import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { applyPwaUpdate, checkForPwaUpdate, dismissPwaUpdate, subscribePwaUpdates } from "@/lib/registerPwa";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  install: () => Promise<boolean>;
  updateReady: boolean;
  offlineReady: boolean;
  applyUpdate: () => Promise<void>;
  checkForUpdate: () => Promise<boolean>;
  dismissUpdate: () => void;
}

const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  isInstalled: false,
  isIos: false,
  install: async () => false,
  updateReady: false,
  offlineReady: false,
  applyUpdate: async () => {},
  checkForUpdate: async () => false,
  dismissUpdate: () => {},
});

export function PwaProvider({ children }: { children: ReactNode }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setInstalled] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribePwaUpdates((next) => {
      setUpdateReady(next.updateReady);
      setOfflineReady(next.offlineReady);
    });
    return () => { unsubscribe(); };
  }, []);

  const install = async () => {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === "accepted") setPromptEvent(null);
    return result.outcome === "accepted";
  };

  return (
    <PwaContext.Provider
      value={{
        canInstall: Boolean(promptEvent),
        isInstalled,
        isIos,
        install,
        updateReady,
        offlineReady,
        applyUpdate: applyPwaUpdate,
        dismissUpdate: dismissPwaUpdate,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export const usePwaInstall = () => useContext(PwaContext);

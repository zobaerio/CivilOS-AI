import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePwaInstall } from "@/lib/pwa";

export default function UpdateAvailable() {
  const { updateReady, offlineReady, applyUpdate, dismissUpdate } = usePwaInstall();
  const shownUpdate = useRef(false);
  const shownOffline = useRef(false);

  useEffect(() => {
    if (!updateReady || shownUpdate.current) return;
    shownUpdate.current = true;
    toast("New version available", {
      description: "A newer version of CivilOS AI is ready to install.",
      duration: Infinity,
      action: {
        label: "Update now",
        onClick: () => { void applyUpdate(); },
      },
      cancel: {
        label: "Later",
        onClick: () => dismissUpdate(),
      },
      onDismiss: () => { shownUpdate.current = false; },
    });
  }, [updateReady, applyUpdate, dismissUpdate]);

  useEffect(() => {
    if (!offlineReady || shownOffline.current) return;
    shownOffline.current = true;
    toast.success("App ready to work offline");
  }, [offlineReady]);

  return null;
}

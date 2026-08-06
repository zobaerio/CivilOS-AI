import { registerSW } from "virtual:pwa-register";

const APP_SW_PATH = "/sw.js";

type PwaUpdateState = { updateReady: boolean; offlineReady: boolean };

let state: PwaUpdateState = { updateReady: false, offlineReady: false };
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<(next: PwaUpdateState) => void>();

function emit(next: Partial<PwaUpdateState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener(state));
}

export function subscribePwaUpdates(listener: (next: PwaUpdateState) => void) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export async function applyPwaUpdate() {
  if (!updateSW) {
    window.location.reload();
    return;
  }
  await updateSW(true);
}

export function dismissPwaUpdate() {
  emit({ updateReady: false });
}

async function removeAppWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => new URL(registration.active?.scriptURL || APP_SW_PATH, window.location.origin).pathname === APP_SW_PATH)
      .map((registration) => registration.unregister()),
  );
}

export async function registerCivilOsPwa() {
  if (!("serviceWorker" in navigator)) return;
  const hostname = window.location.hostname;
  const blocked =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev") ||
    new URLSearchParams(window.location.search).get("sw") === "off";

  if (blocked) {
    await removeAppWorker();
    return;
  }

  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      emit({ updateReady: true });
    },
    onOfflineReady() {
      emit({ offlineReady: true });
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const check = () => { void registration.update(); };
      window.setInterval(check, 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });
}

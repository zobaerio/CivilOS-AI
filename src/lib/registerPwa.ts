import { registerSW } from "virtual:pwa-register";

const APP_SW_PATH = "/sw.js";

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

  registerSW({ immediate: true });
}
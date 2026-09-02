// Firebase (civil-os-ai) — used for Analytics only.
// Auth & database stay on Lovable Cloud. Analytics loads only in the
// browser and only on production builds so dev/preview stays clean.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDk2lq6TuAWdjNIB1l-KHlBj1Cd8fhJKwM",
  authDomain: "civil-os-ai.firebaseapp.com",
  databaseURL: "https://civil-os-ai-default-rtdb.firebaseio.com",
  projectId: "civil-os-ai",
  storageBucket: "civil-os-ai.firebasestorage.app",
  messagingSenderId: "245935831727",
  appId: "1:245935831727:web:24c67f2d63ae44dd57f25a",
  measurementId: "G-QYZ6PJ1FZX",
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (analytics || typeof window === "undefined" || !import.meta.env.PROD) return analytics;
  try {
    if (await isSupported()) {
      analytics = getAnalytics(getFirebaseApp());
    }
  } catch {
    analytics = null;
  }
  return analytics;
}

export { analytics };

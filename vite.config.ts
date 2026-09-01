import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Public backend config. Kept as build-time fallbacks so deployments that don't
// define the VITE_* env vars (e.g. a fresh Vercel project) still boot instead of
// failing every request with "Failed to fetch".
const FALLBACK_SUPABASE_URL = "https://qtvwjjcyvswjwzymknlg.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dndqamN5dnN3and6eW1rbmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjE2MzksImV4cCI6MjA5MzI5NzYzOX0.p3H6VnvXkB843eV3mw8mKgg4DYQRDEnXuX1qNZS_65c";
const FALLBACK_SUPABASE_PROJECT_ID = "qtvwjjcyvswjwzymknlg";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "generateSW",
      filename: "sw.js",
      injectRegister: null,
      manifest: false,
      devOptions: { enabled: false },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "civilos-pages", networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ request, sameOrigin }) => sameOrigin && ["script", "style", "image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "civilos-assets",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));

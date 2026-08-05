import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import "./index.css";
import { registerCivilOsPwa } from "./lib/registerPwa";

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Application root was not found");

createRoot(rootElement).render(
  <HelmetProvider>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </HelmetProvider>
);

requestAnimationFrame(() => {
  requestAnimationFrame(() => window.dispatchEvent(new Event("civilos:ready")));
});

void registerCivilOsPwa();

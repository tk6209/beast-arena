import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow/800.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";

// PWA guard: unregister stale service workers in preview/iframe contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");
if (isPreviewHost || isInIframe) {
  // Preview/iframe: nunca registra SW (evita cache obsoleto durante o dev no Lovable).
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else if (import.meta.env.PROD && "serviceWorker" in navigator) {
  // Produção: SW de cache para carregamento instantâneo em visitas repetidas.
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registro falhou (sem HTTPS, etc.) — app segue normal, só sem cache offline */
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

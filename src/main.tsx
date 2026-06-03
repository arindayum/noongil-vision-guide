import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(<App />);

// ✅ Only register service worker in browser/PWA context, NOT in Capacitor
// Capacitor apps use file:// or capacitor:// scheme — SW registration causes issues
const isCapacitor = typeof (window as any).Capacitor !== 'undefined' &&
  (window as any).Capacitor.isNativePlatform?.();

if (!isCapacitor && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => {
        if (import.meta.env.DEV) console.log('SW registered:', reg.scope);
      })
      .catch(err => {
        if (import.meta.env.DEV) console.warn('SW registration failed:', err);
      });
  });
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(<App />);

// Register service worker for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        if (import.meta.env.DEV) console.log('DoorDrushti SW registered:', reg.scope);
      })
      .catch(err => {
        if (import.meta.env.DEV) console.warn('SW registration failed:', err);
      });
  });
}

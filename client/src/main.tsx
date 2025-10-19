import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Unregister service worker to prevent caching issues in development
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

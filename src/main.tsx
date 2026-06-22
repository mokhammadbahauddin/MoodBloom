import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AuthOverlay from "./components/AuthOverlay";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // Check for updates every time the page loads
      registration.update();
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New content is available; please refresh.
                console.log("New content available, reloading...");
                window.location.reload();
              }
            }
          };
        }
      };
    }).catch((err) => {
      console.log("SW registration failed: ", err);
    });
  });

  // Handle redundant reloads
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}

import ErrorOasis from "./components/ui/ErrorOasis";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorOasis>
      <AuthOverlay>
        <App />
      </AuthOverlay>
    </ErrorOasis>
  </StrictMode>,
);


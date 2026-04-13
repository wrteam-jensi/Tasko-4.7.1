"use client";

import { useEffect } from "react";

const ServiceWorkerNavigationListener = () => {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleNavigationMessage = (event) => {
      const msg = event.data;

      if (!msg) {
        return;
      }
      // Check for both message formats: { action: "navigate" } and { type: "NAVIGATE" }
      const isNavigateMessage =
        (msg.action === "navigate" && msg.url) ||
        (msg.type === "NAVIGATE" && msg.url);

      if (!isNavigateMessage) {
        return;
      }

      const url = msg.url;

      const currentOrigin = window.location.origin;

      let targetUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        targetUrl = `${currentOrigin}${url.startsWith("/") ? url : "/" + url}`;
      }

      if (targetUrl.startsWith(currentOrigin)) {
        try {
          window.location.href = targetUrl;
        } catch (error) {
          console.error("🔀 [SWListener] ❌ Navigation error:", error);
          // Fallback: try router if available
          try {
            if (window.__nextRouter) {
              window.__nextRouter.push(targetUrl);
            }
          } catch (e) {
            console.error("🔀 [SWListener] ❌ Router fallback also failed:", e);
          }
        }
      } else {
        console.warn(
          "🔀 [SWListener] ⚠️ URL is not from same origin, blocking navigation",
        );
        console.warn("🔀 [SWListener] Target URL:", targetUrl);
        console.warn("🔀 [SWListener] Current origin:", currentOrigin);
      }
    };

    // Wait for service worker to be ready
    navigator.serviceWorker.ready
      .then((registration) => {
        // Check if component is still mounted before adding listener
        // (This part is tricky in a hook effect cleanup, so we focus on proper removal)

        navigator.serviceWorker.addEventListener(
          "message",
          handleNavigationMessage,
        );

        // Also listen on the service worker controller if available
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.addEventListener(
            "message",
            handleNavigationMessage,
          );
        }
      })
      .catch((error) => {
        // Still try to add listener even if ready() fails
        navigator.serviceWorker.addEventListener(
          "message",
          handleNavigationMessage,
        );
      });

    return () => {
      // Proper cleanup
      navigator.serviceWorker.removeEventListener(
        "message",
        handleNavigationMessage,
      );
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.removeEventListener(
          "message",
          handleNavigationMessage,
        );
      }
    };
  }, []);

  return null;
};

export default ServiceWorkerNavigationListener;

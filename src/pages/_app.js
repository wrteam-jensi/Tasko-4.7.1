import "@/styles/globals.css";
import { Lexend } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/router";
import { Providers } from "@/redux/providers";
import React, { useEffect } from "react";
import { TranslationProvider } from "@/components/Layout/TranslationContext";
import PushNotificationLayout from "@/components/firebaseNotification/PushNotification";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/AllProviders/QueryProvider";
import RouteProgressBar from "@/components/ReUseableComponents/RouteProgressBar";
import {
  logClarityEvent,
  checkClarityStatus,
  debugClarityIntegration,
} from "@/utils/clarityEvents";
import { APP_LIFECYCLE_EVENTS } from "@/constants/clarityEventNames";
// Import notification redirect to ensure helpers are available globally
import "@/utils/notificationRedirect";
// Global service worker navigation listener for browser notification clicks
import ServiceWorkerNavigationListener from "@/components/ServiceWorkerNavigationListener";

const font = Lexend({ subsets: ["latin"] });

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Check Clarity integration status on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Expose helpers globally for quick console access
    if (!window.__clarityDebugToolsAttached) {
      window.checkClarityStatus = checkClarityStatus;
      window.debugClarityIntegration = debugClarityIntegration;
      window.__clarityDebugToolsAttached = true;
    }

    // Retry mechanism: Check multiple times with increasing delays
    const checkWithRetry = (attempt = 1, maxAttempts = 3) => {
      const delays = [2000, 3000, 5000]; // 2s, 3s, 5s
      const delay = delays[attempt - 1] || delays[delays.length - 1];

      setTimeout(() => {
        const status = checkClarityStatus();
        const debugResult = debugClarityIntegration();

        // If not ready and we have more attempts, retry
        if (!status && attempt < maxAttempts) {
          checkWithRetry(attempt + 1, maxAttempts);
        } else if (!status) {
          console.warn(
            "[clarityEvents] ⚠️ Clarity still not ready after all retries. Check network tab and ad blockers."
          );
        }
      }, delay);
    };

    // Start checking
    checkWithRetry();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Log the very first render to align with the mobile app's `app_launch`.
    logClarityEvent(APP_LIFECYCLE_EVENTS.APP_LAUNCH, {
      path: window.location.pathname,
      route: router.pathname,
    });
  }, [router.pathname]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";

      logClarityEvent(
        isVisible
          ? APP_LIFECYCLE_EVENTS.APP_RESUME
          : APP_LIFECYCLE_EVENTS.APP_BACKGROUND,
        {
          path: typeof window !== "undefined" ? window.location.pathname : "",
          route: router.pathname,
        }
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router.pathname]);

  return (
    <Providers>
      <ErrorBoundary>
        <QueryProvider>
          <ThemeProvider attribute="class">
            <main className={font.className}>
              {/* Global service worker navigation listener for browser notification clicks */}
              <ServiceWorkerNavigationListener />
              <RouteProgressBar />
              <TranslationProvider>
                <PushNotificationLayout>
                  <Component {...pageProps} />
                </PushNotificationLayout>
              </TranslationProvider>

              <Toaster position="bottom-right" />
            </main>
          </ThemeProvider>
        </QueryProvider>
      </ErrorBoundary>
    </Providers>
  );
}

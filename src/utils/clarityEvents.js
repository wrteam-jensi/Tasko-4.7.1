/**
 * Lightweight helpers around the Microsoft Clarity client SDK.
 *
 * Microsoft Clarity injects a `window.clarity` function after the snippet
 * boots.  We guard every call so production code never throws on the server,
 * during the hydration window, or while the script is still loading.
 *
 * Usage:
 * ```js
 * import { logClarityEvent } from "@/utils/clarityEvents";
 * logClarityEvent("login_success", { user_id: "123" });
 * ```
 *
 * NOTE:
 * - Only send JSON-serialisable data.  Complex objects will be stringified
 *   automatically by Clarity, but keeping data flat and predictable keeps the
 *   analytics pipeline healthy.
 * - Keep comments in this file up to date whenever the event taxonomy changes.
 */

const isBrowser = () => typeof window !== "undefined";

/**
 * Quick readiness helper so components can guard custom logic if needed.
 */
export const isClarityReady = () => {
  const ready = isBrowser() && typeof window.clarity === "function";
  return ready;
};

/**
 * Dispatch a Clarity event safely.
 *
 * @param {string} eventName - The name registered in `clarityEventNames`.
 * @param {Record<string, any>} params - Key/value pairs forwarded via `clarity("set")`.
 */
export const logClarityEvent = (eventName, params = {}) => {
  if (!eventName) {
    if (process.env.NODE_ENV !== "production") {
    }
    return;
  }

  if (!isClarityReady()) {
    return;
  }

  try {
    const clarity = window.clarity;

    // Persist the context values immediately before firing the event. Clarity
    // keeps the most recent `set` values until they are overridden or cleared.
    Object.entries(params || {}).forEach(([key, value]) => {
      if (typeof key !== "string") {
        return;
      }

      // Avoid leaking `undefined` – Clarity will coerce to the string "undefined".
      if (value === undefined) {
        return;
      }

      clarity("set", key, value);
    });

    clarity("event", eventName);
  } catch (error) {
    // Gracefully swallow errors; analytics should never break critical flows.
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[clarityEvents] Failed to log "${eventName}".`,
        error,
        params
      );
    }
  }
};

/**
 * Convenience helper for components that want to ensure Clarity is ready
 * before running callback logic.
 *
 * @param {() => void} callback - Invoked once Clarity is ready (immediately if already ready).
 * @param {number} timeoutMs - Optional timeout to stop polling.
 */
export const onClarityReady = (callback, timeoutMs = 5000) => {
  if (typeof callback !== "function") {
    return;
  }

  if (!isBrowser()) {
    return;
  }

  const start = Date.now();

  const poll = () => {
    if (isClarityReady()) {
      callback();
      return;
    }

    if (Date.now() - start >= timeoutMs) {
      return;
    }

    window.requestAnimationFrame(poll);
  };

  poll();
};

/**
 * Debug helper: Check Clarity integration status.
 * Only logs in development mode when explicitly called.
 * 
 * Usage: Call `checkClarityStatus()` in browser console or component.
 */
export const checkClarityStatus = () => {
  if (!isBrowser()) {
    return false;
  }

  const ready = isClarityReady();
  
  return ready;
};

/**
 * Optional deep-dive debug helper. Mirrors the quick DevTools snippet to inspect
 * Clarity's presence and fetch the current session id when available.
 * Only logs in development mode.
 *
 * Usage:
 *   import { debugClarityIntegration } from "@/utils/clarityEvents";
 *   debugClarityIntegration();
 */
export const debugClarityIntegration = () => {
  if (!isBrowser()) {
    return false;
  }

  return isClarityReady();
};



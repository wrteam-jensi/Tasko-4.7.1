// Generic app initialization endpoint
// This endpoint serves application configuration needed for service worker initialization
// Security measures: Token authentication, origin validation, rate limiting
// Note: Endpoint name is intentionally generic to reduce visibility

// Simple in-memory rate limiting store
// In production, consider using Redis or similar for distributed rate limiting
// Using global to persist across hot reloads in dev
const globalStore = global.rateLimitStore || new Map();
if (process.env.NODE_ENV !== "production") global.rateLimitStore = globalStore;
const rateLimitStore = globalStore;

// Rate limiting: max 10 requests per IP per minute
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_STORE_SIZE = 10000; // Hard limit to prevent memory exhaustion

function checkRateLimit(ip) {
  const now = Date.now();
  const key = `rate_limit_${ip}`;

  if (!rateLimitStore.has(key)) {
    // Prevent unbounded growth
    if (rateLimitStore.size >= MAX_STORE_SIZE) {
      // Primitive cleanup: clear older half or just clear all if simple
      // For simplicity and performance, if full, clear all (fail-open or reset)
      // A better approach is LRU, but Map preserves insertion order, so we can delete the first few
      const keysToDelete = [];
      let count = 0;
      for (const k of rateLimitStore.keys()) {
        if (count++ > MAX_STORE_SIZE / 2) break; // Clear half
        keysToDelete.push(k);
      }
      keysToDelete.forEach((k) => rateLimitStore.delete(k));
    }
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const limit = rateLimitStore.get(key);

  // Reset if window expired
  if (now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  // Check if limit exceeded
  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  limit.count++;
  return true;
}

// Clean up old rate limit entries periodically
// Use a global interval to prevent duplicates on hot reload
if (!global.rateLimitInterval) {
  global.rateLimitInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, RATE_LIMIT_WINDOW);
}

export default function handler(req, res) {
  // Only allow POST requests (less visible in Network tab than GET)
  if (req.method !== "POST") {
    // Return 404 for non-POST requests to hide endpoint existence
    return res.status(404).json({ error: "Not Found" });
  }

  // Validate request body (additional security layer)
  const body = req.body || {};
  const { action, clientId } = body;

  // Request must have valid action and clientId
  if (!action || action !== "init" || !clientId) {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      "unknown";
    console.warn(`Invalid request body from IP: ${ip}`);
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid request format",
    });
  }

  // Security Layer 1: Service Worker Context Validation
  // Check if request is coming from a service worker context
  // Service workers have specific characteristics that browsers don't
  const userAgent = req.headers["user-agent"] || "";
  const accept = req.headers["accept"] || "";
  const secFetchMode = req.headers["sec-fetch-mode"] || "";
  const secFetchSite = req.headers["sec-fetch-site"] || "";
  const isServiceWorker = req.headers["x-service-worker"] === "true";

  // Service worker requests typically:
  // - Don't have a standard browser User-Agent (or have minimal one)
  // - Have specific Accept headers
  // - Are same-origin (sec-fetch-site: same-origin)
  // - Have sec-fetch-mode: cors or no-cors
  // - Have X-Service-Worker header (we set this in our service worker)

  // Block obvious direct browser requests (no token, no service worker header)
  const hasToken = !!req.headers["x-auth-token"];
  const isBrowserRequest =
    userAgent.includes("Mozilla") &&
    userAgent.includes("Chrome") &&
    !userAgent.includes("ServiceWorker");

  // If it's a browser request without token and without service worker header, block it
  if (isBrowserRequest && !hasToken && !isServiceWorker) {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      "unknown";
    console.warn(
      `Direct browser access attempt blocked from IP: ${ip}, User-Agent: ${userAgent.substring(0, 50)}`,
    );

    // Return generic 404 error to prevent information disclosure
    // This makes the endpoint look like it doesn't exist
    return res.status(404).json({
      error: "Not Found",
      message: "Resource not found",
    });
  }

  // Prefer service worker header, but don't require it (for backward compatibility)
  // If present, it adds extra validation
  if (isServiceWorker && !hasToken) {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      "unknown";
    console.warn(`Service worker request without token from IP: ${ip}`);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  // Security Layer 2: Token Authentication
  // Service worker must provide a token to access config
  // Using generic header name to reduce visibility
  const providedToken = req.headers["x-auth-token"] || req.query.token;
  const expectedToken = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_TOKEN;

  if (!expectedToken) {
    console.error("FIREBASE_CONFIG_TOKEN environment variable not set");
    return res.status(500).json({
      error: "Server configuration error",
      message: "Token validation not configured",
    });
  }

  if (!providedToken || providedToken !== expectedToken) {
    // Log suspicious activity (without exposing token)
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      "unknown";
    console.warn(
      `Unauthorized config access attempt from IP: ${ip}, User-Agent: ${userAgent.substring(0, 50)}`,
    );

    // Return generic error to prevent information disclosure
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  // Security Layer 3: Token + Time Validation (Optional)
  // Add additional layer: token must be valid AND request should be recent
  // This prevents token replay attacks if token is somehow extracted
  const requestTimestamp = req.headers["x-request-time"];
  if (requestTimestamp) {
    const timestamp = parseInt(requestTimestamp, 10);
    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp);

    // Reject requests older than 5 minutes (prevent token replay)
    if (timeDiff > 5 * 60 * 1000) {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.headers["x-real-ip"] ||
        req.socket?.remoteAddress ||
        "unknown";
      console.warn(
        `Stale token request rejected from IP: ${ip}, time diff: ${timeDiff}ms`,
      );

      return res.status(401).json({
        error: "Unauthorized",
        message: "Request expired",
      });
    }
  }

  // Security Layer 4: Origin/Referrer Validation
  // Only allow requests from same origin (helps prevent direct browser access)
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers["x-forwarded-host"] || req.headers.host;

  // Allow if:
  // 1. No origin/referer (service worker context - referrer might not be set)
  // 2. Origin matches host (same-origin request)
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      const hostUrl = new URL(`https://${host}`);

      // Check if origin matches host (same domain)
      if (originUrl.hostname !== hostUrl.hostname) {
        // Log suspicious cross-origin attempt
        console.warn(`Cross-origin config access attempt from: ${origin}`);
        return res.status(403).json({
          error: "Forbidden",
          message: "Cross-origin requests not allowed",
        });
      }
    } catch (e) {
      // Invalid origin URL, deny access
      return res.status(403).json({
        error: "Forbidden",
        message: "Invalid origin",
      });
    }
  }

  // Security Layer 5: Rate Limiting
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  // Return Firebase configuration from environment variables
  // These are server-side only, not exposed in client bundle
  // Note: Matching the variable names used in the codebase (including typos)
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGEING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MESUMENT_ID,
  };

  // Validate that all required variables are present
  const missingVars = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error("Missing Firebase config variables:", missingVars);
    return res.status(500).json({
      error: "Firebase configuration incomplete",
      message: "Some environment variables are missing",
    });
  }

  // Additional Security: Obfuscate response
  // Return config but with minimal headers to reduce information disclosure
  // Don't expose that this is a Firebase config endpoint

  // Set security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Robots-Tag", "noindex, nofollow"); // Don't index this endpoint

  // Set cache headers to reduce unnecessary requests
  // Cache for 1 hour, but allow revalidation
  res.setHeader(
    "Cache-Control",
    "private, max-age=3600, stale-while-revalidate=86400",
  );

  // Return the config as JSON
  res.status(200).json(firebaseConfig);
}

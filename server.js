/**
 * Custom Next.js Server
 * 
 * SECURITY NOTE: This server uses HTTP because HTTPS/TLS is handled by the
 * reverse proxy (Nginx, Cloudflare, Vercel, etc.) in production environments.
 * This is a standard deployment pattern - the Node.js server runs on an internal
 * network/localhost, and the proxy terminates SSL/TLS connections.
 * 
 * If you need direct HTTPS without a proxy, configure SSL certificates and
 * use the 'https' module instead.
 */
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import fs from "fs";
import path from "path";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.NODE_PORT || 3000;

/* -----------------------------------------------------
   Rate Limiting Configuration (CWE-770 Protection)
   Prevents Denial of Service attacks by limiting requests per IP
------------------------------------------------------ */
const RATE_LIMIT = {
  windowMs: 60 * 1000,     // 1 minute window
  maxRequests: 100,         // Max 100 requests per window per IP
  wellKnownMax: 20,         // Stricter limit for .well-known endpoint
};

// In-memory store for rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map();

/**
 * Check if request should be rate limited.
 * Returns true if request is allowed, false if rate limited.
 */
const checkRateLimit = (ip, endpoint = 'general') => {
  const now = Date.now();
  const key = `${ip}:${endpoint}`;
  const maxRequests = endpoint === 'well-known' ? RATE_LIMIT.wellKnownMax : RATE_LIMIT.maxRequests;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  const limit = rateLimitStore.get(key);
  
  // Reset if window expired
  if (now > limit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  // Check if limit exceeded
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
};

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT.windowMs);

/**
 * Get client IP address from request headers.
 * Handles proxied requests (X-Forwarded-For, X-Real-IP).
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         'unknown';
};

/**
 * Validates and sanitizes a file path to prevent Path Traversal attacks (CWE-23).
 * Ensures the requested file is within the allowed .well-known directory.
 * 
 * @param {string} pathname - The URL pathname to validate
 * @returns {string|null} - Safe file path or null if invalid
 */
const getSafeWellKnownPath = (pathname) => {
  // Define the allowed base directory for .well-known files
  const wellKnownDir = path.join(process.cwd(), ".well-known");
  
  // Only allow alphanumeric, hyphen, underscore, and dot in filename
  // This prevents path traversal sequences like ../ or encoded variants
  const filenameMatch = pathname.match(/^\/\.well-known\/([a-zA-Z0-9_.-]+)$/);
  if (!filenameMatch) {
    return null;
  }
  
  const filename = filenameMatch[1];
  
  // Construct the full path using only the validated filename
  const filePath = path.join(wellKnownDir, filename);
  
  // Double-check: resolve the path and verify it's still within .well-known directory
  // This is a defense-in-depth measure against any bypass attempts
  const resolvedPath = path.resolve(filePath);
  const resolvedWellKnownDir = path.resolve(wellKnownDir);
  
  if (!resolvedPath.startsWith(resolvedWellKnownDir + path.sep)) {
    return null;
  }
  
  return resolvedPath;
};

app.prepare().then(() => {
  /* 
   * SECURITY NOTES for Snyk:
   * 
   * 1. HTTP vs HTTPS (CWE-319): This server uses HTTP because HTTPS/TLS termination
   *    is handled by the reverse proxy (Nginx, Cloudflare, Vercel) in production.
   *    This is a standard deployment pattern where Node.js runs internally.
   * 
   * 2. Rate Limiting (CWE-770): Rate limiting IS implemented via checkRateLimit()
   *    function above. All requests are rate-limited before processing.
   *    - General requests: 100/minute per IP
   *    - .well-known requests: 20/minute per IP
   */
  // deepcode ignore HttpToHttps: HTTPS is handled by reverse proxy (Nginx/Cloudflare) in production - this is standard practice
  // deepcode ignore NoRateLimitingForExpensiveWebOperation: Rate limiting IS implemented via checkRateLimit() function - see lines 32-65
  createServer((req, res) => {
    const clientIp = getClientIp(req);
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Handle .well-known directory requests with path traversal protection
    if (pathname.startsWith("/.well-known")) {
      // Apply rate limiting for .well-known endpoint
      if (!checkRateLimit(clientIp, 'well-known')) {
        res.writeHead(429, { 'Retry-After': '60' });
        res.end("Too Many Requests");
        return;
      }

      const safePath = getSafeWellKnownPath(pathname);
      
      // Reject invalid or potentially malicious paths
      if (!safePath) {
        res.writeHead(400);
        res.end("Bad Request");
        return;
      }
      
      try {
        const fileContent = fs.readFileSync(safePath, "utf-8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(fileContent);
        return;
      } catch (error) {
        // Log error without exposing sensitive path information
        console.error("Error reading .well-known file:", error.code || "Unknown error");
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
    }

    // Apply general rate limiting
    if (!checkRateLimit(clientIp, 'general')) {
      res.writeHead(429, { 'Retry-After': '60' });
      res.end("Too Many Requests");
      return;
    }

    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
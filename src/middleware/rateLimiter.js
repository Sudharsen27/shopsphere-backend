import rateLimit from "express-rate-limit";

// Disable trustProxy validation so we don't crash if Express trust proxy is true (e.g. old deploy).
// Prefer setting app.set("trust proxy", 1) in server.js; this just avoids ERR_ERL_PERMISSIVE_TRUST_PROXY.
const validate = { trustProxy: false };

// Rate limiter for auth routes (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  validate,
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for token verification (more lenient since it's called frequently)
export const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute
  validate,
  message: {
    success: false,
    message: "Too many verification requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// General API rate limiter (excludes auth routes to avoid double limiting)
// In development, use a much higher limit to avoid 429s from HMR + many product/wishlist requests
const isDev = process.env.NODE_ENV !== "production";
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 2000 : 200, // Dev: 2000; Production: 200 per 15 min per IP
  validate,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for all auth routes (they have their own limiters)
    if (req.path.startsWith("/api/auth")) return true;
    return false;
  },
});

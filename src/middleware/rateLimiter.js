import rateLimit from "express-rate-limit";

// Rate limiter for auth routes (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10 - Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Rate limiter for token verification (more lenient since it's called frequently)
export const verifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Allow 20 verify requests per minute
  message: {
    success: false,
    message: "Too many verification requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful verifications
});

// General API rate limiter (excludes verify endpoint)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 - Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for verify endpoint (it has its own limiter)
    return req.path === "/api/auth/verify";
  },
});

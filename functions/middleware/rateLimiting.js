
/**
 * Rate Limiting Middleware
 * Protects against abuse and DDoS attacks
 */

const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Different limits for different endpoints
exports.authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
exports.apiLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
exports.uploadLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 uploads per hour

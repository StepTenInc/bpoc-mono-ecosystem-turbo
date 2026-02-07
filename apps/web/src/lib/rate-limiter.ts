/**
 * Simple in-memory rate limiter for API endpoints
 * Prevents abuse by limiting requests per user per time window
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number;    // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check if request is within rate limit
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 } // Default: 10 requests per minute
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // No existing record or expired - create new
  if (!record || record.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Existing record - check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Within limit - increment count
  record.count++;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  BATCH_OPERATIONS: { maxRequests: 5, windowMs: 60000 },  // 5 batch ops per minute
  USER_ACTIONS: { maxRequests: 20, windowMs: 60000 },     // 20 user actions per minute
  DATA_FETCH: { maxRequests: 100, windowMs: 60000 },      // 100 fetches per minute
  NOTIFICATIONS: { maxRequests: 10, windowMs: 60000 },    // 10 notifications per minute
} as const;

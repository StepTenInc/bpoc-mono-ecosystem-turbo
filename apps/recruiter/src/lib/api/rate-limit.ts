/**
 * Rate Limiting Middleware for BPOC API v1
 * 
 * Implements token bucket algorithm for rate limiting API requests
 * based on agency ID.
 * 
 * Rate limits by tier:
 * - Free: 100 requests/hour
 * - Pro: 1000 requests/hour
 * - Enterprise: 10000 requests/hour
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// In-memory rate limit store (use Redis in production for multi-instance deployments)
interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
  tier: string;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations by tier
const RATE_LIMITS = {
  free: {
    maxTokens: 100,
    refillRate: 100 / 3600, // tokens per second (100 per hour)
    windowSeconds: 3600,
  },
  pro: {
    maxTokens: 1000,
    refillRate: 1000 / 3600, // tokens per second (1000 per hour)
    windowSeconds: 3600,
  },
  enterprise: {
    maxTokens: 10000,
    refillRate: 10000 / 3600, // tokens per second (10000 per hour)
    windowSeconds: 3600,
  },
};

/**
 * Get agency tier from database
 */
async function getAgencyTier(agencyId: string): Promise<keyof typeof RATE_LIMITS> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('api_tier')
    .eq('id', agencyId)
    .single();
  
  const tier = data?.api_tier || 'free';
  return (tier in RATE_LIMITS ? tier : 'free') as keyof typeof RATE_LIMITS;
}

/**
 * Check if request is within rate limit
 * 
 * @param agencyId - Agency making the request
 * @returns Object with allowed status and rate limit headers
 */
export async function checkRateLimit(agencyId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfter?: number;
}> {
  const tier = await getAgencyTier(agencyId);
  const config = RATE_LIMITS[tier];
  
  const now = Date.now() / 1000; // Convert to seconds
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(agencyId);
  
  if (!entry) {
    // First request from this agency
    entry = {
      tokens: config.maxTokens - 1, // Consume 1 token for this request
      lastRefill: now,
      tier,
    };
    rateLimitStore.set(agencyId, entry);
    
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      limit: config.maxTokens,
      resetAt: Math.floor(now + config.windowSeconds),
    };
  }
  
  // Check if tier changed (upgrade/downgrade)
  if (entry.tier !== tier) {
    // Reset tokens to new tier's limit
    entry = {
      tokens: config.maxTokens,
      lastRefill: now,
      tier,
    };
    rateLimitStore.set(agencyId, entry);
  }
  
  // Calculate tokens to add based on time elapsed
  const timeSinceRefill = now - entry.lastRefill;
  const tokensToAdd = timeSinceRefill * config.refillRate;
  
  // Refill tokens up to max
  entry.tokens = Math.min(config.maxTokens, entry.tokens + tokensToAdd);
  entry.lastRefill = now;
  
  // Check if we have tokens available
  if (entry.tokens >= 1) {
    // Consume 1 token
    entry.tokens -= 1;
    rateLimitStore.set(agencyId, entry);
    
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      limit: config.maxTokens,
      resetAt: Math.floor(now + config.windowSeconds),
    };
  }
  
  // Rate limit exceeded
  const tokensNeeded = 1 - entry.tokens;
  const secondsUntilToken = tokensNeeded / config.refillRate;
  
  return {
    allowed: false,
    remaining: 0,
    limit: config.maxTokens,
    resetAt: Math.floor(now + config.windowSeconds),
    retryAfter: Math.ceil(secondsUntilToken),
  };
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(
  response: Response,
  rateLimit: {
    remaining: number;
    limit: number;
    resetAt: number;
  }
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
  headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Clean up old entries from rate limit store (run periodically)
 * Call this from a cron job or background task
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now() / 1000;
  const maxAge = 7200; // 2 hours
  
  for (const [agencyId, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRefill > maxAge) {
      rateLimitStore.delete(agencyId);
    }
  }
}

/**
 * Get current rate limit status for an agency (for debugging/monitoring)
 */
export async function getRateLimitStatus(agencyId: string): Promise<{
  tier: string;
  tokens: number;
  maxTokens: number;
  lastRefill: number;
} | null> {
  const entry = rateLimitStore.get(agencyId);
  if (!entry) return null;
  
  const tier = entry.tier as keyof typeof RATE_LIMITS;
  const config = RATE_LIMITS[tier];
  
  return {
    tier: entry.tier,
    tokens: entry.tokens,
    maxTokens: config.maxTokens,
    lastRefill: entry.lastRefill,
  };
}

/**
 * Reset rate limit for an agency (for testing or admin override)
 */
export function resetRateLimit(agencyId: string): void {
  rateLimitStore.delete(agencyId);
}

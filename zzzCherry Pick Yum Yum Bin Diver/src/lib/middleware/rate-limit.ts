import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: Date;
  error?: string;
}

/**
 * Check if API request is within rate limits
 */
export async function checkRateLimit(
  request: NextRequest,
  agencyId: string,
  apiKey: string
): Promise<RateLimitResult> {
  try {
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const now = new Date();
    
    // Get or create rate limit record
    const { data: rateLimit, error: fetchError } = await supabaseAdmin
      .from('api_rate_limits')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Rate limit check error:', fetchError);
      // Allow request on error to avoid blocking legitimate traffic
      return { allowed: true };
    }

    if (!rateLimit) {
      // Create new rate limit record
      await supabaseAdmin
        .from('api_rate_limits')
        .insert({
          agency_id: agencyId,
          api_key_hash: apiKeyHash,
          request_count: 1,
          window_start: now.toISOString(),
          last_request_at: now.toISOString(),
          last_request_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          last_request_endpoint: request.nextUrl.pathname,
        });

      return { 
        allowed: true,
        remaining: 999,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      };
    }

    // Check if window has expired
    const windowStart = new Date(rateLimit.window_start);
    const windowDuration = rateLimit.window_duration_minutes || 60;
    const windowEnd = new Date(windowStart.getTime() + windowDuration * 60 * 1000);

    if (now > windowEnd) {
      // Reset window
      await supabaseAdmin
        .from('api_rate_limits')
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          last_request_at: now.toISOString(),
          last_request_ip: request.headers.get('x-forwarded-for') || 'unknown',
          last_request_endpoint: request.nextUrl.pathname,
          updated_at: now.toISOString(),
        })
        .eq('id', rateLimit.id);

      return { 
        allowed: true,
        remaining: rateLimit.requests_per_hour - 1,
        resetAt: new Date(now.getTime() + windowDuration * 60 * 1000),
      };
    }

    // Check if limit exceeded
    if (rateLimit.request_count >= rateLimit.requests_per_hour) {
      // Log violation
      await supabaseAdmin
        .from('api_rate_limits')
        .update({
          rate_limit_exceeded_count: (rateLimit.rate_limit_exceeded_count || 0) + 1,
          last_exceeded_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', rateLimit.id);

      return {
        allowed: false,
        remaining: 0,
        resetAt: windowEnd,
        error: `Rate limit exceeded. Limit: ${rateLimit.requests_per_hour} requests per hour. Try again after ${windowEnd.toISOString()}`,
      };
    }

    // Increment counter
    await supabaseAdmin
      .from('api_rate_limits')
      .update({
        request_count: rateLimit.request_count + 1,
        last_request_at: now.toISOString(),
        last_request_ip: request.headers.get('x-forwarded-for') || 'unknown',
        last_request_endpoint: request.nextUrl.pathname,
        updated_at: now.toISOString(),
      })
      .eq('id', rateLimit.id);

    return {
      allowed: true,
      remaining: rateLimit.requests_per_hour - rateLimit.request_count - 1,
      resetAt: windowEnd,
    };

  } catch (error) {
    console.error('Rate limit error:', error);
    // Allow request on error
    return { allowed: true };
  }
}

/**
 * Get rate limit headers to include in response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining || 0),
    'X-RateLimit-Reset': result.resetAt ? result.resetAt.toISOString() : '',
  };
}

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/api/rate-limit';

/**
 * Validate API key and return agency info
 * Optionally checks rate limits
 */
export async function validateApiKey(
  request: NextRequest,
  options: { checkRateLimit?: boolean } = { checkRateLimit: true }
) {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  
  if (!apiKey) {
    return { error: 'Missing API key. Include X-API-Key header.', status: 401 };
  }

  // Look up the agency by API key
  const { data: agency, error } = await supabaseAdmin
    .from('agencies')
    .select('id, name, api_enabled')
    .eq('api_key', apiKey)
    .single();

  if (error || !agency) {
    return { error: 'Invalid API key', status: 401 };
  }

  if (!agency.api_enabled) {
    return { error: 'API access is disabled for this agency', status: 403 };
  }

  // Check rate limit if enabled
  if (options.checkRateLimit) {
    const rateLimit = await checkRateLimit(agency.id);
    
    if (!rateLimit.allowed) {
      return {
        error: 'Rate limit exceeded',
        status: 429,
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
          retryAfter: rateLimit.retryAfter,
        },
      };
    }
    
    // Return rate limit info with successful auth
    return {
      agency,
      agencyId: agency.id,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    };
  }

  return { agency, agencyId: agency.id };
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const prefix = 'bpoc_';
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `${prefix}${randomBytes}`;
}

/**
 * Get agency's client IDs for filtering
 */
export async function getAgencyClientIds(agencyId: string): Promise<string[]> {
  const { data: clients } = await supabaseAdmin
    .from('agency_clients')
    .select('id')
    .eq('agency_id', agencyId);
  
  return clients?.map(c => c.id) || [];
}


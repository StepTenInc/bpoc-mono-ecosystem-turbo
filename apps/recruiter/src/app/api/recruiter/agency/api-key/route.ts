import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * GET /api/recruiter/agency/api-key
 * Get the current agency's API key
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agency ID from user
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id, role')
      .eq('user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter' }, { status: 403 });
    }

    // Get agency with API info
    const { data: agency, error } = await supabaseAdmin
      .from('agencies')
      .select('api_key, api_enabled, api_tier')
      .eq('id', recruiter.agency_id)
      .single();

    if (error || !agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Calculate rate limit info
    const RATE_LIMITS = {
      free: { limit: 100, window: 'hour' },
      pro: { limit: 1000, window: 'hour' },
      enterprise: { limit: 10000, window: 'hour' },
    };

    const tier = (agency.api_tier || 'free') as keyof typeof RATE_LIMITS;
    const rateLimit = RATE_LIMITS[tier] || RATE_LIMITS.free;

    return NextResponse.json({
      apiKey: agency.api_key || null,
      apiEnabled: agency.api_enabled || false,
      rateLimit: {
        tier,
        limit: rateLimit.limit,
        window: rateLimit.window,
      },
    });
  } catch (error) {
    console.error('API key GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter/agency/api-key
 * Generate or regenerate the agency's API key
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agency ID from user
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id, role')
      .eq('user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter' }, { status: 403 });
    }

    // Only admins/owners can regenerate API keys
    if (!['admin', 'owner'].includes(recruiter.role)) {
      return NextResponse.json({ error: 'Only admins can manage API keys' }, { status: 403 });
    }

    // Generate new API key
    const newApiKey = `bpoc_${crypto.randomBytes(24).toString('hex')}`;

    // Update agency
    const { data: agency, error } = await supabaseAdmin
      .from('agencies')
      .update({
        api_key: newApiKey,
        api_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recruiter.agency_id)
      .select('api_key, api_enabled, api_tier')
      .single();

    if (error) {
      console.error('Failed to update API key:', error);
      return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
    }

    // Log this action (non-critical, don't block on errors)
    try {
      await supabaseAdmin
        .from('admin_audit_log')
        .insert({
          agency_id: recruiter.agency_id,
          user_id: user.id,
          action: 'api_key_regenerated',
          details: { timestamp: new Date().toISOString() },
        });
    } catch {
      // Ignore audit log errors
    }

    return NextResponse.json({
      apiKey: agency.api_key,
      apiEnabled: agency.api_enabled,
      message: 'API key regenerated successfully',
    });
  } catch (error) {
    console.error('API key POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import crypto from 'crypto';

/**
 * Generate a secure API key
 */
function generateApiKey(): string {
  const prefix = 'bpoc_';
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `${prefix}${randomBytes}`;
}

/**
 * GET /api/recruiter/api-key
 * Get the agency's current API key
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Get agency API key
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('api_key, api_enabled, api_tier')
      .eq('id', recruiter.agency_id)
      .single();

    return NextResponse.json({
      apiKey: agency?.api_key || null,
      apiEnabled: agency?.api_enabled || false,
      apiTier: agency?.api_tier || 'free',
    });

  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter/api-key
 * Generate a new API key for the agency
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id, role')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Only owners/admins can generate keys
    if (recruiter.role !== 'owner' && recruiter.role !== 'admin') {
      return NextResponse.json({ error: 'Only agency owners can manage API keys' }, { status: 403 });
    }

    // Generate new key
    const newApiKey = generateApiKey();

    // Update agency
    const { error } = await supabaseAdmin
      .from('agencies')
      .update({ 
        api_key: newApiKey,
        api_enabled: true,
      })
      .eq('id', recruiter.agency_id);

    if (error) {
      console.error('Error updating API key:', error);
      return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
    }

    return NextResponse.json({
      apiKey: newApiKey,
      apiEnabled: true,
      message: 'API key generated successfully',
    });

  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


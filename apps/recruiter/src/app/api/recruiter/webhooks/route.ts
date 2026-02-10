import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * GET /api/recruiter/webhooks
 * List webhooks for the current agency
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
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter' }, { status: 403 });
    }

    // Get webhooks
    const { data: webhooks, error } = await supabaseAdmin
      .from('webhooks')
      .select('id, url, events, description, is_active, last_triggered_at, created_at')
      .eq('agency_id', recruiter.agency_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch webhooks:', error);
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Webhooks GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter/webhooks
 * Create a new webhook
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
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter' }, { status: 403 });
    }

    const body = await request.json();
    const { url, events, description } = body;

    if (!url || !events || events.length === 0) {
      return NextResponse.json({ 
        error: 'url and events are required' 
      }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Generate webhook secret
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    // Create webhook
    const { data: webhook, error } = await supabaseAdmin
      .from('webhooks')
      .insert({
        agency_id: recruiter.agency_id,
        url,
        events,
        description: description || null,
        secret,
        is_active: true,
        created_by: user.id,
      })
      .select('id, url, events, secret, created_at')
      .single();

    if (error) {
      console.error('Failed to create webhook:', error);
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }

    return NextResponse.json({ 
      webhook,
      message: 'Webhook created successfully. Store the secret securely - it will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Webhooks POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

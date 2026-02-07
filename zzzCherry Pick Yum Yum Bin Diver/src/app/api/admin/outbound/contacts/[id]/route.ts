import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/outbound/contacts/[id]
 * Get a single contact by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get contact with activity stats
    const { data: contact, error } = await supabaseAdmin
      .from('outbound_contacts')
      .select(`
        *,
        campaign_recipients (
          id,
          status,
          sent_at,
          opened_at,
          clicked_at,
          email_campaigns (
            id,
            name,
            subject
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get activity log
    const { data: activityLog } = await supabaseAdmin
      .from('email_activity_log')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      contact,
      activityLog: activityLog || [],
    });
  } catch (error: any) {
    console.error('[API] Error in GET /api/admin/outbound/contacts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/outbound/contacts/[id]
 * Update a contact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const { first_name, last_name, phone_number, tags, custom_fields, email_valid, unsubscribed } = body;

    // Update contact
    const { data: contact, error } = await supabaseAdmin
      .from('outbound_contacts')
      .update({
        first_name,
        last_name,
        phone_number,
        tags,
        custom_fields,
        email_valid,
        unsubscribed,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating contact:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact });
  } catch (error: any) {
    console.error('[API] Error in PUT /api/admin/outbound/contacts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/outbound/contacts/[id]
 * Delete a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { error } = await supabaseAdmin
      .from('outbound_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Error deleting contact:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/admin/outbound/contacts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

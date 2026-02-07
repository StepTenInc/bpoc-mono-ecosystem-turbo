import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/outbound/contacts
 * List all contacts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const isRegistered = searchParams.get('is_registered');
    const emailValid = searchParams.get('email_valid');
    const unsubscribed = searchParams.get('unsubscribed');
    const tags = searchParams.get('tags');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('outbound_contacts')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (isRegistered !== null && isRegistered !== undefined) {
      query = query.eq('is_registered', isRegistered === 'true');
    }

    if (emailValid !== null && emailValid !== undefined) {
      query = query.eq('email_valid', emailValid === 'true');
    }

    if (unsubscribed !== null && unsubscribed !== undefined) {
      query = query.eq('unsubscribed', unsubscribed === 'true');
    }

    if (tags) {
      const tagArray = tags.split(',');
      query = query.contains('tags', tagArray);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('[API] Error fetching contacts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('[API] Error in GET /api/admin/outbound/contacts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/outbound/contacts
 * Create a new contact manually
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, first_name, last_name, phone_number, tags, custom_fields } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check for duplicates
    const { data: existing } = await supabaseAdmin
      .from('outbound_contacts')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Contact with this email already exists' }, { status: 409 });
    }

    // Create contact
    const { data: contact, error } = await supabaseAdmin
      .from('outbound_contacts')
      .insert({
        email: email.toLowerCase(),
        first_name,
        last_name,
        phone_number,
        tags: tags || [],
        custom_fields: custom_fields || {},
        source: 'manual',
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Error creating contact:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Error in POST /api/admin/outbound/contacts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

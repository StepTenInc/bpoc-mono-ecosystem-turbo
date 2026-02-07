import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const signedUp = searchParams.get('signed_up');
    const contacted = searchParams.get('contacted');
    const visited = searchParams.get('visited');
    const source = searchParams.get('source');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('carpet_bomb_leads')
      .select('*', { count: 'exact' });

    // Filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (signedUp === 'true') {
      query = query.eq('signed_up', true);
    } else if (signedUp === 'false') {
      query = query.eq('signed_up', false);
    }

    if (contacted === 'true') {
      query = query.eq('been_contacted', true);
    } else if (contacted === 'false') {
      query = query.eq('been_contacted', false);
    }

    if (visited === 'true') {
      query = query.eq('visited_site', true);
    } else if (visited === 'false') {
      query = query.eq('visited_site', false);
    }

    if (source) {
      query = query.eq('original_source', source);
    }

    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      leads: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch leads error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      first_name,
      last_name,
      phone_number,
      city,
      current_salary,
      expected_salary,
      resume_url,
      profile_picture_url,
      original_source,
      tags,
      notes,
    } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: lead, error } = await supabase
      .from('carpet_bomb_leads')
      .insert({
        email: email.toLowerCase().trim(),
        first_name,
        last_name,
        phone_number,
        city,
        current_salary,
        expected_salary,
        resume_url,
        profile_picture_url,
        original_source: original_source || 'Manual Entry',
        tags: tags || [],
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error: any) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
  }
}

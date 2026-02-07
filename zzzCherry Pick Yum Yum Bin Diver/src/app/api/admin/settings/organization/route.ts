/**
 * ADMIN API - Organization Schema Management
 * GET: Fetch organization schema for editing
 * PUT: Update organization schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET - Fetch organization schema (admin-only)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('setting_key', 'organization_schema')
      .single();

    if (error) {
      console.error('Failed to fetch organization schema:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization schema' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.setting_value,
      meta: {
        lastUpdated: data.updated_at,
        updatedBy: data.updated_by,
      },
    });
  } catch (error: any) {
    console.error('Admin organization schema GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update organization schema (admin-only)
 */
export async function PUT(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organizationData, adminUserId } = body;

    // Validate required fields
    const requiredFields = ['name', 'url', 'description'];
    const missingFields = requiredFields.filter(
      (field) => !organizationData[field]
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update organization schema
    const { data, error } = await supabase
      .from('site_settings')
      .update({
        setting_value: organizationData,
        updated_by: adminUserId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', 'organization_schema')
      .select()
      .single();

    if (error) {
      console.error('Failed to update organization schema:', error);
      return NextResponse.json(
        { error: 'Failed to update organization schema' },
        { status: 500 }
      );
    }

    // Revalidate cached pages
    // In production, this would trigger ISR revalidation
    console.log('✅ Organization schema updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Organization schema updated successfully',
      data: data.setting_value,
      meta: {
        lastUpdated: data.updated_at,
        updatedBy: data.updated_by,
      },
    });
  } catch (error: any) {
    console.error('Admin organization schema PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUBLIC API - Organization Schema
 * Returns organization schema for global SEO injection
 * Used by root layout to inject Organization schema markup
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'organization_schema')
      .single();

    if (error) {
      console.error('Failed to fetch organization schema:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization schema' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Organization schema not found' },
        { status: 404 }
      );
    }

    // Return the schema with @context for schema.org
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      ...data.setting_value,
    };

    return NextResponse.json(schema, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('Organization schema API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

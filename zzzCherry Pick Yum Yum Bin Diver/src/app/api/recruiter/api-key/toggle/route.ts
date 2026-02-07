import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * POST /api/recruiter/api-key/toggle
 * Enable or disable API access for the agency
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

    // Only owners/admins can toggle API
    if (recruiter.role !== 'owner' && recruiter.role !== 'admin') {
      return NextResponse.json({ error: 'Only agency owners can manage API access' }, { status: 403 });
    }

    // Get current status
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('api_enabled')
      .eq('id', recruiter.agency_id)
      .single();

    // Toggle
    const newStatus = !agency?.api_enabled;

    const { error } = await supabaseAdmin
      .from('agencies')
      .update({ api_enabled: newStatus })
      .eq('id', recruiter.agency_id);

    if (error) {
      console.error('Error toggling API:', error);
      return NextResponse.json({ error: 'Failed to toggle API' }, { status: 500 });
    }

    return NextResponse.json({
      apiEnabled: newStatus,
      message: newStatus ? 'API access enabled' : 'API access disabled',
    });

  } catch (error) {
    console.error('Error toggling API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


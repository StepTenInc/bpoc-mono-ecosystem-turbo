import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/recruiter/team
 * Get all team members for the recruiter's agency
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the recruiter's agency
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
    }

    // Get all team members from the same agency
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('*')
      .eq('agency_id', recruiter.agency_id)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });

    if (teamError) {
      console.error('Error fetching team members:', teamError);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    // Format team members for the frontend
    const formattedMembers = (teamMembers || []).map(member => ({
      id: member.id,
      userId: member.user_id,
      email: member.email,
      firstName: member.first_name,
      lastName: member.last_name,
      role: member.role,
      avatarUrl: null, // We can add this later if needed
      lastActive: member.updated_at,
      placementsThisMonth: 0, // We can calculate this later if needed
      joinedAt: member.joined_at,
    }));

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      count: formattedMembers.length,
    });

  } catch (error) {
    console.error('Error in GET /api/recruiter/team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

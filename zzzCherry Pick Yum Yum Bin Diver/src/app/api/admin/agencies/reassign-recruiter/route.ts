import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/agencies/reassign-recruiter
 * Admin-only: Reassign a recruiter from one agency to another
 * 
 * Body: {
 *   recruiterId: string (agency_recruiters.id)
 *   newAgencyId: string (agencies.id)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { recruiterId, newAgencyId } = await request.json();

    if (!recruiterId || !newAgencyId) {
      return NextResponse.json(
        { error: 'recruiterId and newAgencyId are required' },
        { status: 400 }
      );
    }

    // Verify the new agency exists
    const { data: newAgency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('id, name')
      .eq('id', newAgencyId)
      .single();

    if (agencyError || !newAgency) {
      return NextResponse.json(
        { error: 'Target agency not found' },
        { status: 404 }
      );
    }

    // Get the recruiter's current data
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('*, agencies(name)')
      .eq('id', recruiterId)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: 'Recruiter not found' },
        { status: 404 }
      );
    }

    const oldAgencyName = (recruiter.agencies as any)?.name || 'Unknown';

    // Check if recruiter is already in the target agency
    if (recruiter.agency_id === newAgencyId) {
      return NextResponse.json(
        { error: 'Recruiter is already in this agency' },
        { status: 400 }
      );
    }

    // Update the recruiter's agency
    const { data: updatedRecruiter, error: updateError } = await supabaseAdmin
      .from('agency_recruiters')
      .update({ 
        agency_id: newAgencyId,
        // Reset role to 'recruiter' when moving to new agency (safety measure)
        role: 'recruiter'
      })
      .eq('id', recruiterId)
      .select('id, first_name, last_name, email, agency_id')
      .single();

    if (updateError) {
      console.error('Error reassigning recruiter:', updateError);
      return NextResponse.json(
        { error: 'Failed to reassign recruiter', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ [Admin] Recruiter reassigned:', {
      recruiterId,
      recruiterEmail: recruiter.email,
      fromAgency: oldAgencyName,
      toAgency: newAgency.name,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reassigned ${recruiter.first_name} ${recruiter.last_name} to ${newAgency.name}`,
      recruiter: updatedRecruiter,
      previousAgency: oldAgencyName,
      newAgency: newAgency.name,
    });

  } catch (error) {
    console.error('Error in reassign-recruiter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/agencies/reassign-recruiter
 * Get all recruiters (for dropdown selection)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeAgencyId = searchParams.get('excludeAgencyId');

    let query = supabaseAdmin
      .from('agency_recruiters')
      .select(`
        id, 
        user_id,
        first_name, 
        last_name, 
        email, 
        role,
        agency_id,
        agencies (
          id,
          name
        )
      `)
      .order('first_name');

    // Optionally exclude recruiters already in a specific agency
    if (excludeAgencyId) {
      query = query.neq('agency_id', excludeAgencyId);
    }

    const { data: recruiters, error } = await query;

    if (error) {
      console.error('Error fetching recruiters:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recruiters' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recruiters: recruiters?.map(r => ({
        id: r.id,
        userId: r.user_id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        role: r.role,
        agencyId: r.agency_id,
        agencyName: (r.agencies as any)?.name || 'No Agency',
      })) || [],
    });

  } catch (error) {
    console.error('Error fetching recruiters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

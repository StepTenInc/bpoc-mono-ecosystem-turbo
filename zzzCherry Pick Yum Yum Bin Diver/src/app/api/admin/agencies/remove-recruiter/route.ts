import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/agencies/remove-recruiter
 * Remove a recruiter from an agency
 *
 * Body: { recruiterId: string, reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recruiterId, reason } = body;

    if (!recruiterId) {
      return NextResponse.json({ error: 'recruiterId is required' }, { status: 400 });
    }

    // Get recruiter info first
    const { data: recruiter, error: fetchError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id, first_name, last_name, email')
      .eq('id', recruiterId)
      .single();

    if (fetchError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    // Check if recruiter has active jobs or applications they're managing
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title')
      .eq('posted_by', recruiterId)
      .eq('status', 'active');

    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .or(`reviewed_by.eq.${recruiterId}`)
      .in('status', ['under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_pending', 'offer_sent']);

    const hasActiveJobs = (jobs?.length || 0) > 0;
    const hasActiveApplications = (applications?.length || 0) > 0;

    if (hasActiveJobs) {
      return NextResponse.json({
        error: `Cannot remove recruiter: They have ${jobs?.length} active job(s)`,
        details: 'Please reassign or close their active jobs first',
        activeJobs: jobs?.map(j => ({ id: j.id, title: j.title }))
      }, { status: 400 });
    }

    if (hasActiveApplications) {
      return NextResponse.json({
        error: `Cannot remove recruiter: They are managing ${applications?.length} active application(s)`,
        details: 'Please reassign these applications first'
      }, { status: 400 });
    }

    // Soft delete: Set is_active to false
    const { error: updateError } = await supabaseAdmin
      .from('agency_recruiters')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', recruiterId);

    if (updateError) {
      console.error('Error removing recruiter:', updateError);
      return NextResponse.json({ error: 'Failed to remove recruiter' }, { status: 500 });
    }

    // TODO: Log the removal action in audit log
    // await supabaseAdmin.from('admin_audit_log').insert({
    //   action: 'remove_recruiter',
    //   entity_type: 'agency_recruiter',
    //   entity_id: recruiterId,
    //   details: { reason },
    // });

    return NextResponse.json({
      message: `Recruiter ${recruiter.first_name} ${recruiter.last_name} removed successfully`,
      recruiter: {
        id: recruiter.id,
        name: `${recruiter.first_name} ${recruiter.last_name}`,
        email: recruiter.email,
        agencyId: recruiter.agency_id
      }
    });

  } catch (error) {
    console.error('Error removing recruiter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

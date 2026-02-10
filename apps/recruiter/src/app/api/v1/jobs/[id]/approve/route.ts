import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../../../auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/v1/jobs/[id]/approve
 * Approve a job posting via API (Enterprise only, admin/manager roles only)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const jobId = id;

    // Validate API key
    const auth = await validateApiKey(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { notes, approvedBy } = await request.json();

    if (!approvedBy) {
      return NextResponse.json({ 
        error: 'approvedBy (recruiter ID) is required' 
      }, { status: 400 });
    }

    // Verify the recruiter belongs to the agency and has proper role
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, role, agency_id')
      .eq('id', approvedBy)
      .eq('agency_id', auth.agency_id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ 
        error: 'Invalid recruiter ID or recruiter not in your agency' 
      }, { status: 404 });
    }

    // Check if recruiter has approval permissions
    if (recruiter.role !== 'admin' && recruiter.role !== 'super_admin' && recruiter.role !== 'manager') {
      return NextResponse.json({ 
        error: 'Only admins and managers can approve jobs' 
      }, { status: 403 });
    }

    // Get the job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*, agency_clients!inner(agency_id)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify job belongs to the agency
    if ((job.agency_clients as any).agency_id !== auth.agency_id) {
      return NextResponse.json({ 
        error: 'Job does not belong to your agency' 
      }, { status: 403 });
    }

    // Check if already approved
    if (job.approval_status === 'approved') {
      return NextResponse.json({ 
        error: 'Job is already approved' 
      }, { status: 400 });
    }

    // Approve the job
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        approval_status: 'approved',
        approved_by: recruiter.id,
        approved_at: new Date().toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving job:', updateError);
      return NextResponse.json({ 
        error: 'Failed to approve job', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job approved successfully',
      job: {
        id: updatedJob.id,
        title: updatedJob.title,
        approval_status: updatedJob.approval_status,
        approved_by: updatedJob.approved_by,
        approved_at: updatedJob.approved_at,
        status: updatedJob.status,
      },
    });

  } catch (error) {
    console.error('API job approval error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/jobs/[id]/approve
 * Reject a job posting via API (Enterprise only, admin/manager roles only)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const jobId = id;

    // Validate API key
    const auth = await validateApiKey(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { reason, approvedBy } = await request.json();

    if (!approvedBy) {
      return NextResponse.json({ 
        error: 'approvedBy (recruiter ID) is required' 
      }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ 
        error: 'Rejection reason is required' 
      }, { status: 400 });
    }

    // Verify the recruiter
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, role, agency_id')
      .eq('id', approvedBy)
      .eq('agency_id', auth.agency_id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ 
        error: 'Invalid recruiter ID or recruiter not in your agency' 
      }, { status: 404 });
    }

    // Check permissions
    if (recruiter.role !== 'admin' && recruiter.role !== 'super_admin' && recruiter.role !== 'manager') {
      return NextResponse.json({ 
        error: 'Only admins and managers can reject jobs' 
      }, { status: 403 });
    }

    // Get the job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*, agency_clients!inner(agency_id)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify agency ownership
    if ((job.agency_clients as any).agency_id !== auth.agency_id) {
      return NextResponse.json({ 
        error: 'Job does not belong to your agency' 
      }, { status: 403 });
    }

    // Reject the job
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        approval_status: 'rejected',
        approved_by: recruiter.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting job:', updateError);
      return NextResponse.json({ 
        error: 'Failed to reject job', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job rejected',
      job: {
        id: updatedJob.id,
        title: updatedJob.title,
        approval_status: updatedJob.approval_status,
        approved_by: updatedJob.approved_by,
        approved_at: updatedJob.approved_at,
        rejection_reason: updatedJob.rejection_reason,
        status: updatedJob.status,
      },
    });

  } catch (error) {
    console.error('API job rejection error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

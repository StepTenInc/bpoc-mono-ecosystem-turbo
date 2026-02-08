import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin-audit';
import { createNotification } from '@/lib/notifications/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Fetch jobs with agency_client -> agency and company info
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        slug,
        description,
        status,
        approval_status,
        ai_validation,
        ai_validated_at,
        approved_at,
        rejection_reason,
        work_type,
        work_arrangement,
        salary_min,
        salary_max,
        currency,
        industry,
        created_at,
        agency_client:agency_clients (
          id,
          agency:agencies (
            id,
            name
          ),
          company:companies (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Jobs fetch error:', error);
      throw error;
    }

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      (jobs || []).map(async (job) => {
        const { count } = await supabase
          .from('job_applications')
          .select('id', { count: 'exact', head: true })
          .eq('job_id', job.id);

        // Format salary
        let salary = 'Not specified';
        if (job.salary_min && job.salary_max) {
          const currency = job.currency || 'PHP';
          salary = `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`;
        } else if (job.salary_min) {
          salary = `${job.currency || 'PHP'} ${job.salary_min.toLocaleString()}+`;
        }

        // Extract nested data
        const agencyClient = job.agency_client as { agency?: { id: string; name: string }; company?: { id: string; name: string } } | null;

        // Extract AI validation info
        const aiValidation = job.ai_validation as { score?: number; summary?: string; checks?: Record<string, boolean> } | null;

        return {
          id: job.id,
          title: job.title,
          slug: job.slug,
          company: agencyClient?.company?.name || 'ShoreAgents Client',
          agency_id: agencyClient?.agency?.id || null,
          agency_name: agencyClient?.agency?.name || 'ShoreAgents',
          location: job.industry || 'Remote',
          salary,
          type: job.work_type || 'full_time',
          arrangement: job.work_arrangement || 'remote',
          status: job.status,
          approval_status: job.approval_status || 'approved',
          ai_validation: aiValidation ? {
            score: aiValidation.score,
            summary: aiValidation.summary,
          } : null,
          ai_validated_at: job.ai_validated_at,
          approved_at: job.approved_at,
          rejection_reason: job.rejection_reason || null,
          applicants_count: count || 0,
          created_at: job.created_at,
        };
      })
    );

    // Calculate aggregate stats for the pipeline view
    const stats = {
      total: jobsWithCounts.length,
      active: jobsWithCounts.filter(j => j.status === 'active').length,
      paused: jobsWithCounts.filter(j => j.status === 'paused').length,
      closed: jobsWithCounts.filter(j => j.status === 'closed').length,
      ai_approved: jobsWithCounts.filter(j => j.approval_status === 'approved').length,
      pending_review: jobsWithCounts.filter(j => j.approval_status === 'pending_review').length,
      rejected: jobsWithCounts.filter(j => j.approval_status === 'rejected' || j.status === 'rejected').length,
      with_applicants: jobsWithCounts.filter(j => j.applicants_count > 0).length,
      total_applicants: jobsWithCounts.reduce((sum, j) => sum + j.applicants_count, 0),
    };

    return NextResponse.json({ jobs: jobsWithCounts, stats });

  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject a pending job (ONLY admin action allowed)
export async function PATCH(request: NextRequest) {
  try {
    const { jobId, action, rejection_reason } = await request.json();

    // Validate inputs
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 });
    }

    // Require rejection reason when rejecting
    if (action === 'reject' && !rejection_reason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required when rejecting a job' }, { status: 400 });
    }

    // Fetch the job and verify it's pending approval
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        status,
        agency_client_id,
        posted_by,
        agency_client:agency_clients (
          recruiter_id,
          recruiter:agency_recruiters (
            user_id
          )
        )
      `)
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'pending_approval') {
      return NextResponse.json({ 
        error: `Cannot ${action} job. Current status is "${job.status}". Only pending_approval jobs can be approved/rejected.` 
      }, { status: 400 });
    }

    // Update job status
    const newStatus = action === 'approve' ? 'active' : 'rejected';

    // Prepare update data
    const updateData: {
      status: string;
      updated_at: string;
      rejection_reason?: string | null;
    } = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Add rejection_reason for reject action, clear it for approve
    if (action === 'reject') {
      updateData.rejection_reason = rejection_reason;
    } else {
      updateData.rejection_reason = null;
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Job update error:', updateError);
      return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
    }

    // Send notification to recruiter who posted the job
    try {
      const agencyClient = job.agency_client as { recruiter?: { user_id: string } } | null;
      const recruiterId = job.posted_by || agencyClient?.recruiter?.user_id;

      if (recruiterId) {
        const notificationType = action === 'approve' ? 'job_approved' : 'job_rejected';
        const notificationTitle = action === 'approve' ? 'Job Posting Approved' : 'Job Posting Rejected';
        const notificationMessage = action === 'approve'
          ? `Your job posting "${job.title}" has been approved and is now active`
          : `Your job posting "${job.title}" has been rejected. Reason: ${rejection_reason}`;

        await createNotification({
          recipientId: recruiterId,
          recipientType: 'recruiter',
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          actionUrl: `/recruiter/jobs/${jobId}`,
          relatedId: jobId,
          relatedType: 'job',
          isUrgent: action === 'reject'
        });
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    // Log the admin action (non-blocking)
    try {
      // Get admin info from auth header if available
      const authHeader = request.headers.get('authorization');
      let adminId = 'system';
      let adminName = 'BPOC Admin';

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          adminId = user.id;
          adminName = user.email || 'BPOC Admin';
        }
      }

      await logAdminAction({
        adminId,
        adminName,
        action: action === 'approve' ? 'approve_job' : 'reject_job',
        entityType: 'job',
        entityId: jobId,
        entityName: job.title,
        details: { previousStatus: 'pending_approval', newStatus },
      });
    } catch (auditError) {
      console.error('Failed to log audit action:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: `Job ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      job: updatedJob
    });

  } catch (error) {
    console.error('Job approval error:', error);
    return NextResponse.json({ error: 'Failed to process job action' }, { status: 500 });
  }
}

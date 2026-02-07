import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin-audit';
import { getAdminFromSession, requireAdmin } from '@/lib/admin-helpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();
    const admin = await getAdminFromSession();

    // Rate limiting - prevent abuse
    const rateLimitResult = checkRateLimit(admin.adminId, RATE_LIMITS.BATCH_OPERATIONS);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before making more batch operations.',
          resetAt: new Date(rateLimitResult.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { jobIds, action } = body; // action: 'approve' or 'reject'

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'jobIds array is required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: approve or reject' },
        { status: 400 }
      );
    }

    // Fetch all jobs to verify they're all pending
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, status')
      .in('id', jobIds);

    if (fetchError) throw fetchError;

    // Check if all jobs are pending_approval
    const invalidJobs = (jobs || []).filter(j => j.status !== 'pending_approval');
    if (invalidJobs.length > 0) {
      return NextResponse.json({
        error: `${invalidJobs.length} jobs are not pending approval`,
        invalidJobs: invalidJobs.map(j => ({ id: j.id, title: j.title, status: j.status })),
      }, { status: 400 });
    }

    // Batch update
    const newStatus = action === 'approve' ? 'active' : 'rejected';
    const { data: updatedJobs, error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .in('id', jobIds)
      .select();

    if (updateError) throw updateError;

    // Log each action
    const logPromises = (jobs || []).map(job =>
      logAdminAction({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: action === 'approve' ? 'batch_approve_job' : 'batch_reject_job',
        entityType: 'job',
        entityId: job.id,
        entityName: job.title,
        details: {
          batchSize: jobIds.length,
          previousStatus: 'pending_approval',
          newStatus,
        },
      })
    );

    await Promise.all(logPromises);

    return NextResponse.json({
      success: true,
      message: `${jobIds.length} jobs ${action}d successfully`,
      updatedCount: updatedJobs?.length || 0,
    });

  } catch (error) {
    console.error('Batch job action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform batch job action' },
      { status: 500 }
    );
  }
}

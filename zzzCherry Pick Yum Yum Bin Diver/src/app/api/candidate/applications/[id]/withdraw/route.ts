import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { webhookApplicationStatusChanged } from '@/lib/webhooks/events';

// POST - Withdraw an application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header
    const user = await getUserFromRequest(request);

    const applicationId = params.id;

    // Verify application belongs to this candidate
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select('id, candidate_id, status, job_id')
      .eq('id', applicationId)
      .single();

    if (appError || !application || application.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if application can be withdrawn
    const nonWithdrawableStatuses = ['hired', 'rejected', 'withdrawn', 'offer_accepted'];
    if (nonWithdrawableStatuses.includes(application.status)) {
      return NextResponse.json(
        { error: `Cannot withdraw application with status: ${application.status}` },
        { status: 400 }
      );
    }

    // Update application status to withdrawn
    await supabaseAdmin
      .from('job_applications')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    // Add activity timeline entry
    await supabaseAdmin
      .from('application_activity_timeline')
      .insert({
        application_id: applicationId,
        action_type: 'withdrawn',
        performed_by_type: 'candidate',
        performed_by_id: user.id,
        description: 'Candidate withdrew application',
        metadata: {
          timestamp: new Date().toISOString(),
        }
      });

    // Trigger webhook for withdrawal
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('agency_client_id')
      .eq('id', application.job_id)
      .single();

    if (job?.agency_client_id) {
      const { data: agencyClient } = await supabaseAdmin
        .from('agency_clients')
        .select('agency_id')
        .eq('id', job.agency_client_id)
        .single();

      if (agencyClient?.agency_id) {
        webhookApplicationStatusChanged({
          applicationId,
          jobId: application.job_id,
          candidateId: application.candidate_id,
          oldStatus: application.status,
          newStatus: 'withdrawn',
          changedBy: user.id,
          agencyId: agencyClient.agency_id,
        }).catch(err => console.error('[Webhook] Withdraw application error:', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('[Withdraw Application API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw application' },
      { status: 500 }
    );
  }
}

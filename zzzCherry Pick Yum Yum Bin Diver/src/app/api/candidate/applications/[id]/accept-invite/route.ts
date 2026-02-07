import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { webhookApplicationStatusChanged } from '@/lib/webhooks/events';

// POST - Accept an invitation and convert invited -> submitted
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const applicationId = params.id;

    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select('id, candidate_id, job_id, status')
      .eq('id', applicationId)
      .single();

    if (appError || !application || application.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'invited') {
      return NextResponse.json(
        { error: `Cannot accept invite with status: ${application.status}` },
        { status: 400 }
      );
    }

    // Ensure job is active
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, status, title')
      .eq('id', application.job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (job.status !== 'active') {
      return NextResponse.json({ error: 'Job is not accepting applications' }, { status: 400 });
    }

    // Update application status
    await supabaseAdmin
      .from('job_applications')
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    // Activity timeline
    await supabaseAdmin
      .from('application_activity_timeline')
      .insert({
        application_id: applicationId,
        action_type: 'invite_accepted',
        performed_by_type: 'candidate',
        performed_by_id: user.id,
        description: `Candidate accepted invitation to apply for ${job.title || 'job'}`,
        metadata: {
          jobId: application.job_id,
          timestamp: new Date().toISOString(),
        },
      });

    // Mark the related invite notification as read
    try {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('type', 'job_invite')
        .contains('metadata', { applicationId });
    } catch (e) {
      console.warn('[Accept Invite API] Failed to mark invite notification read:', e);
    }

    // Notify recruiter team (best-effort)
    try {
      const { data: jobRow } = await supabaseAdmin
        .from('jobs')
        .select('agency_client_id, title')
        .eq('id', application.job_id)
        .single();

      if (jobRow?.agency_client_id) {
        const { data: agencyClient } = await supabaseAdmin
          .from('agency_clients')
          .select('agency_id')
          .eq('id', jobRow.agency_client_id)
          .single();

        if (agencyClient?.agency_id) {
          const { data: recruiters } = await supabaseAdmin
            .from('agency_recruiters')
            .select('user_id')
            .eq('agency_id', agencyClient.agency_id);

          if (recruiters?.length) {
            await supabaseAdmin.from('notifications').insert(
              recruiters
                .filter(r => !!r.user_id)
                .map(r => ({
                  user_id: r.user_id,
                  type: 'invite_accepted',
                  title: 'Invite accepted ✅',
                  message: `A candidate accepted the invite for ${jobRow.title || 'a job'}.`,
                  action_url: `/recruiter/applications/${applicationId}`,
                  action_label: 'Open application',
                  is_urgent: true,
                  is_read: false,
                  metadata: {
                    applicationId,
                    jobId: application.job_id,
                    timestamp: new Date().toISOString(),
                  },
                }))
            );
          }
        }
      }
    } catch (e) {
      console.warn('[Accept Invite API] Failed to notify recruiters:', e);
    }

    // Increment applicants count
    await supabaseAdmin.rpc('increment_applicants_count', { job_id_param: application.job_id });

    // Trigger webhook for invite acceptance
    if (jobRow?.agency_client_id) {
      const { data: agencyClient } = await supabaseAdmin
        .from('agency_clients')
        .select('agency_id')
        .eq('id', jobRow.agency_client_id)
        .single();

      if (agencyClient?.agency_id) {
        webhookApplicationStatusChanged({
          applicationId,
          jobId: application.job_id,
          candidateId: application.candidate_id,
          oldStatus: 'invited',
          newStatus: 'submitted',
          changedBy: user.id,
          agencyId: agencyClient.agency_id,
        }).catch(err => console.error('[Webhook] Accept invite error:', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted. Application submitted.',
    });
  } catch (error) {
    console.error('[Accept Invite API] Error:', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}

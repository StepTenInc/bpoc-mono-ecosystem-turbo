import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/service';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';

export const dynamic = 'force-dynamic';

interface ProposedTime {
  date: string;
  time: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userIdHeader = request.headers.get('x-user-id');

    if (!authHeader?.startsWith('Bearer ') || !userIdHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing credentials' },
        { status: 401 }
      );
    }

    const recruiterId = userIdHeader;

    // Parse request body
    const body = await request.json();
    const {
      applicationId,
      candidateId,
      interviewType,
      duration,
      proposedTimes,
      notes,
    } = body;

    // Validation
    if (!applicationId || !candidateId || !interviewType || !proposedTimes?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (proposedTimes.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 proposed times allowed' },
        { status: 400 }
      );
    }

    // Verify recruiter has access to this application
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        job_id,
        candidate_id,
        jobs!inner(
          id,
          agency_client_id,
          agency_clients!inner(
            id,
            agency_id,
            agencies!inner(
              id,
              agency_recruiters!inner(
                user_id
              )
            )
          )
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if recruiter has access
    const hasAccess = (application as any).jobs?.agency_clients?.agencies?.agency_recruiters?.some(
      (ar: any) => ar.user_id === recruiterId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this application' },
        { status: 403 }
      );
    }

    // Validate proposed times are in the future (at least 2 hours)
    const now = new Date();
    const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    for (const proposedTime of proposedTimes as ProposedTime[]) {
      const slotDate = new Date(proposedTime.date);
      if (slotDate < minTime) {
        return NextResponse.json(
          { error: 'All proposed times must be at least 2 hours in the future' },
          { status: 400 }
        );
      }
    }

    // Create interview record with pending_scheduling status
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('interviews')
      .insert({
        application_id: applicationId,
        interview_type: interviewType,
        status: 'pending_scheduling',
        duration_minutes: duration || 60,
        notes: notes || null,
        created_by: recruiterId,
      })
      .select()
      .single();

    if (interviewError || !interview) {
      console.error('Failed to create interview:', interviewError);
      return NextResponse.json(
        { error: 'Failed to create interview record' },
        { status: 500 }
      );
    }

    // Create time proposal record
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('interview_time_proposals')
      .insert({
        interview_id: interview.id,
        proposed_times: proposedTimes,
        status: 'pending',
        proposed_by: recruiterId,
      })
      .select()
      .single();

    if (proposalError || !proposal) {
      console.error('Failed to create time proposal:', proposalError);

      // Rollback: delete the interview
      await supabaseAdmin.from('interviews').delete().eq('id', interview.id);

      return NextResponse.json(
        { error: 'Failed to create time proposal' },
        { status: 500 }
      );
    }

    // Send notification to candidate
    try {
      await createNotification({
        recipientId: candidateId,
        recipientType: 'candidate',
        type: 'interview_scheduled',
        title: 'Interview Time Proposal',
        message: `A recruiter has proposed interview times. Please review and select your preferred time.`,
        actionUrl: `/candidate/applications/${applicationId}`,
        actionLabel: 'Review Times',
        relatedId: proposal.id,
        relatedType: 'interview_time_proposal',
        isUrgent: true,
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Log timeline activity for interview proposal
    try {
      await logApplicationActivity(applicationId, {
        action_type: 'interview_scheduled',
        performed_by_type: 'recruiter',
        performed_by_id: recruiterId,
        description: `Interview times proposed for ${interviewType} interview`,
        metadata: {
          interview_id: interview.id,
          proposal_id: proposal.id,
          interview_type: interviewType,
          duration_minutes: duration || 60,
          proposed_times: proposedTimes,
          recruiter_id: recruiterId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log interview proposal:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      interviewId: interview.id,
      message: 'Interview time proposal sent successfully',
    });
  } catch (error) {
    console.error('Error in propose interview endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/service';
import { createDailyRoom, generateMeaningfulRoomName, calculateRoomExpiration } from '@/lib/daily';

export const dynamic = 'force-dynamic';

interface TimeSlot {
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

    const candidateId = userIdHeader;

    // Parse request body
    const body = await request.json();
    const { proposalId, action, acceptedTime, alternativeTime, message } = body;

    // Validation
    if (!proposalId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['accept', 'counter_propose', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get the proposal and verify candidate has access
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('interview_time_proposals')
      .select(`
        *,
        interviews!inner(
          id,
          application_id,
          interview_type,
          duration_minutes,
          job_applications!inner(
            id,
            candidate_id,
            job_id,
            jobs(
              id,
              title
            ),
            candidates(
              id,
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Verify this is the candidate's proposal
    const application = (proposal as any).interviews?.job_applications;
    if (application?.candidate_id !== candidateId) {
      return NextResponse.json(
        { error: 'You do not have access to this proposal' },
        { status: 403 }
      );
    }

    // Check if proposal is still pending
    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: `Proposal has already been ${proposal.status}` },
        { status: 400 }
      );
    }

    const interview = (proposal as any).interviews;

    if (action === 'accept') {
      // Validate accepted time
      if (!acceptedTime?.date || !acceptedTime?.time) {
        return NextResponse.json(
          { error: 'Accepted time is required' },
          { status: 400 }
        );
      }

      // Create Daily.co room for the interview
      const candidateName = application?.candidates
        ? `${application.candidates.first_name} ${application.candidates.last_name}`
        : 'Candidate';

      const roomName = generateMeaningfulRoomName({
        callType: interview.interview_type,
        participantName: candidateName,
      });

      const scheduledDateTime = new Date(acceptedTime.date);
      const expirationTime = calculateRoomExpiration(3); // Room expires 3 hours after scheduled time

      let dailyRoom;
      try {
        dailyRoom = await createDailyRoom({
          name: roomName,
          properties: {
            exp: expirationTime,
            max_participants: 10,
            enable_chat: true,
            enable_screenshare: true,
            enable_recording: 'cloud',
          },
        });
      } catch (dailyError) {
        console.error('Failed to create Daily.co room:', dailyError);
        return NextResponse.json(
          { error: 'Failed to create video room' },
          { status: 500 }
        );
      }

      // Update interview record
      const { error: interviewUpdateError } = await supabaseAdmin
        .from('interviews')
        .update({
          status: 'scheduled',
          scheduled_at: scheduledDateTime.toISOString(),
          daily_room_name: dailyRoom.name,
          daily_room_url: dailyRoom.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', interview.id);

      if (interviewUpdateError) {
        console.error('Failed to update interview:', interviewUpdateError);
        return NextResponse.json(
          { error: 'Failed to update interview' },
          { status: 500 }
        );
      }

      // Update proposal status
      const { error: proposalUpdateError } = await supabaseAdmin
        .from('interview_time_proposals')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      if (proposalUpdateError) {
        console.error('Failed to update proposal:', proposalUpdateError);
      }

      // Create response record
      const { error: responseError } = await supabaseAdmin
        .from('time_proposal_responses')
        .insert({
          proposal_id: proposalId,
          responder_id: candidateId,
          accepted_time: scheduledDateTime.toISOString(),
          status: 'accepted',
          response_notes: message || null,
        });

      if (responseError) {
        console.error('Failed to create response record:', responseError);
      }

      // Send notification to recruiter
      try {
        await createNotification({
          recipientId: proposal.proposed_by,
          recipientType: 'recruiter',
          type: 'interview_scheduled',
          title: 'Interview Time Confirmed',
          message: `${candidateName} has confirmed the interview time.`,
          actionUrl: `/recruiter/applications/${application.id}`,
          actionLabel: 'View Application',
          relatedId: interview.id,
          relatedType: 'interview',
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      return NextResponse.json({
        success: true,
        message: 'Interview time confirmed',
        interview: {
          id: interview.id,
          scheduled_at: scheduledDateTime.toISOString(),
          room_url: dailyRoom.url,
        },
      });
    } else if (action === 'counter_propose') {
      // Validate alternative time
      if (!alternativeTime?.date || !alternativeTime?.time) {
        return NextResponse.json(
          { error: 'Alternative time is required' },
          { status: 400 }
        );
      }

      // Validate alternative time is in the future (at least 2 hours)
      const altDateTime = new Date(alternativeTime.date);
      const minTime = new Date();
      minTime.setHours(minTime.getHours() + 2);

      if (altDateTime < minTime) {
        return NextResponse.json(
          { error: 'Alternative time must be at least 2 hours in the future' },
          { status: 400 }
        );
      }

      // Create response record with counter proposal
      const { error: responseError } = await supabaseAdmin
        .from('time_proposal_responses')
        .insert({
          proposal_id: proposalId,
          responder_id: candidateId,
          alternative_times: [alternativeTime],
          status: 'counter_proposed',
          response_notes: message || null,
        });

      if (responseError) {
        console.error('Failed to create response record:', responseError);
        return NextResponse.json(
          { error: 'Failed to create counter proposal' },
          { status: 500 }
        );
      }

      // Update original proposal status (still pending, but has counter)
      // Don't change to rejected, recruiter can still accept original or counter

      // Send notification to recruiter
      try {
        const candidateName = application?.candidates
          ? `${application.candidates.first_name} ${application.candidates.last_name}`
          : 'Candidate';

        await createNotification({
          recipientId: proposal.proposed_by,
          recipientType: 'recruiter',
          type: 'interview_scheduled',
          title: 'Alternative Interview Time Proposed',
          message: `${candidateName} has proposed an alternative time for the interview.`,
          actionUrl: `/recruiter/applications/${application.id}`,
          actionLabel: 'Review Alternative',
          relatedId: proposalId,
          relatedType: 'interview_time_proposal',
          isUrgent: true,
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      return NextResponse.json({
        success: true,
        message: 'Alternative time proposed to recruiter',
      });
    } else if (action === 'reject') {
      // Update proposal status
      const { error: proposalUpdateError } = await supabaseAdmin
        .from('interview_time_proposals')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      if (proposalUpdateError) {
        console.error('Failed to update proposal:', proposalUpdateError);
        return NextResponse.json(
          { error: 'Failed to reject proposal' },
          { status: 500 }
        );
      }

      // Create response record
      const { error: responseError } = await supabaseAdmin
        .from('time_proposal_responses')
        .insert({
          proposal_id: proposalId,
          responder_id: candidateId,
          status: 'rejected',
          response_notes: message || null,
        });

      if (responseError) {
        console.error('Failed to create response record:', responseError);
      }

      // Send notification to recruiter
      try {
        const candidateName = application?.candidates
          ? `${application.candidates.first_name} ${application.candidates.last_name}`
          : 'Candidate';

        await createNotification({
          recipientId: proposal.proposed_by,
          recipientType: 'recruiter',
          type: 'interview_scheduled',
          title: 'Interview Times Declined',
          message: `${candidateName} has declined the proposed interview times.`,
          actionUrl: `/recruiter/applications/${application.id}`,
          actionLabel: 'View Application',
          relatedId: proposalId,
          relatedType: 'interview_time_proposal',
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      return NextResponse.json({
        success: true,
        message: 'Interview times declined',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in respond to interview endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

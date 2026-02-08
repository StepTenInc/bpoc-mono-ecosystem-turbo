import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { formatInPhilippinesTime } from '@/lib/timezone';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

/**
 * Create a Daily.co video room for the interview
 */
async function createDailyRoom(interview_id: string, scheduledAt: string, durationMinutes: number): Promise<{ url: string; name: string } | null> {
  if (!DAILY_API_KEY) {
    console.error('[Daily] No API key configured');
    return null;
  }

  try {
    const roomName = `interview-${interviewId}-${Date.now()}`;
    const expiryTime = new Date(scheduledAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + durationMinutes + 30); // Extra 30 min buffer

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: {
          exp: Math.floor(expiryTime.getTime() / 1000),
          max_participants: 10,
          enable_chat: true,
          enable_knocking: false,
          enable_screenshare: true,
          enable_recording: 'cloud',
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Daily] Failed to create room:', error);
      return null;
    }

    const room = await response.json();
    return {
      url: room.url,
      name: room.name,
    };
  } catch (error) {
    console.error('[Daily] Error creating room:', error);
    return null;
  }
}

/**
 * POST /api/recruiter/interviews/[id]/respond
 * 
 * Recruiter responds to an interview request
 * 
 * Body:
 * - action: 'accept' | 'reject' | 'counter'
 * - newTime?: string (ISO, for counter proposals)
 * - message?: string (optional message)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const interviewId = id;
    const body = await request.json();
    const { action, newTime, message } = body;

    // Validate action
    if (!action || !['accept', 'reject', 'counter'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept", "reject", or "counter"' },
        { status: 400 }
      );
    }

    if (action === 'counter' && !newTime) {
      return NextResponse.json(
        { error: 'New time is required for counter proposal' },
        { status: 400 }
      );
    }

    // Get recruiter info
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Fetch interview with related data
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('job_interviews')
      .select(`
        id,
        application_id,
        status,
        scheduled_at,
        duration_minutes,
        client_timezone,
        application:job_applications!inner(
          id,
          job_id,
          candidate_id,
          candidate:candidates!inner(
            first_name,
            last_name,
            email
          ),
          job:jobs!inner(
            id,
            title,
            agency_client_id,
            agency_clients!inner(
              id,
              agency_id,
              client_timezone,
              primary_contact_email,
              companies(name)
            )
          )
        )
      `)
      .eq('id', interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Verify recruiter has access to this interview
    if (interview.application.job.agency_clients.agency_id !== recruiter.agency_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const clientTimezone = interview.client_timezone || interview.application.job.agency_clients.client_timezone || 'Australia/Sydney';
    const candidateName = `${interview.application.candidate.first_name} ${interview.application.candidate.last_name}`;
    const clientName = interview.application.job.agency_clients.companies?.name || 'Client';

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    let meetingRoom = null;

    if (action === 'accept') {
      // Accept the interview - create Daily room
      meetingRoom = await createDailyRoom(
        interview.id,
        interview.scheduled_at,
        interview.duration_minutes || 30
      );

      updateData.status = 'confirmed';
      updateData.meeting_link = meetingRoom?.url || null;
      updateData.interviewer_id = recruiter.id;
      updateData.interviewer_notes = message 
        ? `${interview.interviewer_notes || ''}\n\n[Accepted] ${message}`.trim()
        : interview.interviewer_notes;

      // Also create video_call_rooms record if meeting was created
      if (meetingRoom) {
        await supabaseAdmin
          .from('video_call_rooms')
          .insert({
            interview_id: interview.id,
            application_id: interview.application_id,
            call_type: 'client_interview',
            call_title: `Interview: ${candidateName} - ${interview.application.job.title}`,
            status: 'scheduled',
            daily_room_url: meetingRoom.url,
            daily_room_name: meetingRoom.name,
            scheduled_for: interview.scheduled_at,
            created_by: userId,
          });
      }

    } else if (action === 'reject') {
      updateData.status = 'cancelled';
      updateData.interviewer_notes = message 
        ? `${interview.interviewer_notes || ''}\n\n[Rejected] ${message}`.trim()
        : interview.interviewer_notes;

    } else if (action === 'counter') {
      // Counter proposal with new time
      const newScheduledAt = new Date(newTime).toISOString();
      const newScheduledAtPh = formatInPhilippinesTime(newScheduledAt) + ' (PHT)';
      const newScheduledAtClientLocal = new Date(newScheduledAt).toLocaleString('en-US', {
        timeZone: clientTimezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ` (${clientTimezone.split('/').pop()?.replace('_', ' ') || clientTimezone})`;

      updateData.status = 'pending_client_confirmation';
      updateData.scheduled_at = newScheduledAt;
      updateData.scheduled_at_ph = newScheduledAtPh;
      updateData.scheduled_at_client_local = newScheduledAtClientLocal;
      updateData.interviewer_notes = message 
        ? `${interview.interviewer_notes || ''}\n\n[Counter Proposal] ${message}`.trim()
        : interview.interviewer_notes;
    }

    // Update the interview
    const { error: updateError } = await supabaseAdmin
      .from('job_interviews')
      .update(updateData)
      .eq('id', interviewId);

    if (updateError) {
      console.error('Error updating interview:', updateError);
      return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
    }

    // Update application status based on action
    if (action === 'accept') {
      await supabaseAdmin
        .from('job_applications')
        .update({
          status: 'interview_scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', interview.application_id);
    }

    // Create notification based on action
    // TODO: Notify client via email about the decision

    return NextResponse.json({
      success: true,
      action,
      interviewId,
      status: updateData.status,
      meetingUrl: meetingRoom?.url || null,
      message: action === 'accept' 
        ? 'Interview confirmed. Meeting room created.'
        : action === 'reject'
        ? 'Interview request rejected.'
        : 'Counter proposal sent to client.',
    });

  } catch (error) {
    console.error('Error responding to interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

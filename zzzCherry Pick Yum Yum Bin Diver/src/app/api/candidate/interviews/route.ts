import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { createMeetingToken } from '@/lib/daily';

// GET - Fetch interviews for the logged-in candidate
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const user = await getUserFromRequest(request);

    // Resolve candidate display name for Daily (so they don't show as generic "Candidate")
    let candidateDisplayName =
      (user.user_metadata as any)?.full_name ||
      `${(user.user_metadata as any)?.first_name || ''} ${(user.user_metadata as any)?.last_name || ''}`.trim() ||
      '';
    if (!candidateDisplayName) {
      const { data: cand } = await supabaseAdmin
        .from('candidates')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();
      if (cand) {
        candidateDisplayName =
          `${(cand as any).first_name || ''} ${(cand as any).last_name || ''}`.trim() || '';
      }
    }
    if (!candidateDisplayName) candidateDisplayName = 'Candidate';

    // Get candidate's applications
    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .eq('candidate_id', user.id);

    if (!applications || applications.length === 0) {
      return NextResponse.json({ interviews: [] });
    }

    const applicationIds = applications.map(a => a.id);

    // Get interviews for those applications
    const { data: interviews, error } = await supabaseAdmin
      .from('job_interviews')
      .select(`
        id,
        interview_type,
        status,
        outcome,
        scheduled_at,
        duration_minutes,
        meeting_link,
        interviewer_notes,
        created_at,
        application:job_applications (
          id,
          job:jobs (
            id,
            title,
            agency_client:agency_clients (
              company:companies (
                name
              )
            )
          )
        )
      `)
      .in('application_id', applicationIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get video room data for interviews that have meeting links
    const interviewIds = (interviews || []).map(i => i.id);
    const { data: videoRooms } = await supabaseAdmin
      .from('video_call_rooms')
      .select('interview_id, daily_room_name, daily_room_url')
      .in('interview_id', interviewIds.length > 0 ? interviewIds : ['none']);

    const videoRoomMap = new Map(
      (videoRooms || []).map(vr => [vr.interview_id, vr])
    );

    // Format interviews with fresh participant tokens
    const formattedInterviews = await Promise.all((interviews || []).map(async (interview) => {
      const app = interview.application as {
        id: string;
        job?: {
          id: string;
          title: string;
          agency_client?: { company?: { name: string } };
        };
      } | null;

      // Generate fresh participant token if video room exists
      let participantJoinUrl = null;
      const videoRoom = videoRoomMap.get(interview.id);

      if (videoRoom?.daily_room_name) {
        try {
          const token = await createMeetingToken({
            roomName: videoRoom.daily_room_name,
            userId: user.id,
            userName: candidateDisplayName,
            isOwner: false,
            enableRecording: false,
            enableScreenShare: true,
          });
          participantJoinUrl = `${videoRoom.daily_room_url}?t=${token}`;
        } catch (tokenError) {
          console.error('Failed to generate participant token:', tokenError);
          // Fall back to raw meeting link if token generation fails
          participantJoinUrl = interview.meeting_link;
        }
      }

      return {
        id: interview.id,
        jobId: app?.job?.id,
        jobTitle: app?.job?.title || 'Unknown Job',
        company: app?.job?.agency_client?.company?.name || 'ShoreAgents Client',
        type: interview.interview_type,
        status: interview.status,
        outcome: interview.outcome,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration_minutes,
        meetingLink: interview.meeting_link,
        participantJoinUrl, // Fresh token URL for joining
        notes: interview.interviewer_notes,
        createdAt: interview.created_at,
      };
    }));

    return NextResponse.json({ interviews: formattedInterviews });

  } catch (error) {
    console.error('Candidate interviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}


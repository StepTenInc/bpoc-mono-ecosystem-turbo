import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken, logClientAccess } from '@/lib/client-tokens';

/**
 * GET /api/client/jobs/[token]/interviews/[id]
 *
 * Get interview details and join link (via job token)
 *
 * Returns:
 * - Interview details
 * - Candidate brief info
 * - Daily.co join URL and token
 * - Can join status (based on time)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; id: string } }
) {
  try {
    const { token, id: interviewId } = params;

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired access link' },
        { status: 403 }
      );
    }

    if (!tokenData.canJoinInterviews) {
      return NextResponse.json(
        { error: 'You do not have permission to join interviews' },
        { status: 403 }
      );
    }

    // Get client IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Fetch interview
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('job_interviews')
      .select(`
        id,
        scheduled_at,
        scheduled_at_ph,
        scheduled_at_client_local,
        duration_minutes,
        client_timezone,
        status,
        interview_type,
        meeting_link,
        application_id
      `)
      .eq('id', interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Fetch application separately
    const { data: application } = await supabaseAdmin
      .from('job_applications')
      .select('id, job_id, candidate_id, released_to_client')
      .eq('id', interview.application_id)
      .single();

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Fetch candidate separately
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', application.candidate_id)
      .single();

    // Verify interview belongs to a job accessible by this token
    if (application.job_id !== tokenData.jobId) {
      return NextResponse.json(
        { error: 'This interview does not belong to your job' },
        { status: 403 }
      );
    }

    // Verify candidate is released to client
    if (!application.released_to_client) {
      return NextResponse.json(
        { error: 'This candidate has not been released to you yet' },
        { status: 403 }
      );
    }

    // Calculate if client can join (5 minutes before start time, or always in dev mode)
    const scheduledTime = new Date(interview.scheduled_at);
    const now = new Date();
    const minutesUntilStart = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
    const isDevMode = process.env.NODE_ENV === 'development';
    const canJoin = isDevMode || (minutesUntilStart <= 5 && minutesUntilStart >= -interview.duration_minutes);

    // Get job details for context
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('title')
      .eq('id', tokenData.jobId)
      .single();

    // Log access
    await logClientAccess({
      jobTokenId: tokenData.tokenId,
      action: canJoin ? 'joined_interview' : 'viewed_interview',
      metadata: {
        interview_id: interviewId,
        application_id: application.id,
        candidate_name: `${candidate?.first_name} ${candidate?.last_name}`,
        scheduled_at: interview.scheduled_at,
      },
      ipAddress,
      userAgent,
    });

    // Format response
    const response = {
      interview: {
        id: interview.id,
        scheduledAt: interview.scheduled_at,
        scheduledAtClientLocal: (interview as any).scheduled_at_client_local || null,
        scheduledAtPh: (interview as any).scheduled_at_ph || null,
        duration: interview.duration_minutes,
        timezone: interview.client_timezone || 'Asia/Manila',
        status: interview.status,
        type: interview.interview_type,
      },
      candidate: {
        id: candidate?.id,
        fullName: `${candidate?.first_name} ${candidate?.last_name}`,
        headline: '', // Fetched from candidate_profiles if needed
        avatar: candidate?.avatar_url,
      },
      job: {
        title: job?.title || 'Unknown Position',
      },
      meeting: {
        url: interview.meeting_link,
        // In production, you might want to generate a Daily.co guest token here
        // For now, we'll use the meeting URL directly
      },
      canJoin,
      minutesUntilStart: Math.max(minutesUntilStart, 0),
      joinMessage: canJoin
        ? 'You can join the interview now'
        : minutesUntilStart > 0
        ? `Interview starts in ${minutesUntilStart} minutes`
        : 'Interview has ended',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching interview details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview details' },
      { status: 500 }
    );
  }
}

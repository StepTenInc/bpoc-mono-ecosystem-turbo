import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET - Fetch all interviews for admin (VIEW ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    let query = supabaseAdmin
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
          released_to_client,
          candidate:candidates (
            id,
            email,
            first_name,
            last_name,
            avatar_url
          ),
          job:jobs (
            id,
            title,
            agency_client:agency_clients (
              company:companies (
                name
              ),
              agency:agencies (
                name
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: interviews, error } = await query;

    if (error) throw error;

    const formattedInterviews = (interviews || []).map((interview) => {
      const app = interview.application as {
        id: string;
        released_to_client?: boolean;
        candidate?: { id: string; email: string; first_name: string; last_name: string; avatar_url?: string };
        job?: { id: string; title: string; agency_client?: { company?: { name: string }; agency?: { name: string } } };
      } | null;

      return {
        id: interview.id,
        applicationId: app?.id,
        candidateId: app?.candidate?.id,
        candidateName: app?.candidate ? `${app.candidate.first_name} ${app.candidate.last_name}`.trim() : 'Unknown',
        candidateEmail: app?.candidate?.email || '',
        candidateAvatar: app?.candidate?.avatar_url,
        jobId: app?.job?.id,
        jobTitle: app?.job?.title || 'Unknown Job',
        company: app?.job?.agency_client?.company?.name || 'Unknown Company',
        agency: app?.job?.agency_client?.agency?.name || 'Unknown Agency',
        releasedToClient: app?.released_to_client || false,
        type: interview.interview_type,
        status: interview.status,
        outcome: interview.outcome,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration_minutes,
        meetingLink: interview.meeting_link,
        notes: interview.interviewer_notes,
        createdAt: interview.created_at,
      };
    });

    return NextResponse.json({ interviews: formattedInterviews });

  } catch (error) {
    console.error('Interviews API error:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

// NOTE: POST and PATCH removed - Admin should NOT create or modify interviews
// Interview scheduling and updates are handled by recruiters via /api/recruiter/interviews

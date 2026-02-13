import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

/**
 * GET /api/candidate/applications/:id
 * Fetch a single application for the logged-in candidate, including any
 * call artifacts explicitly shared with the candidate.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);

    const { id } = await params;

    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs(
          id,
          title,
          description,
          salary_min,
          salary_max,
          currency,
          work_arrangement,
          shift,
          agency_clients(
            agencies(name),
            companies(name, industry)
          )
        )
      `)
      .eq('id', id)
      .eq('candidate_id', user.id)
      .single();

    if (appError) {
      console.error('Supabase error fetching application:', appError);
      return NextResponse.json({ error: 'Application not found', details: appError.message }, { status: 404 });
    }
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Fetch all calls for this application, then filter by candidate sharing flags
    const { data: calls } = await supabaseAdmin
      .from('video_call_rooms')
      .select(`
        id,
        daily_room_name,
        daily_room_url,
        call_type,
        call_title,
        status,
        notes,
        rating,
        share_with_candidate,
        started_at,
        ended_at,
        duration_seconds,
        created_at,
        recordings:video_call_recordings(
          id,
          recording_url,
          download_url,
          duration_seconds,
          status,
          shared_with_candidate,
          created_at
        ),
        transcripts:video_call_transcripts(
          id,
          full_text,
          summary,
          key_points,
          word_count,
          status,
          shared_with_candidate,
          created_at
        )
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    const filteredCalls = (calls || [])
      .map((c: any) => {
        const shareAll =
          typeof c.share_with_candidate === 'boolean'
            ? !!c.share_with_candidate
            : false;

        // Only return calls that are explicitly shared
        if (!shareAll) return null;

        const safe = { ...c };
        return safe;
      })
      .filter(Boolean);

    // Fetch interviews for this application
    const { data: interviews } = await supabaseAdmin
      .from('job_interviews')
      .select(`
        id,
        interview_type,
        scheduled_at,
        scheduled_at_ph,
        scheduled_at_client_local,
        client_timezone,
        duration_minutes,
        location,
        meeting_link,
        status,
        outcome,
        feedback,
        rating,
        interviewer_notes,
        created_at,
        updated_at,
        time_proposals:interview_time_proposals(
          id,
          proposed_times,
          status,
          proposed_by,
          created_at
        )
      `)
      .eq('application_id', id)
      .order('scheduled_at', { ascending: true });

    // Fetch any offers for this application
    const { data: offers } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        salary_offered,
        salary_type,
        currency,
        start_date,
        benefits_offered,
        additional_terms,
        status,
        sent_at,
        viewed_at,
        responded_at,
        expires_at,
        candidate_response,
        created_at
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      application: {
        ...application,
        calls: filteredCalls,
        interviews: interviews || [],
        offers: (offers || []).map((o: any) => ({
          id: o.id,
          salary: o.salary_offered,
          salary_type: o.salary_type,
          currency: o.currency,
          start_date: o.start_date,
          benefits: o.benefits_offered,
          notes: o.additional_terms,
          status: o.status,
          expires_at: o.expires_at,
          created_at: o.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error in candidate application detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



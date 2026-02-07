import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getApplicationActivityTimeline } from '@/lib/db/applications/queries.supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get application with job + candidate info
    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs(
          id,
          title,
          agency_client_id
        ),
        candidates(
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Candidate profile (location lives in candidate_profiles, not candidates)
    const candidateId = (application as any)?.candidate_id as string | undefined;
    const { data: candidateProfile } = candidateId
      ? await supabaseAdmin
        .from('candidate_profiles')
        .select('location, location_city, location_province, location_country')
        .eq('candidate_id', candidateId)
        .maybeSingle()
      : { data: null };

    if ((application as any)?.candidates) {
      (application as any).candidates = {
        ...(application as any).candidates,
        location: candidateProfile?.location
          || candidateProfile?.location_city
          || null,
        location_city: candidateProfile?.location_city || null,
        location_province: candidateProfile?.location_province || null,
        location_country: candidateProfile?.location_country || null,
      };
    }

    // Client feedback (migrated off job_applications)
    const { data: clientFeedback } = await supabaseAdmin
      .from('application_client_feedback')
      .select('notes, rating')
      .eq('application_id', id)
      .maybeSingle();

    // Back-compat fields used by existing UI components
    (application as any).client_notes = clientFeedback?.notes ?? null;
    (application as any).client_rating = clientFeedback?.rating ?? null;
    (application as any).client_tags = [];

    // Get activity timeline
    const timeline = await getApplicationActivityTimeline(id);

    // Get related interviews
    const { data: interviews } = await supabaseAdmin
      .from('job_interviews')
      .select('*')
      .eq('application_id', id)
      .order('scheduled_at', { ascending: false });

    // Get related offers
    const { data: offers } = await supabaseAdmin
      .from('job_offers')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    // Get all related call rooms (recruiter + client calls) with recordings + transcripts
    const { data: calls } = await supabaseAdmin
      .from('video_call_rooms')
      .select(`
        id,
        daily_room_name,
        daily_room_url,
        call_type,
        call_mode,
        call_title,
        title,
        status,
        notes,
        rating,
        started_at,
        ended_at,
        duration_seconds,
        host_user_id,
        participant_user_id,
        created_at,
        recordings:video_call_recordings(
          id,
          daily_recording_id,
          recording_url,
          download_url,
          duration_seconds,
          status,
          created_at,
          processed_at
        ),
        transcripts:video_call_transcripts(
          id,
          recording_id,
          full_text,
          segments,
          summary,
          key_points,
          word_count,
          status,
          error_message,
          created_at,
          completed_at
        )
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      application: {
        ...application,
        timeline: timeline || [],
        interviews: interviews || [],
        offers: offers || [],
        calls: calls || [],
      },
    });
  } catch (error) {
    console.error('Error fetching admin application:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getApplicationActivityTimeline } from '@/lib/db/applications/queries.supabase';
import { verifyAuthToken } from '@/lib/auth/verify-token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    if (!userId) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const debug = request.nextUrl.searchParams.get('debug') === '1';

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      console.warn('[recruiter/applications/:id] Recruiter not found for user', { userId, applicationId: id });
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    // Get agency's client IDs
    const { data: clients } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('agency_id', recruiter.agency_id);

    const clientIds = clients?.map(c => c.id) || [];
    if (clientIds.length === 0) {
      console.warn('[recruiter/applications/:id] No clients for recruiter agency', {
        userId,
        agencyId: recruiter.agency_id,
        applicationId: id,
      });
    }

    // Get application with job and candidate info
    // First get the application to check if it exists
    const { data: applicationCheck, error: checkError } = await supabaseAdmin
      .from('job_applications')
      .select('id, job_id, candidate_id')
      .eq('id', id)
      .single();

    if (checkError || !applicationCheck) {
      console.warn('[recruiter/applications/:id] Application does not exist', { userId, applicationId: id });
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get the job to verify access
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('id, title, agency_client_id')
      .eq('id', applicationCheck.job_id)
      .single();

    if (!job || !clientIds.includes(job.agency_client_id)) {
      console.warn('[recruiter/applications/:id] Application not in recruiter scope', {
        userId,
        applicationId: id,
        jobAgencyClient: job?.agency_client_id,
        recruiterClients: clientIds,
      });
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Now get full application details
    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        candidates(
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    // Add job data to application
    if (application) {
      (application as any).jobs = job;
    }

    if (error || !application) {
      if (debug) {
        // Check if app exists at all, and if it exists, what agency_client_id it's under
        const { data: appAny, error: appAnyErr } = await supabaseAdmin
          .from('job_applications')
          .select(`
            id,
            job_id,
            candidate_id,
            status,
            jobs(
              id,
              title,
              agency_client_id
            )
          `)
          .eq('id', id)
          .maybeSingle();

        const found = !!appAny;
        const appAgencyClientId = (appAny as any)?.jobs?.agency_client_id || null;
        const inScope = appAgencyClientId ? clientIds.includes(appAgencyClientId) : false;

        return NextResponse.json(
          {
            error: 'Application not found',
            debug: {
              userId,
              recruiterAgencyId: recruiter.agency_id,
              recruiterClientIdsCount: clientIds.length,
              appExists: found,
              appAgencyClientId,
              appInRecruiterScope: inScope,
              appAnyError: appAnyErr?.message || null,
              scopedQueryError: error?.message || null,
            },
          },
          { status: 404 }
        );
      }
      console.warn('[recruiter/applications/:id] Application not found or not in scope', {
        userId,
        agencyId: recruiter.agency_id,
        applicationId: id,
        clientIdsCount: clientIds.length,
        error: error?.message,
      });
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
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

    // Get candidate resume (best effort)
    const { data: resumes } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id, file_name, file_url, is_primary, uploaded_at, created_at')
      .eq('candidate_id', (application as any).candidate_id)
      .order('is_primary', { ascending: false })
      .order('uploaded_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    const resume = resumes?.[0] || null;

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
        share_with_client,
        share_with_candidate,
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
          shared_with_client,
          shared_with_candidate,
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
          shared_with_candidate,
          shared_with_client,
          created_at,
          completed_at
        )
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      application: {
        ...application,
        resume_url: resume?.file_url || null,
        resume_file_name: resume?.file_name || null,
        timeline: timeline || [],
        interviews: interviews || [],
        offers: offers || [],
        calls: calls || [],
      },
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}


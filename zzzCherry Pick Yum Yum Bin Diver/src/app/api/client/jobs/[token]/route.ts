import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken, logClientAccess } from '@/lib/client-tokens';

/**
 * GET /api/client/jobs/[token]
 *
 * Client job dashboard endpoint (no auth required - token-based)
 *
 * Returns:
 * - Job details
 * - Statistics (total applicants, shortlisted, released, interviewed)
 * - List of released candidates
 * - Upcoming interviews
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // Validate token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired access link' },
        { status: 403 }
      );
    }

    // Get client IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Fetch job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        description,
        requirements,
        responsibilities,
        benefits,
        salary_min,
        salary_max,
        currency,
        salary_type,
        work_type,
        work_arrangement,
        shift,
        experience_level,
        status,
        created_at,
        agency_client:agency_clients!inner(
          id,
          client_timezone,
          company:companies(
            name
          )
        )
      `)
      .eq('id', tokenData.jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get job statistics
    const { count: totalApplicants } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', tokenData.jobId);

    const { count: shortlisted } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', tokenData.jobId)
      .eq('status', 'shortlisted');

    const { count: releasedToClient } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', tokenData.jobId)
      .eq('released_to_client', true);

    const { count: interviewed } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', tokenData.jobId)
      .eq('status', 'interviewed');

    const { count: offered } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', tokenData.jobId)
      .in('status', ['offered', 'offer_accepted']);

    const { count: hired } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', tokenData.jobId)
      .eq('status', 'hired');

    // Fetch released candidates (only those marked as released_to_client)
    const { data: releasedCandidates, error: candidatesError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        status,
        released_at,
        candidate_id
      `)
      .eq('job_id', tokenData.jobId)
      .eq('released_to_client', true)
      .order('released_at', { ascending: false });

    // Fetch candidate details for each application (from both candidates and candidate_profiles)
    const candidateMap = new Map();
    for (const app of (releasedCandidates || [])) {
      if (app.candidate_id) {
        const { data: candidate } = await supabaseAdmin
          .from('candidates')
          .select('id, slug, first_name, last_name, avatar_url')
          .eq('id', app.candidate_id)
          .single();
        
        const { data: profile } = await supabaseAdmin
          .from('candidate_profiles')
          .select('headline')
          .eq('candidate_id', app.candidate_id)
          .single();
        
        if (candidate) {
          candidateMap.set(app.candidate_id, {
            ...candidate,
            headline: profile?.headline || '',
          });
        }
      }
    }

    if (candidatesError) {
      console.error('Error fetching released candidates:', candidatesError);
    }

    // Fetch upcoming interviews for released candidates
    const releasedApplicationIds = (releasedCandidates || []).map(app => app.id);
    const { data: upcomingInterviews, error: interviewsError } = releasedApplicationIds.length > 0
      ? await supabaseAdmin
          .from('job_interviews')
          .select(`
            id,
            scheduled_at,
            scheduled_at_ph,
            scheduled_at_client_local,
            client_timezone,
            duration_minutes,
            status,
            meeting_link,
            application_id
          `)
          .in('application_id', releasedApplicationIds)
          .in('status', ['scheduled', 'confirmed', 'pending_scheduling'])
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
      : { data: [], error: null };

    if (interviewsError) {
      console.error('Error fetching interviews:', interviewsError);
    }

    // Fetch candidate names for interviews
    const interviewCandidateMap = new Map();
    for (const interview of (upcomingInterviews || [])) {
      const app = (releasedCandidates || []).find(a => a.id === interview.application_id);
      if (app) {
        const candidate = candidateMap.get(app.candidate_id);
        if (candidate) {
          interviewCandidateMap.set(interview.id, `${candidate.first_name} ${candidate.last_name}`);
        }
      }
    }

    // Log access
    await logClientAccess({
      jobTokenId: tokenData.tokenId,
      action: 'viewed_job_dashboard',
      metadata: {
        job_id: tokenData.jobId,
        job_title: job.title,
      },
      ipAddress,
      userAgent,
    });

    // Format response
    const response = {
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || [],
        status: job.status,
        postedAt: job.created_at,
        salaryRange: {
          min: job.salary_min,
          max: job.salary_max,
          currency: job.currency || 'PHP',
          type: job.salary_type || 'monthly',
        },
        workType: job.work_type,
        workArrangement: job.work_arrangement,
        shift: job.shift,
        experienceLevel: job.experience_level,
      },
      client: {
        name: job.agency_client?.company?.name || 'Unknown Company',
        timezone: job.agency_client?.client_timezone || 'Australia/Sydney',
      },
      statistics: {
        totalApplicants: totalApplicants || 0,
        shortlisted: shortlisted || 0,
        releasedToClient: releasedToClient || 0,
        interviewed: interviewed || 0,
        offered: offered || 0,
        hired: hired || 0,
      },
      releasedCandidates: (releasedCandidates || []).map((app: any) => {
        const candidate = candidateMap.get(app.candidate_id);
        return {
          applicationId: app.id,
          candidateId: candidate?.id || app.candidate_id,
          candidateSlug: candidate?.slug || '',
          fullName: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
          headline: candidate?.headline || '',
          avatar: candidate?.avatar_url || null,
          status: app.status,
          releasedAt: app.released_at,
          profileUrl: `/client/jobs/${token}/candidates/${app.id}`,
        };
      }),
      upcomingInterviews: (upcomingInterviews || []).map((interview: any) => {
        // Calculate if client can join (5 minutes before start time, or always in dev mode)
        const scheduledTime = new Date(interview.scheduled_at);
        const now = new Date();
        const minutesUntilStart = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
        const isDevMode = process.env.NODE_ENV === 'development';
        const canJoin = isDevMode || (minutesUntilStart <= 5 && minutesUntilStart >= -(interview.duration_minutes || 30));
        
        return {
          id: interview.id,
          candidateName: interviewCandidateMap.get(interview.id) || 'Candidate',
          scheduledAt: interview.scheduled_at,
          scheduledAtClientLocal: interview.scheduled_at_client_local || null,
          scheduledAtPh: interview.scheduled_at_ph || null,
          duration: interview.duration_minutes,
          status: interview.status,
          canJoin,
          joinUrl: interview.meeting_link || `/client/jobs/${token}/interviews/${interview.id}`,
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching client job dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job dashboard' },
      { status: 500 }
    );
  }
}

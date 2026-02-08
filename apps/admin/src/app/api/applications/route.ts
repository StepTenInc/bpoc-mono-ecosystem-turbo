import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';

// GET - Fetch all applications for admin (VIEW ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    let query = supabase
      .from('job_applications')
      .select(`
        id,
        status,
        created_at,
        released_to_client,
        released_at,
        recruiter_notes,
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
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) throw error;

    const formattedApps = (applications || []).map((app) => {
      const candidateData = app.candidate;
      const candidate = Array.isArray(candidateData) ? candidateData[0] : candidateData;
      const jobData = app.job;
      const job = Array.isArray(jobData) ? jobData[0] : jobData;

      return {
        id: app.id,
        candidate_id: candidate?.id,
        candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}`.trim() || candidate.email : 'Unknown',
        candidate_email: candidate?.email || '',
        candidate_avatar: candidate?.avatar_url,
        job_id: job?.id,
        job_title: job?.title || 'Unknown Job',
        company: job?.agency_client?.[0]?.company?.[0]?.name || 'Unknown Company',
        agency: job?.agency_client?.[0]?.agency?.[0]?.name || 'Unknown Agency',
        status: app.status,
        applied_at: app.created_at,
        released_to_client: app.released_to_client,
        released_at: app.released_at,
        recruiter_notes: app.recruiter_notes,
      };
    });

    return NextResponse.json({ applications: formattedApps });

  } catch (error) {
    console.error('Applications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// NOTE: PATCH and POST removed - Admin should NOT modify applications
// Application status changes are handled by recruiters via /api/recruiter/applications/*

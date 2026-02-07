import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET - Fetch all applications for admin (VIEW ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    let query = supabaseAdmin
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
      const candidate = app.candidate as { id: string; email: string; first_name: string; last_name: string; avatar_url?: string } | null;
      const job = app.job as { id: string; title: string; agency_client?: { company?: { name: string }; agency?: { name: string } } } | null;

      return {
        id: app.id,
        candidateId: candidate?.id,
        candidateName: candidate ? `${candidate.first_name} ${candidate.last_name}`.trim() || candidate.email : 'Unknown',
        candidateEmail: candidate?.email || '',
        candidateAvatar: candidate?.avatar_url,
        jobId: job?.id,
        jobTitle: job?.title || 'Unknown Job',
        company: job?.agency_client?.company?.name || 'Unknown Company',
        agency: job?.agency_client?.agency?.name || 'Unknown Agency',
        status: app.status,
        appliedAt: app.created_at,
        releasedToClient: app.released_to_client,
        releasedAt: app.released_at,
        recruiterNotes: app.recruiter_notes,
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

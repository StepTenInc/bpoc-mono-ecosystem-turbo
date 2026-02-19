import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';

/**
 * GET /api/candidates/[id]
 * Fetch detailed candidate info for admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get candidate
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('candidate_id', id)
      .single();

    // Get skills
    const { data: skills } = await supabase
      .from('candidate_skills')
      .select('name')
      .eq('candidate_id', id);

    // Get resume
    const { data: resume } = await supabase
      .from('candidate_resumes')
      .select('id, file_name, uploaded_at')
      .eq('candidate_id', id)
      .eq('is_primary', true)
      .single();

    // Get AI analysis
    const { data: aiAnalysis } = await supabase
      .from('candidate_ai_analysis')
      .select('*')
      .eq('candidate_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Game assessments removed from admin view

    // Get applications with job and agency info
    const { data: applications } = await supabase
      .from('job_applications')
      .select(`
        id,
        status,
        created_at,
        job_id
      `)
      .eq('candidate_id', id)
      .order('created_at', { ascending: false });

    // Get job details for applications
    const jobIds = applications?.map(a => a.job_id) || [];
    let jobMap: Record<string, { title: string; agencyClientId: string }> = {};
    let clientAgencyMap: Record<string, string> = {};

    if (jobIds.length > 0) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, agency_client_id')
        .in('id', jobIds);

      jobMap = Object.fromEntries(
        (jobs || []).map(j => [j.id, { title: j.title, agencyClientId: j.agency_client_id }])
      );

      // Get agency names
      const clientIds = [...new Set(jobs?.map(j => j.agency_client_id) || [])];
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('agency_clients')
          .select('id, agencies(name)')
          .in('id', clientIds);

        clientAgencyMap = Object.fromEntries(
          (clients || []).map(c => [c.id, (c.agencies as any)?.name || 'Unknown'])
        );
      }
    }

    // Get placements (accepted offers)
    const appIds = applications?.map(a => a.id) || [];
    let placements: any[] = [];

    if (appIds.length > 0) {
      const { data: offers } = await supabase
        .from('job_offers')
        .select('id, application_id, salary_offered, start_date, created_at')
        .in('application_id', appIds)
        .eq('status', 'accepted');

      placements = (offers || []).map(o => {
        const app = applications?.find(a => a.id === o.application_id);
        const job = app ? jobMap[app.job_id] : null;
        return {
          id: o.id,
          job_title: job?.title || 'Unknown',
          salary: o.salary_offered || 0,
          start_date: o.start_date,
          hired_at: o.created_at,
        };
      });
    }

    // Format response
    const formattedCandidate = {
      id: candidate.id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      avatar_url: candidate.avatar_url,
      username: candidate.username,
      is_active: candidate.is_active,
      email_verified: candidate.email_verified,
      created_at: candidate.created_at,
      profile: profile ? {
        bio: profile.bio,
        headline: profile.headline,
        location: profile.location,
        experience_years: profile.experience_years,
        current_role: profile.current_role,
        target_role: profile.target_role,
        expected_salary: profile.expected_salary,
        availability: profile.availability,
      } : null,
      skills: (skills || []).map(s => s.name),
      resume: resume ? {
        id: resume.id,
        file_name: resume.file_name,
        uploaded_at: resume.uploaded_at,
      } : null,
      ai_analysis: aiAnalysis ? {
        overall_score: aiAnalysis.overall_score,
        strengths: aiAnalysis.strengths,
        weaknesses: aiAnalysis.areas_to_improve || aiAnalysis.weaknesses,
        recommendations: aiAnalysis.recommendations,
        summary: aiAnalysis.summary,
      } : null,
      // Game assessments removed from admin view
      applications: (applications || []).map(a => {
        const job = jobMap[a.job_id];
        return {
          id: a.id,
          job_title: job?.title || 'Unknown',
          agency_name: job ? clientAgencyMap[job.agencyClientId] || 'Unknown' : 'Unknown',
          status: a.status,
          applied_at: a.created_at,
        };
      }),
      placements,
    };

    return NextResponse.json({ candidate: formattedCandidate });

  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

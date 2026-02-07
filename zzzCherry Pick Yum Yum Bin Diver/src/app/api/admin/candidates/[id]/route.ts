import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/candidates/[id]
 * Fetch detailed candidate info for admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get candidate
    const { data: candidate, error } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('candidate_profiles')
      .select('*')
      .eq('candidate_id', id)
      .single();

    // Get skills
    const { data: skills } = await supabaseAdmin
      .from('candidate_skills')
      .select('name')
      .eq('candidate_id', id);

    // Get resume
    const { data: resume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id, file_name, uploaded_at')
      .eq('candidate_id', id)
      .eq('is_primary', true)
      .single();

    // Get AI analysis
    const { data: aiAnalysis } = await supabaseAdmin
      .from('candidate_ai_analysis')
      .select('*')
      .eq('candidate_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Game assessments removed from admin view

    // Get applications with job and agency info
    const { data: applications } = await supabaseAdmin
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
      const { data: jobs } = await supabaseAdmin
        .from('jobs')
        .select('id, title, agency_client_id')
        .in('id', jobIds);

      jobMap = Object.fromEntries(
        (jobs || []).map(j => [j.id, { title: j.title, agencyClientId: j.agency_client_id }])
      );

      // Get agency names
      const clientIds = [...new Set(jobs?.map(j => j.agency_client_id) || [])];
      if (clientIds.length > 0) {
        const { data: clients } = await supabaseAdmin
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
      const { data: offers } = await supabaseAdmin
        .from('job_offers')
        .select('id, application_id, salary_offered, start_date, created_at')
        .in('application_id', appIds)
        .eq('status', 'accepted');

      placements = (offers || []).map(o => {
        const app = applications?.find(a => a.id === o.application_id);
        const job = app ? jobMap[app.job_id] : null;
        return {
          id: o.id,
          jobTitle: job?.title || 'Unknown',
          salary: o.salary_offered || 0,
          startDate: o.start_date,
          hiredAt: o.created_at,
        };
      });
    }

    // Format response
    const formattedCandidate = {
      id: candidate.id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      avatarUrl: candidate.avatar_url,
      username: candidate.username,
      isActive: candidate.is_active,
      emailVerified: candidate.email_verified,
      createdAt: candidate.created_at,
      profile: profile ? {
        bio: profile.bio,
        headline: profile.headline,
        location: profile.location,
        experienceYears: profile.experience_years,
        currentRole: profile.current_role,
        targetRole: profile.target_role,
        expectedSalary: profile.expected_salary,
        availability: profile.availability,
      } : null,
      skills: (skills || []).map(s => s.name),
      resume: resume ? {
        id: resume.id,
        fileName: resume.file_name,
        uploadedAt: resume.uploaded_at,
      } : null,
      aiAnalysis: aiAnalysis ? {
        overallScore: aiAnalysis.overall_score,
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
          jobTitle: job?.title || 'Unknown',
          agencyName: job ? clientAgencyMap[job.agencyClientId] || 'Unknown' : 'Unknown',
          status: a.status,
          appliedAt: a.created_at,
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

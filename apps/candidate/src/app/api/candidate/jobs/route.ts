import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/candidate/jobs
 * Get all active jobs with optional match scores for the logged-in candidate
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const userId = session?.user?.id;

    // Get active jobs with agency info (NOT client company - that's confidential)
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        slug,
        description,
        requirements,
        responsibilities,
        benefits,
        salary_min,
        salary_max,
        currency,
        work_arrangement,
        work_type,
        shift,
        experience_level,
        status,
        created_at,
        agency_clients (
          id,
          agencies (
            id,
            name,
            logo_url
          ),
          companies (
            industry
          )
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Get job skills
    const jobIds = jobs?.map(j => j.id) || [];
    const { data: allJobSkills } = await supabaseAdmin
      .from('job_skills')
      .select('job_id, name')
      .in('job_id', jobIds);

    const skillsByJob = new Map<string, string[]>();
    allJobSkills?.forEach(skill => {
      if (!skillsByJob.has(skill.job_id)) {
        skillsByJob.set(skill.job_id, []);
      }
      skillsByJob.get(skill.job_id)!.push(skill.name);
    });

    // Get match scores if user is logged in
    let matchesByJob = new Map<string, any>();
    if (userId) {
      const { data: matches } = await supabaseAdmin
        .from('job_matches')
        .select('job_id, overall_score, match_reasons, concerns')
        .eq('candidate_id', userId)
        .in('job_id', jobIds);

      matches?.forEach(match => {
        matchesByJob.set(match.job_id, {
          score: match.overall_score,
          reasons: match.match_reasons,
          concerns: match.concerns,
        });
      });
    }

    // Format jobs for frontend
    const formattedJobs = (jobs || []).map(job => {
      const agencyClient = (job as any).agency_clients;
      const agency = agencyClient?.agencies;
      const client = agencyClient?.companies; // Only used for industry, never show name
      const match = matchesByJob.get(job.id);
      
      return {
        id: job.id,
        title: job.title,
        slug: job.slug,
        company: agency?.name || 'Recruitment Agency', // AGENCY name only, never client
        company_logo: agency?.logo_url || null,
        industry: client?.industry || null, // Industry is OK to show
        description: job.description,
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || [],
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        currency: job.currency || 'PHP',
        work_arrangement: job.work_arrangement,
        work_type: job.work_type,
        shift: job.shift,
        experience_level: job.experience_level,
        skills: skillsByJob.get(job.id) || [],
        posted_at: job.created_at,
        // Match data (if available)
        match_score: match?.score || null,
        match_reasons: match?.reasons || [],
        match_concerns: match?.concerns || [],
      };
    });

    // Sort by match score if available
    if (userId) {
      formattedJobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    }

    return NextResponse.json({
      jobs: formattedJobs,
      total: formattedJobs.length,
      has_matches: matchesByJob.size > 0,
    });

  } catch (error: any) {
    console.error('Error in jobs API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/candidate/jobs/[id]
 * Get a single job with match data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Get job with agency info (NOT client company - that's confidential)
    const { data: job, error: jobError } = await supabaseAdmin
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
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get job skills
    const { data: jobSkills } = await supabaseAdmin
      .from('job_skills')
      .select('name')
      .eq('job_id', jobId);

    // Get match data if logged in
    let matchData = null;
    if (userId) {
      const { data: match } = await supabaseAdmin
        .from('job_matches')
        .select('overall_score, match_reasons, concerns')
        .eq('candidate_id', userId)
        .eq('job_id', jobId)
        .single();

      if (match) {
        matchData = {
          score: match.overall_score,
          reasons: match.match_reasons,
          concerns: match.concerns,
        };
      }
    }

    const agencyClient = (job as any).agency_clients;
    const agency = agencyClient?.agencies;
    const client = agencyClient?.companies; // Only used for industry

    const formattedJob = {
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
      skills: jobSkills?.map(s => s.name) || [],
      posted_at: job.created_at,
      match_score: matchData?.score || null,
      match_reasons: matchData?.reasons || [],
      match_concerns: matchData?.concerns || [],
    };

    return NextResponse.json({ job: formattedJob });

  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

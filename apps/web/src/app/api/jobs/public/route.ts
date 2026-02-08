import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET - Fetch active jobs for candidates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const work_type = searchParams.get('work_type') || searchParams.get('workType');
    const work_arrangement = searchParams.get('work_arrangement') || searchParams.get('workArrangement');
    const shift = searchParams.get('shift');
    const experience_level = searchParams.get('experience_level') || searchParams.get('experienceLevel');
    const salary_min = searchParams.get('salary_min') || searchParams.get('salaryMin');
    const salary_max = searchParams.get('salary_max') || searchParams.get('salaryMax');

    let query = supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        slug,
        description,
        requirements,
        responsibilities,
        benefits,
        work_type,
        work_arrangement,
        shift,
        experience_level,
        salary_min,
        salary_max,
        currency,
        created_at,
        agency_client:agency_clients (
          agency:agencies (
            name,
            logo_url
          ),
          company:companies (
            name
          )
        ),
        job_skills (
          name
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply work type filter
    if (work_type) {
      query = query.eq('work_type', work_type);
    }

    // Apply work arrangement filter
    if (work_arrangement) {
      query = query.eq('work_arrangement', work_arrangement);
    }

    // Apply shift filter
    if (shift) {
      query = query.eq('shift', shift);
    }

    // Apply experience level filter
    if (experience_level) {
      query = query.eq('experience_level', experience_level);
    }

    // Apply salary filters
    if (salary_min) {
      const minSalary = parseInt(salary_min, 10);
      if (!isNaN(minSalary)) {
        query = query.gte('salary_max', minSalary);
      }
    }

    if (salary_max) {
      const maxSalary = parseInt(salary_max, 10);
      if (!isNaN(maxSalary)) {
        query = query.lte('salary_min', maxSalary);
      }
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    // Format jobs for display - using snake_case
    // NOTE: We intentionally do NOT expose the client company name to candidates
    // Jobs are posted by the Agency, not the client (BPO agencies keep clients confidential)
    const formattedJobs = (jobs || []).map((job) => {
      const agencyClient = job.agency_client as { agency?: { name: string; logo_url?: string }; company?: { name: string } } | null;
      
      return {
        id: job.id,
        title: job.title,
        slug: job.slug,
        description: job.description,
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || [],
        work_type: job.work_type,
        work_arrangement: job.work_arrangement,
        shift: job.shift,
        experience_level: job.experience_level,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        currency: job.currency || 'PHP',
        // Show Agency as the "company" posting the job (client is confidential)
        company: agencyClient?.agency?.name || 'BPOC Agency',
        agency: agencyClient?.agency?.name || 'BPOC Agency',
        agency_logo: agencyClient?.agency?.logo_url,
        skills: (job.job_skills || []).map((s: { name: string }) => s.name),
        created_at: job.created_at,
      };
    });

    return NextResponse.json({ jobs: formattedJobs });

  } catch (error) {
    console.error('Public jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

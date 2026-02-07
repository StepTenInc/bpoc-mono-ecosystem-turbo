import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET - Fetch active jobs for candidates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const workType = searchParams.get('workType');
    const workArrangement = searchParams.get('workArrangement');
    const shift = searchParams.get('shift');
    const experienceLevel = searchParams.get('experienceLevel');
    const salaryMin = searchParams.get('salaryMin');
    const salaryMax = searchParams.get('salaryMax');

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
    if (workType) {
      query = query.eq('work_type', workType);
    }

    // Apply work arrangement filter
    if (workArrangement) {
      query = query.eq('work_arrangement', workArrangement);
    }

    // Apply shift filter
    if (shift) {
      query = query.eq('shift', shift);
    }

    // Apply experience level filter
    if (experienceLevel) {
      query = query.eq('experience_level', experienceLevel);
    }

    // Apply salary filters
    if (salaryMin) {
      const minSalary = parseInt(salaryMin, 10);
      if (!isNaN(minSalary)) {
        query = query.gte('salary_max', minSalary);
      }
    }

    if (salaryMax) {
      const maxSalary = parseInt(salaryMax, 10);
      if (!isNaN(maxSalary)) {
        query = query.lte('salary_min', maxSalary);
      }
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    // Format jobs for display
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
        workType: job.work_type,
        workArrangement: job.work_arrangement,
        shift: job.shift,
        experienceLevel: job.experience_level,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        currency: job.currency || 'PHP',
        // Show Agency as the "company" posting the job (client is confidential)
        company: agencyClient?.agency?.name || 'BPOC Agency',
        agency: agencyClient?.agency?.name || 'BPOC Agency',
        agencyLogo: agencyClient?.agency?.logo_url,
        skills: (job.job_skills || []).map((s: { name: string }) => s.name),
        createdAt: job.created_at,
      };
    });

    return NextResponse.json({ jobs: formattedJobs });

  } catch (error) {
    console.error('Public jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}


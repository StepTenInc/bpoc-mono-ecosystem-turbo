import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthTokenSafe } from '@/lib/supabase/auth';

/**
 * GET /api/jobs/public/[id]
 * Fetch a single public job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch job with related data
    const { data: job, error } = await supabaseAdmin
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
        salary_type,
        currency,
        work_arrangement,
        work_type,
        shift,
        experience_level,
        views,
        applicants_count,
        created_at,
        agency_clients (
          agencies (
            name
          ),
          companies (
            name
          )
        ),
        job_skills (
          name
        )
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Increment views
    await supabaseAdmin
      .from('jobs')
      .update({ views: (job.views || 0) + 1 })
      .eq('id', id);

    // Check if user has applied (if authenticated)
    let hasApplied = false;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const user = await verifyAuthTokenSafe(token);
      
      if (user) {
        const { data: application } = await supabaseAdmin
          .from('job_applications')
          .select('id')
          .eq('candidate_id', user.id)
          .eq('job_id', id)
          .single();
        
        hasApplied = !!application;
      }
    }

    // Format response - hide client company, only show agency
    const agencyClient = job.agency_clients as any;
    
    const formattedJob = {
      id: job.id,
      title: job.title,
      slug: job.slug,
      description: job.description,
      requirements: job.requirements || [],
      responsibilities: job.responsibilities || [],
      benefits: job.benefits || [],
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      salaryType: job.salary_type,
      currency: job.currency || 'PHP',
      workArrangement: job.work_arrangement,
      workType: job.work_type,
      shift: job.shift,
      experienceLevel: job.experience_level,
      views: (job.views || 0) + 1,
      applicantsCount: job.applicants_count || 0,
      agency: agencyClient?.agencies?.name || 'BPO Agency',
      company: agencyClient?.agencies?.name || 'BPO Agency', // Show agency, not client
      skills: (job.job_skills || []).map((s: any) => s.name),
      createdAt: job.created_at,
    };

    return NextResponse.json({
      job: formattedJob,
      hasApplied
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}


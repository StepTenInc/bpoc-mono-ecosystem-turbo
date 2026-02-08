import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/v1/embed/jobs
 * Public endpoint for embedding jobs on external websites
 * 
 * Query params:
 *   agency=agency-slug (required)
 *   limit=10
 *   theme=dark|light
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agencySlug = searchParams.get('agency');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25);
  const theme = searchParams.get('theme') || 'dark';

  if (!agencySlug) {
    return NextResponse.json({ error: 'agency parameter is required' }, { status: 400 });
  }

  try {
    // Get agency by slug
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('id, name, logo_url')
      .eq('slug', agencySlug)
      .eq('is_active', true)
      .single();

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Get clients for agency
    const { data: clients } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('agency_id', agency.id);

    const clientIds = clients?.map(c => c.id) || [];

    if (clientIds.length === 0) {
      return NextResponse.json({ 
        agency: { name: agency.name, logo: agency.logo_url },
        jobs: [],
        theme,
      });
    }

    // Get active jobs
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        slug,
        description,
        salary_min,
        salary_max,
        currency,
        work_arrangement,
        work_type,
        experience_level,
        created_at
      `)
      .in('agency_client_id', clientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    const formattedJobs = (jobs || []).map(job => ({
      id: job.id,
      title: job.title,
      slug: job.slug,
      description: job.description?.substring(0, 200) + '...',
      salary: {
        min: job.salary_min,
        max: job.salary_max,
        currency: job.currency,
        display: job.salary_min && job.salary_max 
          ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
          : 'Competitive',
      },
      workArrangement: job.work_arrangement,
      workType: job.work_type?.replace('_', ' '),
      experienceLevel: job.experience_level?.replace('_', ' '),
      postedAt: job.created_at,
      applyUrl: `https://bpoc-stepten.vercel.app/jobs/${job.id}`,
    }));

    // Set CORS headers for embedding
    const response = NextResponse.json({
      agency: {
        name: agency.name,
        logo: agency.logo_url,
      },
      jobs: formattedJobs,
      total: formattedJobs.length,
      theme,
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');

    return response;

  } catch (error) {
    console.error('API v1 embed jobs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


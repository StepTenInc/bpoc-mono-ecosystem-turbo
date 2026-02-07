import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireRecruiter, roleErrorResponse } from '@/lib/api-role-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // CRITICAL SECURITY: Verify user is a recruiter (not just authenticated)
    // This prevents candidates from calling recruiter APIs
    const auth = await requireRecruiter(request);
    if (!auth.success) {
      return roleErrorResponse(auth);
    }

    const { agencyId } = auth.user!;

    // Get agency_client ids for this agency
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('agency_id', agencyId);

    if (clientsError) throw clientsError;
    const clientIds = (clients || []).map((c) => c.id);

    const status = searchParams.get('status') || '';

    let query = supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        slug,
        status,
        rejection_reason,
        work_type,
        work_arrangement,
        salary_min,
        salary_max,
        currency,
        views,
        applicants_count,
        created_at,
        agency_client_id,
        agency_clients (
          company_id,
          companies (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (clientIds.length > 0) {
      query = query.in('agency_client_id', clientIds);
    } else {
      return NextResponse.json({ jobs: [] });
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;
    if (error) throw error;

    const formattedJobs = (jobs || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      slug: job.slug,
      status: job.status,
      rejectionReason: job.rejection_reason || null,
      workType: job.work_type,
      workArrangement: job.work_arrangement,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      currency: job.currency || 'PHP',
      views: job.views || 0,
      applicantsCount: job.applicants_count || 0,
      createdAt: job.created_at,
      agencyClientId: job.agency_client_id,
      clientName: job.agency_clients?.companies?.name || 'Unknown Client',
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error) {
    console.error('Recruiter jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

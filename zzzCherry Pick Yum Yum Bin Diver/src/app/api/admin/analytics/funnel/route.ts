import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/analytics/funnel
 * Recruitment funnel: Applications → Shortlisted → Interviewed → Offered → Hired
 * With conversion rates and filters by date, agency, job
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const agencyId = searchParams.get('agencyId');
    const jobId = searchParams.get('jobId');

    // Calculate date range
    let startDate: Date | null = null;
    const now = new Date();

    if (period === '7') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
    }

    // Base query for applications
    let applicationsQuery = supabaseAdmin
      .from('job_applications')
      .select('id, status, job_id, created_at');

    if (startDate) {
      applicationsQuery = applicationsQuery.gte('created_at', startDate.toISOString());
    }

    // Filter by job if specified
    if (jobId) {
      applicationsQuery = applicationsQuery.eq('job_id', jobId);
    }

    const { data: applications } = await applicationsQuery;
    const applicationIds = applications?.map(a => a.id) || [];

    // If agency filter is specified, filter jobs by agency
    if (agencyId) {
      // Get jobs for this agency
      const { data: agencyClients } = await supabaseAdmin
        .from('agency_clients')
        .select('id')
        .eq('agency_id', agencyId);

      const clientIds = agencyClients?.map(c => c.id) || [];

      const { data: agencyJobs } = await supabaseAdmin
        .from('jobs')
        .select('id')
        .in('agency_client_id', clientIds.length > 0 ? clientIds : ['none']);

      const jobIds = agencyJobs?.map(j => j.id) || [];

      // Filter applications by these job IDs
      const filteredApps = applications?.filter(a => jobIds.includes(a.job_id)) || [];
      const filteredAppIds = filteredApps.map(a => a.id);

      return calculateFunnel(filteredApps, filteredAppIds);
    }

    return calculateFunnel(applications || [], applicationIds);

  } catch (error) {
    console.error('Error fetching funnel analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function calculateFunnel(applications: any[], applicationIds: string[]) {
  // Stage 1: All Applications
  const totalApplications = applications.length;

  // Stage 2: Shortlisted (status = 'shortlisted' or beyond)
  const shortlisted = applications.filter(a =>
    ['shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended', 'hired'].includes(a.status)
  ).length;

  // Stage 3: Interviewed (has completed interview or beyond)
  const { data: interviews } = await supabaseAdmin
    .from('job_interviews')
    .select('id, application_id, status')
    .in('application_id', applicationIds.length > 0 ? applicationIds : ['none'])
    .in('status', ['completed', 'in_progress']);

  const interviewedAppIds = new Set(interviews?.map(i => i.application_id) || []);
  const interviewed = interviewedAppIds.size;

  // Stage 4: Offered (has received an offer)
  const { data: offers } = await supabaseAdmin
    .from('job_offers')
    .select('id, application_id, status')
    .in('application_id', applicationIds.length > 0 ? applicationIds : ['none'])
    .in('status', ['sent', 'viewed', 'accepted', 'rejected']);

  const offeredAppIds = new Set(offers?.map(o => o.application_id) || []);
  const offered = offeredAppIds.size;

  // Stage 5: Hired (offer accepted)
  const acceptedOffers = offers?.filter(o => o.status === 'accepted') || [];
  const hiredAppIds = new Set(acceptedOffers.map(o => o.application_id));
  const hired = hiredAppIds.size;

  // Calculate conversion rates
  const shortlistedRate = totalApplications > 0
    ? Math.round((shortlisted / totalApplications) * 100 * 10) / 10
    : 0;

  const interviewedRate = shortlisted > 0
    ? Math.round((interviewed / shortlisted) * 100 * 10) / 10
    : 0;

  const offeredRate = interviewed > 0
    ? Math.round((offered / interviewed) * 100 * 10) / 10
    : 0;

  const hiredRate = offered > 0
    ? Math.round((hired / offered) * 100 * 10) / 10
    : 0;

  const overallConversionRate = totalApplications > 0
    ? Math.round((hired / totalApplications) * 100 * 10) / 10
    : 0;

  return NextResponse.json({
    funnel: [
      {
        stage: 'Applications',
        count: totalApplications,
        conversionRate: 100,
        dropoff: 0,
      },
      {
        stage: 'Shortlisted',
        count: shortlisted,
        conversionRate: shortlistedRate,
        dropoff: totalApplications - shortlisted,
      },
      {
        stage: 'Interviewed',
        count: interviewed,
        conversionRate: interviewedRate,
        dropoff: shortlisted - interviewed,
      },
      {
        stage: 'Offered',
        count: offered,
        conversionRate: offeredRate,
        dropoff: interviewed - offered,
      },
      {
        stage: 'Hired',
        count: hired,
        conversionRate: hiredRate,
        dropoff: offered - hired,
      },
    ],
    overallConversionRate,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/analytics
 * Fetch platform analytics for admin billing and tracking
 */
export async function GET(request: NextRequest) {
  try {
    const period = request.nextUrl.searchParams.get('period') || 'all';
    
    // Calculate date range
    let startDate: Date | null = null;
    const now = new Date();
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Get all agencies
    const { data: agencies } = await supabaseAdmin
      .from('agencies')
      .select('id, name, logo_url')
      .eq('is_active', true);

    const agencyCount = agencies?.length || 0;

    // Get all candidates
    const { data: candidates } = await supabaseAdmin
      .from('candidates')
      .select('id');

    const candidateCount = candidates?.length || 0;

    // Get active jobs
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id, agency_client_id')
      .eq('status', 'active');

    const activeJobCount = jobs?.length || 0;

    // Get all accepted offers (placements)
    let offersQuery = supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        application_id,
        salary_offered,
        currency,
        start_date,
        created_at,
        accepted_at,
        updated_at
      `)
      .eq('status', 'accepted');

    if (startDate) {
      offersQuery = offersQuery.gte('created_at', startDate.toISOString());
    }

    const { data: offers } = await offersQuery;

    const totalPlacements = offers?.length || 0;
    const totalRevenue = offers?.reduce((acc, o) => acc + (o.salary_offered || 0), 0) || 0;
    const avgPlacementValue = totalPlacements > 0 ? totalRevenue / totalPlacements : 0;

    // This month's data
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: thisMonthOffers } = await supabaseAdmin
      .from('job_offers')
      .select('id, salary_offered')
      .eq('status', 'accepted')
      .gte('created_at', thisMonthStart.toISOString());

    const placementsThisMonth = thisMonthOffers?.length || 0;
    const revenueThisMonth = thisMonthOffers?.reduce((acc, o) => acc + (o.salary_offered || 0), 0) || 0;

    // Get agency performance
    const agencyPerformance = await Promise.all(
      (agencies || []).map(async (agency) => {
        // Get clients for this agency
        const { data: clients } = await supabaseAdmin
          .from('agency_clients')
          .select('id')
          .eq('agency_id', agency.id);

        const clientIds = clients?.map(c => c.id) || [];

        // Get jobs for these clients
        const { data: agencyJobs } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .in('agency_client_id', clientIds.length > 0 ? clientIds : ['none']);

        const jobIds = agencyJobs?.map(j => j.id) || [];
        const activeJobsCount = agencyJobs?.length || 0;

        // Get applications for these jobs
        const { data: apps } = await supabaseAdmin
          .from('job_applications')
          .select('id')
          .in('job_id', jobIds.length > 0 ? jobIds : ['none']);

        const appIds = apps?.map(a => a.id) || [];
        const totalApps = apps?.length || 0;

        // Get placements (accepted offers) for these applications
        const { data: agencyOffers } = await supabaseAdmin
          .from('job_offers')
          .select('id, salary_offered')
          .in('application_id', appIds.length > 0 ? appIds : ['none'])
          .eq('status', 'accepted');

        const placements = agencyOffers?.length || 0;
        const revenue = agencyOffers?.reduce((acc, o) => acc + (o.salary_offered || 0), 0) || 0;
        const conversionRate = totalApps > 0 ? Math.round((placements / totalApps) * 100) : 0;

        return {
          id: agency.id,
          name: agency.name,
          logo: agency.logo_url,
          placements,
          revenue,
          activeJobs: activeJobsCount,
          conversionRate,
        };
      })
    );

    // Sort agencies by placements
    agencyPerformance.sort((a, b) => b.placements - a.placements);

    // Get recent placements
    const { data: recentOffers } = await supabaseAdmin
      .from('job_offers')
      .select('*')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get application details for recent offers
    const recentAppIds = recentOffers?.map(o => o.application_id) || [];
    const { data: recentApps } = await supabaseAdmin
      .from('job_applications')
      .select('id, job_id, candidate_id')
      .in('id', recentAppIds.length > 0 ? recentAppIds : ['none']);

    const appMap = Object.fromEntries(
      (recentApps || []).map(a => [a.id, a])
    );

    // Get job details
    const recentJobIds = [...new Set(recentApps?.map(a => a.job_id) || [])];
    const { data: recentJobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title, agency_client_id')
      .in('id', recentJobIds.length > 0 ? recentJobIds : ['none']);

    const jobMap = Object.fromEntries(
      (recentJobs || []).map(j => [j.id, j])
    );

    // Get candidate details
    const recentCandidateIds = [...new Set(recentApps?.map(a => a.candidate_id) || [])];
    const { data: recentCandidates } = await supabaseAdmin
      .from('candidates')
      .select('id, first_name, last_name')
      .in('id', recentCandidateIds.length > 0 ? recentCandidateIds : ['none']);

    const candidateMap = Object.fromEntries(
      (recentCandidates || []).map(c => [c.id, `${c.first_name || ''} ${c.last_name || ''}`.trim()])
    );

    // Get client details
    const clientIds = [...new Set(recentJobs?.map(j => j.agency_client_id) || [])];
    const { data: recentClients } = await supabaseAdmin
      .from('agency_clients')
      .select('id, agency_id, companies(name)')
      .in('id', clientIds.length > 0 ? clientIds : ['none']);

    const clientMap = Object.fromEntries(
      (recentClients || []).map(c => [c.id, {
        name: (c.companies as any)?.name || 'Unknown',
        agencyId: c.agency_id,
      }])
    );

    // Get agency names for clients
    const agencyIds = [...new Set(recentClients?.map(c => c.agency_id) || [])];
    const { data: recentAgencies } = await supabaseAdmin
      .from('agencies')
      .select('id, name')
      .in('id', agencyIds.length > 0 ? agencyIds : ['none']);

    const agencyMap = Object.fromEntries(
      (recentAgencies || []).map(a => [a.id, a.name])
    );

    // Format recent placements
    const recentPlacements = (recentOffers || []).map(offer => {
      const app = appMap[offer.application_id];
      const job = app ? jobMap[app.job_id] : null;
      const client = job ? clientMap[job.agency_client_id] : null;
      const agencyName = client ? agencyMap[client.agencyId] : 'Unknown';

      return {
        id: offer.id,
        candidateName: app ? candidateMap[app.candidate_id] || 'Unknown' : 'Unknown',
        jobTitle: job?.title || 'Unknown Job',
        agencyName,
        clientName: client?.name || 'Unknown Client',
        salary: offer.salary_offered || 0,
        currency: offer.currency || 'PHP',
        startDate: offer.start_date,
        hiredAt: offer.accepted_at || offer.created_at,
      };
    });

    return NextResponse.json({
      overview: {
        totalPlacements,
        totalRevenue,
        avgPlacementValue,
        activeJobs: activeJobCount,
        totalCandidates: candidateCount,
        totalAgencies: agencyCount,
        placementsThisMonth,
        revenueThisMonth,
      },
      agencyPerformance: agencyPerformance.slice(0, 10),
      recentPlacements,
      monthlyTrend: [], // TODO: Implement monthly trend
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/analytics/overview
 * Comprehensive analytics overview with key metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 7, 30, 90, all

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

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all core metrics in parallel
    const [
      totalCandidatesResult,
      totalApplicationsResult,
      thisMonthApplicationsResult,
      totalJobsResult,
      thisMonthJobsResult,
      acceptedOffersResult,
      allApplicationsForSuccessRate,
    ] = await Promise.all([
      // Total candidates
      supabaseAdmin
        .from('candidates')
        .select('id', { count: 'exact', head: true }),

      // Total applications (filtered by period if applicable)
      startDate
        ? supabaseAdmin
            .from('job_applications')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startDate.toISOString())
        : supabaseAdmin
            .from('job_applications')
            .select('id', { count: 'exact', head: true }),

      // Applications this month
      supabaseAdmin
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString()),

      // Total jobs (filtered by period if applicable)
      startDate
        ? supabaseAdmin
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startDate.toISOString())
        : supabaseAdmin
            .from('jobs')
            .select('id', { count: 'exact', head: true }),

      // Jobs posted this month
      supabaseAdmin
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString()),

      // Placements (accepted offers) with created_at for time to hire
      startDate
        ? supabaseAdmin
            .from('job_offers')
            .select('id, application_id, created_at, accepted_at')
            .eq('status', 'accepted')
            .gte('accepted_at', startDate.toISOString())
        : supabaseAdmin
            .from('job_offers')
            .select('id, application_id, created_at, accepted_at')
            .eq('status', 'accepted'),

      // All applications for success rate calculation
      startDate
        ? supabaseAdmin
            .from('job_applications')
            .select('id')
            .gte('created_at', startDate.toISOString())
        : supabaseAdmin
            .from('job_applications')
            .select('id'),
    ]);

    const totalCandidates = totalCandidatesResult.count || 0;
    const totalApplications = totalApplicationsResult.count || 0;
    const applicationsThisMonth = thisMonthApplicationsResult.count || 0;
    const totalJobs = totalJobsResult.count || 0;
    const jobsThisMonth = thisMonthJobsResult.count || 0;
    const placements = acceptedOffersResult.data || [];
    const totalPlacements = placements.length;
    const totalAppsForRate = allApplicationsForSuccessRate.data?.length || 0;

    // Calculate success rate (placements / applications)
    const successRate = totalAppsForRate > 0
      ? Math.round((totalPlacements / totalAppsForRate) * 100 * 10) / 10
      : 0;

    // Calculate average time to hire
    let avgTimeToHire = 0;
    if (placements.length > 0) {
      // Get application created dates for each placement
      const applicationIds = placements.map(p => p.application_id);
      const { data: applications } = await supabaseAdmin
        .from('job_applications')
        .select('id, created_at')
        .in('id', applicationIds);

      const appMap = new Map(applications?.map(a => [a.id, a.created_at]) || []);

      let totalDays = 0;
      let validCount = 0;

      placements.forEach(placement => {
        const appCreatedAt = appMap.get(placement.application_id);
        if (appCreatedAt && placement.accepted_at) {
          const startDate = new Date(appCreatedAt);
          const endDate = new Date(placement.accepted_at);
          const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0) {
            totalDays += days;
            validCount++;
          }
        }
      });

      avgTimeToHire = validCount > 0 ? Math.round(totalDays / validCount) : 0;
    }

    return NextResponse.json({
      totalCandidates,
      totalApplications,
      applicationsThisMonth,
      totalJobs,
      jobsThisMonth,
      totalPlacements,
      successRate,
      avgTimeToHire,
    });

  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Dashboard Analytics Service
 *
 * Provides real-time analytics for recruiter and admin dashboards
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { APPLICATION_STATUS } from '@/lib/constants/statuses';

export interface RecruiterDashboardStats {
  activeJobs: number;
  newApplications: number;
  pendingInterviews: number;
  offersDue: number;
  placementsThisMonth: number;
  applicationsThisWeek: number;
  averageTimeToHire: number; // in days
  conversionRate: number; // percentage
}

export interface AdminDashboardStats {
  totalAgencies: number;
  activeRecruiters: number;
  totalCandidates: number;
  activeJobs: number;
  totalApplications: number;
  placementsThisMonth: number;
  averageTimeToHire: number;
  topPerformingAgency: {
    id: string;
    name: string;
    placementsCount: number;
  } | null;
}

export interface ApplicationFunnelStats {
  submitted: number;
  underReview: number;
  shortlisted: number;
  interviewed: number;
  offerSent: number;
  hired: number;
  rejected: number;
}

export interface TimeToHireBreakdown {
  averageDays: number;
  medianDays: number;
  fastest: number;
  slowest: number;
  breakdown: {
    applicationToInterview: number;
    interviewToOffer: number;
    offerToHire: number;
  };
}

/**
 * Get recruiter dashboard statistics
 */
export async function getRecruiterDashboardStats(
  agencyId: string
): Promise<RecruiterDashboardStats> {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // First get all agency client IDs for this agency
    const { data: clients } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('agency_id', agencyId);

    const clientIds = clients?.map(c => c.id) || [];

    if (clientIds.length === 0) {
      // No clients, return empty stats
      return {
        activeJobs: 0,
        newApplications: 0,
        pendingInterviews: 0,
        activeOffers: 0,
        placementRate: 0,
        avgTimeToHire: 0,
        topPerformingJobs: [],
        recentActivity: [],
      };
    }

    // Get all job IDs for these clients
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];

    // 1. Active Jobs
    const { count: activeJobs } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .in('agency_client_id', clientIds);

    // 2. New Applications (this week)
    const { count: newApplications } = jobIds.length > 0
      ? await supabaseAdmin
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString())
          .in('job_id', jobIds)
          .then(r => r.count || 0)
      : 0;

    // Get application IDs for interviews/offers queries
    const { data: applications } = jobIds.length > 0
      ? await supabaseAdmin
          .from('job_applications')
          .select('id')
          .in('job_id', jobIds)
      : { data: [] };

    const applicationIds = applications?.map(a => a.id) || [];

    // 3. Pending Interviews (scheduled, not completed)
    const { count: pendingInterviews } = applicationIds.length > 0
      ? await supabaseAdmin
          .from('job_interviews')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled')
          .gte('scheduled_at', now.toISOString())
          .in('application_id', applicationIds)
          .then(r => r.count || 0)
      : 0;

    // 4. Offers Due (expiring within 7 days)
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const { count: offersDue } = applicationIds.length > 0
      ? await supabaseAdmin
          .from('job_offers')
          .select('*', { count: 'exact', head: true })
          .in('status', ['sent', 'viewed'])
          .lte('expires_at', inSevenDays.toISOString())
          .in('application_id', applicationIds)
          .then(r => r.count || 0)
      : 0;

    // 5. Placements this month
    const { count: placementsThisMonth } = jobIds.length > 0
      ? await supabaseAdmin
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', APPLICATION_STATUS.HIRED)
          .gte('offer_acceptance_date', monthStart.toISOString())
          .in('job_id', jobIds)
          .then(r => r.count || 0)
      : 0;

    // 6. Applications this week
    const { count: applicationsThisWeek } = jobIds.length > 0
      ? await supabaseAdmin
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString())
          .in('job_id', jobIds)
          .then(r => r.count || 0)
      : 0;

    // 7. Average Time to Hire (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: hiredApplications } = jobIds.length > 0
      ? await supabaseAdmin
          .from('job_applications')
          .select('created_at, offer_acceptance_date')
          .eq('status', APPLICATION_STATUS.HIRED)
          .gte('offer_acceptance_date', thirtyDaysAgo.toISOString())
          .not('offer_acceptance_date', 'is', null)
          .in('job_id', jobIds)
      : { data: [] };

    let averageTimeToHire = 0;
    if (hiredApplications && hiredApplications.length > 0) {
      const totalDays = hiredApplications.reduce((sum, app) => {
        const created = new Date(app.created_at);
        const hired = new Date(app.offer_acceptance_date!);
        const days = (hired.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageTimeToHire = Math.round(totalDays / hiredApplications.length);
    }

    // 8. Conversion Rate (applications to hires, last 30 days)
    const { count: totalApplications30Days } = jobIds.length > 0
      ? await supabaseAdmin
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString())
          .in('job_id', jobIds)
          .then(r => r.count || 0)
      : 0;

    const conversionRate =
      totalApplications30Days && totalApplications30Days > 0
        ? Math.round(((hiredApplications?.length || 0) / totalApplications30Days) * 100)
        : 0;

    return {
      activeJobs: activeJobs || 0,
      newApplications: newApplications || 0,
      pendingInterviews: pendingInterviews || 0,
      offersDue: offersDue || 0,
      placementsThisMonth: placementsThisMonth || 0,
      applicationsThisWeek: applicationsThisWeek || 0,
      averageTimeToHire,
      conversionRate,
    };
  } catch (error) {
    console.error('Error fetching recruiter dashboard stats:', error);
    throw error;
  }
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total Agencies
    const { count: totalAgencies } = await supabaseAdmin
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // 2. Active Recruiters
    const { count: activeRecruiters } = await supabaseAdmin
      .from('agency_recruiters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // 3. Total Candidates
    const { count: totalCandidates } = await supabaseAdmin
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // 4. Active Jobs
    const { count: activeJobs } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // 5. Total Applications
    const { count: totalApplications } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true });

    // 6. Placements this month
    const { count: placementsThisMonth } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', APPLICATION_STATUS.HIRED)
      .gte('offer_acceptance_date', monthStart.toISOString());

    // 7. Average Time to Hire
    const { data: hiredApplications } = await supabaseAdmin
      .from('job_applications')
      .select('created_at, offer_acceptance_date')
      .eq('status', APPLICATION_STATUS.HIRED)
      .gte('offer_acceptance_date', thirtyDaysAgo.toISOString())
      .not('offer_acceptance_date', 'is', null);

    let averageTimeToHire = 0;
    if (hiredApplications && hiredApplications.length > 0) {
      const totalDays = hiredApplications.reduce((sum, app) => {
        const created = new Date(app.created_at);
        const hired = new Date(app.offer_acceptance_date!);
        const days = (hired.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageTimeToHire = Math.round(totalDays / hiredApplications.length);
    }

    // 8. Top Performing Agency (most placements this month)
    const { data: agencyPlacements } = await supabaseAdmin
      .from('job_applications')
      .select(`
        job:jobs!inner(
          agency_client:agency_clients!inner(
            agency:agencies!inner(
              id,
              name
            )
          )
        )
      `)
      .eq('status', APPLICATION_STATUS.HIRED)
      .gte('offer_acceptance_date', monthStart.toISOString());

    let topPerformingAgency = null;
    if (agencyPlacements && agencyPlacements.length > 0) {
      const agencyCounts: Record<string, { name: string; count: number }> = {};
      agencyPlacements.forEach((app: any) => {
        const agency = app.job.agency_client.agency;
        if (!agencyCounts[agency.id]) {
          agencyCounts[agency.id] = { name: agency.name, count: 0 };
        }
        agencyCounts[agency.id].count++;
      });

      const topAgency = Object.entries(agencyCounts).reduce((max, [id, data]) =>
        data.count > max.count ? { id, ...data } : max
        , { id: '', name: '', count: 0 });

      if (topAgency.count > 0) {
        topPerformingAgency = {
          id: topAgency.id,
          name: topAgency.name,
          placementsCount: topAgency.count,
        };
      }
    }

    return {
      totalAgencies: totalAgencies || 0,
      activeRecruiters: activeRecruiters || 0,
      totalCandidates: totalCandidates || 0,
      activeJobs: activeJobs || 0,
      totalApplications: totalApplications || 0,
      placementsThisMonth: placementsThisMonth || 0,
      averageTimeToHire,
      topPerformingAgency,
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    throw error;
  }
}

/**
 * Get application funnel statistics
 */
export async function getApplicationFunnelStats(
  agencyId?: string
): Promise<ApplicationFunnelStats> {
  try {
    let jobIds: string[] = [];

    if (agencyId) {
      // First get client IDs
      const { data: clients } = await supabaseAdmin
        .from('agency_clients')
        .select('id')
        .eq('agency_id', agencyId);

      const clientIds = clients?.map(c => c.id) || [];

      if (clientIds.length > 0) {
        // Then get job IDs for those clients
        const { data: jobs } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .in('agency_client_id', clientIds);

        jobIds = jobs?.map(j => j.id) || [];
      }
    }

    // Build query with resolved job IDs
    let query = supabaseAdmin.from('job_applications').select('status');

    if (agencyId && jobIds.length > 0) {
      query = query.in('job_id', jobIds);
    } else if (agencyId && jobIds.length === 0) {
      // No jobs for this agency, return empty stats
      return {
        submitted: 0,
        underReview: 0,
        shortlisted: 0,
        interviewed: 0,
        offerSent: 0,
        hired: 0,
        rejected: 0,
      };
    }

    const { data: applications } = await query;

    const funnel: ApplicationFunnelStats = {
      submitted: 0,
      underReview: 0,
      shortlisted: 0,
      interviewed: 0,
      offerSent: 0,
      hired: 0,
      rejected: 0,
    };

    applications?.forEach((app) => {
      switch (app.status) {
        case APPLICATION_STATUS.SUBMITTED:
          funnel.submitted++;
          break;
        case APPLICATION_STATUS.UNDER_REVIEW:
          funnel.underReview++;
          break;
        case APPLICATION_STATUS.SHORTLISTED:
        case APPLICATION_STATUS.INTERVIEW_SCHEDULED:
          funnel.shortlisted++;
          break;
        case APPLICATION_STATUS.INTERVIEWED:
          funnel.interviewed++;
          break;
        case APPLICATION_STATUS.OFFER_SENT:
        case APPLICATION_STATUS.NEGOTIATING:
        case APPLICATION_STATUS.OFFER_ACCEPTED:
          funnel.offerSent++;
          break;
        case APPLICATION_STATUS.HIRED:
        case APPLICATION_STATUS.STARTED:
          funnel.hired++;
          break;
        case APPLICATION_STATUS.REJECTED:
          funnel.rejected++;
          break;
      }
    });

    return funnel;
  } catch (error) {
    console.error('Error fetching application funnel stats:', error);
    throw error;
  }
}

export default {
  getRecruiterDashboardStats,
  getAdminDashboardStats,
  getApplicationFunnelStats,
};

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/analytics/top-performers
 * Top 10 jobs, recruiters, and agencies by various metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

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

    // Fetch all jobs with their applications and placements
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        created_at,
        agency_client:agency_clients (
          id,
          agency:agencies (
            id,
            name
          ),
          company:companies (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!jobs) {
      return NextResponse.json({
        topJobsByApplications: [],
        topJobsByPlacements: [],
        topRecruitersByPlacements: [],
        topAgenciesByActivity: [],
      });
    }

    // Filter by date if needed
    const filteredJobs = startDate
      ? jobs.filter(j => new Date(j.created_at) >= startDate)
      : jobs;

    const jobIds = filteredJobs.map(j => j.id);

    // Get applications for these jobs
    let applicationsQuery = supabaseAdmin
      .from('job_applications')
      .select('id, job_id, created_at')
      .in('job_id', jobIds.length > 0 ? jobIds : ['none']);

    if (startDate) {
      applicationsQuery = applicationsQuery.gte('created_at', startDate.toISOString());
    }

    const { data: applications } = await applicationsQuery;
    const applicationIds = applications?.map(a => a.id) || [];

    // Get placements (accepted offers) for these applications
    let offersQuery = supabaseAdmin
      .from('job_offers')
      .select('id, application_id, status')
      .in('application_id', applicationIds.length > 0 ? applicationIds : ['none'])
      .eq('status', 'accepted');

    const { data: acceptedOffers } = await offersQuery;

    // Build job performance map
    const jobPerformance = new Map<string, {
      job: any;
      applications: number;
      placements: number;
    }>();

    filteredJobs.forEach(job => {
      jobPerformance.set(job.id, {
        job,
        applications: 0,
        placements: 0,
      });
    });

    // Count applications per job
    applications?.forEach(app => {
      const perf = jobPerformance.get(app.job_id);
      if (perf) {
        perf.applications++;
      }
    });

    // Count placements per job
    const appToJobMap = new Map(applications?.map(a => [a.id, a.job_id]) || []);
    acceptedOffers?.forEach(offer => {
      const jobId = appToJobMap.get(offer.application_id);
      if (jobId) {
        const perf = jobPerformance.get(jobId);
        if (perf) {
          perf.placements++;
        }
      }
    });

    // Sort and format top jobs by applications
    const topJobsByApplications = Array.from(jobPerformance.values())
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10)
      .map(perf => ({
        jobId: perf.job.id,
        jobTitle: perf.job.title,
        company: perf.job.agency_client?.company?.name || 'Unknown',
        agency: perf.job.agency_client?.agency?.name || 'Unknown',
        applications: perf.applications,
        placements: perf.placements,
      }));

    // Sort and format top jobs by placements
    const topJobsByPlacements = Array.from(jobPerformance.values())
      .filter(perf => perf.placements > 0)
      .sort((a, b) => b.placements - a.placements)
      .slice(0, 10)
      .map(perf => ({
        jobId: perf.job.id,
        jobTitle: perf.job.title,
        company: perf.job.agency_client?.company?.name || 'Unknown',
        agency: perf.job.agency_client?.agency?.name || 'Unknown',
        applications: perf.applications,
        placements: perf.placements,
      }));

    // Get top recruiters by placements
    // We need to get applications with their offers and find the recruiter who managed them
    const { data: applicationsWithRecruiters } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        reviewed_by,
        job:jobs (
          agency_client:agency_clients (
            agency_id
          )
        )
      `)
      .in('id', applicationIds.length > 0 ? applicationIds : ['none']);

    const recruiterPlacements = new Map<string, {
      recruiterId: string;
      placements: number;
    }>();

    // Map applications to recruiters and count placements
    const placementAppIds = new Set(acceptedOffers?.map(o => o.application_id) || []);

    applicationsWithRecruiters?.forEach(app => {
      if (placementAppIds.has(app.id) && app.reviewed_by) {
        const existing = recruiterPlacements.get(app.reviewed_by);
        if (existing) {
          existing.placements++;
        } else {
          recruiterPlacements.set(app.reviewed_by, {
            recruiterId: app.reviewed_by,
            placements: 1,
          });
        }
      }
    });

    // Get recruiter details
    const recruiterIds = Array.from(recruiterPlacements.keys());
    const { data: recruiters } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .in('id', recruiterIds.length > 0 ? recruiterIds : ['none']);

    const recruiterMap = new Map(recruiters?.map(r => [r.id, r]) || []);

    const topRecruitersByPlacements = Array.from(recruiterPlacements.values())
      .sort((a, b) => b.placements - a.placements)
      .slice(0, 10)
      .map(rp => {
        const recruiter = recruiterMap.get(rp.recruiterId);
        return {
          recruiterId: rp.recruiterId,
          recruiterName: recruiter
            ? `${recruiter.first_name || ''} ${recruiter.last_name || ''}`.trim() || recruiter.email
            : 'Unknown',
          placements: rp.placements,
        };
      });

    // Get top agencies by activity (applications + placements)
    const agencyActivity = new Map<string, {
      agencyId: string;
      agencyName: string;
      applications: number;
      placements: number;
      jobs: number;
    }>();

    filteredJobs.forEach(job => {
      const agencyId = job.agency_client?.agency?.id;
      const agencyName = job.agency_client?.agency?.name;
      if (agencyId && agencyName) {
        const existing = agencyActivity.get(agencyId);
        if (existing) {
          existing.jobs++;
        } else {
          agencyActivity.set(agencyId, {
            agencyId,
            agencyName,
            applications: 0,
            placements: 0,
            jobs: 1,
          });
        }
      }
    });

    // Add application counts
    applications?.forEach(app => {
      const job = filteredJobs.find(j => j.id === app.job_id);
      const agencyId = job?.agency_client?.agency?.id;
      if (agencyId) {
        const activity = agencyActivity.get(agencyId);
        if (activity) {
          activity.applications++;
        }
      }
    });

    // Add placement counts
    acceptedOffers?.forEach(offer => {
      const jobId = appToJobMap.get(offer.application_id);
      if (jobId) {
        const job = filteredJobs.find(j => j.id === jobId);
        const agencyId = job?.agency_client?.agency?.id;
        if (agencyId) {
          const activity = agencyActivity.get(agencyId);
          if (activity) {
            activity.placements++;
          }
        }
      }
    });

    const topAgenciesByActivity = Array.from(agencyActivity.values())
      .sort((a, b) => (b.applications + b.placements) - (a.applications + a.placements))
      .slice(0, 10)
      .map(agency => ({
        agencyId: agency.agencyId,
        agencyName: agency.agencyName,
        jobs: agency.jobs,
        applications: agency.applications,
        placements: agency.placements,
        totalActivity: agency.applications + agency.placements,
      }));

    return NextResponse.json({
      topJobsByApplications,
      topJobsByPlacements,
      topRecruitersByPlacements,
      topAgenciesByActivity,
    });

  } catch (error) {
    console.error('Error fetching top performers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

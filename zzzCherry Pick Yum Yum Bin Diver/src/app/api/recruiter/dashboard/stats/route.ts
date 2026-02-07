import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { getRecruiterDashboardStats, getApplicationFunnelStats } from '@/lib/analytics/dashboardService';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    if (!auth.userId) {
      return NextResponse.json({ error: auth.error || 'Not authenticated' }, { status: 401 });
    }

    // Get recruiter's agency
    let agencyId: string | null = null;
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', auth.userId)
      .single();
    agencyId = recruiter?.agency_id || null;

    // If no agency, return empty stats
    if (!agencyId) {
      return NextResponse.json({
        stats: {
          activeJobs: 0,
          newApplications: 0,
          pendingInterviews: 0,
          offersDue: 0,
          placementsThisMonth: 0,
          applicationsThisWeek: 0,
          averageTimeToHire: 0,
          conversionRate: 0,
        },
        funnel: {
          submitted: 0,
          underReview: 0,
          shortlisted: 0,
          interviewed: 0,
          offerSent: 0,
          hired: 0,
          rejected: 0,
        },
        recentApplications: []
      });
    }

    // Get comprehensive stats using analytics service
    const [dashboardStats, funnelStats] = await Promise.all([
      getRecruiterDashboardStats(agencyId),
      getApplicationFunnelStats(agencyId),
    ]);

    // Get recent applications for quick view
    const { data: clients } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('agency_id', agencyId);
    const clientIds = (clients || []).map(c => c.id);

    const { data: jobsForAgency } = clientIds.length > 0
      ? await supabaseAdmin.from('jobs').select('id').in('agency_client_id', clientIds)
      : { data: [] };
    const jobIds = (jobsForAgency || []).map(j => j.id);

    const { data: recentApplications } = jobIds.length > 0
      ? await supabaseAdmin
        .from('job_applications')
        .select(`
          id,
          created_at,
          status,
          candidate:candidates (
            first_name,
            last_name
          ),
          job:jobs (
            title
          )
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(5)
      : { data: [] };

    const formattedApplications = (recentApplications || []).map((app: any) => {
      const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
      const job = Array.isArray(app.job) ? app.job[0] : app.job;

      return {
        id: app.id,
        candidateName: candidate ? `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
        jobTitle: job?.title || 'Unknown Job',
        status: app.status,
        appliedAt: app.created_at,
      };
    });

    return NextResponse.json({
      stats: dashboardStats,
      funnel: funnelStats,
      recentApplications: formattedApplications,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}


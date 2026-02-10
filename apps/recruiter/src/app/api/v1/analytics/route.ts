import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../auth';
import { handleCorsOptions, withCors } from '../cors';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * GET /api/v1/analytics
 * Get recruiting analytics and pipeline stats
 * 
 * TIER: Pro+
 * 
 * Query params:
 *   ?period=30d (7d, 30d, 90d, 1y)
 *   ?clientId=uuid (optional filter)
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(
      NextResponse.json({ error: auth.error }, { status: auth.status }),
      request,
      'rateLimit' in auth ? auth.rateLimit : undefined
    );
  }

  const tier = await getAgencyTier(auth.agency_id);
  if (tier === 'free') {
    return withCors(NextResponse.json({
      error: 'Analytics requires Pro plan',
    }, { status: 403 }));
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';
  const clientId = searchParams.get('clientId');

  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get client IDs
    let clientIds: string[];
    if (clientId) {
      const allClientIds = await getAgencyClientIds(auth.agency_id);
      if (!allClientIds.includes(clientId)) {
        return withCors(NextResponse.json({ error: 'Client not found' }, { status: 404 }), request);
      }
      clientIds = [clientId];
    } else {
      clientIds = await getAgencyClientIds(auth.agency_id);
    }

    if (clientIds.length === 0) {
      return withCors(NextResponse.json({
        period,
        pipeline: {},
        metrics: {},
        jobs: { active: 0, closed: 0, total: 0 },
      }), request);
    }

    // Get jobs
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id, status, created_at')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];

    // Get applications with status breakdown
    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('id, status, created_at, job_id')
      .in('job_id', jobIds.length > 0 ? jobIds : ['none'])
      .gte('created_at', startDate.toISOString());

    // Get interviews
    const appIds = applications?.map(a => a.id) || [];
    const { data: interviews } = await supabaseAdmin
      .from('job_interviews')
      .select('id, status, outcome, created_at, application_id')
      .in('application_id', appIds.length > 0 ? appIds : ['none']);

    // Get offers
    const { data: offers } = await supabaseAdmin
      .from('job_offers')
      .select('id, status, created_at, application_id')
      .in('application_id', appIds.length > 0 ? appIds : ['none']);

    // Calculate pipeline stats
    const pipeline: Record<string, number> = {};
    for (const app of applications || []) {
      pipeline[app.status] = (pipeline[app.status] || 0) + 1;
    }

    // Calculate interview outcomes
    const interviewStats = {
      total: interviews?.length || 0,
      passed: interviews?.filter(i => i.outcome === 'passed').length || 0,
      failed: interviews?.filter(i => i.outcome === 'failed').length || 0,
      pending: interviews?.filter(i => !i.outcome || i.outcome === 'pending_decision').length || 0,
    };

    // Calculate offer stats
    const offerStats = {
      total: offers?.length || 0,
      accepted: offers?.filter(o => o.status === 'accepted').length || 0,
      rejected: offers?.filter(o => o.status === 'rejected').length || 0,
      pending: offers?.filter(o => ['sent', 'viewed', 'negotiating'].includes(o.status)).length || 0,
    };

    // Calculate time-to-hire metrics (from application to offer accepted)
    const acceptedOffers = (offers || []).filter(o => o.status === 'accepted');
    let avgTimeToHire: number | null = null;
    
    if (acceptedOffers.length > 0) {
      const times: number[] = [];
      for (const offer of acceptedOffers) {
        const app = (applications || []).find(a => a.id === offer.application_id);
        if (app) {
          const days = (new Date(offer.created_at).getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24);
          times.push(days);
        }
      }
      if (times.length > 0) {
        avgTimeToHire = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
    }

    // Applications over time (daily for 7d, weekly for 30d+)
    const applicationsOverTime: { date: string; count: number }[] = [];
    const appsByDate: Record<string, number> = {};
    
    for (const app of applications || []) {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      appsByDate[date] = (appsByDate[date] || 0) + 1;
    }
    
    // Fill in dates
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      applicationsOverTime.push({
        date: dateStr,
        count: appsByDate[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Job stats
    const jobStats = {
      active: jobs?.filter(j => j.status === 'active').length || 0,
      closed: jobs?.filter(j => j.status === 'closed').length || 0,
      draft: jobs?.filter(j => j.status === 'draft').length || 0,
      total: jobs?.length || 0,
    };

    // Source breakdown (if tracked)
    const sources: Record<string, number> = {};
    // TODO: Add source tracking to applications

    return withCors(NextResponse.json({
      period,
      date_range: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      pipeline,
      metrics: {
        total_applications: applications?.length || 0,
        conversion_rate: applications?.length 
          ? Math.round((offerStats.accepted / applications.length) * 100) 
          : 0,
        avg_time_to_hire_days: avgTimeToHire,
        interview_pass_rate: interviewStats.total
          ? Math.round((interviewStats.passed / interviewStats.total) * 100)
          : 0,
        offer_acceptance_rate: offerStats.total
          ? Math.round((offerStats.accepted / offerStats.total) * 100)
          : 0,
      },
      interviews: interviewStats,
      offers: offerStats,
      jobs: jobStats,
      applications_over_time: applicationsOverTime,
    }), request);

  } catch (error) {
    console.error('Analytics error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

async function getAgencyTier(agency_id: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('api_tier')
    .eq('id', agency_id)
    .single();
  
  return data?.api_tier || 'free';
}

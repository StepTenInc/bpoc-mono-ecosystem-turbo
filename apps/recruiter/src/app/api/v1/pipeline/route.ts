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
 * GET /api/v1/pipeline
 * Get applications grouped by pipeline stage
 * 
 * TIER: All
 * 
 * Query params:
 *   ?jobId=uuid (filter by job)
 *   ?clientId=uuid (filter by client)
 *   ?includeDetails=true (include candidate details)
 *   ?limit=50 (per stage)
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

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const clientId = searchParams.get('clientId');
  const includeDetails = searchParams.get('includeDetails') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
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
      return withCors(NextResponse.json({ stages: [], totals: {} }), request);
    }

    // Get jobs
    let jobQuery = supabaseAdmin
      .from('jobs')
      .select('id, title')
      .in('agency_client_id', clientIds);

    if (jobId) {
      jobQuery = jobQuery.eq('id', jobId);
    }

    const { data: jobs } = await jobQuery;
    const jobIds = jobs?.map(j => j.id) || [];
    const jobMap = Object.fromEntries((jobs || []).map(j => [j.id, j.title]));

    if (jobIds.length === 0) {
      return withCors(NextResponse.json({ stages: [], totals: {} }), request);
    }

    // Define pipeline stages in order
    const PIPELINE_STAGES = [
      'submitted',
      'screening',
      'prescreen_scheduled',
      'prescreen_completed',
      'interview_scheduled',
      'interviewing',
      'offer_pending',
      'offer_sent',
      'offer_accepted',
      'offer_rejected',
      'hired',
      'rejected',
      'withdrawn',
    ];

    // Get all applications with optional candidate details
    let applicationQuery = supabaseAdmin
      .from('job_applications')
      .select(includeDetails 
        ? `
          id,
          status,
          job_id,
          candidate_id,
          released_to_client,
          created_at,
          updated_at,
          candidates (
            id,
            first_name,
            last_name,
            email
          )
        `
        : 'id, status, job_id, candidate_id, released_to_client, created_at'
      )
      .in('job_id', jobIds);

    const { data: applications, error } = await applicationQuery as { data: any[] | null; error: any };

    if (error) {
      console.error('Pipeline fetch error:', error);
      return withCors(NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 }), request);
    }

    // Group by stage
    const stageMap: Record<string, any[]> = {};
    const totals: Record<string, number> = {};

    for (const stage of PIPELINE_STAGES) {
      stageMap[stage] = [];
      totals[stage] = 0;
    }

    for (const app of applications || []) {
      const stage = app.status || 'submitted';
      if (stage in stageMap) {
        totals[stage]++;
        if (stageMap[stage].length < limit) {
          stageMap[stage].push({
            id: app.id,
            job_id: app.job_id,
            job_title: jobMap[app.job_id] || 'Unknown',
            candidate_id: app.candidate_id,
            released_to_client: app.released_to_client,
            created_at: app.created_at,
            updated_at: app.updated_at,
            ...(includeDetails && app.candidates ? {
              candidate: {
                id: (app.candidates as any).id,
                first_name: (app.candidates as any).first_name,
                last_name: (app.candidates as any).last_name,
                email: (app.candidates as any).email,
                name: `${(app.candidates as any).first_name} ${(app.candidates as any).last_name}`.trim(),
              }
            } : {}),
          });
        }
      }
    }

    // Format response as ordered stages
    const stages = PIPELINE_STAGES.map(stage => ({
      stage,
      count: totals[stage],
      applications: stageMap[stage],
    })).filter(s => s.count > 0 || ['submitted', 'screening', 'interviewing', 'hired'].includes(s.stage));

    return withCors(NextResponse.json({
      stages,
      totals,
      summary: {
        total_applications: applications?.length || 0,
        active: (totals.submitted || 0) + (totals.screening || 0) + (totals.prescreen_scheduled || 0) +
                (totals.prescreen_completed || 0) + (totals.interview_scheduled || 0) + (totals.interviewing || 0) +
                (totals.offer_pending || 0) + (totals.offer_sent || 0),
        hired: totals.hired || 0,
        rejected: (totals.rejected || 0) + (totals.withdrawn || 0),
      },
    }), request);

  } catch (error) {
    console.error('Pipeline error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

/**
 * PATCH /api/v1/pipeline
 * Bulk move applications to different stages
 * 
 * TIER: Pro+
 * 
 * Body:
 *   applicationIds: string[] (required)
 *   newStatus: string (required)
 */
export async function PATCH(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const tier = await getAgencyTier(auth.agency_id);
  if (tier === 'free') {
    return withCors(NextResponse.json({
      error: 'Bulk pipeline operations require Pro plan',
    }, { status: 403 }));
  }

  try {
    const body = await request.json();
    const { applicationIds, newStatus } = body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return withCors(NextResponse.json({
        error: 'applicationIds array is required'
      }, { status: 400 }));
    }

    if (!newStatus) {
      return withCors(NextResponse.json({
        error: 'newStatus is required'
      }, { status: 400 }));
    }

    if (applicationIds.length > 50) {
      return withCors(NextResponse.json({
        error: 'Maximum 50 applications per request'
      }, { status: 400 }));
    }

    // Verify applications belong to agency
    const clientIds = await getAgencyClientIds(auth.agency_id);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];

    const { data: apps } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .in('id', applicationIds)
      .in('job_id', jobIds);

    const validAppIds = apps?.map(a => a.id) || [];

    if (validAppIds.length === 0) {
      return withCors(NextResponse.json({
        error: 'No valid applications found'
      }, { status: 404 }));
    }

    // Update applications
    const { error } = await supabaseAdmin
      .from('job_applications')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .in('id', validAppIds);

    if (error) {
      console.error('Bulk update error:', error);
      return withCors(NextResponse.json({ error: 'Failed to update applications' }, { status: 500 }), request);
    }

    return withCors(NextResponse.json({
      success: true,
      updated: validAppIds.length,
      skipped: applicationIds.length - validAppIds.length,
    }), request);

  } catch (error) {
    console.error('Pipeline PATCH error:', error);
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

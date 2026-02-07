import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../auth';
import { corsHeaders, handleCorsOptions, withCors } from '../cors';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * GET /api/v1/jobs
 * List all active jobs for the agency
 * 
 * Headers:
 *   X-API-Key: your_api_key
 * 
 * Query params:
 *   ?status=active (optional)
 *   ?limit=10 (optional, default 50)
 *   ?offset=0 (optional)
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { agencyId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'active';
  const clientId = searchParams.get('clientId'); // Filter by specific client
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Get agency's clients (or specific client if filtered)
    let clientIds: string[];
    if (clientId) {
      // Verify client belongs to agency
      const allClientIds = await getAgencyClientIds(agencyId);
      if (!allClientIds.includes(clientId)) {
        return withCors(NextResponse.json({ error: 'Client not found' }, { status: 404 }), request);
      }
      clientIds = [clientId];
    } else {
      clientIds = await getAgencyClientIds(agencyId);
    }
    
    if (clientIds.length === 0) {
      return withCors(NextResponse.json({ jobs: [], total: 0 }), request);
    }

    // Fetch jobs - ALL fields
    let query = supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact' })
      .in('agency_client_id', clientIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: jobs, count, error } = await query;

    if (error) {
      console.error('API v1 jobs error:', error);
      return withCors(NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 }), request);
    }

    // Format response - return ALL fields
    const formattedJobs = (jobs || []).map(job => ({
      ...job, // Return ALL database fields
      // Also include camelCase versions for backward compatibility
      agencyClientId: job.agency_client_id,
      postedBy: job.posted_by,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      salaryType: job.salary_type,
      workArrangement: job.work_arrangement,
      workType: job.work_type,
      experienceLevel: job.experience_level,
      applicationDeadline: job.application_deadline,
      applicantsCount: job.applicants_count,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    }));

    return withCors(NextResponse.json({
      jobs: formattedJobs,
      total: count || 0,
      limit,
      offset,
    }), request);

  } catch (error) {
    console.error('API v1 jobs error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

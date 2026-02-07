import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getAgencyClientIds } from '../../../../auth';
import { handleCorsOptions, withCors } from '../../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getApplicationActivityTimeline, logApplicationActivity } from '@/lib/db/applications/queries.supabase';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * GET /api/v1/applications/[id]/card/timeline
 * Get activity timeline for an application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { agencyId } = auth;
  const { id } = await params;

  try {
    // Verify application belongs to agency
    const clientIds = await getAgencyClientIds(agencyId);
    const { data: app } = await supabaseAdmin
      .from('job_applications')
      .select('id, jobs!inner(agency_client_id)')
      .eq('id', id)
      .in('jobs.agency_client_id', clientIds)
      .single();

    if (!app) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    const timeline = await getApplicationActivityTimeline(id);

    return withCors(NextResponse.json({ timeline }), request);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    ), request);
  }
}

/**
 * POST /api/v1/applications/[id]/card/timeline
 * Manually log an activity (for custom events)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { agencyId } = auth;
  const { id } = await params;
  const body = await request.json();
  const { action_type, performed_by_type, performed_by_id, description, metadata } = body;

  if (!action_type || !performed_by_type || !description) {
    return withCors(NextResponse.json(
      { error: 'Missing required fields: action_type, performed_by_type, description' },
      { status: 400 }
    ), request);
  }

  if (!['candidate', 'recruiter', 'client', 'system'].includes(performed_by_type)) {
    return withCors(NextResponse.json(
      { error: 'performed_by_type must be "candidate", "recruiter", "client", or "system"' },
      { status: 400 }
    ), request);
  }

  try {
    // Verify application belongs to agency
    const clientIds = await getAgencyClientIds(agencyId);
    const { data: app } = await supabaseAdmin
      .from('job_applications')
      .select('id, jobs!inner(agency_client_id)')
      .eq('id', id)
      .in('jobs.agency_client_id', clientIds)
      .single();

    if (!app) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    await logApplicationActivity(id, {
      action_type,
      performed_by_type: performed_by_type as 'candidate' | 'recruiter' | 'client' | 'system',
      performed_by_id,
      description,
      metadata,
    });

    const timeline = await getApplicationActivityTimeline(id);

    return withCors(NextResponse.json({ timeline }), request);
  } catch (error) {
    console.error('Error logging activity:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    ), request);
  }
}


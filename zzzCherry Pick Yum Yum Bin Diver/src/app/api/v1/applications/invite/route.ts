import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../../auth';
import { handleCorsOptions, withCors } from '../../cors';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * POST /api/v1/applications/invite
 * Invite a candidate to apply for a job (Agency Portal / ShoreAgents).
 *
 * Body:
 *  - candidateId: string (required) candidates.id
 *  - jobId: string (required) jobs.id
 *  - message?: string (optional) stored in recruiter_notes for now
 *
 * Notes:
 * - Creates (or updates) job_applications row with status='invited'
 * - Requires DB check constraint to allow 'invited' status (see migration)
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  try {
    const body = await request.json();
    const { candidateId, jobId, message } = body as { candidateId?: string; jobId?: string; message?: string };

    if (!candidateId || !jobId) {
      return withCors(NextResponse.json({ error: 'candidateId and jobId are required' }, { status: 400 }), request);
    }

    // Verify job belongs to agency via agency_clients
    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('id, agency_client_id')
      .eq('id', jobId)
      .in('agency_client_id', clientIds)
      .single();

    if (!job) {
      return withCors(NextResponse.json({ error: 'Job not found' }, { status: 404 }), request);
    }

    const now = new Date().toISOString();
    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .upsert(
        {
          candidate_id: candidateId,
          job_id: jobId,
          status: 'invited',
          recruiter_notes: typeof message === 'string' && message.trim().length > 0 ? message.trim() : null,
          updated_at: now,
        },
        { onConflict: 'candidate_id,job_id' }
      )
      .select('id, status')
      .single();

    if (error) {
      console.error('[v1 invite] failed to upsert job_application:', error);
      return withCors(
        NextResponse.json(
          {
            error: 'Failed to invite candidate',
            details: (error as any)?.message,
            hint: 'Ensure job_applications.status allows \"invited\" (check constraint/migration).',
          },
          { status: 500 }
        ),
        request
      );
    }

    return withCors(
      NextResponse.json({
        success: true,
        applicationId: application?.id,
        status: application?.status,
        message: 'Invitation created',
      }),
      request
    );
  } catch (e) {
    console.error('API v1 applications invite error:', e);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}



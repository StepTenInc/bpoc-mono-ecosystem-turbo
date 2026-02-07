import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getAgencyClientIds } from '../../../../auth';
import { handleCorsOptions, withCors } from '../../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateClientFeedback } from '@/lib/db/applications/queries.supabase';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * PATCH /api/v1/applications/[id]/card/client-feedback
 * Update client notes and rating
 */
export async function PATCH(
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
  const { notes, rating } = body;

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

    const updated = await updateClientFeedback(id, {
      notes,
      rating,
    });

    if (!updated) {
      return withCors(NextResponse.json({ error: 'Failed to update client feedback' }, { status: 500 }), request);
    }

    return withCors(NextResponse.json({ feedback: updated }), request);
  } catch (error) {
    console.error('Error updating client feedback:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to update client feedback' },
      { status: 500 }
    ), request);
  }
}


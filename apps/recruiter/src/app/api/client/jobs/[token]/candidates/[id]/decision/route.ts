import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken, logClientAccess } from '@/lib/client-tokens';

/**
 * POST /api/client/jobs/[token]/candidates/[id]/decision
 *
 * Record client's decision on a candidate (accept/reject)
 *
 * Body:
 * - decision: 'accept' | 'reject'
 * - notes?: string (optional feedback)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id } = await context.params;

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired access link' },
        { status: 403 }
      );
    }

    if (!tokenData.canViewReleasedCandidates) {
      return NextResponse.json(
        { error: 'You do not have permission to manage candidates' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { decision, notes } = body;

    // Validate decision
    if (!decision || !['accept', 'reject'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Verify application exists and is released to client
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        job_id,
        candidate_id,
        status,
        released_to_client,
        client_decision
      `)
      .eq('id', id)
      .eq('job_id', tokenData.job_id)
      .single();

    if (appError || !application) {
      console.error('[Decision API] Application not found:', appError);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Fetch candidate name separately (joins don't work reliably)
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('first_name, last_name')
      .eq('id', application.candidate_id)
      .single();

    if (!application.released_to_client) {
      return NextResponse.json(
        { error: 'This candidate has not been released to you yet' },
        { status: 403 }
      );
    }

    // Check if decision already made
    if (application.client_decision) {
      return NextResponse.json(
        { error: `Decision already recorded as "${application.client_decision}"` },
        { status: 400 }
      );
    }

    // Determine new status based on decision
    const newStatus = decision === 'accept' ? 'client_approved' : 'client_rejected';

    // Update the application
    const { error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        client_decision: decision,
        client_decision_at: new Date().toISOString(),
        client_notes: notes || null,
        status: newStatus,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to record decision' },
        { status: 500 }
      );
    }

    // Get client IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Log the action
    await logClientAccess({
      jobTokenId: tokenData.tokenId,
      action: decision === 'accept' ? 'accepted_candidate' : 'rejected_candidate',
      metadata: {
        application_id: id,
        candidate_id: application.candidate_id,
        candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
        decision,
        notes: notes || null,
        new_status: newStatus,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: decision === 'accept' 
        ? 'Candidate accepted successfully' 
        : 'Candidate rejected',
      decision,
      newStatus,
    });
  } catch (error) {
    console.error('Error recording client decision:', error);
    return NextResponse.json(
      { error: 'Failed to record decision' },
      { status: 500 }
    );
  }
}

/**
 * Admin Candidate Suspension API
 *
 * POST /api/admin/candidates/[id]/suspend - Suspend a candidate
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { logAdminAction, getAdminUser, ADMIN_ACTIONS } from '@/lib/admin-audit';


// POST - Suspend a candidate
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);

    // 2. Check if user is admin
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 3. Get candidate to verify they exist
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, email, suspended')
      .eq('id', params.id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.suspended) {
      return NextResponse.json(
        { error: 'Candidate is already suspended' },
        { status: 400 }
      );
    }

    // 4. Parse request body for reason
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Suspension reason is required' },
        { status: 400 }
      );
    }

    // 5. Suspend the candidate
    const { data: updatedCandidate, error: updateError } = await supabase
      .from('candidates')
      .update({
        suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_by: user.id,
        suspended_reason: reason,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error suspending candidate:', updateError);
      return NextResponse.json({ error: 'Failed to suspend candidate' }, { status: 500 });
    }

    // 6. Log action to audit trail
    await logAdminAction({
      adminId: user.id,
      adminName: `${adminUser.user.first_name} ${adminUser.user.last_name}`,
      adminEmail: adminUser.user.email || undefined,
      action: ADMIN_ACTIONS.SUSPEND_CANDIDATE,
      entityType: 'candidate',
      entityId: params.id,
      entityName: `${candidate.first_name} ${candidate.last_name}`,
      details: {
        previousStatus: 'active',
        newStatus: 'suspended',
        candidateEmail: candidate.email,
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      candidate: {
        id: updatedCandidate.id,
        name: `${updatedCandidate.first_name} ${updatedCandidate.last_name}`,
        email: updatedCandidate.email,
        suspended: updatedCandidate.suspended,
        suspendedAt: updatedCandidate.suspended_at,
        suspendedReason: updatedCandidate.suspended_reason,
      },
    });
  } catch (error) {
    console.error('Error suspending candidate:', error);
    return NextResponse.json(
      { error: 'Failed to suspend candidate' },
      { status: 500 }
    );
  }
}

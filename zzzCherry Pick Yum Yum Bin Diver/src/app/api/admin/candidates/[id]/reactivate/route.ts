/**
 * Admin Candidate Reactivation API
 *
 * POST /api/admin/candidates/[id]/reactivate - Reactivate a suspended candidate
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { logAdminAction, getAdminUser, ADMIN_ACTIONS } from '@/lib/admin-audit';


// POST - Reactivate a suspended candidate
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

    // 3. Get candidate to verify they exist and are suspended
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, email, suspended, suspended_reason')
      .eq('id', params.id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (!candidate.suspended) {
      return NextResponse.json(
        { error: 'Candidate is not suspended' },
        { status: 400 }
      );
    }

    // 4. Parse request body for optional reason
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // 5. Reactivate the candidate
    const { data: updatedCandidate, error: updateError } = await supabase
      .from('candidates')
      .update({
        suspended: false,
        suspended_at: null,
        suspended_by: null,
        suspended_reason: null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error reactivating candidate:', updateError);
      return NextResponse.json({ error: 'Failed to reactivate candidate' }, { status: 500 });
    }

    // 6. Log action to audit trail
    await logAdminAction({
      adminId: user.id,
      adminName: `${adminUser.user.first_name} ${adminUser.user.last_name}`,
      adminEmail: adminUser.user.email || undefined,
      action: ADMIN_ACTIONS.REACTIVATE_CANDIDATE,
      entityType: 'candidate',
      entityId: params.id,
      entityName: `${candidate.first_name} ${candidate.last_name}`,
      details: {
        previousStatus: 'suspended',
        newStatus: 'active',
        previousSuspensionReason: candidate.suspended_reason,
        candidateEmail: candidate.email,
      },
      reason: reason || 'Reactivated by admin',
    });

    return NextResponse.json({
      success: true,
      candidate: {
        id: updatedCandidate.id,
        name: `${updatedCandidate.first_name} ${updatedCandidate.last_name}`,
        email: updatedCandidate.email,
        suspended: updatedCandidate.suspended,
      },
    });
  } catch (error) {
    console.error('Error reactivating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate candidate' },
      { status: 500 }
    );
  }
}

/**
 * Admin Agency Reactivation API
 *
 * POST /api/admin/agencies/[id]/reactivate - Reactivate a suspended agency
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { logAdminAction, getAdminUser, ADMIN_ACTIONS } from '@/lib/admin-audit';

// POST - Reactivate a suspended agency
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

    // 3. Get agency to verify it exists and is suspended
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('id, name, suspended, suspended_reason, tier')
      .eq('id', params.id)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    if (!agency.suspended) {
      return NextResponse.json(
        { error: 'Agency is not suspended' },
        { status: 400 }
      );
    }

    // 4. Parse request body for optional reason
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // 5. Reactivate the agency
    const { data: updatedAgency, error: updateError } = await supabaseAdmin
      .from('agencies')
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
      console.error('Error reactivating agency:', updateError);
      return NextResponse.json({ error: 'Failed to reactivate agency' }, { status: 500 });
    }

    // 6. Log action to audit trail
    await logAdminAction({
      adminId: user.id,
      adminName: `${adminUser.user.first_name} ${adminUser.user.last_name}`,
      adminEmail: adminUser.user.email || undefined,
      action: ADMIN_ACTIONS.REACTIVATE_AGENCY,
      entityType: 'agency',
      entityId: params.id,
      entityName: agency.name || undefined,
      details: {
        previousStatus: 'suspended',
        newStatus: 'active',
        previousSuspensionReason: agency.suspended_reason,
        tier: agency.tier,
      },
      reason: reason || 'Reactivated by admin',
    });

    return NextResponse.json({
      success: true,
      agency: {
        id: updatedAgency.id,
        companyName: updatedAgency.name,
        suspended: updatedAgency.suspended,
      },
    });
  } catch (error) {
    console.error('Error reactivating agency:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate agency' },
      { status: 500 }
    );
  }
}

/**
 * Admin Agency Suspension API
 *
 * POST /api/admin/agencies/[id]/suspend - Suspend an agency
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { logAdminAction, getAdminUser, ADMIN_ACTIONS } from '@/lib/admin-audit';

// POST - Suspend an agency
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

    // 3. Get agency to verify it exists
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('id, name, suspended, tier')
      .eq('id', params.id)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    if (agency.suspended) {
      return NextResponse.json(
        { error: 'Agency is already suspended' },
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

    // 5. Suspend the agency
    const { data: updatedAgency, error: updateError } = await supabaseAdmin
      .from('agencies')
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
      console.error('Error suspending agency:', updateError);
      return NextResponse.json({ error: 'Failed to suspend agency' }, { status: 500 });
    }

    // 6. Log action to audit trail
    await logAdminAction({
      adminId: user.id,
      adminName: `${adminUser.user.first_name} ${adminUser.user.last_name}`,
      adminEmail: adminUser.user.email || undefined,
      action: ADMIN_ACTIONS.SUSPEND_AGENCY,
      entityType: 'agency',
      entityId: params.id,
      entityName: agency.name || undefined,
      details: {
        previousStatus: 'active',
        newStatus: 'suspended',
        tier: agency.tier,
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      agency: {
        id: updatedAgency.id,
        companyName: updatedAgency.name,
        suspended: updatedAgency.suspended,
        suspendedAt: updatedAgency.suspended_at,
        suspendedReason: updatedAgency.suspended_reason,
      },
    });
  } catch (error) {
    console.error('Error suspending agency:', error);
    return NextResponse.json(
      { error: 'Failed to suspend agency' },
      { status: 500 }
    );
  }
}

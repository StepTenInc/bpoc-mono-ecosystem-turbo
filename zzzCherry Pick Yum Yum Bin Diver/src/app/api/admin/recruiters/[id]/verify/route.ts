import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin-audit';
import { getAdminFromSession, requireAdmin } from '@/lib/admin-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleVerification(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleVerification(request, params);
}

async function handleVerification(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    await requireAdmin();
    const admin = await getAdminFromSession();

    const recruiterId = params.id;
    const body = await request.json();
    const { action, reason } = body; // action: 'verify' or 'reject'

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: verify or reject' },
        { status: 400 }
      );
    }

    // Fetch recruiter with agency and role info
    const { data: recruiter, error: fetchError } = await supabaseAdmin
      .from('agency_recruiters')
      .select(`
        id,
        email,
        role,
        is_verified,
        verification_status,
        agency_id,
        agency:agencies (
          id,
          name,
          tin_number,
          dti_certificate_url,
          business_permit_url,
          sec_registration_url
        )
      `)
      .eq('id', recruiterId)
      .single();

    if (fetchError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    const agency = Array.isArray(recruiter.agency) ? recruiter.agency[0] : recruiter.agency;

    if (action === 'verify') {
      // Check if agency documents are uploaded
      if (!agency?.tin_number || !agency?.dti_certificate_url ||
          !agency?.business_permit_url || !agency?.sec_registration_url) {
        return NextResponse.json({
          error: 'Cannot verify recruiter. Agency documents are incomplete.'
        }, { status: 400 });
      }

      // Update recruiter verification status
      const { error: updateError } = await supabaseAdmin
        .from('agency_recruiters')
        .update({
          verification_status: 'verified',
          is_verified: true,
          is_active: true,
          verified_at: new Date().toISOString(),
          rejected_at: null,
          rejection_reason: null,
          profile_completion_percentage: 100,
        })
        .eq('id', recruiterId);

      if (updateError) {
        console.error('Failed to update recruiter:', updateError);
        throw updateError;
      }

      // Update agency document verification
      const { error: agencyUpdateError } = await supabaseAdmin
        .from('agencies')
        .update({
          documents_verified: true,
          documents_verified_at: new Date().toISOString(),
          documents_verified_by: admin.adminId,
        })
        .eq('id', recruiter.agency_id);

      if (agencyUpdateError) {
        console.error('Failed to update agency documents:', agencyUpdateError);
        // Don't throw - recruiter is already verified
      }

      // Auto-approve team members waiting for this authorization head
      if (recruiter.role === 'admin' || recruiter.role === 'owner') {
        const { error: teamUpdateError } = await supabaseAdmin
          .from('agency_recruiters')
          .update({
            verification_status: 'verified',
            is_verified: true,
            is_active: true,
            verified_at: new Date().toISOString(),
            profile_completion_percentage: 100,
          })
          .eq('invited_by_recruiter_id', recruiterId)
          .eq('verification_status', 'pending_authorization_head');

        if (teamUpdateError) {
          console.error('Failed to auto-approve team members:', teamUpdateError);
        }
      }

      // Log the action
      await logAdminAction({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: 'verify_recruiter',
        entityType: 'recruiter',
        entityId: recruiterId,
        entityName: recruiter.email || 'Unknown',
        details: {
          agencyId: agency?.id,
          agencyName: agency?.name,
          documentsVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Recruiter verified successfully',
      });

    } else {
      // Reject the recruiter
      const { error: updateError } = await supabaseAdmin
        .from('agency_recruiters')
        .update({
          verification_status: 'rejected',
          is_verified: false,
          is_active: false,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || 'No reason provided',
        })
        .eq('id', recruiterId);

      if (updateError) throw updateError;

      await logAdminAction({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: 'reject_recruiter',
        entityType: 'recruiter',
        entityId: recruiterId,
        entityName: recruiter.email || 'Unknown',
        details: {
          agencyId: agency?.id,
          agencyName: agency?.name,
          reason: reason || 'No reason provided',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Recruiter rejected',
      });
    }

  } catch (error) {
    console.error('Recruiter verification error:', error);
    return NextResponse.json(
      { error: 'Failed to process recruiter verification' },
      { status: 500 }
    );
  }
}

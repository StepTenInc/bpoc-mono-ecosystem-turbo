import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch recruiter with full details
    const { data: recruiter, error } = await supabaseAdmin
      .from('agency_recruiters')
      .select(`
        *,
        agency:agencies (
          id,
          name,
          email,
          logo_url,
          phone,
          website,
          is_active,
          tin_number,
          birn_number,
          dti_certificate_url,
          business_permit_url,
          sec_registration_url,
          nbi_clearance_url,
          documents_uploaded_at,
          documents_verified,
          documents_verified_at,
          documents_verified_by
        ),
        invited_by:agency_recruiters!invited_by_recruiter_id (
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Recruiter fetch error:', error);
      return NextResponse.json(
        { error: 'Recruiter not found' },
        { status: 404 }
      );
    }

    // Fetch team members invited by this recruiter (if they're an admin/owner)
    const { data: invitedMembers } = await supabaseAdmin
      .from('agency_recruiters')
      .select(`
        id,
        first_name,
        last_name,
        email,
        verification_status,
        role,
        created_at
      `)
      .eq('invited_by_recruiter_id', id);

    // Lookup admin who verified documents
    let verifiedByAdmin = null;
    if (recruiter.agency?.documents_verified_by) {
      const { data: admin } = await supabaseAdmin
        .from('bpoc_users')
        .select('id, email, first_name, last_name')
        .eq('id', recruiter.agency.documents_verified_by)
        .single();

      verifiedByAdmin = admin;
    }

    // Format response
    const agency = Array.isArray(recruiter.agency) ? recruiter.agency[0] : recruiter.agency;
    const invitedBy = Array.isArray(recruiter.invited_by) ? recruiter.invited_by[0] : recruiter.invited_by;

    const formattedRecruiter = {
      id: recruiter.id,
      userId: recruiter.user_id,
      email: recruiter.email,
      firstName: recruiter.first_name,
      lastName: recruiter.last_name,
      role: recruiter.role,
      verificationStatus: recruiter.verification_status,
      profileCompletionPercentage: recruiter.profile_completion_percentage || 0,
      isVerified: recruiter.is_verified,
      isActive: recruiter.is_active,
      createdAt: recruiter.created_at,
      joinedAt: recruiter.joined_at,
      verifiedAt: recruiter.verified_at,
      rejectedAt: recruiter.rejected_at,
      rejectionReason: recruiter.rejection_reason,
      lastSignInAt: null, // Not available without users table join
      canPostJobs: recruiter.can_post_jobs,
      canManageApplications: recruiter.can_manage_applications,
      canInviteRecruiters: recruiter.can_invite_recruiters,
      canManageClients: recruiter.can_manage_clients,
      invitedByRecruiterId: recruiter.invited_by_recruiter_id,
      invitedBy: invitedBy ? {
        id: invitedBy.id,
        firstName: invitedBy.first_name,
        lastName: invitedBy.last_name,
        email: invitedBy.email,
        role: invitedBy.role,
      } : null,
      invitedMembers: (invitedMembers || []).map(member => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        verificationStatus: member.verification_status,
        role: member.role,
        createdAt: member.created_at,
      })),
      agency: {
        id: agency?.id,
        name: agency?.name,
        email: agency?.email,
        phone: agency?.phone,
        website: agency?.website,
        logoUrl: agency?.logo_url,
        isActive: agency?.is_active,
        tinNumber: agency?.tin_number,
        birnNumber: agency?.birn_number,
        dtiCertificateUrl: agency?.dti_certificate_url,
        businessPermitUrl: agency?.business_permit_url,
        secRegistrationUrl: agency?.sec_registration_url,
        nbiClearanceUrl: agency?.nbi_clearance_url,
        documentsUploadedAt: agency?.documents_uploaded_at,
        documentsVerified: agency?.documents_verified,
        documentsVerifiedAt: agency?.documents_verified_at,
        documentsVerifiedBy: agency?.documents_verified_by,
        verifiedByAdmin: verifiedByAdmin ? {
          id: verifiedByAdmin.id,
          email: verifiedByAdmin.email,
          firstName: verifiedByAdmin.first_name,
          lastName: verifiedByAdmin.last_name,
        } : null,
      },
    };

    return NextResponse.json({ recruiter: formattedRecruiter });

  } catch (error) {
    console.error('Recruiter Detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recruiter details' },
      { status: 500 }
    );
  }
}

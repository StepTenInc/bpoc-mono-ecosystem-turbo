import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Fetch recruiter with full details
    const { data: recruiter, error } = await supabase
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
    const { data: invitedMembers } = await supabase
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
      const { data: admin } = await supabase
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
      user_id: recruiter.user_id,
      email: recruiter.email,
      first_name: recruiter.first_name,
      last_name: recruiter.last_name,
      role: recruiter.role,
      verification_status: recruiter.verification_status,
      profile_completion_percentage: recruiter.profile_completion_percentage || 0,
      is_verified: recruiter.is_verified,
      is_active: recruiter.is_active,
      created_at: recruiter.created_at,
      joined_at: recruiter.joined_at,
      verified_at: recruiter.verified_at,
      rejected_at: recruiter.rejected_at,
      rejection_reason: recruiter.rejection_reason,
      last_sign_in_at: null, // Not available without users table join
      can_post_jobs: recruiter.can_post_jobs,
      can_manage_applications: recruiter.can_manage_applications,
      can_invite_recruiters: recruiter.can_invite_recruiters,
      can_manage_clients: recruiter.can_manage_clients,
      invited_by_recruiter_id: recruiter.invited_by_recruiter_id,
      invited_by: invitedBy ? {
        id: invitedBy.id,
        first_name: invitedBy.first_name,
        last_name: invitedBy.last_name,
        email: invitedBy.email,
        role: invitedBy.role,
      } : null,
      invited_members: (invitedMembers || []).map(member => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        verification_status: member.verification_status,
        role: member.role,
        created_at: member.created_at,
      })),
      agency: {
        id: agency?.id,
        name: agency?.name,
        email: agency?.email,
        phone: agency?.phone,
        website: agency?.website,
        logo_url: agency?.logo_url,
        is_active: agency?.is_active,
        tin_number: agency?.tin_number,
        birn_number: agency?.birn_number,
        dti_certificate_url: agency?.dti_certificate_url,
        business_permit_url: agency?.business_permit_url,
        sec_registration_url: agency?.sec_registration_url,
        nbi_clearance_url: agency?.nbi_clearance_url,
        documents_uploaded_at: agency?.documents_uploaded_at,
        documents_verified: agency?.documents_verified,
        documents_verified_at: agency?.documents_verified_at,
        documents_verified_by: agency?.documents_verified_by,
        verified_by_admin: verifiedByAdmin ? {
          id: verifiedByAdmin.id,
          email: verifiedByAdmin.email,
          first_name: verifiedByAdmin.first_name,
          last_name: verifiedByAdmin.last_name,
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

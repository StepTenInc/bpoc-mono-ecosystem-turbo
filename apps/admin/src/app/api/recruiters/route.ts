import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // all, pending, verified, rejected

    // Fetch all recruiters with agency info (no user join - recruiters have their own profile data)
    let query = supabase
      .from('agency_recruiters')
      .select(`
        id,
        user_id,
        email,
        first_name,
        last_name,
        full_name,
        phone,
        avatar_url,
        role,
        position,
        bio,
        is_active,
        verification_status,
        profile_completion_percentage,
        invited_by_recruiter_id,
        created_at,
        agency:agencies (
          id,
          name,
          email,
          logo_url,
          is_active,
          tin_number,
          dti_certificate_url,
          business_permit_url,
          sec_registration_url,
          documents_uploaded_at,
          documents_verified,
          documents_verified_at,
          documents_verified_by
        )
      `)
      .order('created_at', { ascending: false });

    const { data: recruiters, error } = await query;

    if (error) {
      console.error('Recruiters fetch error:', error);
      throw error;
    }

    // Get invited_by info in a separate query if needed
    const recruiterIds = (recruiters || [])
      .filter(r => r.invited_by_recruiter_id)
      .map(r => r.invited_by_recruiter_id);

    let invitedByMap: Record<string, any> = {};
    if (recruiterIds.length > 0) {
      const { data: invitedByRecruiters } = await supabase
        .from('agency_recruiters')
        .select('id, first_name, last_name, email')
        .in('id', recruiterIds);

      if (invitedByRecruiters) {
        invitedByRecruiters.forEach(r => {
          invitedByMap[r.id] = r;
        });
      }
    }

    // Process recruiters and categorize by status
    const processedRecruiters = (recruiters || []).map((recruiter) => {
      const agency = Array.isArray(recruiter.agency) ? recruiter.agency[0] : recruiter.agency;
      const invitedBy = recruiter.invited_by_recruiter_id ? invitedByMap[recruiter.invited_by_recruiter_id] : null;

      // Use verification_status, default to pending
      const statusLabel = recruiter.verification_status || 'pending';

      return {
        id: recruiter.id,
        user_id: recruiter.user_id,
        email: recruiter.email,
        first_name: recruiter.first_name,
        last_name: recruiter.last_name,
        full_name: recruiter.full_name,
        phone: recruiter.phone,
        role: recruiter.role,
        position: recruiter.position,
        bio: recruiter.bio,
        avatar_url: recruiter.avatar_url,
        agency_id: agency?.id,
        agency_name: agency?.name || 'Unknown Agency',
        agency_logo: agency?.logo_url,
        agency_active: agency?.is_active,
        status: statusLabel,
        verification_status: recruiter.verification_status,
        profile_completion_percentage: recruiter.profile_completion_percentage || 0,
        is_active: recruiter.is_active,
        created_at: recruiter.created_at,
        invited_by_recruiter_id: recruiter.invited_by_recruiter_id,
        invited_by: invitedBy ? {
          id: invitedBy.id,
          first_name: invitedBy.first_name,
          last_name: invitedBy.last_name,
          email: invitedBy.email,
        } : null,
        agency: {
          id: agency?.id,
          name: agency?.name,
          email: agency?.email,
          logo_url: agency?.logo_url,
          is_active: agency?.is_active,
          tin_number: agency?.tin_number,
          dti_certificate_url: agency?.dti_certificate_url,
          business_permit_url: agency?.business_permit_url,
          sec_registration_url: agency?.sec_registration_url,
          documents_uploaded_at: agency?.documents_uploaded_at,
          documents_verified: agency?.documents_verified,
          documents_verified_at: agency?.documents_verified_at,
          documents_verified_by: agency?.documents_verified_by,
        },
      };
    });

    // Filter by status
    let filteredRecruiters = processedRecruiters;
    if (status !== 'all') {
      if (status === 'pending') {
        // Group all pending statuses together
        filteredRecruiters = processedRecruiters.filter(r =>
          r.status === 'pending' ||
          r.status === 'pending_documents' ||
          r.status === 'pending_admin_review' ||
          r.status === 'pending_authorization_head'
        );
      } else {
        filteredRecruiters = processedRecruiters.filter(r => r.status === status);
      }
    }

    // Calculate stats
    const stats = {
      total: processedRecruiters.length,
      pending: processedRecruiters.filter(r => r.status === 'pending' || r.status === 'pending_documents').length,
      pending_documents: processedRecruiters.filter(r => r.status === 'pending_documents').length,
      pending_admin_review: processedRecruiters.filter(r => r.status === 'pending_admin_review').length,
      pending_authorization_head: processedRecruiters.filter(r => r.status === 'pending_authorization_head').length,
      verified: processedRecruiters.filter(r => r.status === 'verified').length,
      rejected: processedRecruiters.filter(r => r.status === 'rejected').length,
      active: processedRecruiters.filter(r => r.is_active).length,
    };

    return NextResponse.json({
      recruiters: filteredRecruiters,
      stats,
    });

  } catch (error) {
    console.error('Recruiters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recruiters' },
      { status: 500 }
    );
  }
}

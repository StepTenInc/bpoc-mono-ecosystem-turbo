import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user is a recruiter in agency_recruiters table
    let { data: recruiter, error } = await supabaseAdmin
      .from('agency_recruiters')
      .select(`
        id,
        user_id,
        agency_id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        verification_status,
        can_post_jobs,
        can_manage_applications,
        can_invite_recruiters,
        can_manage_clients,
        agency:agencies (
          id,
          name,
          slug,
          logo_url,
          is_active,
          is_verified,
          document_expiry_date,
          business_permit_expiry
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    /**
     * Self-heal: If recruiter row exists but user_id changed (common when identities get re-linked),
     * recover by matching on verified auth email and re-attaching the recruiter record.
     *
     * This fixes cases where:
     * - The recruiter account exists in `agency_recruiters` but user_id got out of sync
     * - The recruiter row was marked inactive accidentally
     */
    if (error || !recruiter) {
      // Fetch auth user to get the verified email for this userId
      const { data: authUserRes, error: authUserErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = authUserRes?.user?.email?.toLowerCase() || null;

      if (!authUserErr && email) {
        // Try to find recruiter by email (even if inactive)
        const { data: recruiterByEmail } = await supabaseAdmin
          .from('agency_recruiters')
          .select(`
            id,
            user_id,
            agency_id,
            email,
            first_name,
            last_name,
            role,
            is_active,
            verification_status,
            can_post_jobs,
            can_manage_applications,
            can_invite_recruiters,
            can_manage_clients,
            agency:agencies (
              id,
              name,
              slug,
              logo_url,
              is_active,
              is_verified,
              document_expiry_date,
              business_permit_expiry
            )
          `)
          .ilike('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recruiterByEmail?.id) {
          // Re-attach to this userId and reactivate
          await supabaseAdmin
            .from('agency_recruiters')
            .update({ user_id: userId, is_active: true })
            .eq('id', recruiterByEmail.id);

          recruiter = {
            ...recruiterByEmail,
            user_id: userId,
            is_active: true,
          } as any;
          error = null;
        }
      }

      if (!recruiter) {
        return NextResponse.json({ 
          isRecruiter: false, 
          error: 'Recruiter account not found or inactive',
          hint: 'If this is an existing recruiter, ensure a row exists in agency_recruiters for this user email.'
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      isRecruiter: true,
      recruiter: {
        id: recruiter.id,
        userId: recruiter.user_id,
        agencyId: recruiter.agency_id,
        email: recruiter.email,
        firstName: recruiter.first_name,
        lastName: recruiter.last_name,
        role: recruiter.role,
        verificationStatus: recruiter.verification_status,
        permissions: {
          canPostJobs: recruiter.can_post_jobs,
          canManageApplications: recruiter.can_manage_applications,
          canInviteRecruiters: recruiter.can_invite_recruiters,
          canManageClients: recruiter.can_manage_clients,
        },
        agency: recruiter.agency,
      }
    });

  } catch (error) {
    console.error('Recruiter verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


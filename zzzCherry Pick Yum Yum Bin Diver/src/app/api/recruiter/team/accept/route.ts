import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/recruiter/team/accept
 * Accept a team invitation and auto-assign to agency
 * 
 * Body: {
 *   inviteToken: string
 *   userId: string (the new user's ID after signup)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { inviteToken, userId } = await request.json();

    if (!inviteToken || !userId) {
      return NextResponse.json(
        { error: 'inviteToken and userId are required' },
        { status: 400 }
      );
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invitations')
      .select('*, agencies(name)')
      .eq('invite_token', inviteToken)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabaseAdmin
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user is already in this agency
    const { data: existingRecruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id')
      .eq('user_id', userId)
      .eq('agency_id', invitation.agency_id)
      .single();

    if (existingRecruiter) {
      // Mark invitation as accepted
      await supabaseAdmin
        .from('team_invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return NextResponse.json({
        success: true,
        message: 'You are already a member of this agency',
        agencyId: invitation.agency_id,
        agencyName: (invitation.agencies as any)?.name,
      });
    }

    // Get user info
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !authUser?.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create agency_recruiters record
    const { data: newRecruiter, error: createError } = await supabaseAdmin
      .from('agency_recruiters')
      .insert({
        user_id: userId,
        agency_id: invitation.agency_id,
        email: invitation.invitee_email,
        first_name: invitation.invitee_name || authUser.user.user_metadata?.first_name || '',
        last_name: authUser.user.user_metadata?.last_name || '',
        role: invitation.role || 'recruiter',
        is_active: true,
        can_post_jobs: true,
        can_manage_applications: true,
        can_invite_recruiters: invitation.role === 'admin',
        can_manage_clients: invitation.role === 'admin',
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating recruiter record:', createError);
      return NextResponse.json(
        { error: 'Failed to join agency', details: createError.message },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await supabaseAdmin
      .from('team_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    const agencyName = (invitation.agencies as any)?.name || 'the agency';

    console.log('✅ Team invitation accepted:', {
      invitationId: invitation.id,
      userId,
      agencyId: invitation.agency_id,
      agencyName,
      role: invitation.role,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${agencyName}!`,
      agencyId: invitation.agency_id,
      agencyName: agencyName,
      recruiterId: newRecruiter.id,
      role: invitation.role,
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recruiter/team/accept
 * Validate an invite token (before signup)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteToken = searchParams.get('token');

    if (!inviteToken) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get the invitation
    const { data: invitation, error } = await supabaseAdmin
      .from('team_invitations')
      .select('id, invitee_email, invitee_name, role, expires_at, status, agencies(name)')
      .eq('invite_token', inviteToken)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.invitee_email,
        name: invitation.invitee_name,
        role: invitation.role,
        agencyName: (invitation.agencies as any)?.name,
        expiresAt: invitation.expires_at,
      },
    });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

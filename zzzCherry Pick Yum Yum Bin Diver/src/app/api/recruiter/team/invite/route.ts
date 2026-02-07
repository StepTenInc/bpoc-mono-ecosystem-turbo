import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendTeamInvitationEmail } from '@/lib/email';
import { logAdminAction } from '@/lib/admin-audit';

/**
 * POST /api/recruiter/team/invite
 * Send team invitation with agency_id for auto-assignment
 * 
 * Body: {
 *   email: string
 *   name?: string
 *   role?: 'admin' | 'recruiter' | 'viewer'
 *   message?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email, name, message } = await request.json();
    
    // Recruiters can ONLY invite other recruiters (not admins)
    // Admin role can only be assigned by platform admins
    const role = 'recruiter';

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get the recruiter's agency
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id, first_name, last_name, email, can_invite_recruiters, agencies(name)')
      .eq('user_id', user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: 'Recruiter profile not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to invite
    if (!recruiter.can_invite_recruiters) {
      return NextResponse.json(
        { error: 'You do not have permission to invite team members' },
        { status: 403 }
      );
    }

    // Check if email is already a recruiter in this agency
    const { data: existingRecruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, email')
      .eq('agency_id', recruiter.agency_id)
      .eq('email', email.toLowerCase())
      .single();

    if (existingRecruiter) {
      return NextResponse.json(
        { error: 'This person is already a member of your agency' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabaseAdmin
      .from('team_invitations')
      .select('id')
      .eq('agency_id', recruiter.agency_id)
      .eq('invitee_email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      );
    }

    // Generate secure invite token
    const inviteToken = `inv_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        agency_id: recruiter.agency_id,
        inviter_id: user.id,
        inviter_email: recruiter.email,
        inviter_name: `${recruiter.first_name} ${recruiter.last_name}`.trim(),
        invitee_email: email.toLowerCase(),
        invitee_name: name || null,
        role: role,
        message: message || null,
        invite_token: inviteToken,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation', details: inviteError.message },
        { status: 500 }
      );
    }

    const agencyName = (recruiter.agencies as any)?.name || 'the agency';

    // ALWAYS use production URL for invite links - NEVER localhost!
    // Hardcoded to ensure it works regardless of environment
    const inviteLink = `https://www.bpoc.io/recruiter/signup?invite=${inviteToken}`;

    console.log('📧 Generated invite link:', inviteLink);

    // Send email notification to invitee
    try {
      const inviterName = `${recruiter.first_name} ${recruiter.last_name}`.trim() || recruiter.email;

      await sendTeamInvitationEmail(
        email.toLowerCase(),
        inviterName,
        agencyName,
        inviteToken,
        inviteLink
      );

      console.log('✉️ Team invitation email sent to:', email);
    } catch (emailError) {
      console.error('⚠️ Failed to send team invitation email:', emailError);
      // Don't fail the request if email fails - invitation is still created
    }

    // Log audit trail
    await logAdminAction({
      adminId: user.id,
      adminName: `${recruiter.first_name} ${recruiter.last_name}`.trim() || recruiter.email,
      adminEmail: recruiter.email,
      action: 'team_invite',
      entityType: 'other',
      entityId: recruiter.agency_id,
      entityName: agencyName,
      details: {
        invitee_email: email.toLowerCase(),
        role: role,
      },
    });

    console.log('✅ Team invitation created:', {
      invitationId: invitation.id,
      agencyId: recruiter.agency_id,
      inviterEmail: recruiter.email,
      inviteeEmail: email,
      role: role,
    });

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation.id,
        email: email,
        role: role,
        agencyName: agencyName,
        inviteLink: inviteLink,
        expiresAt: invitation.expires_at,
      },
    });

  } catch (error) {
    console.error('Error sending team invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recruiter/team/invite
 * Get all pending invitations for the recruiter's agency
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json(
        { error: 'Recruiter profile not found' },
        { status: 404 }
      );
    }

    // Get pending invitations
    const { data: invitations, error } = await supabaseAdmin
      .from('team_invitations')
      .select('*')
      .eq('agency_id', recruiter.agency_id)
      .in('status', ['pending'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invitations: invitations?.map(inv => ({
        id: inv.id,
        email: inv.invitee_email,
        name: inv.invitee_name,
        role: inv.role,
        status: inv.status,
        inviterName: inv.inviter_name,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
      })) || [],
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recruiter/team/invite
 * Cancel a pending invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get the recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json(
        { error: 'Recruiter profile not found' },
        { status: 404 }
      );
    }

    // Cancel the invitation (only if it belongs to their agency)
    const { error } = await supabaseAdmin
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)
      .eq('agency_id', recruiter.agency_id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cancelling invitation:', error);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled',
    });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

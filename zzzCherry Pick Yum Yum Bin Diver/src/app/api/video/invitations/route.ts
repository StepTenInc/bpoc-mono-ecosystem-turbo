/**
 * Video Call Invitations API
 * GET - Get pending invitations for the current user
 * PATCH - Respond to an invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

// GET - Get pending invitations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuthToken(request);

    if (!userId) {
      // Return empty array instead of 401 for polling
      return NextResponse.json({
        success: true,
        invitations: [],
        count: 0,
      });
    }

    // Get all pending invitations for this user
    const { data: invitations, error } = await supabaseAdmin
      .from('video_call_invitations')
      .select(`
        *,
        video_call_rooms (
          id,
          daily_room_name,
          daily_room_url,
          host_user_id,
          status,
          created_at,
          job_id,
          application_id
        )
      `)
      .eq('invitee_user_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Filter out invitations where the room has ended
    const activeInvitations = (invitations || []).filter(inv => {
      const room = inv.video_call_rooms;
      // Only include if room exists and is not ended
      return room && room.status !== 'ended';
    });

    // Get host details for each invitation
    const invitationsWithHost = await Promise.all(
      activeInvitations.map(async (invitation) => {
        const room = invitation.video_call_rooms;
        if (!room) return invitation;

        let hostName = 'Recruiter';
        let hostAvatar: string | null = null;

        // Try to get host info from agency_recruiters (for recruiters)
        const { data: recruiterProfile } = await supabaseAdmin
          .from('agency_recruiters')
          .select('first_name, last_name, avatar_url')
          .eq('user_id', room.host_user_id)
          .single();

        if (recruiterProfile) {
          hostName = `${recruiterProfile.first_name || ''} ${recruiterProfile.last_name || ''}`.trim() || 'Recruiter';
          hostAvatar = recruiterProfile.avatar_url;
        } else {
          // Fallback: try auth.users metadata
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(room.host_user_id);
            if (authUser?.user) {
              const metadata = authUser.user.user_metadata || {};
              hostName = metadata.full_name 
                || metadata.name 
                || `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim()
                || 'Recruiter';
              hostAvatar = metadata.avatar_url || metadata.picture;
            }
          } catch (e) {
            console.log('Could not get auth user for host:', room.host_user_id);
          }
        }

        return {
          ...invitation,
          host: {
            id: room.host_user_id,
            name: hostName,
            avatar: hostAvatar,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      invitations: invitationsWithHost,
      count: invitationsWithHost.length,
    });

  } catch (error) {
    console.error('Failed to get invitations:', error);
    return NextResponse.json(
      { error: 'Failed to get invitations' },
      { status: 500 }
    );
  }
}

// PATCH - Respond to an invitation
export async function PATCH(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId, response, declineReason } = body;

    if (!invitationId || !response) {
      return NextResponse.json({ error: 'Invitation ID and response are required' }, { status: 400 });
    }

    if (!['accept', 'decline'].includes(response)) {
      return NextResponse.json({ error: 'Response must be "accept" or "decline"' }, { status: 400 });
    }

    // Get invitation
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('video_call_invitations')
      .select('*, video_call_rooms(*)')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify this invitation is for the current user
    if (invitation.invitee_user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if room is still active
    const room = invitation.video_call_rooms;
    if (!room || room.status === 'ended') {
      return NextResponse.json({ error: 'This call has ended' }, { status: 400 });
    }

    // Update invitation
    const updateData: Record<string, any> = {
      status: response === 'accept' ? 'accepted' : 'declined',
      responded_at: new Date().toISOString(),
    };

    if (response === 'decline' && declineReason) {
      updateData.decline_reason = declineReason;
    }

    const { data: updatedInvitation, error: updateError } = await supabaseAdmin
      .from('video_call_invitations')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // If accepted, return join URL
    if (response === 'accept') {
      return NextResponse.json({
        success: true,
        invitation: updatedInvitation,
        joinUrl: invitation.join_url,
        roomId: room.id,
      });
    }

    return NextResponse.json({
      success: true,
      invitation: updatedInvitation,
    });

  } catch (error) {
    console.error('Failed to respond to invitation:', error);
    return NextResponse.json(
      { error: 'Failed to respond to invitation' },
      { status: 500 }
    );
  }
}

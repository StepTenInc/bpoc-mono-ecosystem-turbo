import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { supabaseAdmin } from '@/lib/supabase/admin';

// CORS headers for ShoreAgents
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
};

// Validation helpers
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
    return UUID_REGEX.test(value);
}

function isValidURL(value: string): boolean {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { roomId, candidateId, recruiterName, recruiterUserId, jobTitle, participantJoinUrl, callType, callTitle } = body;

        console.log('[Notification API] Request received:', {
            roomId,
            candidateId,
            recruiterName,
            jobTitle,
            hasJoinUrl: !!participantJoinUrl
        });

        // Validate required fields
        if (!roomId || !candidateId || !participantJoinUrl) {
            console.error('[Notification API] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: roomId, candidateId, participantJoinUrl' },
                { status: 400, headers: corsHeaders }
            );
        }

        const hasRecruiterUserId = typeof recruiterUserId === 'string' && isValidUUID(recruiterUserId);

        // Validate UUID formats
        if (!isValidUUID(candidateId)) {
            console.error('[Notification API] Invalid candidateId format:', candidateId);
            return NextResponse.json(
                { error: 'Invalid candidateId format. Expected UUID' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (!isValidUUID(roomId)) {
            console.error('[Notification API] Invalid roomId format:', roomId);
            return NextResponse.json(
                { error: 'Invalid roomId format. Expected UUID' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (!isValidURL(participantJoinUrl)) {
            console.error('[Notification API] Invalid URL format:', participantJoinUrl);
            return NextResponse.json(
                { error: 'Invalid participantJoinUrl format. Expected valid URL' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Get candidate details
        console.log('[Notification API] Looking up candidate:', candidateId);

        const { data: candidate, error: candidateError } = await supabaseAdmin
            .from('candidates')
            .select('id, email, first_name, last_name')
            .eq('id', candidateId)
            .single();

        if (candidateError || !candidate) {
            console.error('[Notification API] Candidate not found:', candidateId);
            return NextResponse.json(
                { error: 'Candidate not found', id: candidateId },
                { status: 404, headers: corsHeaders }
            );
        }

        const userId = candidate.id;
        const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim();

        console.log('[Notification API] Candidate found:', {
            userId: userId,
            name: fullName,
            email: candidate.email
        });

        // Check if room exists
        let { data: roomRecord } = await supabaseAdmin
            .from('video_call_rooms')
            .select('id, call_type, call_title, daily_room_name')
            .eq('id', roomId)
            .single();

        // Create room if it doesn't exist
        if (!roomRecord) {
            console.log('[Notification API] Room does not exist, creating room record...');

            const urlParts = participantJoinUrl.split('/');
            let roomNameFromUrl = urlParts[urlParts.length - 1]?.split('?')[0];

            if (!roomNameFromUrl || roomNameFromUrl.length < 3) {
                roomNameFromUrl = `shoreagents-${roomId.replace(/-/g, '').substring(0, 16)}`;
            }

            const dailyRoomName = roomNameFromUrl;
            const baseUrl = participantJoinUrl.split('?')[0] || '';
            const resolvedCallType = (typeof callType === 'string' && callType.length > 0)
                ? callType
                : 'recruiter_prescreen';
            const resolvedCallTitle = (typeof callTitle === 'string' && callTitle.length > 0)
                ? callTitle
                : (jobTitle ? `Pre-Screen: ${jobTitle}` : 'Pre-Screen Interview');

            try {
                const { data: newRoom, error: roomCreateError } = await supabaseAdmin
                    .from('video_call_rooms')
                    .insert({
                        id: roomId,
                        daily_room_name: dailyRoomName,
                        daily_room_url: baseUrl,
                        host_user_id: hasRecruiterUserId ? recruiterUserId : userId,
                        participant_user_id: userId,
                        status: 'created',
                        call_type: resolvedCallType,
                        call_title: resolvedCallTitle,
                    })
                    .select()
                    .single();

                if (roomCreateError) throw roomCreateError;
                roomRecord = newRoom;
                console.log('[Notification API] Room created:', roomRecord.id);
            } catch (roomCreateError: any) {
                console.error('[Notification API] Room creation error:', roomCreateError);

                // Try to find by ID again
                const { data: existingRoom } = await supabaseAdmin
                    .from('video_call_rooms')
                    .select('id, call_type, call_title, daily_room_name')
                    .eq('id', roomId)
                    .single();

                if (!existingRoom) {
                    const { data: roomByName } = await supabaseAdmin
                        .from('video_call_rooms')
                        .select('id, call_type, call_title, daily_room_name')
                        .eq('daily_room_name', dailyRoomName)
                        .single();
                    roomRecord = roomByName;
                } else {
                    roomRecord = existingRoom;
                }

                if (!roomRecord) {
                    throw new Error(`Failed to create room record: ${roomCreateError?.message || 'Unknown error'}`);
                }
            }
        }

        const resolvedCallType =
            roomRecord?.call_type ||
            (typeof callType === 'string' && callType.length > 0 ? callType : 'recruiter_prescreen');
        const resolvedCallTitle =
            roomRecord?.call_title ||
            (typeof callTitle === 'string' && callTitle.length > 0
                ? callTitle
                : (jobTitle ? `Pre-Screen: ${jobTitle}` : 'Pre-Screen Interview'));

        // Create invitation record
        const { data: invitation, error: invitationError } = await supabaseAdmin
            .from('video_call_invitations')
            .insert({
                room_id: roomRecord.id,
                invitee_user_id: userId,
                invitee_email: candidate.email || undefined,
                inviter_user_id: hasRecruiterUserId ? recruiterUserId : undefined,
                inviter_name: recruiterName || 'ShoreAgents Recruiter',
                call_type: resolvedCallType,
                call_title: resolvedCallTitle,
                join_url: participantJoinUrl,
                status: 'pending',
                notification_sent: true,
                notification_sent_at: new Date().toISOString(),
                notification_type: 'both',
            })
            .select()
            .single();

        if (invitationError) {
            console.error('[Notification API] Invitation error:', invitationError);
            throw invitationError;
        }

        console.log('[Notification API] Invitation created:', {
            invitationId: invitation.id,
            userId: userId,
            status: invitation.status
        });

        // Send email notification
        try {
            await sendEmail({
                to: candidate.email || '',
                subject: `${recruiterName || 'ShoreAgents Recruiter'} wants to video call you`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Incoming Video Call</h2>
            <p><strong>${recruiterName || 'ShoreAgents Recruiter'}</strong> wants to have a quick video call with you${jobTitle ? ` about the <strong>${jobTitle}</strong> position` : ''}.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 15px 0;">Click the button below to join the call:</p>
              <a href="${participantJoinUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Join Video Call
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">This link is valid for 24 hours.</p>
          </div>
        `,
            });
        } catch (emailError) {
            console.error('[Notification API] Email send failed:', emailError);
        }

        console.log('[Notification API] Realtime notification skipped (table not available)');

        return NextResponse.json({
            success: true,
            invitation: {
                id: invitation.id,
                status: invitation.status,
                notificationSent: invitation.notification_sent,
            },
            message: 'Candidate notified successfully',
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('[Notification API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to notify candidate' },
            { status: 500, headers: corsHeaders }
        );
    }
}

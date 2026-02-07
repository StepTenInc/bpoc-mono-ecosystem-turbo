import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/v1/video/invitations/:id/decline
 * Mark invitation as declined
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json().catch(() => ({}));
        const { reason } = body;

        const { data: invitation, error } = await supabaseAdmin
            .from('video_call_invitations')
            .update({
                status: 'declined',
                responded_at: new Date().toISOString(),
                decline_reason: reason || 'Declined by candidate',
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('[Decline Invitation] Error:', error);
            return NextResponse.json(
                { error: 'Failed to decline invitation' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, invitation });
    } catch (error) {
        console.error('[Decline Invitation] Error:', error);
        return NextResponse.json(
            { error: 'Failed to decline invitation' },
            { status: 500 }
        );
    }
}

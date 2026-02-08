import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/v1/video/invitations/:id/accept
 * Mark invitation as accepted
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const { data: invitation, error } = await supabaseAdmin
            .from('video_call_invitations')
            .update({
                status: 'accepted',
                responded_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Accept Invitation] Error:', error);
            return NextResponse.json(
                { error: 'Failed to accept invitation' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, invitation });
    } catch (error) {
        console.error('[Accept Invitation] Error:', error);
        return NextResponse.json(
            { error: 'Failed to accept invitation' },
            { status: 500 }
        );
    }
}

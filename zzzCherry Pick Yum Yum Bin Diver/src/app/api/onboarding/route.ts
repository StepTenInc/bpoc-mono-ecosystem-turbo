import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/onboarding?candidateId=X
 * Get onboarding status and data
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const candidateId = searchParams.get('candidateId');
        const applicationId = searchParams.get('applicationId');

        if (!candidateId && !applicationId) {
            return NextResponse.json({ error: 'candidateId or applicationId required' }, { status: 400 });
        }

        // Authorization check: only allow access to own data or if user is staff
        // For candidates, verify they're accessing their own onboarding
        const userId = session.user.id;
        const isAccessingOwnData = candidateId === userId;

        // Check if user is a recruiter/admin (they can access candidate onboarding)
        const { data: recruiter } = await supabaseAdmin
            .from('agency_recruiters')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        const { data: admin } = await supabaseAdmin
            .from('bpoc_users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        const isStaff = !!recruiter || !!admin;

        if (!isAccessingOwnData && !isStaff) {
            return NextResponse.json({ error: 'Access denied - you can only view your own onboarding data' }, { status: 403 });
        }

        // Use admin client to bypass RLS (auth is already verified above)
        let query = supabaseAdmin.from('candidate_onboarding').select('*');

        if (candidateId) {
            query = query.eq('candidate_id', candidateId);
        } else if (applicationId) {
            query = query.eq('job_application_id', applicationId);
        }

        const { data: onboarding, error } = await query.single();

        if (error) {
            console.error('[/api/onboarding] Database error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                candidateId,
                applicationId
            });
            if (error.code === 'PGRST116') {
                // No rows returned - record doesn't exist
                return NextResponse.json({
                    onboarding: null,
                    message: 'No onboarding record found for this candidate'
                }, { status: 200 });
            }
            return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
        }

        return NextResponse.json({ onboarding });

    } catch (error: any) {
        console.error('Get onboarding error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/onboarding/pending
 * List all pending onboarding for review
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all incomplete onboardings
        const { data: onboardings, error } = await supabase
            .from('candidate_onboarding')
            .select(`
        *,
        candidates!candidate_onboarding_candidate_id_fkey(first_name, last_name, email),
        job_applications!candidate_onboarding_job_application_id_fkey(id)
      `)
            .eq('is_complete', false)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ onboardings });

    } catch (error: any) {
        console.error('Get pending onboarding error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

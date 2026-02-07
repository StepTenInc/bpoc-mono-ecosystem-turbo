import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper function for all 8 steps
async function updateCompletionPercent(supabase: any, onboardingId: string) {
    const { data } = await supabase
        .from('candidate_onboarding')
        .select('*')
        .eq('id', onboardingId)
        .single();

    if (!data) return;

    const sections = [
        'personal_info_status',
        'gov_id_status',
        'resume_status',
        'education_status',
        'medical_status',
        'data_privacy_status',
        'signature_status',
        'emergency_contact_status'
    ];

    let approved = 0;
    sections.forEach(section => {
        if (data[section] === 'SUBMITTED' || data[section] === 'APPROVED') {
            approved++;
        }
    });

    const percent = Math.round((approved / 8) * 100);

    await supabase
        .from('candidate_onboarding')
        .update({ completion_percent: percent })
        .eq('id', onboardingId);
}

/**
 * POST /api/onboarding/resume - Step 2
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { onboardingId, resumeUrl } = await request.json();

        if (!resumeUrl) {
            return NextResponse.json({ error: 'Resume URL required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('candidate_onboarding')
            .update({
                resume_url: resumeUrl,
                resume_status: 'SUBMITTED'
            })
            .eq('id', onboardingId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        await updateCompletionPercent(supabaseAdmin, onboardingId);

        return NextResponse.json({ success: true, message: 'Resume submitted', status: 'SUBMITTED' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

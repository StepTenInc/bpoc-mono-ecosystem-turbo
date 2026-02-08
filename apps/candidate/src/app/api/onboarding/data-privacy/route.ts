import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';

export const dynamic = 'force-dynamic';

async function updateCompletionPercent(supabase: any, onboardingId: string) {
    const { data } = await supabase.from('candidate_onboarding').select('*').eq('id', onboardingId).single();
    if (!data) return;
    const sections = ['personal_info_status', 'gov_id_status', 'resume_status', 'education_status', 'medical_status', 'data_privacy_status', 'signature_status', 'emergency_contact_status'];
    let approved = 0;
    sections.forEach(section => { if (data[section] === 'SUBMITTED' || data[section] === 'APPROVED') approved++; });
    await supabase.from('candidate_onboarding').update({ completion_percent: Math.round((approved / 8) * 100) }).eq('id', onboardingId);
}

// Step 6: Data Privacy
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { onboardingId, acceptsDataPrivacy } = await request.json();
        if (!acceptsDataPrivacy) return NextResponse.json({ error: 'Data privacy consent required' }, { status: 400 });

        const { data: onboarding, error } = await supabaseAdmin.from('candidate_onboarding').update({
            accepts_data_privacy: true,
            data_privacy_signed_at: new Date().toISOString(),
            data_privacy_status: 'SUBMITTED'
        }).eq('id', onboardingId).select('job_application_id').single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        await updateCompletionPercent(supabaseAdmin, onboardingId);

        // Log timeline activity
        if (onboarding?.job_application_id) {
            try {
                await logApplicationActivity(onboarding.job_application_id, {
                    action_type: 'onboarding_section_completed',
                    performed_by_type: 'candidate',
                    performed_by_id: session.user.id,
                    description: 'Completed onboarding section: Data Privacy Consent',
                    metadata: { section: 'data_privacy', onboarding_id: onboardingId, timestamp: new Date().toISOString() }
                });
            } catch (logError) {
                console.error('Failed to log onboarding section:', logError);
            }
        }

        return NextResponse.json({ success: true, message: 'Data privacy consent submitted', status: 'SUBMITTED' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

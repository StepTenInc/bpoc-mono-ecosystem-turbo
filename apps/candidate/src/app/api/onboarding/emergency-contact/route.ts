import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function updateCompletionPercent(supabase: any, onboardingId: string) {
    const { data } = await supabase.from('candidate_onboarding').select('*').eq('id', onboardingId).single();
    if (!data) return;
    const sections = ['personal_info_status', 'gov_id_status', 'resume_status', 'education_status', 'medical_status', 'data_privacy_status', 'signature_status', 'emergency_contact_status'];
    let approved = 0;
    sections.forEach(section => { if (data[section] === 'SUBMITTED' || data[section] === 'APPROVED') approved++; });
    await supabase.from('candidate_onboarding').update({ completion_percent: Math.round((approved / 8) * 100) }).eq('id', onboardingId);
}

// Step 8: Emergency Contact
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { onboardingId, emergencyContactName, emergencyContactRelationship, emergencyContactPhone } = await request.json();

        if (!emergencyContactName || !emergencyContactRelationship || !emergencyContactPhone) {
            return NextResponse.json({ error: 'All emergency contact fields required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from('candidate_onboarding').update({
            emergency_contact_name: emergencyContactName,
            emergency_contact_relationship: emergencyContactRelationship,
            emergency_contact_phone: emergencyContactPhone,
            emergency_contact_status: 'SUBMITTED'
        }).eq('id', onboardingId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        await updateCompletionPercent(supabaseAdmin, onboardingId);
        return NextResponse.json({ success: true, message: 'Emergency contact submitted', status: 'SUBMITTED' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

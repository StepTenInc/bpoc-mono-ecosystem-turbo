import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/onboarding/[id]/[section]
 * Admin approve/reject onboarding sections
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; section: string } }
) {
    try {
        const supabase = await createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin/recruiter role (using bpoc_users table)
        const { data: admin } = await supabase
            .from('bpoc_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        const { data: recruiter } = await supabase
            .from('agency_recruiters')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (!admin && !recruiter) {
            return NextResponse.json({ error: 'Unauthorized - Admin/Recruiter only' }, { status: 403 });
        }

        const { id, section } = params;
        const { status, feedback } = await request.json();

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        if (status === 'REJECTED' && !feedback) {
            return NextResponse.json({ error: 'Feedback required for rejection' }, { status: 400 });
        }

        const validSections = [
            'personal_info', 'gov_id', 'resume', 'education',
            'medical', 'data_privacy', 'signature', 'emergency_contact'
        ];

        if (!validSections.includes(section)) {
            return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
        }

        const statusField = `${section}_status`;
        const feedbackField = `${section}_feedback`;

        const updateData: any = { [statusField]: status };
        if (feedback) {
            updateData[feedbackField] = feedback;
        }

        const { error } = await supabase
            .from('candidate_onboarding')
            .update(updateData)
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Recalculate completion
        await updateCompletionAndCheck(supabase, id);

        return NextResponse.json({
            success: true,
            message: `Section ${status.toLowerCase()}`
        });

    } catch (error: any) {
        console.error('Admin review error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function updateCompletionAndCheck(supabase: any, onboardingId: string) {
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
    let allApproved = true;

    sections.forEach(section => {
        if (data[section] === 'APPROVED') {
            approved++;
        } else {
            allApproved = false;
        }
    });

    const percent = Math.round((approved / 8) * 100);
    const isComplete = allApproved && data.contract_signed;

    await supabase
        .from('candidate_onboarding')
        .update({
            completion_percent: percent,
            is_complete: isComplete
        })
        .eq('id', onboardingId);
}

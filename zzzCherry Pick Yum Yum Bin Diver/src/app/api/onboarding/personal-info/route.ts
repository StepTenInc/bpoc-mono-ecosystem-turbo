import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/personal-info
 * Submit Step 1: Personal Information
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            onboardingId,
            firstName,
            middleName,
            lastName,
            gender,
            civilStatus,
            dateOfBirth,
            contactNo,
            email,
            address
        } = body;

        // Validate required fields
        if (!firstName || !lastName || !dateOfBirth || !contactNo || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate age (18+)
        const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
        if (age < 18) {
            return NextResponse.json({ error: 'Must be 18 years or older' }, { status: 400 });
        }

        // Update onboarding record (use admin client to bypass RLS)
        const { data, error } = await supabaseAdmin
            .from('candidate_onboarding')
            .update({
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                gender,
                civil_status: civilStatus,
                date_of_birth: dateOfBirth,
                contact_no: contactNo,
                email,
                address,
                personal_info_status: 'SUBMITTED'
            })
            .eq('id', onboardingId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Recalculate completion percentage
        await updateCompletionPercent(supabaseAdmin, onboardingId);

        // Log timeline activity for onboarding section completion
        if (data && data.job_application_id) {
            try {
                await logApplicationActivity(data.job_application_id, {
                    action_type: 'onboarding_section_completed',
                    performed_by_type: 'candidate',
                    performed_by_id: session.user.id,
                    description: 'Completed onboarding section: Personal Information',
                    metadata: {
                        section: 'personal_info',
                        onboarding_id: onboardingId,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (logError) {
                console.error('Failed to log onboarding section:', logError);
                // Don't fail the request if logging fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Personal information saved',
            status: 'SUBMITTED'
        });

    } catch (error: any) {
        console.error('Personal info error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/gov-ids
 * Submit Step 3: Government IDs (SSS, TIN, PhilHealth, Pag-IBIG)
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
            sss,
            tin,
            philhealthNo,
            pagibigNo,
            sssDocUrl,
            tinDocUrl,
            philhealthDocUrl,
            pagibigDocUrl,
            validIdUrl
        } = body;

        // Validate required fields
        if (!sss || !tin || !philhealthNo || !pagibigNo) {
            return NextResponse.json({ error: 'All government IDs required' }, { status: 400 });
        }

        if (!sssDocUrl || !tinDocUrl || !philhealthDocUrl || !pagibigDocUrl || !validIdUrl) {
            return NextResponse.json({ error: 'All documents must be uploaded' }, { status: 400 });
        }

        // Validate formats (Philippines)
        const sssRegex = /^\d{2}-\d{7}-\d{1}$/;
        const tinRegex = /^\d{3}-\d{3}-\d{3}-\d{3}$/;
        const philhealthRegex = /^\d{2}-\d{9}-\d{1}$/;
        const pagibigRegex = /^\d{4}-\d{4}-\d{4}$/;

        if (!sssRegex.test(sss)) {
            return NextResponse.json({ error: 'Invalid SSS format (XX-XXXXXXX-X)' }, { status: 400 });
        }
        if (!tinRegex.test(tin)) {
            return NextResponse.json({ error: 'Invalid TIN format (XXX-XXX-XXX-XXX)' }, { status: 400 });
        }
        if (!philhealthRegex.test(philhealthNo)) {
            return NextResponse.json({ error: 'Invalid PhilHealth format (XX-XXXXXXXXX-X)' }, { status: 400 });
        }
        if (!pagibigRegex.test(pagibigNo)) {
            return NextResponse.json({ error: 'Invalid Pag-IBIG format (XXXX-XXXX-XXXX)' }, { status: 400 });
        }

        // Update onboarding record (use admin client to bypass RLS)
        const { data: onboarding, error } = await supabaseAdmin
            .from('candidate_onboarding')
            .update({
                sss,
                tin,
                philhealth_no: philhealthNo,
                pagibig_no: pagibigNo,
                sss_doc_url: sssDocUrl,
                tin_doc_url: tinDocUrl,
                philhealth_doc_url: philhealthDocUrl,
                pagibig_doc_url: pagibigDocUrl,
                valid_id_url: validIdUrl,
                gov_id_status: 'SUBMITTED'
            })
            .eq('id', onboardingId)
            .select('job_application_id')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update completion
        await updateCompletionPercent(supabaseAdmin, onboardingId);

        // Log timeline activity for onboarding section completion
        if (onboarding && onboarding.job_application_id) {
            try {
                await logApplicationActivity(onboarding.job_application_id, {
                    action_type: 'onboarding_section_completed',
                    performed_by_type: 'candidate',
                    performed_by_id: session.user.id,
                    description: 'Completed onboarding section: Government IDs',
                    metadata: {
                        section: 'gov_ids',
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
            message: 'Government IDs submitted successfully',
            status: 'SUBMITTED'
        });

    } catch (error: any) {
        console.error('Gov IDs error:', error);
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

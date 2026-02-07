import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications/service';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/initialize
 * Create new onboarding record after job acceptance
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            candidateId,
            jobApplicationId,
            position,
            contactType,
            assignedClient,
            startDate,
            workSchedule,
            basicSalary,
            deMinimis,
            totalMonthlyGross,
            hmoOffer,
            paidLeave,
            probationaryPeriod
        } = body;

        // Validate required fields
        if (!candidateId || !jobApplicationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch candidate data for pre-filling
        const { data: candidate } = await supabase
            .from('candidates')
            .select('first_name, last_name, email, birthday, gender')
            .eq('id', candidateId)
            .single();

        const { data: profile } = await supabase
            .from('candidate_profiles')
            .select('phone, bio')
            .eq('candidate_id', candidateId)
            .single();

        const { data: resume } = await supabase
            .from('candidate_resumes')
            .select('resume_url')
            .eq('candidate_id', candidateId)
            .eq('is_primary', true)
            .single();

        // Create onboarding record
        const { data: onboarding, error } = await supabase
            .from('candidate_onboarding')
            .insert({
                candidate_id: candidateId,
                job_application_id: jobApplicationId,

                // Pre-fill from candidate data
                first_name: candidate?.first_name || '',
                last_name: candidate?.last_name || '',
                email: candidate?.email || '',
                date_of_birth: candidate?.birthday || null,
                gender: candidate?.gender || null,
                contact_no: profile?.phone || '',
                resume_url: resume?.resume_url || null,

                // Job details
                position,
                contact_type: contactType,
                assigned_client: assignedClient,
                start_date: startDate,
                work_schedule: workSchedule,
                basic_salary: basicSalary,
                de_minimis: deMinimis,
                total_monthly_gross: totalMonthlyGross,
                hmo_offer: hmoOffer,
                paid_leave: paidLeave,
                probationary_period: probationaryPeriod,

                // If resume exists, mark as approved
                resume_status: resume?.resume_url ? 'APPROVED' : 'PENDING',
                completion_percent: resume?.resume_url ? 12 : 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating onboarding:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Send notification to candidate
        await createNotification({
            recipientId: candidateId,
            recipientType: 'candidate',
            type: 'onboarding_started',
            title: 'Welcome! Onboarding Started',
            message: `Your onboarding for ${position || 'your new role'} has been initiated. Please complete all required tasks.`,
            actionUrl: `/candidate/onboarding`,
            relatedId: onboarding.id,
            relatedType: 'onboarding',
            isUrgent: true
        });

        // TODO: Send email notification
        // await sendOnboardingEmail(candidate?.email, onboarding.id);

        return NextResponse.json({
            success: true,
            onboarding,
            message: 'Onboarding initialized successfully'
        });

    } catch (error: any) {
        console.error('Initialize onboarding error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

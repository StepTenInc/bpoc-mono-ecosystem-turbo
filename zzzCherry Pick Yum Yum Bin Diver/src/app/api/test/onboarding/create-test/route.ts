import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/onboarding/create-test
 * Create a test onboarding record for the currently logged-in candidate
 */
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 });
        }

        // Get candidate data
        const { data: candidate, error: candidateError } = await supabaseAdmin
            .from('candidates')
            .select('*')
            .eq('id', user.id)
            .single();

        // Get candidate profile for additional info
        const { data: profile } = await supabaseAdmin
            .from('candidate_profiles')
            .select('*')
            .eq('candidate_id', user.id)
            .single();

        // Get education data
        const { data: education } = await supabaseAdmin
            .from('candidate_education')
            .select('*')
            .eq('candidate_id', user.id)
            .order('graduation_year', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (candidateError || !candidate) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
        }

        // Get a valid job ID for the application
        const { data: jobData, error: jobError } = await supabaseAdmin
            .from('jobs')
            .select('id')
            .limit(1)
            .single();

        if (jobError || !jobData) {
            return NextResponse.json({ error: 'No active jobs found in database to link to application' }, { status: 404 });
        }

        // Check for existing application
        let testApplication;
        const { data: existingApp } = await supabaseAdmin
            .from('job_applications')
            .select('*')
            .eq('candidate_id', candidate.id)
            .eq('job_id', jobData.id)
            .single();

        if (existingApp) {
            testApplication = existingApp;

            // If reusing application, Ensure we CLEAN UP any existing onboarding for it FIRST
            // This is critical to allow "Retrying" the test wizard
            await supabaseAdmin
                .from('candidate_onboarding')
                .delete()
                .eq('job_application_id', existingApp.id);

        } else {
            // Create a test job application
            const { data: newApp, error: appError } = await supabaseAdmin
                .from('job_applications')
                .insert({
                    candidate_id: candidate.id,
                    job_id: jobData.id,
                    status: 'submitted' // CONFIRMED valid status
                })
                .select()
                .single();

            if (appError) {
                console.error('Application creation error:', appError);
                return NextResponse.json({ error: appError.message }, { status: 500 });
            }
            testApplication = newApp;
        }

        // Prepare onboarding data - use existing data where available
        const hasPersonalInfo = candidate.first_name && candidate.last_name && candidate.email &&
                                (candidate.birthday || profile?.phone);
        const hasResume = !!candidate.resume_url;
        const hasEducation = !!education;

        // Calculate initial completion
        let completedSteps = 0;
        if (hasPersonalInfo) completedSteps++;
        if (hasResume) completedSteps++;
        if (hasEducation) completedSteps++;

        // Create test onboarding record with existing data pre-populated
        const { data: onboarding, error: onboardingError } = await supabaseAdmin
            .from('candidate_onboarding')
            .insert({
                candidate_id: candidate.id,
                job_application_id: testApplication.id,
                // Pre-populate personal info from existing data
                first_name: candidate.first_name || 'Test',
                last_name: candidate.last_name || 'User',
                email: candidate.email,
                date_of_birth: candidate.birthday || '1990-01-01',
                contact_no: profile?.phone || '09123456789',
                gender: profile?.gender || null,
                // Address might be in bio or we can leave it for them to fill
                address: null,
                civil_status: null, // Not in existing data
                // Pre-populate resume if exists
                resume_url: candidate.resume_url || null,
                // Pre-populate education if exists
                education_level: education?.degree || null,
                education_doc_url: null, // They'll need to upload document
                // Job details
                position: 'Test Position - Customer Service Representative',
                contact_type: 'FULL_TIME',
                assigned_client: 'Test Client Corp',
                start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                work_schedule: 'Monday-Friday, 9AM-6PM PST',
                basic_salary: 25000,
                de_minimis: 3000,
                total_monthly_gross: 28000,
                hmo_offer: 'HMO Plan A - Coverage for employee',
                paid_leave: '15 days vacation leave, 10 days sick leave',
                probationary_period: '6 months',
                // Set statuses based on existing data
                personal_info_status: hasPersonalInfo ? 'SUBMITTED' : 'PENDING',
                resume_status: hasResume ? 'SUBMITTED' : 'PENDING',
                education_status: hasEducation ? 'SUBMITTED' : 'PENDING',
                // These are always new for onboarding
                gov_id_status: 'PENDING',
                medical_status: 'PENDING',
                data_privacy_status: 'PENDING',
                signature_status: 'PENDING',
                emergency_contact_status: 'PENDING',
                // Calculate completion
                completion_percent: Math.round((completedSteps / 8) * 100),
                is_complete: false
            })
            .select()
            .single();

        if (onboardingError) {
            console.error('Onboarding creation error:', onboardingError);
            return NextResponse.json({ error: onboardingError.message }, { status: 500 });
        }

        // Build informative message
        const prePopulatedSteps = [];
        if (hasPersonalInfo) prePopulatedSteps.push('Personal Info');
        if (hasResume) prePopulatedSteps.push('Resume');
        if (hasEducation) prePopulatedSteps.push('Education');

        let message = 'Test onboarding created successfully!';
        if (prePopulatedSteps.length > 0) {
            message += ` Pre-populated: ${prePopulatedSteps.join(', ')}. `;
        }
        message += ` ${completedSteps} of 8 steps already complete.`;

        return NextResponse.json({
            success: true,
            onboardingId: onboarding.id,
            candidateId: candidate.id,
            candidateName: `${candidate.first_name} ${candidate.last_name}`,
            completedSteps,
            prePopulatedSteps,
            message
        });

    } catch (error: any) {
        console.error('Create test onboarding error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

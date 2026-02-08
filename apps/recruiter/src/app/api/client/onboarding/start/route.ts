import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// POST - Start onboarding for a hired candidate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { application_id, token } = body;

    if (!application_id || !token) {
      return NextResponse.json(
        { error: 'Missing application_id or token' },
        { status: 400 }
      );
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const jobId = tokenData.job_id;

    // Get application and candidate
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select('id, candidate_id, status')
      .eq('id', application_id)
      .eq('job_id', job_id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if already has onboarding
    const { data: existingOnboarding } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('id')
      .eq('job_application_id', application_id)
      .single();

    if (existingOnboarding) {
      return NextResponse.json({ 
        onboardingId: existingOnboarding.id,
        message: 'Onboarding already started' 
      });
    }

    // Get candidate info
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('first_name, last_name, email')
      .eq('id', application.candidate_id)
      .single();

    // Create onboarding record
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('candidate_onboarding')
      .insert({
        candidate_id: application.candidate_id,
        job_application_id: application_id,
        first_name: candidate?.first_name || '',
        last_name: candidate?.last_name || '',
        email: candidate?.email || '',
        personal_info_status: 'pending',
        gov_id_status: 'pending',
        education_status: 'pending',
        medical_status: 'pending',
        data_privacy_status: 'pending',
        resume_status: 'pending',
        signature_status: 'pending',
        emergency_contact_status: 'pending',
        completion_percent: 0,
        is_complete: false,
      })
      .select()
      .single();

    if (onboardingError) {
      console.error('Error creating onboarding:', onboardingError);
      return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
    }

    // Update application status
    await supabaseAdmin
      .from('job_applications')
      .update({ status: 'hired' })
      .eq('id', application_id);

    return NextResponse.json({ 
      onboardingId: onboarding.id,
      message: 'Onboarding started successfully' 
    });
  } catch (error) {
    console.error('Error starting onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

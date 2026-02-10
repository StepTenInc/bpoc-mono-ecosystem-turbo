import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// POST - Confirm that the candidate has started employment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: application_id } = await context.params;
    const body = await request.json();
    const { token, notes } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const jobId = tokenData.jobId;

    // Verify application belongs to this job
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select('id, job_id, status')
      .eq('id', application_id)
      .eq('job_id', jobId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get onboarding record
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('id, employment_started')
      .eq('job_application_id', application_id)
      .single();

    if (onboardingError || !onboarding) {
      return NextResponse.json({ 
        error: 'No onboarding record found. Start onboarding first.' 
      }, { status: 404 });
    }

    if (onboarding.employment_started) {
      return NextResponse.json({ 
        error: 'Employment already confirmed as started' 
      }, { status: 400 });
    }

    // Update onboarding record
    const { error: updateOnboardingError } = await supabaseAdmin
      .from('candidate_onboarding')
      .update({
        employment_started: true,
        employment_start_date: new Date().toISOString(),
      })
      .eq('id', onboarding.id);

    if (updateOnboardingError) {
      console.error('Error updating onboarding:', updateOnboardingError);
      return NextResponse.json({ error: 'Failed to confirm start' }, { status: 500 });
    }

    // Update application status to employed/active
    await supabaseAdmin
      .from('job_applications')
      .update({ 
        status: 'employed',
        first_day_notes: notes || 'Employment confirmed by client',
      })
      .eq('id', application_id);

    return NextResponse.json({ 
      success: true,
      message: 'Employment start confirmed successfully',
      start_date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error confirming employment start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

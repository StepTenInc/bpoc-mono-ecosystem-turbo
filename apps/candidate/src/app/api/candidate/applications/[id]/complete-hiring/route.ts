import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/candidate/applications/[id]/complete-hiring
 * Called after contract is signed to finalize hiring status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const { id: applicationId } = await params;

    console.log('[complete-hiring] Completing hiring for application:', applicationId);

    // Get application with job and candidate details
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id, 
        candidate_id, 
        status,
        job:jobs (
          id,
          title,
          agency_client:agency_clients (
            company:companies (
              name
            )
          )
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify application is in offer_accepted status
    if (application.status !== 'offer_accepted') {
      return NextResponse.json({ 
        error: 'Application must be in offer_accepted status to complete hiring' 
      }, { status: 400 });
    }

    // Update to hired
    const { error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        status: 'hired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('[complete-hiring] Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to complete hiring' }, { status: 500 });
    }

    // Check if candidate_onboarding record already exists
    const { data: existingOnboarding } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('id')
      .eq('job_application_id', applicationId)
      .single();

    if (!existingOnboarding) {
      // Fetch candidate details for pre-filling
      const { data: candidate } = await supabaseAdmin
        .from('candidates')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      const { data: profile } = await supabaseAdmin
        .from('candidate_profiles')
        .select('phone, birthday, gender')
        .eq('candidate_id', user.id)
        .single();

      const { data: resume } = await supabaseAdmin
        .from('candidate_resumes')
        .select('resume_url')
        .eq('candidate_id', user.id)
        .eq('is_primary', true)
        .single();

      // Get job and company info
      const job = application.job as any;
      const position = job?.title || 'New Position';
      const company = job?.agency_client?.company?.name || 'Company';

      // Get offer details
      const { data: offer } = await supabaseAdmin
        .from('job_offers')
        .select('salary_offered, start_date, currency')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Create candidate_onboarding record
      const { data: onboarding, error: onboardingError } = await supabaseAdmin
        .from('candidate_onboarding')
        .insert({
          candidate_id: user.id,
          job_application_id: applicationId,
          
          // Pre-fill from candidate data
          first_name: candidate?.first_name || '',
          last_name: candidate?.last_name || '',
          email: candidate?.email || '',
          date_of_birth: profile?.birthday || '1990-01-01', // Default if not set, user will update
          gender: profile?.gender || null,
          contact_no: profile?.phone || '',
          resume_url: resume?.resume_url || null,
          
          // Job details
          position,
          assigned_client: company,
          start_date: offer?.start_date,
          basic_salary: offer?.salary_offered,
          
          // If resume exists, mark as approved
          resume_status: resume?.resume_url ? 'approved' : 'pending',
          personal_info_status: (candidate?.first_name && candidate?.last_name && candidate?.email) ? 'approved' : 'pending',
          completion_percent: 0,
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (onboardingError) {
        console.error('[complete-hiring] Error creating onboarding:', onboardingError);
        // Don't fail - hiring is already complete
      } else {
        console.log('[complete-hiring] Created candidate_onboarding record:', onboarding.id);
      }
    } else {
      // Update existing onboarding record
      await supabaseAdmin
        .from('candidate_onboarding')
        .update({
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOnboarding.id);
      
      console.log('[complete-hiring] Updated existing onboarding record:', existingOnboarding.id);
    }

    console.log('[complete-hiring] Success! Application now hired');

    return NextResponse.json({
      success: true,
      message: 'Hiring completed! Welcome aboard!',
    });

  } catch (error: any) {
    console.error('[complete-hiring] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

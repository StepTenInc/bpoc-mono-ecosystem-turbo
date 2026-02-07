import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/candidate/offers/[id]/accept
 * Accept a job offer and auto-trigger onboarding initialization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: offerId } = await params;

    // Get offer details with related data
    const { data: offer, error: offerError } = await supabase
      .from('job_offers')
      .select(`
        *,
        application:job_applications!inner(
          id,
          candidate_id,
          job:jobs!inner(
            id,
            title,
            description,
            agency_client_id
          )
        )
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const application = Array.isArray(offer.application)
      ? offer.application[0]
      : offer.application;

    // Verify candidate owns this offer
    if (application.candidate_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if offer is still valid
    if (offer.status === 'accepted') {
      return NextResponse.json({ error: 'Offer already accepted' }, { status: 400 });
    }

    if (offer.status === 'expired' || offer.status === 'withdrawn') {
      return NextResponse.json({ error: 'Offer is no longer valid' }, { status: 400 });
    }

    // Update offer status to accepted
    const { error: updateOfferError } = await supabase
      .from('job_offers')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (updateOfferError) {
      console.error('Error updating offer:', updateOfferError);
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
    }

    // Update application status to hired
    const { error: updateApplicationError } = await supabase
      .from('job_applications')
      .update({
        status: 'hired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id);

    if (updateApplicationError) {
      console.error('Error updating application:', updateApplicationError);
    }

    // Get candidate details for pre-filling onboarding
    const { data: candidate } = await supabase
      .from('candidates')
      .select('first_name, last_name, email, birthday, gender')
      .eq('id', application.candidate_id)
      .single();

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('phone, bio')
      .eq('candidate_id', application.candidate_id)
      .single();

    const { data: resume } = await supabase
      .from('candidate_resumes')
      .select('resume_url')
      .eq('candidate_id', application.candidate_id)
      .eq('is_primary', true)
      .single();

    const job = Array.isArray(application.job)
      ? application.job[0]
      : application.job;

    // Initialize onboarding record
    const { data: onboarding, error: onboardingError } = await supabase
      .from('candidate_onboarding')
      .insert({
        candidate_id: application.candidate_id,
        job_application_id: application.id,

        // Pre-fill from candidate data
        first_name: candidate?.first_name || '',
        last_name: candidate?.last_name || '',
        email: candidate?.email || '',
        date_of_birth: candidate?.birthday || null,
        gender: candidate?.gender || null,
        contact_no: profile?.phone || '',
        resume_url: resume?.resume_url || null,

        // Job details from offer
        position: job?.title || 'Position',
        contact_type: offer.employment_type || 'FULL_TIME',
        assigned_client: offer.client_name || null,
        start_date: offer.start_date || null,
        work_schedule: offer.work_schedule || null,
        basic_salary: offer.salary_offered || null,
        de_minimis: offer.de_minimis || null,
        total_monthly_gross: offer.total_compensation || offer.salary_offered || null,
        hmo_offer: offer.benefits?.hmo || null,
        paid_leave: offer.benefits?.paid_leave || null,
        probationary_period: offer.probationary_period || '6 months',

        // If resume exists, mark as approved
        resume_status: resume?.resume_url ? 'APPROVED' : 'PENDING',
        completion_percent: resume?.resume_url ? 12 : 0,

        // Initialize employment tracking fields
        employment_started: false,
        employment_start_date: null,
      })
      .select()
      .single();

    if (onboardingError) {
      console.error('Error creating onboarding:', onboardingError);
      return NextResponse.json({ error: 'Failed to initialize onboarding' }, { status: 500 });
    }

    // Send notification to candidate
    await createNotification({
      recipientId: application.candidate_id,
      recipientType: 'candidate',
      type: 'onboarding_started',
      title: 'Welcome! Onboarding Started',
      message: `Your onboarding for ${job?.title || 'your new role'} has been initiated. Please complete all required tasks to prepare for your first day.`,
      actionUrl: `/candidate/onboarding`,
      relatedId: onboarding.id,
      relatedType: 'onboarding',
      isUrgent: true,
    });

    // Notify recruiter about offer acceptance
    const { data: jobData } = await supabase
      .from('jobs')
      .select(`
        agency_client_id,
        agency_clients!inner(
          agency_id,
          agencies!inner(
            agency_recruiters!inner(
              user_id
            )
          )
        )
      `)
      .eq('id', job?.id)
      .single();

    if (jobData) {
      const agencyClient = Array.isArray(jobData.agency_clients)
        ? jobData.agency_clients[0]
        : jobData.agency_clients;

      const agency = agencyClient?.agencies;
      const recruiters = Array.isArray(agency?.agency_recruiters)
        ? agency.agency_recruiters
        : agency?.agency_recruiters ? [agency.agency_recruiters] : [];

      for (const recruiter of recruiters) {
        await createNotification({
          recipientId: recruiter.user_id,
          recipientType: 'recruiter',
          type: 'offer_accepted',
          title: `Offer Accepted: ${job?.title}`,
          message: `${candidate?.first_name} ${candidate?.last_name} has accepted the offer for ${job?.title}. Onboarding has been automatically initiated.`,
          actionUrl: `/recruiter/applications/${application.id}`,
          relatedId: offerId,
          relatedType: 'offer',
          isUrgent: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Offer accepted and onboarding initialized',
      onboardingId: onboarding.id,
    });

  } catch (error: any) {
    console.error('Accept offer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendCounterOfferEmail } from '@/lib/email';
import { logAdminAction } from '@/lib/admin-audit';

/**
 * POST /api/candidate/offers/counter
 * Candidate submits a counter offer
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, requestedSalary, candidateMessage } = body;

    if (!offerId || !requestedSalary) {
      return NextResponse.json(
        { error: 'offerId and requestedSalary are required' },
        { status: 400 }
      );
    }

    // Verify the offer exists using admin client to bypass RLS
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select('id, application_id, salary_offered, currency, status')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      console.error('Offer fetch error:', offerError);
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Get the application to verify candidate ownership
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select('candidate_id')
      .eq('id', offer.application_id)
      .single();

    if (appError || !application) {
      console.error('Application fetch error:', appError);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify this offer belongs to the current user
    if (application.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if offer is in a state where counter is allowed
    if (!['sent', 'viewed', 'negotiating'].includes(offer.status)) {
      return NextResponse.json(
        { error: `Cannot counter an offer with status: ${offer.status}` },
        { status: 400 }
      );
    }

    // Create counter offer using admin client
    const { data: counterOffer, error: counterError } = await supabaseAdmin
      .from('counter_offers')
      .insert({
        offer_id: offerId,
        requested_salary: requestedSalary,
        requested_currency: offer.currency,
        candidate_message: candidateMessage || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (counterError) {
      console.error('Error creating counter offer:', counterError);
      return NextResponse.json(
        { error: 'Failed to create counter offer' },
        { status: 500 }
      );
    }

    // Update offer status to 'negotiating'
    const { error: updateError } = await supabaseAdmin
      .from('job_offers')
      .update({
        status: 'negotiating',
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('Error updating offer status:', updateError);
    }

    // Send notification email to recruiter/client about counter offer
    try {
      // Get job and candidate details for the email
      const { data: jobApp } = await supabaseAdmin
        .from('job_applications')
        .select(`
          id,
          candidate_id,
          job_id,
          candidates (
            first_name,
            last_name
          ),
          jobs (
            title,
            agency_id,
            agency_clients (
              agency_id,
              agencies (
                primary_contact_email
              )
            )
          )
        `)
        .eq('id', offer.application_id)
        .single();

      if (jobApp && jobApp.candidates && jobApp.jobs) {
        const candidateName = `${(jobApp.candidates as any).first_name} ${(jobApp.candidates as any).last_name}`.trim();
        const jobTitle = (jobApp.jobs as any).title;

        // Try to get primary contact email from agency
        const agencyEmail = (jobApp.jobs as any)?.agency_clients?.agencies?.primary_contact_email;

        if (agencyEmail) {
          const offerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bpoc.io'}/recruiter/offers/${offerId}`;

          await sendCounterOfferEmail(
            agencyEmail,
            candidateName,
            jobTitle,
            requestedSalary,
            offerUrl
          );

          console.log('📧 Counter offer email sent to:', agencyEmail);
        } else {
          console.warn('⚠️ No agency contact email found for counter offer notification');
        }
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send counter offer email:', emailError);
      // Don't fail the request if email fails
    }

    // Log audit trail (using admin audit for counter offers)
    await logAdminAction({
      adminId: user.id,
      adminName: 'Candidate',
      adminEmail: user.email,
      action: 'counter_offer_submit',
      entityType: 'counter_offer',
      entityId: counterOffer.id,
      entityName: `Counter offer for offer ${offerId}`,
      details: {
        offer_id: offerId,
        requested_salary: requestedSalary,
      },
    });

    return NextResponse.json({
      message: 'Counter offer submitted successfully',
      counterOffer: {
        id: counterOffer.id,
        requestedSalary: counterOffer.requested_salary,
        status: counterOffer.status,
        createdAt: counterOffer.created_at,
      },
    });
  } catch (error) {
    console.error('Error submitting counter offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

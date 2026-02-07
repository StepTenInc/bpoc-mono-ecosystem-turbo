import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';

// GET - Fetch offers for the logged-in candidate
export async function GET(request: NextRequest) {
  try {
    // Verify authentication using centralized utility
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get candidate's applications
    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .eq('candidate_id', user.id);

    if (!applications || applications.length === 0) {
      return NextResponse.json({ offers: [] });
    }

    const applicationIds = applications.map(a => a.id);

    // Get offers for those applications with counter offers
    const { data: offers, error } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        salary_offered,
        salary_type,
        currency,
        start_date,
        benefits_offered,
        additional_terms,
        status,
        sent_at,
        viewed_at,
        responded_at,
        expires_at,
        created_at,
        application:job_applications (
          id,
          job:jobs (
            id,
            title,
            agency_client:agency_clients (
              company:companies (
                name
              )
            )
          )
        ),
        counter_offers (
          id,
          requested_salary,
          requested_currency,
          candidate_message,
          employer_response,
          response_type,
          status,
          created_at,
          responded_at
        )
      `)
      .in('application_id', applicationIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mark offers as viewed
    const unviewedOfferIds = (offers || [])
      .filter(o => o.status === 'sent' && !o.viewed_at)
      .map(o => o.id);
    
    if (unviewedOfferIds.length > 0) {
      await supabaseAdmin
        .from('job_offers')
        .update({ 
          viewed_at: new Date().toISOString(),
          status: 'viewed'
        })
        .in('id', unviewedOfferIds);
    }

    const formattedOffers = (offers || []).map((offer) => {
      const app = offer.application as {
        id: string;
        job?: {
          id: string;
          title: string;
          agency_client?: { company?: { name: string } };
        };
      } | null;

      const counterOffers = (offer.counter_offers || []).map((co: any) => ({
        id: co.id,
        requestedSalary: co.requested_salary,
        requestedCurrency: co.requested_currency,
        candidateMessage: co.candidate_message,
        employerResponse: co.employer_response,
        responseType: co.response_type,
        status: co.status,
        createdAt: co.created_at,
        respondedAt: co.responded_at,
      }));

      // Get latest counter offer
      const latestCounter = counterOffers.length > 0
        ? counterOffers[counterOffers.length - 1]
        : null;

      return {
        id: offer.id,
        jobId: app?.job?.id,
        jobTitle: app?.job?.title || 'Unknown Job',
        company: app?.job?.agency_client?.company?.name || 'ShoreAgents Client',
        salaryOffered: offer.salary_offered,
        salaryType: offer.salary_type,
        currency: offer.currency,
        startDate: offer.start_date,
        benefits: offer.benefits_offered,
        additionalTerms: offer.additional_terms,
        status: offer.status,
        sentAt: offer.sent_at,
        respondedAt: offer.responded_at,
        expiresAt: offer.expires_at,
        createdAt: offer.created_at,
        // Counter offer data
        counterOffers,
        latestCounter,
      };
    });

    return NextResponse.json({ offers: formattedOffers });

  } catch (error) {
    console.error('Candidate offers error:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}

// PATCH - Accept or reject an offer
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);

    const { offerId, action, response, reason } = await request.json();

    if (!offerId || !action) {
      return NextResponse.json({ error: 'Offer ID and action required' }, { status: 400 });
    }

    // Verify offer belongs to this candidate
    const { data: offer } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        application:job_applications (
          candidate_id
        )
      `)
      .eq('id', offerId)
      .single();

    const app = offer?.application as { candidate_id: string } | null;
    if (!offer || app?.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Update offer based on action
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    const { error: updateError } = await supabaseAdmin
      .from('job_offers')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        candidate_response: response || reason || null,
        rejection_reason: action === 'reject' ? (reason || response) : null,
      })
      .eq('id', offerId);

    if (updateError) throw updateError;

    // Update application status
    const { data: offerData } = await supabaseAdmin
      .from('job_offers')
      .select('application_id, salary_offered, currency')
      .eq('id', offerId)
      .single();

    if (offerData) {
      await supabaseAdmin
        .from('job_applications')
        .update({ status: action === 'accept' ? 'hired' : 'rejected' })
        .eq('id', offerData.application_id);

      // Log timeline activity for offer response
      try {
        await logApplicationActivity(offerData.application_id, {
          action_type: action === 'accept' ? 'offer_accepted' : 'offer_rejected',
          performed_by_type: 'candidate',
          performed_by_id: user.id,
          description: action === 'accept'
            ? `Candidate accepted job offer (${offerData.currency} ${offerData.salary_offered})`
            : `Candidate rejected job offer${reason ? ': ' + reason : ''}`,
          metadata: {
            offer_id: offerId,
            action: action,
            salary_offered: offerData.salary_offered,
            currency: offerData.currency,
            response: response || reason || null,
            rejection_reason: action === 'reject' ? (reason || response) : null,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Failed to log offer response:', logError);
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Offer accepted!' : 'Offer declined'
    });

  } catch (error) {
    console.error('Respond to offer error:', error);
    return NextResponse.json({ error: 'Failed to respond to offer' }, { status: 500 });
  }
}


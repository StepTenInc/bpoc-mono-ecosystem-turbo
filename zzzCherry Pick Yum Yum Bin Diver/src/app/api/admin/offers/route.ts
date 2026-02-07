import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET - Fetch all offers for admin (VIEW ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    let query = supabaseAdmin
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
        candidate_response,
        rejection_reason,
        created_at,
        application:job_applications (
          id,
          released_to_client,
          candidate:candidates (
            id,
            email,
            first_name,
            last_name,
            avatar_url
          ),
          job:jobs (
            id,
            title,
            agency_client:agency_clients (
              company:companies (
                name
              ),
              agency:agencies (
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
          status,
          created_at,
          responded_at
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: offers, error } = await query;

    if (error) throw error;

    const formattedOffers = (offers || []).map((offer) => {
      const app = offer.application as {
        id: string;
        released_to_client?: boolean;
        candidate?: { id: string; email: string; first_name: string; last_name: string; avatar_url?: string };
        job?: { id: string; title: string; agency_client?: { company?: { name: string }; agency?: { name: string } } };
      } | null;

      const counterOffers = (offer.counter_offers || []) as Array<{
        id: string;
        requested_salary: number;
        requested_currency: string;
        candidate_message: string;
        employer_response: string;
        status: string;
        created_at: string;
        responded_at: string;
      }>;

      return {
        id: offer.id,
        applicationId: app?.id,
        candidateId: app?.candidate?.id,
        candidateName: app?.candidate ? `${app.candidate.first_name} ${app.candidate.last_name}`.trim() : 'Unknown',
        candidateEmail: app?.candidate?.email || '',
        candidateAvatar: app?.candidate?.avatar_url,
        jobId: app?.job?.id,
        jobTitle: app?.job?.title || 'Unknown Job',
        company: app?.job?.agency_client?.company?.name || 'Unknown Company',
        agency: app?.job?.agency_client?.agency?.name || 'Unknown Agency',
        salaryOffered: offer.salary_offered,
        salaryType: offer.salary_type,
        currency: offer.currency,
        startDate: offer.start_date,
        benefits: offer.benefits_offered,
        additionalTerms: offer.additional_terms,
        status: offer.status,
        sentAt: offer.sent_at,
        viewedAt: offer.viewed_at,
        respondedAt: offer.responded_at,
        expiresAt: offer.expires_at,
        candidateResponse: offer.candidate_response,
        rejectionReason: offer.rejection_reason,
        createdAt: offer.created_at,
        // Counter offers summary
        counterOffersCount: counterOffers.length,
        latestCounterOffer: counterOffers.length > 0 ? {
          requestedSalary: counterOffers[0].requested_salary,
          currency: counterOffers[0].requested_currency,
          status: counterOffers[0].status,
          message: counterOffers[0].candidate_message,
        } : null,
      };
    });

    return NextResponse.json({ offers: formattedOffers });

  } catch (error) {
    console.error('Offers API error:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}

// NOTE: POST and PATCH removed - Admin should NOT create or modify offers
// Offer creation and management is handled by recruiters via /api/recruiter/offers

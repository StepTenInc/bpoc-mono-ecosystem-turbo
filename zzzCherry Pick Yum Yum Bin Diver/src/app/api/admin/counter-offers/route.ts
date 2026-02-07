import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';


// GET - List all counter offers platform-wide (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    // Verify user is a BPOC admin
    const { data: bpocUser, error: bpocError } = await supabaseAdmin
      .from('bpoc_users')
      .select('id, role, is_active')
      .eq('id', user.id)
      .single();

    if (bpocError || !bpocUser || !bpocUser.is_active) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const agencyId = url.searchParams.get('agencyId');
    const candidateId = url.searchParams.get('candidateId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query for counter offers
    let query = supabaseAdmin
      .from('counter_offers')
      .select(`
        *,
        job_offers (
          id,
          salary_offered,
          currency,
          salary_type,
          status,
          sent_at,
          job_applications (
            id,
            candidate_id,
            job_id,
            jobs (
              title,
              agency_clients (
                agency_id,
                agencies (name),
                companies (name)
              )
            )
          )
        )
      `)
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: counterOffers, error: offersError } = await query;

    if (offersError) {
      console.error('Error fetching counter offers:', offersError);
      return NextResponse.json({ error: 'Failed to fetch counter offers' }, { status: 500 });
    }

    // Get candidate details
    const candidateIds = (counterOffers || [])
      .map(co => co.job_offers?.job_applications?.candidate_id)
      .filter(Boolean) as string[];

    let candidates: any[] = [];
    if (candidateIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('candidates')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', candidateIds);
      candidates = data || [];
    }

    // Filter by agency if specified
    let filteredCounterOffers = counterOffers || [];
    if (agencyId) {
      filteredCounterOffers = filteredCounterOffers.filter(co =>
        co.job_offers?.job_applications?.jobs?.agency_clients?.agency_id === agencyId
      );
    }

    // Filter by candidate if specified
    if (candidateId) {
      filteredCounterOffers = filteredCounterOffers.filter(co =>
        co.job_offers?.job_applications?.candidate_id === candidateId
      );
    }

    // Format response
    const formattedCounterOffers = filteredCounterOffers.map(counterOffer => {
      const offer = counterOffer.job_offers;
      const application = offer?.job_applications;
      const candidate = candidates.find(c => c.id === application?.candidate_id);

      const originalSalary = Number(offer?.salary_offered || 0);
      const requestedSalary = Number(counterOffer.requested_salary);
      const difference = requestedSalary - originalSalary;
      const percentageIncrease = originalSalary > 0 ? ((difference / originalSalary) * 100).toFixed(1) : '0.0';

      return {
        id: counterOffer.id,
        offerId: counterOffer.offer_id,
        status: counterOffer.status,
        candidateId: application?.candidate_id,
        candidateName: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
        candidateEmail: candidate?.email,
        candidateAvatar: candidate?.avatar_url,
        jobId: application?.job_id,
        jobTitle: application?.jobs?.title || 'Unknown Job',
        agency: application?.jobs?.agency_clients?.agencies?.name || 'Unknown Agency',
        client: application?.jobs?.agency_clients?.companies?.name || 'Unknown Company',
        originalSalary,
        requestedSalary,
        difference,
        percentageIncrease: parseFloat(percentageIncrease),
        currency: counterOffer.requested_currency || offer?.currency || 'PHP',
        salaryType: offer?.salary_type || 'month',
        candidateMessage: counterOffer.candidate_message,
        employerResponse: counterOffer.employer_response,
        responseType: counterOffer.response_type,
        createdAt: counterOffer.created_at,
        respondedAt: counterOffer.responded_at
      };
    });

    // Calculate stats
    const { data: allCounterOffers } = await supabaseAdmin
      .from('counter_offers')
      .select('status, requested_salary, job_offers(salary_offered)');

    const allOffers = allCounterOffers || [];
    const stats = {
      total: allOffers.length,
      pending: allOffers.filter(co => co.status === 'pending').length,
      accepted: allOffers.filter(co => co.status === 'accepted').length,
      rejected: allOffers.filter(co => co.status === 'rejected').length,
      averageIncrease: allOffers.length > 0
        ? allOffers.reduce((sum, co: any) => {
          const original = Number(co.job_offers?.salary_offered || 0);
          const requested = Number(co.requested_salary);
          const increase = original > 0 ? ((requested - original) / original) * 100 : 0;
          return sum + increase;
        }, 0) / allOffers.length
        : 0,
      acceptanceRate: allOffers.length > 0
        ? (allOffers.filter(co => co.status === 'accepted').length / allOffers.length) * 100
        : 0
    };

    const totalCount = filteredCounterOffers.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      counterOffers: formattedCounterOffers,
      stats: {
        ...stats,
        averageIncrease: parseFloat(stats.averageIncrease.toFixed(1)),
        acceptanceRate: parseFloat(stats.acceptanceRate.toFixed(1))
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('[Admin Counter Offers API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch counter offers' }, { status: 500 });
  }
}

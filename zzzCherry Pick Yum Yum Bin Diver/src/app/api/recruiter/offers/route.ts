import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';

/**
 * GET /api/recruiter/offers
 * Fetch offers for jobs that belong to this recruiter's agency
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency_id
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ 
        offers: [],
        message: 'Recruiter not found'
      });
    }

    const agencyId = recruiter.agency_id;

    // Get agency_clients for this agency
    const { data: clients } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('agency_id', agencyId);

    if (!clients || clients.length === 0) {
      return NextResponse.json({ 
        offers: [],
        message: 'No clients found for this agency'
      });
    }

    const clientIds = clients.map(c => c.id);

    // Get jobs for these clients
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title')
      .in('agency_client_id', clientIds);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ 
        offers: [],
        message: 'No jobs found for this agency'
      });
    }

    const jobIds = jobs.map(j => j.id);
    const jobMap = Object.fromEntries(jobs.map(j => [j.id, j.title]));

    // Get applications for these jobs
    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('id, job_id, candidate_id')
      .in('job_id', jobIds);

    if (!applications || applications.length === 0) {
      return NextResponse.json({ offers: [] });
    }

    const appIds = applications.map(a => a.id);
    const appMap = Object.fromEntries(applications.map(a => [a.id, { jobId: a.job_id, candidateId: a.candidate_id }]));

    // Get offers for these applications with ALL details
    const { data: offers, error: offersError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        *,
        counter_offers (
          id,
          requested_salary,
          requested_currency,
          candidate_message,
          employer_response,
          response_type,
          status,
          created_at,
          responded_at,
          created_by
        )
      `)
      .in('application_id', appIds)
      .order('created_at', { ascending: false });

    if (offersError) {
      console.error('Error fetching offers:', offersError);
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }

    // Get candidate details (including email for video calls)
    const candidateIds = [...new Set(applications.map(a => a.candidate_id))];
    let candidateMap: Record<string, { name: string; email: string; avatarUrl?: string }> = {};
    
    if (candidateIds.length > 0) {
      const { data: candidates } = await supabaseAdmin
        .from('candidates')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', candidateIds);

      if (candidates) {
        candidateMap = Object.fromEntries(
          candidates.map(c => [c.id, {
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
            email: c.email || '',
            avatarUrl: c.avatar_url || undefined,
          }])
        );
      }
    }

    // Get video call rooms for these applications (for offer negotiation calls)
    const { data: videoCalls } = await supabaseAdmin
      .from('video_call_rooms')
      .select('*')
      .in('application_id', appIds)
      .eq('call_type', 'recruiter_offer') // Only offer-related calls
      .order('created_at', { ascending: false});

    const videoCallsByAppId: Record<string, any[]> = {};
    if (videoCalls) {
      for (const call of videoCalls) {
        if (!videoCallsByAppId[call.application_id]) {
          videoCallsByAppId[call.application_id] = [];
        }
        videoCallsByAppId[call.application_id].push({
          id: call.id,
          createdAt: call.created_at,
          endedAt: call.ended_at,
          status: call.status,
          duration: call.duration_seconds,
          rating: call.rating,
          notes: call.notes,
        });
      }
    }

    // Format response with all fields needed for video calls and full details
    const formattedOffers = (offers || []).map(offer => {
      const app = appMap[offer.application_id];
      const candidateInfo = app ? candidateMap[app.candidateId] : null;
      const videoCalls = videoCallsByAppId[offer.application_id] || [];
      
      return {
        id: offer.id,
        applicationId: offer.application_id,
        // Candidate info for video calls
        candidateId: app?.candidateId || null,
        candidateName: candidateInfo?.name || 'Unknown',
        candidateEmail: candidateInfo?.email || '',
        candidateAvatar: candidateInfo?.avatarUrl || undefined,
        // Job info
        jobId: app?.jobId || null,
        jobTitle: app ? jobMap[app.jobId] || 'Unknown Job' : 'Unknown Job',
        // Offer details - ALL FIELDS
        salaryOffered: offer.salary_offered,
        currency: offer.currency || 'PHP',
        salaryType: offer.salary_type || 'monthly',
        startDate: offer.start_date,
        benefits: offer.benefits_offered,
        additionalTerms: offer.additional_terms,
        // Status and timestamps
        status: offer.status,
        sentAt: offer.sent_at || offer.created_at,
        viewedAt: offer.viewed_at,
        respondedAt: offer.responded_at,
        expiresAt: offer.expires_at,
        createdAt: offer.created_at,
        updatedAt: offer.updated_at,
        // Response info
        candidateResponse: offer.candidate_response,
        rejectionReason: offer.rejection_reason,
        // Counter offers
        counterOffers: (offer.counter_offers || []).map((co: any) => ({
          id: co.id,
          requestedSalary: co.requested_salary,
          requestedCurrency: co.requested_currency,
          candidateMessage: co.candidate_message,
          employerResponse: co.employer_response,
          responseType: co.response_type,
          status: co.status,
          createdAt: co.created_at,
          respondedAt: co.responded_at,
        })),
        // Video calls (offer negotiation calls)
        offerCalls: videoCalls,
        // Negotiation history (derived from counter offers)
        negotiationHistory: [
          {
            id: 'initial',
            type: 'offer_sent',
            amount: Number(offer.salary_offered),
            currency: offer.currency,
            createdAt: offer.sent_at || offer.created_at,
          },
          ...(offer.counter_offers || []).flatMap((co: any) => [
            {
              id: co.id,
              type: 'counter_offer',
              amount: Number(co.requested_salary),
              currency: co.requested_currency,
              note: co.candidate_message,
              createdAt: co.created_at,
              createdBy: 'candidate',
            },
            ...(co.responded_at ? [{
              id: `${co.id}-response`,
              type: co.response_type === 'accepted' ? 'accepted' : co.response_type === 'rejected' ? 'rejected' : 'note',
              note: co.employer_response,
              createdAt: co.responded_at,
              createdBy: 'recruiter',
            }] : [])
          ]),
          ...(offer.status === 'accepted' && offer.responded_at ? [{
            id: 'final-accept',
            type: 'accepted',
            createdAt: offer.responded_at,
            createdBy: 'candidate',
          }] : []),
          ...(offer.status === 'rejected' && offer.responded_at ? [{
            id: 'final-reject',
            type: 'rejected',
            note: offer.rejection_reason,
            createdAt: offer.responded_at,
            createdBy: 'candidate',
          }] : []),
        ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      };
    });

    return NextResponse.json({ 
      offers: formattedOffers,
      total: formattedOffers.length 
    });

  } catch (error) {
    console.error('Error in recruiter offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter/offers
 * Create a new job offer
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, salaryOffered, currency, salaryType, startDate, benefits } = await request.json();

    if (!applicationId || !salaryOffered) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get recruiter's agency_recruiters ID
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Create offer
    const { data: offer, error } = await supabaseAdmin
      .from('job_offers')
      .insert({
        application_id: applicationId,
        salary_offered: salaryOffered,
        currency: currency || 'PHP',
        salary_type: salaryType || 'monthly',
        start_date: startDate,
        benefits_offered: benefits || [],
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_by: recruiter?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating offer:', error);
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
    }

    // Update application status
    await supabaseAdmin
      .from('job_applications')
      .update({ status: 'offer_sent' })
      .eq('id', applicationId);

    // Log timeline activity for offer sent
    try {
      await logApplicationActivity(applicationId, {
        action_type: 'offer_sent',
        performed_by_type: 'recruiter',
        performed_by_id: recruiter?.id || userId,
        description: `Job offer sent: ${currency || 'PHP'} ${salaryOffered}${startDate ? ' (Start: ' + startDate + ')' : ''}`,
        metadata: {
          offer_id: offer.id,
          salary_offered: salaryOffered,
          currency: currency || 'PHP',
          salary_type: salaryType || 'monthly',
          start_date: startDate || null,
          benefits: benefits || [],
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log offer sent:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ success: true, offer });

  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


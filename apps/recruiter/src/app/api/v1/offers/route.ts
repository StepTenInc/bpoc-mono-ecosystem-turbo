import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../auth';
import { handleCorsOptions, withCors } from '../cors';
import { webhookOfferSent } from '@/lib/webhooks/events';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * GET /api/v1/offers
 * List job offers for agency's jobs
 * 
 * TIER: Enterprise
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const tier = await getAgencyTier(auth.agency_id);
  if (tier !== 'enterprise') {
    return withCors(NextResponse.json({ 
      error: 'Offer management via API requires Enterprise plan',
    }, { status: 403 }));
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const clientId = searchParams.get('clientId'); // Filter by specific client
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Get agency's clients (or specific client if filtered)
    let clientIds: string[];
    if (clientId) {
      const allClientIds = await getAgencyClientIds(auth.agency_id);
      if (!allClientIds.includes(clientId)) {
        return withCors(NextResponse.json({ error: 'Client not found' }, { status: 404 }), request);
      }
      clientIds = [clientId];
    } else {
      clientIds = await getAgencyClientIds(auth.agency_id);
    }
    
    if (clientIds.length === 0) {
      return withCors(NextResponse.json({ offers: [], total: 0 }), request);
    }

    // Get jobs
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];
    const jobMap = Object.fromEntries((jobs || []).map(j => [j.id, j.title]));

    if (jobIds.length === 0) {
      return withCors(NextResponse.json({ offers: [], total: 0 }), request);
    }

    // Get applications
    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('id, job_id, candidate_id')
      .in('job_id', job_id_list);

    const appIds = applications?.map(a => a.id) || [];
    const appMap = Object.fromEntries((applications || []).map(a => [a.id, a]));

    if (appIds.length === 0) {
      return withCors(NextResponse.json({ offers: [], total: 0 }), request);
    }

    // Get offers
    let query = supabaseAdmin
      .from('job_offers')
      .select('*', { count: 'exact' })
      .in('application_id', appIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data: offers, count, error } = await query;

    if (error) {
      return withCors(NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 }), request);
    }

    // Get candidate details
    const candidateIds = [...new Set(applications?.map(a => a.candidate_id) || [])];
    const { data: candidates } = await supabaseAdmin
      .from('candidates')
      .select('id, first_name, last_name, email')
      .in('id', candidate_id_list.length > 0 ? candidateIds : ['none']);

    const candidateMap = Object.fromEntries(
      (candidates || []).map(c => [c.id, { name: `${c.first_name} ${c.last_name}`.trim(), email: c.email }])
    );

    const formattedOffers = (offers || []).map(o => {
      const app = appMap[o.application_id];
      return {
        ...o, // Return ALL database fields
        // Also include camelCase versions for backward compatibility
        application_id: o.application_id,
        salaryOffered: o.salary_offered,
        salaryType: o.salary_type,
        start_date: o.start_date,
        benefitsOffered: o.benefits_offered,
        additionalTerms: o.additional_terms,
        sentAt: o.sent_at,
        viewedAt: o.viewed_at,
        respondedAt: o.responded_at,
        expiresAt: o.expires_at,
        candidateResponse: o.candidate_response,
        rejectionReason: o.rejection_reason,
        createdBy: o.created_by,
        created_at: o.created_at,
        updated_at: o.updated_at,
        // Additional context
        job_title: app ? jobMap[app.job_id] : 'Unknown',
        candidate: app ? candidateMap[app.candidate_id] : null,
      };
    });

    return withCors(NextResponse.json({
      offers: formattedOffers,
      total: count || 0,
      limit,
      offset,
    }), request);

  } catch (error) {
    console.error('API v1 offers error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

/**
 * POST /api/v1/offers
 * Send a job offer
 * 
 * Body:
 *   application_id: string (required)
 *   salary: number (required)
 *   currency: string (default: PHP)
 *   start_date?: string (ISO date)
 *   expiresAt?: string (ISO date)
 *   benefits?: string[]
 *   message?: string
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const tier = await getAgencyTier(auth.agency_id);
  if (tier !== 'enterprise') {
    return withCors(NextResponse.json({ 
      error: 'Offer management via API requires Enterprise plan',
    }, { status: 403 }));
  }

  try {
    const body = await request.json();
    const { 
      application_id, 
      salary, 
      currency = 'PHP', 
      startDate, 
      expiresAt,
      benefits,
      message 
    } = body;

    if (!application_id || !salary) {
      return withCors(NextResponse.json({ 
        error: 'application_id and salary are required' 
      }, { status: 400 }));
    }

    // Verify application belongs to agency
    const clientIds = await getAgencyClientIds(auth.agency_id);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);

    const jobIds = jobs?.map(j => j.id) || [];

    const { data: app } = await supabaseAdmin
      .from('job_applications')
      .select('id, job_id')
      .eq('id', application_id)
      .in('job_id', job_id_list)
      .single();

    if (!app) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    // Check if offer already exists
    const { data: existingOffer } = await supabaseAdmin
      .from('job_offers')
      .select('id')
      .eq('application_id', application_id)
      .single();

    if (existingOffer) {
      return withCors(NextResponse.json({ 
        error: 'An offer already exists for this application',
        offer_id: existingOffer.id
      }, { status: 409 }));
    }

    // Create offer
    // Note: status must be one of: 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'negotiating', 'expired', 'withdrawn'
    // We use 'sent' for new offers created via API
    const { data: offer, error } = await supabaseAdmin
      .from('job_offers')
      .insert({
        application_id: application_id,
        salary_offered: salary,
        currency,
        start_date: startDate || null,
        expires_at: expiresAt || null,
        benefits_offered: benefits || [],
        additional_terms: message || null,  // Field name is 'additional_terms' not 'offer_message'
        status: 'sent',  // Must be 'sent' not 'pending' - valid values: draft, sent, viewed, accepted, rejected, negotiating, expired, withdrawn
        sent_at: new Date().toISOString(),  // Mark as sent now
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create offer:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Return more specific error messages
      if (error.code === '23503') {
        return withCors(NextResponse.json({ 
          error: 'Invalid application_id. Application does not exist or does not belong to your agency.',
          details: error.message 
        }, { status: 400 }));
      }
      
      if (error.code === '23505') {
        return withCors(NextResponse.json({ 
          error: 'An offer already exists for this application',
          details: error.message 
        }, { status: 409 }));
      }
      
      return withCors(NextResponse.json({ 
        error: 'Failed to create offer',
        details: error.message,
        code: error.code,
        hint: 'Check that application_id exists and belongs to your agency'
      }, { status: 500 }));
    }

    // Update application status
    await supabaseAdmin
      .from('job_applications')
      .update({ status: 'offer_sent' })
      .eq('id', application_id);

    // Trigger webhook for offer sent
    const { data: application } = await supabaseAdmin
      .from('job_applications')
      .select('candidate_id, job_id')
      .eq('id', application_id)
      .single();

    if (application) {
      webhookOfferSent({
        offer_id: offer.id,
        application_id: application_id,
        candidate_id: application.candidate_id,
        salaryOffered: salary,
        currency: currency,
        start_date: startDate || undefined,
        agency_id: auth.agency_id,
      }).catch(err => console.error('[Webhook] Offer sent error:', err));
    }

    // Log timeline activity for offer sent
    try {
      await logApplicationActivity(application_id, {
        action_type: 'offer_sent',
        performed_by_type: 'recruiter',
        performed_by_id: auth.agency_id, // Using agency ID as this is via API
        description: `Job offer sent: ${currency} ${salary}${startDate ? ' (Start: ' + startDate + ')' : ''}`,
        metadata: {
          offer_id: offer.id,
          salary_offered: salary,
          currency: currency,
          start_date: startDate || null,
          expires_at: expiresAt || null,
          benefits: benefits || [],
          additional_terms: message || null,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log offer sent:', logError);
      // Don't fail the request if logging fails
    }

    return withCors(NextResponse.json({
      success: true,
      offer: {
        ...offer, // Return ALL fields
      },
    }, { status: 201 }), request);

  } catch (error) {
    console.error('API v1 offers POST error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

async function getAgencyTier(agency_id: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('api_tier')
    .eq('id', agencyId)
    .single();
  
  return data?.api_tier || 'free';
}

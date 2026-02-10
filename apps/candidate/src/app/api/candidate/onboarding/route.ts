import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

// GET - Fetch onboarding status for the logged-in candidate
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get candidate's onboarding records
    const { data: onboarding, error } = await supabaseAdmin
      .from('candidate_onboarding')
      .select(`
        *,
        offer:job_offers (
          id,
          salary_offered,
          currency,
          salary_type,
          start_date,
          application:job_applications (
            job:jobs (
              title,
              agency_client:agency_clients (
                company:companies (
                  name
                )
              )
            )
          )
        ),
        documents:onboarding_documents (
          id,
          document_type,
          file_name,
          status,
          verified_at,
          verification_notes
        )
      `)
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (onboarding || []).map((ob: any) => {
      const offer = ob.offer;
      const app = offer?.application;
      const job = app?.job;

      return {
        id: ob.id,
        status: ob.status,
        confirmedStartDate: ob.confirmed_start_date,
        documentsSubmittedAt: ob.documents_submitted_at,
        documentsVerifiedAt: ob.documents_verified_at,
        createdAt: ob.created_at,
        offer: {
          id: offer?.id,
          salaryOffered: Number(offer?.salary_offered) || 0,
          currency: offer?.currency || 'PHP',
          salaryType: offer?.salary_type || 'monthly',
          startDate: offer?.start_date,
        },
        job: {
          title: job?.title || 'Unknown Job',
          company: job?.agency_client?.company?.name || 'Unknown Company',
        },
        documents: (ob.documents || []).map((doc: any) => ({
          id: doc.id,
          type: doc.document_type,
          fileName: doc.file_name,
          status: doc.status,
          verifiedAt: doc.verified_at,
          notes: doc.verification_notes,
        })),
      };
    });

    return NextResponse.json({ onboarding: formatted });

  } catch (error) {
    console.error('Onboarding fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding' }, { status: 500 });
  }
}

// POST - Create onboarding record and submit documents
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { offerId, confirmedStartDate } = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: 'Offer ID required' }, { status: 400 });
    }

    // Verify offer belongs to this candidate
    const { data: offer } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        status,
        application:job_applications (
          candidate_id
        )
      `)
      .eq('id', offerId)
      .single();

    const app = offer?.application as unknown as { candidate_id: string } | null;
    if (!offer || app?.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (offer.status !== 'accepted') {
      return NextResponse.json({ error: 'Offer must be accepted first' }, { status: 400 });
    }

    // Check if onboarding already exists
    const { data: existing } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('id')
      .eq('offer_id', offerId)
      .single();

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('candidate_onboarding')
        .update({
          confirmed_start_date: confirmedStartDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ 
        success: true, 
        onboarding: updated,
        message: 'Onboarding updated' 
      });
    }

    // Create new onboarding record
    const { data: onboarding, error } = await supabaseAdmin
      .from('candidate_onboarding')
      .insert({
        candidate_id: user.id,
        offer_id: offerId,
        confirmed_start_date: confirmedStartDate,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      onboarding,
      message: 'Onboarding started'
    });

  } catch (error) {
    console.error('Onboarding create error:', error);
    return NextResponse.json({ error: 'Failed to create onboarding' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// POST - Send a job offer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, salary, currency, startDate, benefits, message, token } = body;

    if (!applicationId || !salary || !startDate || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, salary, startDate, token' },
        { status: 400 }
      );
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
      .select('id, candidate_id, status')
      .eq('id', applicationId)
      .eq('job_id', jobId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Create the offer
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to respond

    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .insert({
        application_id: applicationId,
        salary_offered: salary,
        salary_type: 'monthly',
        currency: currency || 'PHP',
        start_date: startDate,
        benefits_offered: benefits || [],
        additional_terms: message || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (offerError) {
      console.error('Error creating offer:', offerError);
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
    }

    // Update application status
    await supabaseAdmin
      .from('job_applications')
      .update({
        status: 'offer_sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    return NextResponse.json({ offer, message: 'Offer sent successfully' });
  } catch (error) {
    console.error('Error in offer creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

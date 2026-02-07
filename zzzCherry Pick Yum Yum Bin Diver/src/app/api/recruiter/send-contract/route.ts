import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    console.log('[send-contract] Request received');
    
    // Verify authentication
    if (!req || !req.headers) {
      console.error('[send-contract] Invalid request object');
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const authHeader = req.headers.get('authorization');
    console.log('[send-contract] Auth header:', authHeader ? 'present' : 'missing');
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    console.log('[send-contract] Verifying token...');
    const userId = await verifyAuthToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('[send-contract] User verified:', userId);

    // Verify user is a recruiter
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id')
      .eq('id', userId)
      .single();

    if (recruiterError || !recruiter) {
      console.error('[send-contract] Recruiter verification failed:', recruiterError);
      return NextResponse.json({ error: 'Unauthorized - Not a recruiter' }, { status: 403 });
    }

    console.log('[send-contract] Recruiter verified');

    // Get application ID from request body
    let body;
    try {
      body = await req.json();
      console.log('[send-contract] Request body:', body);
    } catch (jsonError) {
      console.error('[send-contract] JSON parse error:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { applicationId } = body;
    
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    console.log('[send-contract] Processing application:', applicationId);

    console.log('[send-contract] Processing application:', applicationId);

    // Get application and candidate details
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs (
          id,
          title,
          agency_client_id
        ),
        candidates (
          id,
          first_name,
          last_name,
          email
        ),
        job_offers (
          id,
          status
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('[send-contract] Application not found:', appError);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    console.log('[send-contract] Application found');

    // Verify application has an accepted offer
    const acceptedOffer = application.job_offers?.find((offer: any) => offer.status === 'accepted');
    if (!acceptedOffer) {
      console.error('[send-contract] No accepted offer found');
      return NextResponse.json({ error: 'No accepted offer found for this application' }, { status: 400 });
    }

    console.log('[send-contract] Accepted offer found');

    // Create notification for candidate
    const candidate = application.candidates;
    const job = application.jobs;

    console.log('[send-contract] Creating notification for candidate:', candidate.id);

    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: candidate.id,
        type: 'contract_ready',
        title: 'Employment Contract Ready for Signature',
        message: `Your employment contract for ${job.title} is ready for review and signature.`,
        action_url: `/candidate/contracts/${applicationId}`,
        action_label: 'View Contract',
        is_read: false
      });

    if (notificationError) {
      console.error('[send-contract] Failed to create notification:', notificationError);
      // Don't fail the request if notification fails
    } else {
      console.log('[send-contract] Notification created successfully');
    }

    // Update offer to mark contract as sent
    const { error: updateError } = await supabaseAdmin
      .from('job_offers')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', acceptedOffer.id);

    if (updateError) {
      console.error('[send-contract] Failed to update offer:', updateError);
    }

    console.log('[send-contract] Contract sent successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Contract sent to candidate',
      candidateEmail: candidate.email
    });

  } catch (error: any) {
    console.error('[send-contract] Unexpected error:', error);
    console.error('[send-contract] Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to send contract',
      details: error.message 
    }, { status: 500 });
  }
}


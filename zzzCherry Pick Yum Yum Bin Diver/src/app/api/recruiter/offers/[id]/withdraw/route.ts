import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import NotificationService from '@/lib/notifications/service';

/**
 * POST /api/recruiter/offers/[id]/withdraw
 *
 * Allows recruiters to manually withdraw a job offer.
 * Requires a withdrawal reason.
 * Sends notification to the candidate.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { withdrawalReason } = await request.json();

    if (!withdrawalReason || withdrawalReason.trim() === '') {
      return NextResponse.json({
        error: 'Withdrawal reason is required'
      }, { status: 400 });
    }

    const offerId = params.id;

    // Get the offer with application details
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        *,
        application:job_applications!inner(
          id,
          job_id,
          candidate_id,
          job:jobs!inner(
            id,
            title,
            agency_client_id
          )
        )
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({
        error: 'Offer not found'
      }, { status: 404 });
    }

    // Verify that this recruiter has access to this offer
    const application = offer.application as any;
    const job = application?.job;

    if (!job?.agency_client_id) {
      return NextResponse.json({
        error: 'Invalid offer structure'
      }, { status: 400 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({
        error: 'Recruiter not found'
      }, { status: 403 });
    }

    // Verify the job belongs to this recruiter's agency
    const { data: client } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('id', job.agency_client_id)
      .eq('agency_id', recruiter.agency_id)
      .single();

    if (!client) {
      return NextResponse.json({
        error: 'Unauthorized to withdraw this offer'
      }, { status: 403 });
    }

    // Check if offer can be withdrawn (must be in sent, viewed, or countered status)
    if (!['sent', 'viewed'].includes(offer.status)) {
      return NextResponse.json({
        error: `Cannot withdraw offer with status: ${offer.status}. Only sent or viewed offers can be withdrawn.`
      }, { status: 400 });
    }

    // Update offer status to withdrawn
    const { error: updateError } = await supabaseAdmin
      .from('job_offers')
      .update({
        status: 'withdrawn',
        rejection_reason: withdrawalReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('Error withdrawing offer:', updateError);
      return NextResponse.json({
        error: 'Failed to withdraw offer'
      }, { status: 500 });
    }

    // Log to activity timeline if table exists
    try {
      await supabaseAdmin
        .from('activity_timeline')
        .insert({
          application_id: application.id,
          event_type: 'offer_withdrawn',
          title: 'Offer Withdrawn',
          description: `Job offer withdrawn by recruiter. Reason: ${withdrawalReason}`,
          created_at: new Date().toISOString(),
        });
    } catch (timelineError) {
      // Timeline logging is optional, don't fail if it doesn't exist
      console.log('Timeline logging skipped (table may not exist)');
    }

    // Send notification to candidate
    const notification = {
      recipientId: application.candidate_id,
      recipientType: 'candidate' as const,
      type: 'offer_withdrawn' as any,
      title: `Offer Withdrawn: ${job.title}`,
      message: `The job offer for ${job.title} has been withdrawn by the employer. Reason: ${withdrawalReason}`,
      actionUrl: `/candidate/applications`,
      actionLabel: 'View Applications',
      relatedId: offerId,
      relatedType: 'offer',
      isUrgent: true,
    };

    const notifResult = await NotificationService.create(notification);
    if (!notifResult.success) {
      console.error('Failed to send withdrawal notification:', notifResult.error);
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Offer withdrawn successfully',
      offerId,
    });

  } catch (error) {
    console.error('Error in withdraw offer:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

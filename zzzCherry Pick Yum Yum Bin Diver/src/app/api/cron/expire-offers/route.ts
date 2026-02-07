import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import NotificationService from '@/lib/notifications/service';

/**
 * GET /api/cron/expire-offers
 *
 * Automatically expire offers that have passed their expiration date.
 * Updates status from 'sent' or 'viewed' to 'expired'.
 * Sends notification to candidates when their offer expires.
 *
 * Run frequency: Every hour (0 * * * *)
 */
export async function GET(request: NextRequest) {
  // Verify Authorization (Critical for Cron)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // Find expired offers that haven't been expired yet
    const { data: expiredOffers, error: queryError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        expires_at,
        application:job_applications!inner(
          id,
          candidate_id,
          job:jobs!inner(
            title
          )
        )
      `)
      .in('status', ['sent', 'viewed'])
      .lt('expires_at', now);

    if (queryError) {
      console.error('Error querying expired offers:', queryError);
      return NextResponse.json({
        error: 'Failed to query expired offers',
        details: queryError.message,
      }, { status: 500 });
    }

    let expiredCount = 0;
    const errors: string[] = [];

    if (expiredOffers && expiredOffers.length > 0) {
      for (const offer of expiredOffers) {
        try {
          // Update offer status to expired
          const { error: updateError } = await supabaseAdmin
            .from('job_offers')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString(),
            })
            .eq('id', offer.id);

          if (updateError) {
            errors.push(`Failed to update offer ${offer.id}: ${updateError.message}`);
            continue;
          }

          // Get application details
          const application = offer.application as any;
          const jobTitle = application?.job?.title || 'Unknown Job';

          // Log to activity timeline if table exists
          try {
            await supabaseAdmin
              .from('activity_timeline')
              .insert({
                application_id: application.id,
                event_type: 'offer_expired',
                title: 'Offer Expired',
                description: `Job offer for ${jobTitle} has expired`,
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
            type: 'offer_expired' as any,
            title: `Offer Expired: ${jobTitle}`,
            message: `Your job offer for ${jobTitle} has expired. Please contact the recruiter if you're still interested in this opportunity.`,
            actionUrl: `/candidate/applications`,
            actionLabel: 'View Applications',
            relatedId: offer.id,
            relatedType: 'offer',
            isUrgent: false,
          };

          const notifResult = await NotificationService.create(notification);
          if (!notifResult.success) {
            errors.push(`Notification failed for offer ${offer.id}: ${notifResult.error}`);
          }

          expiredCount++;
        } catch (offerError) {
          errors.push(`Exception processing offer ${offer.id}: ${offerError instanceof Error ? offerError.message : 'Unknown error'}`);
        }
      }
    }

    console.log(`✅ Offer expiration cron completed: ${expiredCount} offers expired`);

    return NextResponse.json({
      success: true,
      expired: expiredCount,
      processed: expiredOffers?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Offer expiration cron error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

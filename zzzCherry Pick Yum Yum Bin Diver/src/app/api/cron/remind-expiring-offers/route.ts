import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import NotificationService, { NotificationTemplates } from '@/lib/notifications/service';

/**
 * GET /api/cron/remind-expiring-offers
 *
 * Send reminders for offers expiring within the next 24 hours.
 * Only sends reminder once per offer (expiry_reminder_sent flag).
 *
 * Run frequency: Daily at 8 AM (0 8 * * *)
 */
export async function GET(request: NextRequest) {
  // Verify Authorization (Critical for Cron)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find offers expiring within the next 24 hours
    // that haven't had a reminder sent yet
    const { data: expiringOffers, error: queryError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        expires_at,
        expiry_reminder_sent,
        application:job_applications!inner(
          id,
          candidate_id,
          job:jobs!inner(
            title
          )
        )
      `)
      .in('status', ['sent', 'viewed'])
      .eq('expiry_reminder_sent', false)
      .gte('expires_at', now.toISOString())
      .lte('expires_at', in24Hours.toISOString());

    if (queryError) {
      console.error('Error querying expiring offers:', queryError);
      return NextResponse.json({
        error: 'Failed to query expiring offers',
        details: queryError.message,
      }, { status: 500 });
    }

    let remindedCount = 0;
    const errors: string[] = [];

    if (expiringOffers && expiringOffers.length > 0) {
      for (const offer of expiringOffers) {
        try {
          const application = offer.application as any;
          const jobTitle = application?.job?.title || 'Unknown Job';

          // Send notification using the template
          const notification = NotificationTemplates.offerExpiring(
            application.candidate_id,
            offer.id,
            jobTitle,
            new Date(offer.expires_at)
          );

          const notifResult = await NotificationService.create(notification);

          if (notifResult.success) {
            // Mark reminder as sent
            const { error: updateError } = await supabaseAdmin
              .from('job_offers')
              .update({
                expiry_reminder_sent: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', offer.id);

            if (updateError) {
              errors.push(`Failed to update reminder flag for offer ${offer.id}: ${updateError.message}`);
            } else {
              remindedCount++;
            }
          } else {
            errors.push(`Notification failed for offer ${offer.id}: ${notifResult.error}`);
          }
        } catch (offerError) {
          errors.push(`Exception processing offer ${offer.id}: ${offerError instanceof Error ? offerError.message : 'Unknown error'}`);
        }
      }
    }

    console.log(`✅ Expiration reminder cron completed: ${remindedCount} reminders sent`);

    return NextResponse.json({
      success: true,
      reminded: remindedCount,
      processed: expiringOffers?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Expiration reminder cron error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

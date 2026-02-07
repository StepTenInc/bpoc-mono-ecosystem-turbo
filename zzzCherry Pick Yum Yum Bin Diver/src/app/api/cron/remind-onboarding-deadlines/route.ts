import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/remind-onboarding-deadlines
 *
 * Send reminders for onboarding tasks due within 3 days
 * Run frequency: Daily at 9 AM (0 9 * * *)
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
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find onboarding records with start_date within 3 days and not complete
    const { data: upcomingOnboarding, error: queryError } = await supabaseAdmin
      .from('candidate_onboarding')
      .select(`
        id,
        candidate_id,
        start_date,
        is_complete,
        position,
        first_name,
        last_name,
        completion_percent
      `)
      .eq('is_complete', false)
      .gte('start_date', now.toISOString().split('T')[0])
      .lte('start_date', in3Days.toISOString().split('T')[0]);

    if (queryError) {
      console.error('Error querying upcoming onboarding:', queryError);
      return NextResponse.json({
        error: 'Failed to query onboarding records',
        details: queryError.message,
      }, { status: 500 });
    }

    let remindedCount = 0;
    const errors: string[] = [];

    if (upcomingOnboarding && upcomingOnboarding.length > 0) {
      for (const onboarding of upcomingOnboarding) {
        try {
          const daysUntilStart = Math.ceil(
            (new Date(onboarding.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Determine urgency based on days remaining
          const isUrgent = daysUntilStart <= 1;
          const timeframe = daysUntilStart === 0
            ? 'today'
            : daysUntilStart === 1
              ? 'tomorrow'
              : `in ${daysUntilStart} days`;

          // Send notification to candidate
          const notificationResult = await createNotification({
            recipientId: onboarding.candidate_id,
            recipientType: 'candidate',
            type: 'onboarding_task_due',
            title: `Onboarding Deadline Reminder: ${onboarding.position}`,
            message: `Your onboarding for ${onboarding.position} is due ${timeframe}. You've completed ${onboarding.completion_percent}% of required tasks. Please complete all pending tasks before your start date.`,
            actionUrl: `/candidate/onboarding`,
            actionLabel: 'Complete Onboarding',
            relatedId: onboarding.id,
            relatedType: 'onboarding',
            isUrgent: isUrgent,
          });

          if (notificationResult.success) {
            remindedCount++;
          } else {
            errors.push(`Notification failed for onboarding ${onboarding.id}: ${notificationResult.error}`);
          }
        } catch (onboardingError) {
          errors.push(
            `Exception processing onboarding ${onboarding.id}: ${
              onboardingError instanceof Error ? onboardingError.message : 'Unknown error'
            }`
          );
        }
      }
    }

    console.log(`✅ Onboarding deadline reminder cron completed: ${remindedCount} reminders sent`);

    return NextResponse.json({
      success: true,
      reminded: remindedCount,
      processed: upcomingOnboarding?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Onboarding deadline reminder cron error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

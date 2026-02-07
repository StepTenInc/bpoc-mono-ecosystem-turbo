import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import NotificationService, { NotificationTemplates } from '@/lib/notifications/service';

/**
 * POST /api/cron/reminders
 *
 * Comprehensive reminder system for:
 * - Interview reminders (24h, 1h, 15m before)
 * - Offer expiration reminders (24h before)
 * - Day 1 start reminders (1 day before)
 * - Missed call notifications
 *
 * Run frequency: Every 15 minutes
 * Vercel Cron expression: (every 15 min)
 */
export async function POST(request: NextRequest) {
  // Verify Authorization (Critical for Cron)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const stats = {
      interviewReminders24h: 0,
      interviewReminders1h: 0,
      interviewReminders15m: 0,
      offerExpiringReminders: 0,
      dayOneReminders: 0,
      missedCallNotifications: 0,
      errors: [] as string[],
    };

    // ========================================
    // 1. INTERVIEW REMINDERS (24h before)
    // ========================================
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in24HoursEnd = new Date(in24Hours.getTime() + 15 * 60 * 1000); // 15-min window

    const { data: interviews24h, error: error24h } = await supabaseAdmin
      .from('job_interviews')
      .select(`
        id,
        scheduled_at,
        reminder_sent_24h,
        application:job_applications!inner(
          id,
          candidate_id,
          job:jobs!inner(
            title
          )
        )
      `)
      .eq('status', 'scheduled')
      .eq('reminder_sent_24h', false)
      .gte('scheduled_at', in24Hours.toISOString())
      .lt('scheduled_at', in24HoursEnd.toISOString());

    if (error24h) {
      stats.errors.push(`24h reminders: ${error24h.message}`);
    } else if (interviews24h && interviews24h.length > 0) {
      for (const interview of interviews24h) {
        const application = interview.application as any;
        const notification = NotificationTemplates.interviewReminder(
          application.candidate_id,
          interview.id,
          application.job.title,
          new Date(interview.scheduled_at),
          '24h'
        );

        const result = await NotificationService.create(notification);
        if (result.success) {
          // Mark as sent
          await supabaseAdmin
            .from('job_interviews')
            .update({ reminder_sent_24h: true })
            .eq('id', interview.id);

          stats.interviewReminders24h++;
        } else {
          stats.errors.push(`24h reminder failed for interview ${interview.id}`);
        }
      }
    }

    // ========================================
    // 2. INTERVIEW REMINDERS (1h before)
    // ========================================
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in1HourEnd = new Date(in1Hour.getTime() + 15 * 60 * 1000);

    const { data: interviews1h, error: error1h } = await supabaseAdmin
      .from('job_interviews')
      .select(`
        id,
        scheduled_at,
        reminder_sent_1h,
        application:job_applications!inner(
          id,
          candidate_id,
          job:jobs!inner(
            title
          )
        )
      `)
      .eq('status', 'scheduled')
      .eq('reminder_sent_1h', false)
      .gte('scheduled_at', in1Hour.toISOString())
      .lt('scheduled_at', in1HourEnd.toISOString());

    if (error1h) {
      stats.errors.push(`1h reminders: ${error1h.message}`);
    } else if (interviews1h && interviews1h.length > 0) {
      for (const interview of interviews1h) {
        const application = interview.application as any;
        const notification = NotificationTemplates.interviewReminder(
          application.candidate_id,
          interview.id,
          application.job.title,
          new Date(interview.scheduled_at),
          '1h'
        );

        const result = await NotificationService.create(notification);
        if (result.success) {
          await supabaseAdmin
            .from('job_interviews')
            .update({ reminder_sent_1h: true })
            .eq('id', interview.id);

          stats.interviewReminders1h++;
        } else {
          stats.errors.push(`1h reminder failed for interview ${interview.id}`);
        }
      }
    }

    // ========================================
    // 3. INTERVIEW REMINDERS (15m before)
    // ========================================
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
    const in15MinEnd = new Date(in15Min.getTime() + 15 * 60 * 1000);

    const { data: interviews15m, error: error15m } = await supabaseAdmin
      .from('job_interviews')
      .select(`
        id,
        scheduled_at,
        reminder_sent_15m,
        application:job_applications!inner(
          id,
          candidate_id,
          job:jobs!inner(
            title
          )
        )
      `)
      .eq('status', 'scheduled')
      .eq('reminder_sent_15m', false)
      .gte('scheduled_at', in15Min.toISOString())
      .lt('scheduled_at', in15MinEnd.toISOString());

    if (error15m) {
      stats.errors.push(`15m reminders: ${error15m.message}`);
    } else if (interviews15m && interviews15m.length > 0) {
      for (const interview of interviews15m) {
        const application = interview.application as any;
        const notification = NotificationTemplates.interviewReminder(
          application.candidate_id,
          interview.id,
          application.job.title,
          new Date(interview.scheduled_at),
          '15m'
        );

        const result = await NotificationService.create(notification);
        if (result.success) {
          await supabaseAdmin
            .from('job_interviews')
            .update({ reminder_sent_15m: true })
            .eq('id', interview.id);

          stats.interviewReminders15m++;
        } else {
          stats.errors.push(`15m reminder failed for interview ${interview.id}`);
        }
      }
    }

    // ========================================
    // 4. OFFER EXPIRING REMINDERS (24h before)
    // ========================================
    const { data: expiringOffers, error: errorOffers } = await supabaseAdmin
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
      .gte('expires_at', in24Hours.toISOString())
      .lt('expires_at', in24HoursEnd.toISOString());

    if (errorOffers) {
      stats.errors.push(`Offer expiry reminders: ${errorOffers.message}`);
    } else if (expiringOffers && expiringOffers.length > 0) {
      for (const offer of expiringOffers) {
        const application = offer.application as any;
        const notification = NotificationTemplates.offerExpiring(
          application.candidate_id,
          offer.id,
          application.job.title,
          new Date(offer.expires_at)
        );

        const result = await NotificationService.create(notification);
        if (result.success) {
          await supabaseAdmin
            .from('job_offers')
            .update({ expiry_reminder_sent: true })
            .eq('id', offer.id);

          stats.offerExpiringReminders++;
        } else {
          stats.errors.push(`Offer expiry reminder failed for offer ${offer.id}`);
        }
      }
    }

    // ========================================
    // 5. DAY 1 START REMINDERS (1 day before)
    // ========================================
    const tomorrow = new Date(now);
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const { data: startingTomorrow, error: errorDayOne } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        candidate_id,
        first_day_date,
        day_one_reminder_sent,
        job:jobs!inner(
          title
        )
      `)
      .eq('status', 'hired')
      .eq('day_one_reminder_sent', false)
      .gte('first_day_date', tomorrow.toISOString().split('T')[0])
      .lte('first_day_date', tomorrowEnd.toISOString().split('T')[0]);

    if (errorDayOne) {
      stats.errors.push(`Day 1 reminders: ${errorDayOne.message}`);
    } else if (startingTomorrow && startingTomorrow.length > 0) {
      for (const application of startingTomorrow) {
        const job = application.job as any;
        const notification = NotificationTemplates.dayOneReminder(
          application.candidate_id,
          application.id,
          job.title,
          new Date(application.first_day_date)
        );

        const result = await NotificationService.create(notification);
        if (result.success) {
          await supabaseAdmin
            .from('job_applications')
            .update({ day_one_reminder_sent: true })
            .eq('id', application.id);

          stats.dayOneReminders++;
        } else {
          stats.errors.push(`Day 1 reminder failed for application ${application.id}`);
        }
      }
    }

    // ========================================
    // 6. MISSED CALL NOTIFICATIONS
    // ========================================
    // Find video call rooms that:
    // - Status is 'waiting' (never answered)
    // - Created more than 60 seconds ago
    // - Missed call notification not sent
    const missedCallCutoff = new Date(now.getTime() - 60 * 1000);

    const { data: missedCalls, error: errorMissed } = await supabaseAdmin
      .from('video_call_rooms')
      .select(`
        id,
        participant_user_id,
        host_user_id,
        missed_call_notified,
        application:job_applications(
          id
        ),
        host:users!video_call_rooms_host_user_id_fkey(
          first_name,
          last_name
        )
      `)
      .eq('status', 'waiting')
      .eq('missed_call_notified', false)
      .lt('created_at', missedCallCutoff.toISOString());

    if (errorMissed) {
      stats.errors.push(`Missed calls: ${errorMissed.message}`);
    } else if (missedCalls && missedCalls.length > 0) {
      for (const call of missedCalls) {
        const host = call.host as any;
        const callerName = host ? `${host.first_name} ${host.last_name}` : 'Recruiter';

        const notification = NotificationTemplates.missedCall(
          call.participant_user_id,
          call.id,
          callerName
        );

        const result = await NotificationService.create(notification);
        if (result.success) {
          await supabaseAdmin
            .from('video_call_rooms')
            .update({
              missed_call_notified: true,
              status: 'failed', // Mark as failed since no one answered
            })
            .eq('id', call.id);

          stats.missedCallNotifications++;
        } else {
          stats.errors.push(`Missed call notification failed for room ${call.id}`);
        }
      }
    }

    // ========================================
    // RETURN RESULTS
    // ========================================
    console.log('✅ Reminder cron completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Reminder processing completed',
      stats,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error('Reminder cron error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Allow GET for manual testing in development
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return POST(request);
}

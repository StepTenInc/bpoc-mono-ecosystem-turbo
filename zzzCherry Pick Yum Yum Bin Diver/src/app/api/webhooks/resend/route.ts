import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/webhooks/resend
 * Handle Resend webhook events (opens, clicks, bounces, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('[Resend Webhook] Received event:', payload.type);

    const { type, data } = payload;

    // Extract email and find contact
    const email = data.to || data.email;

    if (!email) {
      console.warn('[Resend Webhook] No email found in payload');
      return NextResponse.json({ success: true }); // Don't fail, just log
    }

    // Find contact by email
    const { data: contact } = await supabaseAdmin
      .from('outbound_contacts')
      .select('id')
      .eq('email', email)
      .single();

    if (!contact) {
      console.warn(`[Resend Webhook] Contact not found for email: ${email}`);
      return NextResponse.json({ success: true }); // Don't fail
    }

    // Find campaign recipient (if applicable)
    // Note: Resend doesn't automatically send campaign_id, so we'll need to match by email/timestamp
    const { data: recentRecipient } = await supabaseAdmin
      .from('campaign_recipients')
      .select('id, campaign_id')
      .eq('contact_id', contact.id)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    // Handle different event types
    switch (type) {
      case 'email.sent':
      case 'email.delivered':
        await handleEmailDelivered(contact.id, recentRecipient, data);
        break;

      case 'email.opened':
        await handleEmailOpened(contact.id, recentRecipient, data);
        break;

      case 'email.clicked':
        await handleEmailClicked(contact.id, recentRecipient, data);
        break;

      case 'email.bounced':
        await handleEmailBounced(contact.id, recentRecipient, data);
        break;

      case 'email.complained':
      case 'email.unsubscribed':
        await handleEmailUnsubscribed(contact.id, recentRecipient, data);
        break;

      default:
        console.log(`[Resend Webhook] Unknown event type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    // Return 200 anyway to avoid Resend retrying
    return NextResponse.json({ success: true });
  }
}

/**
 * Handle email delivered event
 */
async function handleEmailDelivered(contactId: string, recipient: any, data: any) {
  if (recipient) {
    await supabaseAdmin
      .from('campaign_recipients')
      .update({
        delivered_at: new Date().toISOString(),
      })
      .eq('id', recipient.id);
  }

  await supabaseAdmin.from('email_activity_log').insert({
    contact_id: contactId,
    campaign_id: recipient?.campaign_id || null,
    recipient_id: recipient?.id || null,
    event_type: 'delivered',
    event_data: data,
  });
}

/**
 * Handle email opened event
 */
async function handleEmailOpened(contactId: string, recipient: any, data: any) {
  if (recipient) {
    await supabaseAdmin
      .from('campaign_recipients')
      .update({
        status: 'opened',
        opened_at: new Date().toISOString(),
      })
      .eq('id', recipient.id);
  }

  await supabaseAdmin.from('email_activity_log').insert({
    contact_id: contactId,
    campaign_id: recipient?.campaign_id || null,
    recipient_id: recipient?.id || null,
    event_type: 'opened',
    event_data: data,
    user_agent: data.user_agent,
    ip_address: data.ip_address,
  });
}

/**
 * Handle email clicked event
 */
async function handleEmailClicked(contactId: string, recipient: any, data: any) {
  if (recipient) {
    await supabaseAdmin
      .from('campaign_recipients')
      .update({
        status: 'clicked',
        clicked_at: new Date().toISOString(),
      })
      .eq('id', recipient.id);
  }

  await supabaseAdmin.from('email_activity_log').insert({
    contact_id: contactId,
    campaign_id: recipient?.campaign_id || null,
    recipient_id: recipient?.id || null,
    event_type: 'clicked',
    event_data: data,
    link_clicked: data.link || data.url,
    user_agent: data.user_agent,
    ip_address: data.ip_address,
  });
}

/**
 * Handle email bounced event
 */
async function handleEmailBounced(contactId: string, recipient: any, data: any) {
  const bounceType = data.bounce_type || 'hard'; // hard or soft

  if (recipient) {
    await supabaseAdmin
      .from('campaign_recipients')
      .update({
        status: 'bounced',
        bounced_at: new Date().toISOString(),
      })
      .eq('id', recipient.id);
  }

  // If hard bounce, mark email as invalid
  if (bounceType === 'hard') {
    await supabaseAdmin
      .from('outbound_contacts')
      .update({
        email_valid: false,
      })
      .eq('id', contactId);
  }

  await supabaseAdmin.from('email_activity_log').insert({
    contact_id: contactId,
    campaign_id: recipient?.campaign_id || null,
    recipient_id: recipient?.id || null,
    event_type: 'bounced',
    event_data: { ...data, bounce_type: bounceType },
    bounce_reason: data.reason || data.message,
  });
}

/**
 * Handle email unsubscribed/complained event
 */
async function handleEmailUnsubscribed(contactId: string, recipient: any, data: any) {
  // Mark contact as unsubscribed
  await supabaseAdmin
    .from('outbound_contacts')
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', contactId);

  await supabaseAdmin.from('email_activity_log').insert({
    contact_id: contactId,
    campaign_id: recipient?.campaign_id || null,
    recipient_id: recipient?.id || null,
    event_type: 'unsubscribed',
    event_data: data,
  });
}

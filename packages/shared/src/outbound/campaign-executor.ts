/**
 * Campaign Execution Engine
 * Handles batch sending of email campaigns with rate limiting
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { renderEmailTemplate } from './email-templates';

export interface CampaignExecutionResult {
  campaignId: string;
  totalRecipients: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Execute email campaign
 */
export async function executeCampaign(campaignId: string): Promise<CampaignExecutionResult> {
  console.log(`[Campaign] Starting execution for campaign ${campaignId}`);

  const result: CampaignExecutionResult = {
    campaignId,
    totalRecipients: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`);
    }

    // 2. Update campaign status to 'sending'
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    // 3. Get all pending recipients
    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from('campaign_recipients')
      .select(`
        id,
        contact_id,
        status,
        outbound_contacts (
          id,
          email,
          first_name,
          last_name,
          phone_number,
          is_registered,
          unsubscribed,
          email_valid
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (recipientsError) {
      throw new Error(`Failed to fetch recipients: ${recipientsError.message}`);
    }

    if (!recipients || recipients.length === 0) {
      console.log('[Campaign] No pending recipients found');
      await supabaseAdmin
        .from('email_campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
      return result;
    }

    result.totalRecipients = recipients.length;
    console.log(`[Campaign] Found ${recipients.length} pending recipients`);

    // 4. Send emails in batches
    const batchSize = campaign.batch_size || 50;
    const delayBetweenBatches = campaign.delay_between_batches || 5000;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(recipients.length / batchSize);

      console.log(`[Campaign] Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`);

      // Send batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(recipient => sendCampaignEmail(campaign, recipient))
      );

      // Process results
      for (let j = 0; j < batchResults.length; j++) {
        const batchResult = batchResults[j];
        const recipient = batch[j];
        const contact = recipient.outbound_contacts as any;

        if (batchResult.status === 'fulfilled') {
          const { sent, skipped } = batchResult.value;
          if (sent) {
            result.sent++;
          } else if (skipped) {
            result.skipped++;
          }
        } else {
          result.failed++;
          result.errors.push({
            email: contact?.email || 'unknown',
            error: batchResult.reason?.message || 'Unknown error',
          });
        }
      }

      // Wait before next batch (except for last batch)
      if (i + batchSize < recipients.length) {
        console.log(`[Campaign] Waiting ${delayBetweenBatches}ms before next batch...`);
        await sleep(delayBetweenBatches);
      }
    }

    // 5. Update campaign status to 'completed'
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    console.log(`[Campaign] Execution complete. Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`);

    return result;
  } catch (error: any) {
    console.error('[Campaign] Execution failed:', error);

    // Update campaign status to 'failed'
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'draft', // Revert to draft so it can be retried
      })
      .eq('id', campaignId);

    throw error;
  }
}

/**
 * Send individual campaign email to a recipient
 */
async function sendCampaignEmail(
  campaign: any,
  recipient: any
): Promise<{ sent: boolean; skipped: boolean }> {
  const contact = recipient.outbound_contacts;

  if (!contact) {
    throw new Error('Contact not found for recipient');
  }

  try {
    // 1. Check if contact should be skipped
    if (contact.unsubscribed) {
      console.log(`[Campaign] Skipping unsubscribed contact: ${contact.email}`);
      await updateRecipientStatus(recipient.id, 'skipped');
      await logEmailActivity({
        contact_id: contact.id,
        campaign_id: campaign.id,
        recipient_id: recipient.id,
        event_type: 'skipped',
        event_data: { reason: 'unsubscribed' },
      });
      return { sent: false, skipped: true };
    }

    if (!contact.email_valid) {
      console.log(`[Campaign] Skipping invalid email: ${contact.email}`);
      await updateRecipientStatus(recipient.id, 'skipped');
      await logEmailActivity({
        contact_id: contact.id,
        campaign_id: campaign.id,
        recipient_id: recipient.id,
        event_type: 'skipped',
        event_data: { reason: 'invalid_email' },
      });
      return { sent: false, skipped: true };
    }

    // Apply target filters if any
    if (campaign.target_filters) {
      const filters = campaign.target_filters;

      // Check is_registered filter
      if (filters.is_registered !== undefined && contact.is_registered !== filters.is_registered) {
        console.log(`[Campaign] Skipping due to registration filter: ${contact.email}`);
        await updateRecipientStatus(recipient.id, 'skipped');
        return { sent: false, skipped: true };
      }
    }

    // 2. Render email template
    const { html, subject } = renderEmailTemplate(
      campaign.email_html,
      {
        email: contact.email,
        firstName: contact.first_name,
        lastName: contact.last_name,
        phoneNumber: contact.phone_number,
      },
      campaign.subject
    );

    // 3. Send email via Resend
    const emailResult = await sendEmail({
      to: contact.email,
      subject,
      html,
      from: `${campaign.from_name} <${campaign.from_email}>`,
      replyTo: campaign.reply_to,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    // 4. Update recipient status to 'sent'
    await updateRecipientStatus(recipient.id, 'sent', null, subject, html);

    // 5. Update contact metrics
    await supabaseAdmin
      .from('outbound_contacts')
      .update({
        total_emails_sent: (contact.total_emails_sent || 0) + 1,
        last_email_sent_at: new Date().toISOString(),
        first_email_sent_at: contact.first_email_sent_at || new Date().toISOString(),
      })
      .eq('id', contact.id);

    // 6. Log activity
    await logEmailActivity({
      contact_id: contact.id,
      campaign_id: campaign.id,
      recipient_id: recipient.id,
      event_type: 'sent',
      subject,
      from_email: campaign.from_email,
      to_email: contact.email,
    });

    console.log(`[Campaign] Successfully sent to: ${contact.email}`);
    return { sent: true, skipped: false };
  } catch (error: any) {
    console.error(`[Campaign] Failed to send to ${contact.email}:`, error.message);

    // Update recipient status to 'failed'
    await updateRecipientStatus(recipient.id, 'failed', error.message);

    // Log failure
    await logEmailActivity({
      contact_id: contact.id,
      campaign_id: campaign.id,
      recipient_id: recipient.id,
      event_type: 'failed',
      event_data: { error: error.message },
      to_email: contact.email,
    });

    throw error;
  }
}

/**
 * Update campaign recipient status
 */
async function updateRecipientStatus(
  recipientId: string,
  status: string,
  errorMessage?: string | null,
  renderedSubject?: string,
  renderedHtml?: string
) {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'sent') {
    updates.sent_at = new Date().toISOString();
    if (renderedSubject) updates.rendered_subject = renderedSubject;
    if (renderedHtml) updates.rendered_html = renderedHtml;
  }

  if (status === 'failed' && errorMessage) {
    updates.error_message = errorMessage;
    updates.retry_count = supabaseAdmin.sql`retry_count + 1`;
  }

  await supabaseAdmin
    .from('campaign_recipients')
    .update(updates)
    .eq('id', recipientId);
}

/**
 * Log email activity
 */
async function logEmailActivity(data: {
  contact_id: string;
  campaign_id: string;
  recipient_id: string;
  event_type: string;
  event_data?: any;
  subject?: string;
  from_email?: string;
  to_email?: string;
}) {
  await supabaseAdmin.from('email_activity_log').insert({
    contact_id: data.contact_id,
    campaign_id: data.campaign_id,
    recipient_id: data.recipient_id,
    event_type: data.event_type,
    event_data: data.event_data || {},
    subject: data.subject,
    from_email: data.from_email,
    to_email: data.to_email,
  });
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pause a running campaign
 */
export async function pauseCampaign(campaignId: string): Promise<void> {
  await supabaseAdmin
    .from('email_campaigns')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
}

/**
 * Resume a paused campaign
 */
export async function resumeCampaign(campaignId: string): Promise<void> {
  await supabaseAdmin
    .from('email_campaigns')
    .update({
      status: 'sending',
      paused_at: null,
    })
    .eq('id', campaignId);

  // Re-execute campaign
  return executeCampaign(campaignId);
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { limit = 100, fromEmail = 'onboarding@resend.dev' } = body;

    // Get first X leads from carpet_bomb_leads
    const { data: leads, error } = await supabase
      .from('carpet_bomb_leads')
      .select('id, email, first_name, last_name')
      .eq('been_contacted', false)
      .limit(limit);

    if (error || !leads || leads.length === 0) {
      return NextResponse.json({ error: 'No leads found' }, { status: 404 });
    }

    console.log(`[Test Send] Sending to ${leads.length} leads...`);

    const results = {
      total: leads.length,
      sent: 0,
      failed: 0,
      details: [] as Array<{
        email: string;
        status: 'success' | 'failed';
        error?: string;
        messageId?: string;
      }>,
    };

    // Send emails one by one (slow but you can see progress)
    for (const lead of leads) {
      try {
        const { data, error: sendError } = await getResend().emails.send({
          from: fromEmail,
          to: lead.email,
          subject: '🎉 Your BPOC Account is Ready - Test Email',
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); padding: 40px; border-radius: 12px; text-align: center;">
                <h1 style="color: white; margin: 0;">Hi ${lead.first_name || 'there'}! 👋</h1>
              </div>

              <div style="padding: 30px; background: #f9fafb; border-radius: 12px; margin-top: 20px;">
                <h2 style="color: #1f2937;">This is a Test Email from BPOC</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  We're testing our email system. If you received this, it means our emails are working! 🎉
                </p>

                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Your email: <strong>${lead.email}</strong>
                </p>

                <a href="https://bpoc.com/signup?utm_source=email&utm_medium=test&utm_campaign=test_send"
                   style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold;">
                  Visit BPOC Platform
                </a>
              </div>

              <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
                <p>This is a test email from BPOC Platform</p>
                <p>© 2026 BPOC. All rights reserved.</p>
              </div>
            </body>
            </html>
          `,
        });

        if (sendError) {
          results.failed++;
          results.details.push({
            email: lead.email,
            status: 'failed',
            error: sendError.message,
          });
          console.error(`[Test Send] Failed: ${lead.email} - ${sendError.message}`);
        } else {
          results.sent++;
          results.details.push({
            email: lead.email,
            status: 'success',
            messageId: data?.id,
          });
          console.log(`[Test Send] Sent: ${lead.email}`);

          // Update lead as contacted (optional for test)
          await supabase
            .from('carpet_bomb_leads')
            .update({
              been_contacted: true,
              contact_count: 1,
              last_contacted_at: new Date().toISOString(),
              total_emails_sent: 1,
            })
            .eq('id', lead.id);
        }
      } catch (err: any) {
        results.failed++;
        results.details.push({
          email: lead.email,
          status: 'failed',
          error: err.message,
        });
        console.error(`[Test Send] Error: ${lead.email} - ${err.message}`);
      }
    }

    console.log(`[Test Send] Complete - Sent: ${results.sent}, Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Test send error:', error);
    return NextResponse.json(
      { error: error.message || 'Test send failed' },
      { status: 500 }
    );
  }
}

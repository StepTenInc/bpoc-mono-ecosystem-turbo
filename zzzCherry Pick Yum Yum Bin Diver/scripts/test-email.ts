/**
 * Script to test Resend email
 * Run with: npm run test-email your@email.com
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.RESEND_API_KEY;
const recipientEmail = process.argv[2];

if (!apiKey) {
  console.error('❌ RESEND_API_KEY not found in environment variables');
  console.error('Make sure .env.local has: RESEND_API_KEY=re_...');
  process.exit(1);
}

if (!recipientEmail) {
  console.error('❌ Please provide a test email address');
  console.error('Usage: npx tsx scripts/test-email.ts your@email.com');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function testEmail() {
  console.log('📧 Testing Resend email...\n');
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`Sending to: ${recipientEmail}\n`);

  try {
    const { data, error } = await resend.emails.send({
      from: 'BPOC Platform <onboarding@resend.dev>',
      to: recipientEmail,
      subject: 'Test Email from BPOC Platform',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Email Working!</h1>
              </div>
              <div class="content">
                <p>This is a test email from BPOC Platform.</p>
                <p>If you're seeing this, Resend is configured correctly!</p>
                <p><strong>Tested at:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log(`Email ID: ${data?.id}`);
    console.log(`\n📬 Check ${recipientEmail} for the test email`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testEmail();

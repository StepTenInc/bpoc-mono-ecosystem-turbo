/**
 * Test sending the invitation email directly
 */

import { sendTeamInvitationEmail } from '../src/lib/email';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testInvitationEmail() {
  console.log('📧 Testing invitation email sending...\n');

  console.log('Environment check:');
  console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : '❌ NOT SET');
  console.log();

  try {
    console.log('Attempting to send invitation email...');
    await sendTeamInvitationEmail(
      'stephena@shoreagents.com',
      'John Emmanuel Bulaon',
      'John Emmanuel Bulaon\'s Agency',
      'inv_1769581188601_2c3f04331d1c968243bb2a5090e585ed',
      'https://www.bpoc.io/recruiter/signup?invite=inv_1769581188601_2c3f04331d1c968243bb2a5090e585ed'
    );

    console.log('\n✅ Email sent successfully!');
    console.log('Check stephena@shoreagents.com for the invitation email.');
  } catch (error) {
    console.error('\n❌ Email sending failed!');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testInvitationEmail();

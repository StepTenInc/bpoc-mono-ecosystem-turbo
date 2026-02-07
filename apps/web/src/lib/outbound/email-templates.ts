/**
 * Email Template Rendering and Management
 */

export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  example: string;
}

export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  [key: string]: any;
}

/**
 * Available template variables
 */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    key: 'firstName',
    label: 'First Name',
    description: "Contact's first name",
    example: 'John',
  },
  {
    key: 'lastName',
    label: 'Last Name',
    description: "Contact's last name",
    example: 'Doe',
  },
  {
    key: 'email',
    label: 'Email',
    description: "Contact's email address",
    example: 'john@example.com',
  },
  {
    key: 'phoneNumber',
    label: 'Phone Number',
    description: "Contact's phone number",
    example: '+63 912 345 6789',
  },
];

/**
 * Render email template with contact data
 */
export function renderEmailTemplate(template: string, contact: ContactData, subject: string): {
  html: string;
  subject: string;
} {
  let renderedHtml = template;
  let renderedSubject = subject;

  // Replace variables in both HTML and subject
  const variables = {
    firstName: contact.firstName || 'there',
    lastName: contact.lastName || '',
    email: contact.email,
    phoneNumber: contact.phoneNumber || '',
    ...contact,
  };

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    renderedHtml = renderedHtml.replace(regex, String(value || ''));
    renderedSubject = renderedSubject.replace(regex, String(value || ''));
  }

  // Add unsubscribe link
  renderedHtml = renderedHtml.replace(
    '{unsubscribeLink}',
    `https://bpoc.com/unsubscribe?email=${encodeURIComponent(contact.email)}`
  );

  return {
    html: renderedHtml,
    subject: renderedSubject,
  };
}

/**
 * Pre-built email templates
 */

export const MIGRATION_TEMPLATE = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        margin: 0;
        padding: 0;
        background: #f3f4f6;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%);
        padding: 50px 30px;
        text-align: center;
      }
      .header h1 {
        color: white;
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .header p {
        color: rgba(255,255,255,0.95);
        margin: 10px 0 0 0;
        font-size: 18px;
      }
      .content {
        padding: 40px 30px;
      }
      .content p {
        margin: 16px 0;
        font-size: 16px;
        color: #374151;
      }
      .benefits {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 20px;
        margin: 30px 0;
        border-radius: 8px;
      }
      .benefits h3 {
        margin: 0 0 15px 0;
        color: #92400e;
        font-size: 18px;
      }
      .benefits ul {
        margin: 0;
        padding-left: 20px;
      }
      .benefits li {
        margin: 8px 0;
        color: #78350f;
      }
      .cta-button {
        display: inline-block;
        padding: 18px 40px;
        background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%);
        color: white !important;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 18px;
        margin: 30px 0;
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
      }
      .button-container {
        text-align: center;
      }
      .footer {
        text-align: center;
        padding: 30px;
        background: #f9fafb;
        color: #6b7280;
        font-size: 14px;
        border-top: 1px solid #e5e7eb;
      }
      .footer a {
        color: #f97316;
        text-decoration: none;
      }
      .stats {
        display: flex;
        justify-content: space-around;
        margin: 30px 0;
        padding: 20px;
        background: #f9fafb;
        border-radius: 12px;
      }
      .stat {
        text-align: center;
      }
      .stat-number {
        font-size: 32px;
        font-weight: 700;
        color: #f97316;
        display: block;
      }
      .stat-label {
        font-size: 14px;
        color: #6b7280;
        margin-top: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Welcome to BPOC!</h1>
        <p>Your career journey starts here</p>
      </div>

      <div class="content">
        <p>Hi {firstName},</p>

        <p><strong>Great news!</strong> We've migrated your profile to our brand new BPOC platform - the Philippines' premier BPO recruitment network.</p>

        <div class="stats">
          <div class="stat">
            <span class="stat-number">1000+</span>
            <span class="stat-label">Active Jobs</span>
          </div>
          <div class="stat">
            <span class="stat-number">17K+</span>
            <span class="stat-label">Candidates</span>
          </div>
          <div class="stat">
            <span class="stat-number">24/7</span>
            <span class="stat-label">AI Assistant</span>
          </div>
        </div>

        <div class="benefits">
          <h3>✨ What's New on BPOC:</h3>
          <ul>
            <li><strong>AI-Powered Job Matching</strong> - Get matched with perfect roles instantly</li>
            <li><strong>Resume Builder & Analysis</strong> - Professional resume tools powered by AI</li>
            <li><strong>Video Interviews</strong> - Schedule and complete interviews in-platform</li>
            <li><strong>Real-Time Notifications</strong> - Never miss an opportunity</li>
            <li><strong>24/7 HR Assistant</strong> - Get instant career advice anytime</li>
            <li><strong>Contract Signing</strong> - Accept offers and sign contracts digitally</li>
          </ul>
        </div>

        <p><strong>Your existing profile information has been securely transferred.</strong> Simply create your password and you're ready to explore thousands of BPO opportunities.</p>

        <div class="button-container">
          <a href="https://bpoc.com/auth/signup?email={email}" class="cta-button">
            Activate Your Account →
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          <strong>Next Steps:</strong><br>
          1. Click the button above to set your password<br>
          2. Complete your profile (takes 2 minutes)<br>
          3. Start applying to jobs immediately
        </p>
      </div>

      <div class="footer">
        <p><strong>BPOC Platform</strong> - Connecting BPO Talent with Opportunity</p>
        <p style="margin: 15px 0;">
          <a href="https://bpoc.com">Visit Website</a> •
          <a href="https://bpoc.com/how-it-works">How It Works</a> •
          <a href="mailto:support@bpoc.com">Support</a>
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
          This email was sent to {email}. If you no longer wish to receive emails,
          <a href="{unsubscribeLink}" style="color: #9ca3af;">unsubscribe here</a>.
        </p>
        <p style="margin-top: 15px;">© 2026 BPOC Platform. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

export const FOLLOW_UP_TEMPLATE = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      .urgency { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
      .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⏰ Don't Miss Out, {firstName}!</h1>
      </div>
      <div class="content">
        <p>Hi {firstName},</p>
        <p>We noticed you haven't activated your BPOC account yet. Here's what you're missing:</p>

        <div class="urgency">
          <p style="margin: 0; font-weight: bold;">🔥 Right Now on BPOC:</p>
          <ul style="margin: 10px 0;">
            <li>250+ new jobs posted this week</li>
            <li>Recruiters actively searching for talent</li>
            <li>Your profile could be matched TODAY</li>
          </ul>
        </div>

        <p><strong>It takes just 2 minutes to get started.</strong> Don't let other candidates grab the best opportunities first.</p>

        <p style="text-align: center;">
          <a href="https://bpoc.com/auth/signup?email={email}" class="button">Activate My Account Now →</a>
        </p>

        <p style="font-size: 14px; color: #6b7280;">
          Need help? Reply to this email or visit our <a href="https://bpoc.com/support">support center</a>.
        </p>
      </div>
      <div class="footer">
        <p>© 2026 BPOC Platform. All rights reserved.</p>
        <p style="font-size: 12px; margin-top: 10px;">
          <a href="{unsubscribeLink}">Unsubscribe</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;

export const JOB_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
      .job-card { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
      .job-title { font-size: 20px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0; }
      .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 15px 0; }
      .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎯 New Jobs Match Your Profile</h1>
      </div>
      <div class="content">
        <p>Hi {firstName},</p>
        <p>We found new job opportunities that match your skills and experience:</p>

        <!-- Job listings would be dynamically inserted here -->
        <div class="job-card">
          <div class="job-title">Customer Service Representative</div>
          <p style="margin: 5px 0; color: #6b7280;">Company Name • Manila • Full-time</p>
          <p>Looking for experienced CSRs with excellent communication skills...</p>
          <a href="https://bpoc.com/jobs/12345" class="button">View Job →</a>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <a href="https://bpoc.com/candidate/jobs" class="button">Browse All Jobs →</a>
        </p>
      </div>
      <div class="footer">
        <p>© 2026 BPOC Platform. All rights reserved.</p>
        <p style="font-size: 12px; margin-top: 10px;">
          <a href="{unsubscribeLink}">Unsubscribe from job alerts</a>
        </p>
      </div>
    </div>
  </body>
</html>
`;

/**
 * Get template by type
 */
export function getTemplateByType(type: string): string {
  switch (type) {
    case 'migration':
      return MIGRATION_TEMPLATE;
    case 'follow_up':
      return FOLLOW_UP_TEMPLATE;
    case 'job_alert':
      return JOB_ALERT_TEMPLATE;
    default:
      return MIGRATION_TEMPLATE;
  }
}

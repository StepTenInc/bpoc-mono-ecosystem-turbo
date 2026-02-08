import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Resend
 * @param options Email options
 * @returns Promise with email data or error
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, from, replyTo } = options;

  // Fallback to console.log in development if no API key
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] No RESEND_API_KEY found, logging email instead:');
    console.log(`[Email] To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] From: ${from || 'BPOC <noreply@yourdomain.com>'}`);
    console.log(`[Email] HTML:\n${html}`);
    return { success: false, error: 'No API key configured' };
  }

  try {
    const resend = getResendClient();
    const { data, error} = await resend.emails.send({
      from: from || 'BPOC Platform <noreply@bpoc.io>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
      replyTo: replyTo,
    });

    if (error) {
      console.error('[Email] Error sending email:', error);
      throw error;
    }

    console.log('[Email] Successfully sent email:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    throw error;
  }
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(
  toEmail: string,
  inviterName: string,
  agencyName: string,
  inviteToken: string,
  inviteUrl: string
) {
  console.log('[Email] Preparing team invitation email:', { toEmail, inviterName, agencyName });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited!</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${agencyName}</strong> on the BPOC recruiting platform.</p>
            <p>As a team member, you'll be able to:</p>
            <ul>
              <li>Manage job postings and applications</li>
              <li>Access the talent pool of pre-vetted candidates</li>
              <li>Schedule and conduct video interviews</li>
              <li>Track placements and performance metrics</li>
            </ul>
            <p style="text-align: center;">
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              ${inviteUrl}
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              This invitation will expire in 7 days.
            </p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `You're invited to join ${agencyName} on BPOC`,
    html,
  });
}

/**
 * Send job approval notification
 */
export async function sendJobApprovalEmail(
  toEmail: string,
  jobTitle: string,
  recruiterName: string,
  jobUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Job Approved!</h1>
          </div>
          <div class="content">
            <p>Great news!</p>
            <p>Your job posting "<strong>${jobTitle}</strong>" has been approved by ${recruiterName} and is now live on the platform.</p>
            <p>Candidates can now view and apply to this position. You'll receive notifications as applications come in.</p>
            <p style="text-align: center;">
              <a href="${jobUrl}" class="button">View Job Posting</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `Your job "${jobTitle}" has been approved`,
    html,
  });
}

/**
 * Send counter offer notification
 */
export async function sendCounterOfferEmail(
  toEmail: string,
  candidateName: string,
  jobTitle: string,
  counterAmount: number,
  offerUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💼 Counter Offer Received</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${candidateName}</strong> has submitted a counter offer for the <strong>${jobTitle}</strong> position.</p>
            <div class="highlight">
              <p style="margin: 0;"><strong>Counter Offer Amount:</strong></p>
              <p style="font-size: 24px; color: #f59e0b; margin: 10px 0; font-weight: bold;">₱${counterAmount.toLocaleString()}</p>
            </div>
            <p>Please review the counter offer and respond at your earliest convenience.</p>
            <p style="text-align: center;">
              <a href="${offerUrl}" class="button">Review Counter Offer</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `Counter offer from ${candidateName} for ${jobTitle}`,
    html,
  });
}

/**
 * Send interview reminder email
 */
export async function sendInterviewReminderEmail(
  toEmail: string,
  candidateName: string,
  interviewTime: string,
  interviewUrl: string,
  jobTitle: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .time-box { background: #ede9fe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #8b5cf6; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Interview Reminder</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>This is a reminder that you have an upcoming interview with <strong>${candidateName}</strong> for the <strong>${jobTitle}</strong> position.</p>
            <div class="time-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Interview Time:</p>
              <p style="font-size: 20px; color: #8b5cf6; margin: 10px 0; font-weight: bold;">${interviewTime}</p>
            </div>
            <p>Please make sure you're ready 5 minutes before the scheduled time.</p>
            <p style="text-align: center;">
              <a href="${interviewUrl}" class="button">Join Interview</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `Interview reminder: ${candidateName} - ${interviewTime}`,
    html,
  });
}

/**
 * Send contract ready notification
 */
export async function sendContractReadyEmail(
  toEmail: string,
  candidateName: string,
  jobTitle: string,
  contractUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Contract Ready to Sign</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>The employment contract for <strong>${candidateName}</strong> for the <strong>${jobTitle}</strong> position is ready for your review and signature.</p>
            <p>Please review the contract carefully and sign it to proceed with the hiring process.</p>
            <p style="text-align: center;">
              <a href="${contractUrl}" class="button">Review & Sign Contract</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `Contract ready to sign - ${candidateName}`,
    html,
  });
}

/**
 * Send application status update email
 */
export async function sendApplicationStatusEmail(
  toEmail: string,
  candidateName: string,
  jobTitle: string,
  status: string,
  message?: string
) {
  const statusConfig: Record<string, { color: string; icon: string; title: string }> = {
    under_review: { color: '#06b6d4', icon: '👀', title: 'Application Under Review' },
    shortlisted: { color: '#8b5cf6', icon: '⭐', title: 'You\'ve Been Shortlisted!' },
    interview_scheduled: { color: '#f59e0b', icon: '📅', title: 'Interview Scheduled' },
    offer_sent: { color: '#10b981', icon: '🎉', title: 'Offer Extended!' },
    hired: { color: '#10b981', icon: '🎊', title: 'Congratulations - You\'re Hired!' },
    rejected: { color: '#ef4444', icon: '❌', title: 'Application Update' },
  };

  const config = statusConfig[status] || statusConfig.under_review;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${config.color}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.icon} ${config.title}</h1>
          </div>
          <div class="content">
            <p>Hi ${candidateName},</p>
            <p>We have an update regarding your application for the <strong>${jobTitle}</strong> position.</p>
            ${message ? `<p>${message}</p>` : ''}
            <p>Thank you for your interest in this opportunity!</p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `Application update: ${jobTitle}`,
    html,
  });
}

/**
 * Send client job created notification (standard platform)
 */
export async function sendClientJobCreatedEmail(
  toEmail: string,
  clientName: string,
  jobTitle: string,
  recruiterName: string,
  dashboardUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .info-box { background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Your Job is Live!</h1>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p>Great news! Your job posting "<strong>${jobTitle}</strong>" is now live on the BPOC platform.</p>
            <p>Your recruiter <strong>${recruiterName}</strong> will screen candidates and share the best matches with you. You can track progress anytime using your dedicated job dashboard.</p>
            <div class="info-box">
              <p style="margin: 0; font-weight: bold;">📊 Track Your Job Progress:</p>
              <ul style="margin: 10px 0;">
                <li>View real-time applicant statistics</li>
                <li>See candidates released to you</li>
                <li>Join scheduled interviews</li>
                <li>Download resumes and profiles</li>
              </ul>
            </div>
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">View Job Dashboard</a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              💡 Tip: Bookmark this link for easy access throughout the hiring process!
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              Questions? Contact ${recruiterName} directly.
            </p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Recruitment Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `[BPOC] Your Job is Live: ${jobTitle}`,
    html,
  });
}

/**
 * Send client candidate released notification (standard platform)
 */
export async function sendClientCandidateReleasedEmail(
  toEmail: string,
  clientName: string,
  candidateName: string,
  candidateHeadline: string,
  jobTitle: string,
  recruiterName: string,
  dashboardUrl: string,
  candidateDirectUrl?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .candidate-card { background: white; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
          .button-secondary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👤 New Candidate Released!</h1>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p>Good news! Your recruiter <strong>${recruiterName}</strong> has released a new candidate for your review:</p>
            <div class="candidate-card">
              <h3 style="margin: 0 0 10px 0; color: #10b981;">👤 ${candidateName}</h3>
              <p style="margin: 0; color: #6b7280;">${candidateHeadline}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Position: ${jobTitle}</p>
            </div>
            <p>You can now view their complete profile, resume, work experience, and schedule interviews.</p>
            <p style="text-align: center;">
              ${candidateDirectUrl
                ? `<a href="${candidateDirectUrl}" class="button">View Candidate Profile</a>`
                : ''}
              <a href="${dashboardUrl}" class="button button-secondary">View Job Dashboard</a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              Your dashboard shows all released candidates and upcoming interviews in one place.
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              Questions? Contact ${recruiterName} directly.
            </p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Recruitment Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `[BPOC] New Candidate Released: ${candidateName}`,
    html,
  });
}

/**
 * Send client interview scheduled notification (standard platform)
 */
export async function sendClientInterviewScheduledEmail(
  toEmail: string,
  clientName: string,
  candidateName: string,
  jobTitle: string,
  interviewDateTime: string,
  interviewDuration: number,
  timezone: string,
  interviewJoinUrl: string,
  dashboardUrl: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .time-box { background: #ede9fe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #8b5cf6; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
          .button-secondary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
          .checklist { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Interview Scheduled!</h1>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p>An interview has been scheduled with <strong>${candidateName}</strong> for the <strong>${jobTitle}</strong> position.</p>
            <div class="time-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">📅 Interview Time:</p>
              <p style="font-size: 20px; color: #8b5cf6; margin: 10px 0; font-weight: bold;">${interviewDateTime}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">⏱️ Duration: ${interviewDuration} minutes</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">🌍 Timezone: ${timezone}</p>
            </div>
            <p style="text-align: center;">
              <a href="${interviewJoinUrl}" class="button">🎥 Join Interview</a>
              <a href="${dashboardUrl}" class="button button-secondary">View Dashboard</a>
            </p>
            <div class="checklist">
              <p style="margin: 0 0 10px 0; font-weight: bold;">📋 Before Joining:</p>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Test your camera and microphone</li>
                <li>Find a quiet location with good lighting</li>
                <li>Join 5 minutes early</li>
                <li>Have the candidate's resume handy</li>
              </ul>
            </div>
            <p style="font-size: 12px; color: #6b7280;">
              💡 The interview link becomes active 5 minutes before the scheduled time.
            </p>
          </div>
          <div class="footer">
            <p>© 2024 BPOC Recruitment Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `[BPOC] Interview Scheduled: ${candidateName}`,
    html,
  });
}

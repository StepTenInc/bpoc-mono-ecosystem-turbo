import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { generateCandidateToken } from '@/lib/client-tokens';
import { sendClientCandidateReleasedEmail } from '@/lib/email';

/**
 * POST /api/applications/[id]/release-to-client
 *
 * Release a candidate to the client (recruiter only)
 *
 * Body:
 * - sendEmail: boolean (default: true)
 * - generateDirectLink: boolean (default: false)
 * - notes: string (optional, internal notes)
 *
 * Returns:
 * - Updated application
 * - Job dashboard URL
 * - Candidate direct link (if generateDirectLink = true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json(
        { error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify recruiter
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id, role')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json(
        { error: 'Recruiter not found' },
        { status: 403 }
      );
    }

    const applicationId = params.id;
    const body = await request.json();
    const {
      sendEmail = true,
      generateDirectLink = false,
      notes = '',
    } = body;

    // Fetch application with job and client details
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        job_id,
        candidate_id,
        status,
        released_to_client,
        job:jobs!inner(
          id,
          title,
          agency_client_id,
          posted_by,
          agency_client:agency_clients!inner(
            id,
            agency_id,
            contact_name,
            contact_email,
            company:companies!inner(
              name
            )
          )
        ),
        candidate:candidates!inner(
          id,
          first_name,
          last_name,
          headline,
          email
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify the job belongs to the recruiter's agency
    if (application.job.agency_client.agency_id !== recruiter.agency_id) {
      return NextResponse.json(
        { error: 'You do not have permission to release this candidate' },
        { status: 403 }
      );
    }

    // Check if already released
    if (application.released_to_client) {
      return NextResponse.json(
        { error: 'Candidate already released to client' },
        { status: 400 }
      );
    }

    // Update application to mark as released
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        released_to_client: true,
        released_at: new Date().toISOString(),
        released_by: userId,
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error releasing candidate:', updateError);
      return NextResponse.json(
        { error: 'Failed to release candidate' },
        { status: 500 }
      );
    }

    // Get the job token for the dashboard URL
    const { data: jobToken } = await supabaseAdmin
      .from('client_job_access_tokens')
      .select('token')
      .eq('job_id', application.job_id)
      .eq('agency_client_id', application.job.agency_client_id)
      .single();

    if (!jobToken) {
      return NextResponse.json(
        { error: 'Job token not found. Please contact support.' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const jobDashboardUrl = `${baseUrl}/client/jobs/${jobToken.token}`;

    // Generate candidate direct link if requested
    let candidateDirectLink = null;
    if (generateDirectLink) {
      try {
        const candidateTokenData = await generateCandidateToken(
          applicationId,
          application.job.agency_client_id,
          userId,
          jobToken.token,
          30 // 30 days expiration
        );
        candidateDirectLink = candidateTokenData.candidateUrl;
      } catch (tokenError) {
        console.error('Failed to generate candidate token:', tokenError);
        // Continue anyway - direct link is optional
      }
    }

    // Send email notification (if requested)
    if (sendEmail && application.job.agency_client.contact_email) {
      try {
        // Get recruiter information
        const { data: recruiterUser } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();

        const recruiterName = recruiterUser
          ? `${recruiterUser.first_name} ${recruiterUser.last_name}`
          : 'Your Recruiter';

        await sendClientCandidateReleasedEmail(
          application.job.agency_client.contact_email,
          application.job.agency_client.contact_name || 'Client',
          `${application.candidate.first_name} ${application.candidate.last_name}`,
          application.candidate.headline || 'Candidate',
          application.job.title,
          recruiterName,
          jobDashboardUrl,
          candidateDirectLink || undefined
        );

        console.log('Candidate released email sent to:', application.job.agency_client.contact_email);
      } catch (emailError) {
        console.error('Failed to send candidate released email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      message: 'Candidate released to client successfully',
      application: {
        id: updatedApplication.id,
        releasedToClient: updatedApplication.released_to_client,
        releasedAt: updatedApplication.released_at,
        releasedBy: updatedApplication.released_by,
      },
      jobDashboardUrl,
      candidateDirectLink,
      emailSent: sendEmail && !!application.job.agency_client.contact_email,
    });
  } catch (error) {
    console.error('Error releasing candidate to client:', error);
    return NextResponse.json(
      { error: 'Failed to release candidate to client' },
      { status: 500 }
    );
  }
}

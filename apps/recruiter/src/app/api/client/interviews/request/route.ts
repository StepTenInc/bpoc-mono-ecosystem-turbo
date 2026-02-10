import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';
import { formatInPhilippinesTime } from '@/lib/timezone';

/**
 * POST /api/client/interviews/request
 *
 * Client requests an interview with a candidate
 *
 * Body:
 * - token: Job token
 * - application_id: Application ID
 * - proposedTimes: Array of ISO datetime strings (in client's local timezone)
 * - message: Optional message
 * - testMode: Optional - if true, allows instant meetings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, application_id, proposedTimes, message, testMode } = body;

    // Check for development/test mode
    const isTestMode = testMode === true || process.env.NODE_ENV === 'development';

    // Validate required fields
    if (!token || !application_id || !proposedTimes || !Array.isArray(proposedTimes) || proposedTimes.length < 1) {
      return NextResponse.json(
        { error: 'Token, application_id, and at least 1 proposed time are required' },
        { status: 400 }
      );
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired access link' },
        { status: 403 }
      );
    }

    // Verify application belongs to this job
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        job_id,
        candidate_id,
        released_to_client
      `)
      .eq('id', application_id)
      .eq('job_id', tokenData.jobId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Fetch candidate separately
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('first_name, last_name, email')
      .eq('id', application.candidate_id)
      .single();

    if (!application.released_to_client) {
      return NextResponse.json(
        { error: 'This candidate has not been released to you yet' },
        { status: 403 }
      );
    }

    // Get job and agency details for notifications + client timezone
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        agency_client_id,
        agency_clients!inner(
          id,
          agency_id,
          client_timezone,
          primary_contact_name,
          companies(name)
        )
      `)
      .eq('id', tokenData.jobId)
      .single();

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get client details from agency_clients (Supabase returns single object due to .single())
    const agencyClient = job.agency_clients as any;
    const clientTimezone = agencyClient?.client_timezone || 'Australia/Sydney';
    const clientName = agencyClient?.companies?.name || agencyClient?.primary_contact_name || 'Client';
    const agencyId = agencyClient?.agency_id;

    // Process proposed times - convert from client's local time to UTC
    // The times from client are already in their local time, we convert to UTC for storage
    const processedTimes = proposedTimes.map((time: string) => {
      const utcDate = new Date(time);
      const utcIso = utcDate.toISOString();
      
      // Calculate PH time display
      const phDisplay = formatInPhilippinesTime(utcIso) + ' (PHT)';
      
      // Calculate client local time display
      const clientLocalDisplay = utcDate.toLocaleString('en-US', {
        timeZone: clientTimezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ` (${clientTimezone.split('/').pop()?.replace('_', ' ') || clientTimezone})`;
      
      return {
        datetime_utc: utcIso,
        datetime_ph: phDisplay,
        datetime_client_local: clientLocalDisplay,
        timezone: clientTimezone,
      };
    });

    // Create interview record with pending status
    const firstProposedTime = new Date(proposedTimes[0]).toISOString();
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('job_interviews')
      .insert({
        application_id: application_id,
        interview_type: 'client_round_1',
        status: 'pending_scheduling',
        interviewer_notes: message || 'Client-requested interview',
        client_timezone: clientTimezone,
        scheduled_at: firstProposedTime, // Initial proposed time in UTC
        scheduled_at_ph: formatInPhilippinesTime(firstProposedTime) + ' (PHT)',
        scheduled_at_client_local: new Date(firstProposedTime).toLocaleString('en-US', {
          timeZone: clientTimezone,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }) + ` (${clientTimezone.split('/').pop()?.replace('_', ' ') || clientTimezone})`,
        duration_minutes: 30,
      })
      .select()
      .single();

    if (interviewError || !interview) {
      console.error('Failed to create interview:', interviewError);
      return NextResponse.json(
        { error: 'Failed to create interview request' },
        { status: 500 }
      );
    }

    // Store proposed times
    const { error: proposalError } = await supabaseAdmin
      .from('interview_time_proposals')
      .insert({
        interview_id: interview.id,
        proposed_times: processedTimes,
        status: 'pending',
        proposed_by: null, // Client portal users don't have user IDs
        metadata: {
          proposed_via: 'client_portal',
          message: message || null,
          client_timezone: clientTimezone,
          client_name: clientName,
          test_mode: isTestMode,
        },
      });

    if (proposalError) {
      console.error('Failed to store time proposals:', proposalError);
      // Continue anyway, interview is created
    }

    // Get all recruiters from the agency to notify
    const { data: recruiters } = await supabaseAdmin
      .from('agency_recruiters')
      .select('user_id')
      .eq('agency_id', agencyId)
      .eq('status', 'active');

    // Create notifications for recruiters
    if (recruiters && recruiters.length > 0) {
      const notifications = recruiters.map((recruiter: any) => ({
        user_id: recruiter.user_id,
        type: 'interview_request',
        title: 'Client Interview Request',
        message: `${clientName} has requested an interview with ${candidate?.first_name || ''} ${candidate?.last_name || ''} for ${job.title}`,
        link: `/recruiter/applications/${application_id}`,
        metadata: {
          application_id: application_id,
          interview_id: interview.id,
          job_id: job.id,
          proposed_times: processedTimes,
          client_message: message,
          client_timezone: clientTimezone,
        },
      }));

      await supabaseAdmin.from('notifications').insert(notifications);
    }

    // TODO: Send email notification to recruiters
    // This would integrate with your email service (Resend, SendGrid, etc.)

    return NextResponse.json({
      success: true,
      interview_id: interview.id,
      message: 'Interview request submitted successfully',
    });
  } catch (error) {
    console.error('Error creating interview request:', error);
    return NextResponse.json(
      { error: 'Failed to create interview request' },
      { status: 500 }
    );
  }
}

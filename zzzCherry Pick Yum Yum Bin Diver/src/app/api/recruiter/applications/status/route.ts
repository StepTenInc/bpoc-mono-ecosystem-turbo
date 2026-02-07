import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { createNotification } from '@/lib/notifications/service';
import { logApplicationActivity } from '@/lib/db/applications/queries.supabase';

/**
 * PATCH /api/recruiter/applications/status
 * Update application status
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    if (!userId) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    const { applicationId, status, notes } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing required field: applicationId' }, { status: 400 });
    }
    if (!status && notes === undefined) {
      return NextResponse.json({ error: 'Nothing to update (provide status and/or notes)' }, { status: 400 });
    }

    // Verify recruiter has access to this application
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Update application
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Allow notes-only updates without changing status
    if (!status) {
      delete updateData.status;
    }

    if (notes !== undefined) {
      updateData.recruiter_notes = notes;
    }

    // Any recruiter action that moves the application forward (or adds recruiter notes)
    // should stamp reviewed_by/reviewed_at.
    const shouldStampReviewed =
      (typeof status === 'string' &&
        status.length > 0 &&
        status !== 'submitted' &&
        status !== 'invited') ||
      notes !== undefined;
    if (shouldStampReviewed) {
      updateData.reviewed_by = recruiter.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    // Get current status before update for logging
    const { data: currentApp } = await supabaseAdmin
      .from('job_applications')
      .select('status')
      .eq('id', applicationId)
      .single();

    const oldStatus = currentApp?.status;

    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select(`
        *,
        job:jobs (
          id,
          title
        )
      `)
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // Log timeline activity for status change
    if (status && oldStatus !== status) {
      try {
        await logApplicationActivity(applicationId, {
          action_type: 'status_changed',
          performed_by_type: 'recruiter',
          performed_by_id: recruiter.id,
          description: `Status changed from "${oldStatus}" to "${status}"`,
          metadata: {
            old_status: oldStatus,
            new_status: status,
            recruiter_id: recruiter.id,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Failed to log status change:', logError);
        // Don't fail the request if logging fails
      }
    }

    // Log timeline activity for notes-only updates
    if (notes !== undefined && !status) {
      try {
        await logApplicationActivity(applicationId, {
          action_type: 'note_added',
          performed_by_type: 'recruiter',
          performed_by_id: recruiter.id,
          description: 'Recruiter added notes to application',
          metadata: {
            recruiter_id: recruiter.id,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Failed to log note addition:', logError);
        // Don't fail the request if logging fails
      }
    }

    // Send notification to candidate when status changes
    if (status && application.candidate_id) {
      const job = application.job as { id: string; title: string } | null;
      const jobTitle = job?.title || 'the position';

      let notificationMessage = '';
      let notificationTitle = '';

      switch (status) {
        case 'under_review':
          notificationTitle = 'Application Under Review';
          notificationMessage = `Your application for ${jobTitle} is now under review`;
          break;
        case 'shortlisted':
          notificationTitle = 'You\'ve Been Shortlisted!';
          notificationMessage = `Great news! You've been shortlisted for ${jobTitle}`;
          break;
        case 'rejected':
          notificationTitle = 'Application Status Updated';
          notificationMessage = `Your application for ${jobTitle} status has been updated`;
          break;
        case 'hired':
          notificationTitle = 'Congratulations!';
          notificationMessage = `Congratulations! You've been hired for ${jobTitle}`;
          break;
      }

      if (notificationMessage) {
        await createNotification({
          recipientId: application.candidate_id,
          recipientType: 'candidate',
          type: 'application_status_changed',
          title: notificationTitle,
          message: notificationMessage,
          actionUrl: `/candidate/applications/${application.id}`,
          relatedId: application.id,
          relatedType: 'application',
          isUrgent: status === 'hired' || status === 'shortlisted'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application updated',
      application
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST - Mark onboarding complete for an application
export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const applicationId = params.applicationId;

    // Verify application belongs to recruiter's agency
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        candidate_id,
        status,
        jobs (
          title,
          agency_clients (
            agency_id,
            companies (name)
          )
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    const appAgencyId = (application.jobs as any)?.agency_clients?.agency_id;

    if (!recruiter || recruiter.agency_id !== appAgencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all onboarding tasks
    const { data: tasks } = await supabaseAdmin
      .from('onboarding_tasks')
      .select('*')
      .eq('application_id', applicationId);

    const taskList = tasks || [];

    // Check if all required tasks are approved
    const requiredTasks = taskList.filter(t => t.is_required);
    const approvedRequiredTasks = requiredTasks.filter(t => t.status === 'approved');

    if (requiredTasks.length > 0 && approvedRequiredTasks.length < requiredTasks.length) {
      const incompleteTasks = requiredTasks.filter(t => t.status !== 'approved');
      return NextResponse.json({
        error: 'Cannot mark onboarding complete. Some required tasks are not approved.',
        incompleteTasks: incompleteTasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status
        }))
      }, { status: 400 });
    }

    // Update application
    await supabaseAdmin
      .from('job_applications')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    // Create activity timeline entry
    await supabaseAdmin
      .from('application_activity_timeline')
      .insert({
        application_id: applicationId,
        action_type: 'onboarding_complete',
        performed_by_type: 'recruiter',
        performed_by_id: user.id,
        description: 'Onboarding marked as complete',
      });

    // Send notification to candidate
    const candidateId = application.candidate_id;
    const jobTitle = (application.jobs as any)?.title;
    const companyName = (application.jobs as any)?.agency_clients?.companies?.name;

    if (candidateId) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: candidateId,
          type: 'onboarding_complete',
          title: 'Onboarding Complete! 🎉',
          message: `Congratulations! You've completed all onboarding requirements for ${jobTitle} at ${companyName}. You're all set for your first day!`,
          action_url: `/candidate/onboarding`,
          action_label: 'View Details',
          is_urgent: false,
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding marked as complete. Candidate has been notified.',
      completedTasks: taskList.filter(t => t.status === 'approved').length,
      totalTasks: taskList.length
    });

  } catch (error) {
    console.error('[Mark Onboarding Complete API] Error:', error);
    return NextResponse.json({ error: 'Failed to mark onboarding complete' }, { status: 500 });
  }
}

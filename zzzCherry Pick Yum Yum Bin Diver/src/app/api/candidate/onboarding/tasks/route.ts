import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

// GET - Fetch onboarding tasks for candidate's applications
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    // Get candidate's hired applications
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        job_id,
        jobs (
          title,
          agency_clients (
            companies (name)
          )
        )
      `)
      .eq('candidate_id', user.id)
      .in('status', ['hired', 'offer_accepted']);

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ tasks: [], progress: { total: 0, completed: 0, pending: 0 } });
    }

    const applicationIds = applications.map(a => a.id);

    // Get onboarding tasks for these applications
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('onboarding_tasks')
      .select('*')
      .in('application_id', applicationIds)
      .order('is_required', { ascending: false })
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const taskList = tasks || [];

    // Calculate progress
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter(t => t.status === 'approved').length;
    const pendingTasks = taskList.filter(t => ['pending', 'submitted'].includes(t.status)).length;
    const overdueTasks = taskList.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && !['approved', 'rejected'].includes(t.status);
    }).length;

    // Format response
    const formattedTasks = taskList.map(task => {
      const application = applications.find(a => a.id === task.application_id);
      return {
        id: task.id,
        applicationId: task.application_id,
        jobTitle: (application?.jobs as any)?.title || 'Unknown Job',
        company: (application?.jobs as any)?.agency_clients?.companies?.name || 'Unknown Company',
        taskType: task.task_type,
        title: task.title,
        description: task.description,
        isRequired: task.is_required,
        dueDate: task.due_date,
        status: task.status,
        submittedAt: task.submitted_at,
        reviewedAt: task.reviewed_at,
        reviewerNotes: task.reviewer_notes,
        createdAt: task.created_at,
      };
    });

    // Get onboarding status for Day One Confirmation button
    const { data: onboardingData } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('employment_started, employment_start_date, start_date')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      tasks: formattedTasks,
      progress: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      onboardingStatus: onboardingData ? {
        employmentStarted: onboardingData.employment_started || false,
        employmentStartDate: onboardingData.employment_start_date,
        startDate: onboardingData.start_date,
      } : null
    });

  } catch (error) {
    console.error('[Onboarding Tasks API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding tasks' }, { status: 500 });
  }
}

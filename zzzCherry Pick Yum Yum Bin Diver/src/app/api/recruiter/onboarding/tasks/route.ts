import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST - Create onboarding task for a hired candidate
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    const applicationId = request.nextUrl.searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId query parameter required' }, { status: 400 });
    }

    // Verify application belongs to recruiter's agency
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select('jobs(agency_clients(agency_id))')
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

    // Get all tasks for this application
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('onboarding_tasks')
      .select('*')
      .eq('application_id', applicationId)
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
    const pendingTasks = taskList.filter(t => t.status === 'pending').length;
    const submittedTasks = taskList.filter(t => t.status === 'submitted').length;
    const overdueTasks = taskList.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && !['approved', 'rejected'].includes(t.status);
    }).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      tasks: taskList.map(task => ({
        id: task.id,
        applicationId: task.application_id,
        taskType: task.task_type,
        title: task.title,
        description: task.description,
        isRequired: task.is_required,
        dueDate: task.due_date,
        status: task.status,
        submittedAt: task.submitted_at,
        reviewedAt: task.reviewed_at,
        reviewerNotes: task.reviewer_notes,
        attachments: task.attachments,
        formData: task.form_data,
        createdAt: task.created_at,
      })),
      progress: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        submitted: submittedTasks,
        overdue: overdueTasks,
        percentage: percentage
      }
    });

  } catch (error) {
    console.error('[Get Onboarding Tasks API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding tasks' }, { status: 500 });
  }
}

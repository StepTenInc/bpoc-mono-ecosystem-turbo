import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';


// GET - List all onboarding tasks platform-wide (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const agencyId = url.searchParams.get('agencyId');
    const candidateId = url.searchParams.get('candidateId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query for onboarding tasks
    let query = supabase
      .from('onboarding_tasks')
      .select(`
        *,
        job_applications (
          id,
          status,
          candidate_id,
          job_id,
          jobs (
            title,
            agency_clients (
              agency_id,
              agencies (name),
              companies (name)
            )
          )
        )
      `)
      .order('status', { ascending: true })
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Get candidate details for all tasks
    const candidateIds = (tasks || [])
      .map(t => t.job_applications?.candidate_id)
      .filter(Boolean) as string[];

    let candidates: any[] = [];
    if (candidateIds.length > 0) {
      const { data } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', candidateIds);
      candidates = data || [];
    }

    // Filter by agency if specified
    let filteredTasks = tasks || [];
    if (agencyId) {
      filteredTasks = filteredTasks.filter(t =>
        t.job_applications?.jobs?.agency_clients?.agency_id === agencyId
      );
    }

    // Filter by candidate if specified
    if (candidateId) {
      filteredTasks = filteredTasks.filter(t =>
        t.job_applications?.candidate_id === candidateId
      );
    }

    // Format response
    const formattedTasks = filteredTasks.map(task => {
      const application = task.job_applications;
      const candidate = candidates.find(c => c.id === application?.candidate_id);

      return {
        id: task.id,
        applicationId: task.application_id,
        candidateId: application?.candidate_id,
        candidateName: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
        candidateEmail: candidate?.email,
        candidateAvatar: candidate?.avatar_url,
        jobTitle: application?.jobs?.title || 'Unknown Job',
        agency: application?.jobs?.agency_clients?.agencies?.name || 'Unknown Agency',
        client: application?.jobs?.agency_clients?.companies?.name || 'Unknown Company',
        taskType: task.task_type,
        title: task.title,
        description: task.description,
        status: task.status,
        isRequired: task.is_required,
        dueDate: task.due_date,
        submittedAt: task.submitted_at,
        reviewedAt: task.reviewed_at,
        reviewerNotes: task.reviewer_notes,
        createdAt: task.created_at
      };
    });

    // Calculate platform-wide stats
    const { data: allTasks } = await supabase
      .from('onboarding_tasks')
      .select('status, due_date');

    const taskList = allTasks || [];
    const stats = {
      total: taskList.length,
      pending: taskList.filter(t => t.status === 'pending').length,
      submitted: taskList.filter(t => t.status === 'submitted').length,
      approved: taskList.filter(t => t.status === 'approved').length,
      rejected: taskList.filter(t => t.status === 'rejected').length,
      overdue: taskList.filter(t => {
        if (!t.due_date) return false;
        return new Date(t.due_date) < new Date() && !['approved', 'rejected'].includes(t.status);
      }).length
    };

    const totalCount = filteredTasks.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tasks: formattedTasks,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('[Admin Onboarding API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding tasks' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// PATCH - Review and approve/reject onboarding task submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const taskId = params.taskId;

    // Get the task with application details
    const { data: task, error: taskError } = await supabaseAdmin
      .from('onboarding_tasks')
      .select(`
        *,
        job_applications (
          id,
          candidate_id,
          jobs (
            title,
            agency_clients (
              agency_id,
              companies (name)
            )
          )
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify recruiter belongs to same agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', user.id)
      .single();

    const taskAgencyId = (task.job_applications as any)?.jobs?.agency_clients?.agency_id;

    if (!recruiter || recruiter.agency_id !== taskAgencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get candidate info
    const candidateId = (task.job_applications as any)?.candidate_id;
    let candidate = null;
    if (candidateId) {
      const { data: candidateData } = await supabaseAdmin
        .from('candidates')
        .select('id, first_name, last_name, email')
        .eq('id', candidateId)
        .single();
      candidate = candidateData;
    }

    return NextResponse.json({
      task: {
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
        signatureData: task.signature_data,
        acknowledgmentComplete: task.acknowledgment_complete,
        createdAt: task.created_at,
        // Context
        jobTitle: (task.job_applications as any)?.jobs?.title,
        company: (task.job_applications as any)?.jobs?.agency_clients?.companies?.name,
        candidate: candidate ? {
          id: candidate.id,
          name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
          email: candidate.email
        } : null
      }
    });

  } catch (error) {
    console.error('[Get Onboarding Task API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

// POST - Submit/complete an onboarding task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const taskId = params.id;
    const { formData, attachments, signatureData, acknowledgmentComplete } = await request.json();

    // Verify task belongs to this candidate
    const { data: task, error: taskError } = await supabaseAdmin
      .from('onboarding_tasks')
      .select('*, job_applications(candidate_id)')
      .eq('id', taskId)
      .single();

    if (taskError || !task || (task.job_applications as any)?.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task is already completed
    if (task.status === 'approved') {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 });
    }

    // Update task based on type
    const updateData: any = {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Handle different task types
    if (task.task_type === 'document_upload' && attachments) {
      updateData.attachments = attachments;
    }

    if (task.task_type === 'form_fill' && formData) {
      updateData.form_data = formData;
    }

    if (task.task_type === 'e_sign' && signatureData) {
      updateData.signature_data = signatureData;
    }

    if (task.task_type === 'acknowledgment' && acknowledgmentComplete) {
      updateData.acknowledgment_complete = true;
      // Auto-approve acknowledgments
      updateData.status = 'approved';
      updateData.reviewed_at = new Date().toISOString();
    }

    if (task.task_type === 'information') {
      // Auto-approve information tasks
      updateData.status = 'approved';
      updateData.reviewed_at = new Date().toISOString();
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('onboarding_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: 'Failed to submit task' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: updatedTask.id,
        status: updatedTask.status,
        submittedAt: updatedTask.submitted_at,
        reviewedAt: updatedTask.reviewed_at,
      },
      message: updatedTask.status === 'approved' ? 'Task completed!' : 'Task submitted for review'
    });

  } catch (error) {
    console.error('[Submit Onboarding Task API] Error:', error);
    return NextResponse.json({ error: 'Failed to submit task' }, { status: 500 });
  }
}

// GET - Fetch a specific onboarding task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    const taskId = params.id;

    // Fetch task with application details
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
              companies (name)
            )
          )
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task || (task.job_applications as any)?.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      task: {
        id: task.id,
        applicationId: task.application_id,
        jobTitle: (task.job_applications as any)?.jobs?.title,
        company: (task.job_applications as any)?.jobs?.agency_clients?.companies?.name,
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
      }
    });

  } catch (error) {
    console.error('[Get Onboarding Task API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

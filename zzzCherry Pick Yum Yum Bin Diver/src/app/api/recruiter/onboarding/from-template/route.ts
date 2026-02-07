import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * POST /api/recruiter/onboarding/from-template
 * Create onboarding tasks from a template
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, applicationId } = await request.json();

    if (!templateId || !applicationId) {
      return NextResponse.json({ 
        error: 'templateId and applicationId are required' 
      }, { status: 400 });
    }

    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id')
      .eq('user_id', auth.userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    // Get the template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('onboarding_task_templates')
      .select('*')
      .eq('id', templateId)
      .eq('agency_id', recruiter.agency_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get the application to ensure it belongs to the agency
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select('id, candidate_id, jobs!inner(agency_clients!inner(agency_id))')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify agency ownership
    const job = application.jobs as any;
    const agencyClient = job.agency_clients as any;
    if (agencyClient.agency_id !== recruiter.agency_id) {
      return NextResponse.json({ 
        error: 'Application does not belong to your agency' 
      }, { status: 403 });
    }

    // Create tasks from template
    const tasks = template.tasks as any[];
    const today = new Date();

    const taskInserts = tasks.map((task: any, index: number) => {
      const dueDate = new Date(today);
      if (task.due_days) {
        dueDate.setDate(dueDate.getDate() + task.due_days);
      }

      return {
        application_id: applicationId,
        title: task.title,
        description: task.instructions || '',
        type: task.type,
        is_required: task.is_required !== false,
        due_date: task.due_days ? dueDate.toISOString().split('T')[0] : null,
        assigned_to: application.candidate_id,
        order_index: index,
        status: 'pending',
      };
    });

    const { data: createdTasks, error: createError } = await supabaseAdmin
      .from('onboarding_tasks')
      .insert(taskInserts)
      .select();

    if (createError) {
      console.error('Error creating tasks from template:', createError);
      return NextResponse.json({ 
        error: 'Failed to create tasks',
        details: createError.message,
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Created ${createdTasks.length} onboarding tasks from template`,
      tasks: createdTasks,
    });

  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

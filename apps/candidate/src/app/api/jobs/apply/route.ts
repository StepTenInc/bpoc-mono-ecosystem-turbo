import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { createNotification } from '@/lib/notifications/service';

// POST - Candidate applies to a job
export async function POST(request: NextRequest) {
  try {
    const { jobId, resumeId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get the authorization header
    const user = await getUserFromRequest(request);

    // Check if candidate exists
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('id')
      .eq('id', user.id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, status, applicants_count')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'active') {
      return NextResponse.json({ error: 'This job is no longer accepting applications' }, { status: 400 });
    }

    // Check if already applied
    const { data: existingApp } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .eq('candidate_id', user.id)
      .eq('job_id', jobId)
      .single();

    if (existingApp) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 });
    }

    // Create application
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .insert({
        candidate_id: user.id,
        job_id: jobId,
        resume_id: resumeId || null,
        status: 'submitted',
      })
      .select()
      .single();

    if (appError) {
      console.error('Application error:', appError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // Update job applicants count
    await supabaseAdmin
      .from('jobs')
      .update({ applicants_count: (job.applicants_count || 0) + 1 })
      .eq('id', jobId);

    // Send notification to candidate
    await createNotification({
      recipientId: user.id,
      recipientType: 'candidate',
      type: 'application_submitted',
      title: 'Application Submitted',
      message: `Your application to ${job.title} has been submitted successfully`,
      actionUrl: `/candidate/applications/${application.id}`,
      relatedId: application.id,
      relatedType: 'application'
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Apply error:', error);
    return NextResponse.json({ error: 'Failed to apply' }, { status: 500 });
  }
}


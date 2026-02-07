import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// POST - Submit feedback for an interview
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewId, applicationId, rating, notes, outcome, token } = body;

    if (!interviewId || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: interviewId, token' },
        { status: 400 }
      );
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const jobId = tokenData.jobId;

    // Verify interview belongs to this job via application
    const { data: interview, error: intError } = await supabaseAdmin
      .from('job_interviews')
      .select(`
        id,
        application_id,
        job_applications!inner(job_id)
      `)
      .eq('id', interviewId)
      .single();

    if (intError || !interview || (interview as any).job_applications?.job_id !== jobId) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Update interview with feedback
    const updateData: any = {
      status: 'completed',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (rating) updateData.rating = rating;
    if (notes) updateData.interviewer_notes = notes;
    if (outcome) updateData.outcome = outcome; // 'passed', 'failed', 'needs_followup'

    const { data: updatedInterview, error: updateError } = await supabaseAdmin
      .from('job_interviews')
      .update(updateData)
      .eq('id', interviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating interview:', updateError);
      return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
    }

    // Update application status based on outcome
    const appId = applicationId || interview.application_id;
    if (appId && outcome) {
      let newStatus = 'interviewed';
      if (outcome === 'passed') newStatus = 'interviewed';
      if (outcome === 'failed') newStatus = 'rejected';

      await supabaseAdmin
        .from('job_applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appId);
    }

    return NextResponse.json({ interview: updatedInterview, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

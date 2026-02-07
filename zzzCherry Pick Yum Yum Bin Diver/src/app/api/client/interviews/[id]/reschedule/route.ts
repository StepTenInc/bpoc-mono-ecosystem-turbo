import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// POST - Reschedule an interview
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: interviewId } = params;
    const body = await request.json();
    const { token, newDate, newTime, timezone } = body;

    if (!token || !newDate || !newTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const jobId = tokenData.jobId;

    // Verify interview belongs to this job
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

    // Calculate new scheduled time
    const scheduledAt = new Date(`${newDate}T${newTime}`);
    
    // Update interview
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('job_interviews')
      .update({
        scheduled_at: scheduledAt.toISOString(),
        client_timezone: timezone || 'Asia/Manila',
        scheduled_at_client_local: `${newDate}T${newTime}`,
        status: 'scheduled',
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rescheduling interview:', updateError);
      return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 });
    }

    // Update application status
    await supabaseAdmin
      .from('job_applications')
      .update({ status: 'interview_scheduled' })
      .eq('id', interview.application_id);

    return NextResponse.json({ 
      success: true,
      interview: updated,
      message: 'Interview rescheduled successfully' 
    });
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// POST - Cancel an interview
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: interviewId } = await context.params;
    const body = await request.json();
    const { token, reason } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const jobId = tokenData.job_id;

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

    // Cancel interview
    const { error: updateError } = await supabaseAdmin
      .from('job_interviews')
      .update({
        status: 'cancelled',
        interviewer_notes: reason ? `Cancelled: ${reason}` : 'Cancelled by client',
      })
      .eq('id', interviewId);

    if (updateError) {
      console.error('Error cancelling interview:', updateError);
      return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
    }

    // Reset application status back to shortlisted
    await supabaseAdmin
      .from('job_applications')
      .update({ status: 'shortlisted' })
      .eq('id', interview.application_id);

    return NextResponse.json({ 
      success: true,
      message: 'Interview cancelled' 
    });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    // Find their hired application
    const { data: hiredApplication, error: findError } = await supabaseAdmin
      .from('job_applications')
      .select('id, started_status, first_day_date')
      .eq('candidate_id', user.id)
      .eq('status', 'hired')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Error finding hired application:', findError);
      return NextResponse.json({ error: 'Failed to find placement' }, { status: 500 });
    }

    if (!hiredApplication) {
      return NextResponse.json({ error: 'No hired application found' }, { status: 404 });
    }

    // Check if already confirmed
    if (hiredApplication.started_status === 'started') {
      return NextResponse.json({
        message: 'Day 1 already confirmed',
        alreadyConfirmed: true
      });
    }

    // Update started_status to 'started'
    const { error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        started_status: 'started',
        updated_at: new Date().toISOString()
      })
      .eq('id', hiredApplication.id);

    if (updateError) {
      console.error('Error updating started_status:', updateError);
      return NextResponse.json({ error: 'Failed to confirm Day 1' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Day 1 confirmed successfully! Congratulations on starting your new role.',
      startedStatus: 'started',
      confirmedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error confirming Day 1:', error);
    return NextResponse.json({ error: 'Failed to confirm Day 1' }, { status: 500 });
  }
}

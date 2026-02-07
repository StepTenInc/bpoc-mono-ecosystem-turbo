import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userIdHeader = request.headers.get('x-user-id');

    if (!authHeader?.startsWith('Bearer ') || !userIdHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing credentials' },
        { status: 401 }
      );
    }

    const candidateId = userIdHeader;

    // Fetch all pending interview proposals for the candidate
    const { data: proposals, error } = await supabaseAdmin
      .from('interview_time_proposals')
      .select(`
        id,
        proposed_times,
        status,
        created_at,
        interviews!inner(
          id,
          interview_type,
          duration_minutes,
          notes,
          job_applications!inner(
            id,
            candidate_id,
            jobs(
              id,
              title
            )
          )
        )
      `)
      .eq('interviews.job_applications.candidate_id', candidateId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch interview proposals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch interview proposals' },
        { status: 500 }
      );
    }

    // Format proposals
    const formattedProposals = (proposals || []).map((proposal: any) => {
      const interview = proposal.interviews;
      const application = interview?.job_applications;
      const job = application?.jobs;

      return {
        id: proposal.id,
        applicationId: application?.id,
        jobTitle: job?.title || 'Interview',
        interviewType: interview?.interview_type || 'interview',
        duration: interview?.duration_minutes || 60,
        proposedTimes: proposal.proposed_times || [],
        notes: interview?.notes,
        status: proposal.status,
        createdAt: proposal.created_at,
      };
    });

    return NextResponse.json({
      proposals: formattedProposals,
      total: formattedProposals.length,
    });
  } catch (error) {
    console.error('Error in get interview proposals endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

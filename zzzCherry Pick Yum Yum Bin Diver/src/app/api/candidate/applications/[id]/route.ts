import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

/**
 * GET /api/candidate/applications/:id
 * Fetch a single application for the logged-in candidate, including any
 * call artifacts explicitly shared with the candidate.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);

    const { id } = await params;

    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs(
          id,
          title,
          agency_clients(
            agencies(name),
            companies(name)
          )
        )
      `)
      .eq('id', id)
      .eq('candidate_id', user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Fetch all calls for this application, then filter by candidate sharing flags
    const { data: calls } = await supabaseAdmin
      .from('video_call_rooms')
      .select(`
        id,
        daily_room_name,
        daily_room_url,
        call_type,
        call_title,
        status,
        notes,
        rating,
        share_with_candidate,
        started_at,
        ended_at,
        duration_seconds,
        created_at,
        recordings:video_call_recordings(
          id,
          recording_url,
          download_url,
          duration_seconds,
          status,
          shared_with_candidate,
          created_at
        ),
        transcripts:video_call_transcripts(
          id,
          full_text,
          summary,
          key_points,
          word_count,
          status,
          shared_with_candidate,
          created_at
        )
      `)
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    const filteredCalls = (calls || [])
      .map((c: any) => {
        const shareAll =
          typeof c.share_with_candidate === 'boolean'
            ? !!c.share_with_candidate
            : false;

        // Only return calls that are explicitly shared
        if (!shareAll) return null;

        const safe = { ...c };
        return safe;
      })
      .filter(Boolean);

    return NextResponse.json({
      application: {
        ...application,
        calls: filteredCalls,
      },
    });
  } catch (error) {
    console.error('Error in candidate application detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



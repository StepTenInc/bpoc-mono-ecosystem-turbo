import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: stats, error } = await supabase
      .from('disc_personality_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching DISC stats:', error);
      return NextResponse.json({ error: 'Failed to fetch DISC stats' }, { status: 500 });
    }

    if (!stats) {
      return NextResponse.json({ stats: null });
    }

    return NextResponse.json({
      stats: {
        primary_type: stats.latest_primary_type,
        secondary_type: stats.latest_secondary_type,
        d_score: stats.latest_d_score || 0,
        i_score: stats.latest_i_score || 0,
        s_score: stats.latest_s_score || 0,
        c_score: stats.latest_c_score || 0,
        total_sessions: stats.total_sessions || 0,
        completed_sessions: stats.completed_sessions || 0,
        last_taken_at: stats.last_taken_at,
        total_xp: stats.total_xp || 0,
        badges_earned: stats.badges_earned || 0,
        ai_assessment: stats.latest_ai_assessment,
        bpo_roles: stats.latest_bpo_roles,
        confidence_score: stats.best_confidence_score,
        percentile: stats.percentile,
      }
    });
  } catch (error) {
    console.error('Error fetching DISC stats:', error);
    return NextResponse.json({ error: 'Failed to fetch DISC stats' }, { status: 500 });
  }
}

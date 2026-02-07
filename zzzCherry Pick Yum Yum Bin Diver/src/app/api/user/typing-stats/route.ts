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
      .from('typing_hero_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching typing stats:', error);
      return NextResponse.json({ error: 'Failed to fetch typing stats' }, { status: 500 });
    }

    if (!stats) {
      return NextResponse.json({ stats: null });
    }

    return NextResponse.json({
      stats: {
        best_wpm: stats.best_wpm || 0,
        best_accuracy: stats.best_accuracy ? Number(stats.best_accuracy) : 0,
        best_score: stats.best_score || 0,
        best_streak: stats.best_streak || 0,
        latest_wpm: stats.latest_wpm || 0,
        latest_accuracy: stats.latest_accuracy ? Number(stats.latest_accuracy) : 0,
        total_sessions: stats.total_sessions || 0,
        completed_sessions: stats.completed_sessions || 0,
        last_played_at: stats.last_played_at,
        avg_wpm: stats.avg_wpm ? Number(stats.avg_wpm) : 0,
        avg_accuracy: stats.avg_accuracy ? Number(stats.avg_accuracy) : 0,
        total_play_time: stats.total_play_time || 0,
        ai_analysis: stats.ai_analysis,
        vocabulary_strengths: stats.vocabulary_strengths,
        vocabulary_weaknesses: stats.vocabulary_weaknesses,
      }
    });
  } catch (error) {
    console.error('Error fetching typing stats:', error);
    return NextResponse.json({ error: 'Failed to fetch typing stats' }, { status: 500 });
  }
}

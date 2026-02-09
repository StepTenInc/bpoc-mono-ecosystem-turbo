import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/analytics/link-session
 * Link anonymous session to authenticated user after signup/login
 */
export async function POST(request: NextRequest) {
  try {
    const { anonSessionId, userId } = await request.json();

    if (!anonSessionId || !userId) {
      return NextResponse.json({ 
        error: 'Missing anonSessionId or userId' 
      }, { status: 400 });
    }

    // Update all events from this anonymous session to link to user
    const { error: eventsError } = await supabaseAdmin
      .from('analytics_events')
      .update({ user_id: userId })
      .eq('anon_session_id', anonSessionId)
      .is('user_id', null);

    if (eventsError) {
      console.error('Failed to link events:', eventsError);
    }

    // Update anonymous_sessions table if exists
    const { error: sessionError } = await supabaseAdmin
      .from('anonymous_sessions')
      .update({ 
        claimed_by: userId,
        claimed_at: new Date().toISOString()
      })
      .eq('anon_session_id', anonSessionId)
      .is('claimed_by', null);

    if (sessionError) {
      console.error('Failed to link session:', sessionError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Session linked to user'
    });

  } catch (error) {
    console.error('Link session error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

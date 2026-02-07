import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/anon/session
 * Upsert anonymous session payload (resume extract, analysis, games, etc.)
 * Body: { anon_session_id: string, channel?: string, email?: string, payload?: any }
 */
export async function POST(request: NextRequest) {
  try {
    const { anon_session_id, channel, email, payload } = await request.json()

    if (!anon_session_id) {
      return NextResponse.json({ error: 'anon_session_id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('anonymous_sessions')
      .upsert(
        {
          anon_session_id,
          channel: channel || null,
          email: email || null,
          payload: payload ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'anon_session_id' }
      )

    if (error) {
      console.error('Anon session upsert error:', error)
      return NextResponse.json({ error: 'Failed to upsert anon session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Anon session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



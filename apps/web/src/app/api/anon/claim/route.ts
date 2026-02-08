import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/anon/claim
 * Claims anonymous session data for the authenticated user.
 * Migrates resume analysis data when applicable.
 * Headers: Authorization bearer + x-user-id required
 * Body: { anon_session_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const userId = request.headers.get('x-user-id')
    if (!sessionToken || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { anon_session_id } = await request.json()
    if (!anon_session_id) {
      return NextResponse.json({ error: 'anon_session_id is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('anonymous_sessions')
      .select('*')
      .eq('anon_session_id', anon_session_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'No anonymous session found' }, { status: 404 })
    }

    // Check if already claimed
    if (data.claimed_by) {
      return NextResponse.json({
        error: 'Session already claimed',
        claimed_by: data.claimed_by,
        claimed_at: data.claimed_at
      }, { status: 400 })
    }

    const payload = data.payload || {}
    const channel = data.channel

    // Track analytics data migration
    let analyticsMigrated = false
    if (channel === 'analytics-tracking' && payload.analytics) {
      analyticsMigrated = true
      console.log(`✅ Analytics data available for user ${userId}:`, {
        totalEvents: payload.analytics.total_events,
        pageViews: payload.analytics.page_views?.length || 0,
        firstSeen: payload.analytics.first_seen,
        lastSeen: payload.analytics.last_seen
      })
    }

    if (channel === 'marketing-resume-analyzer') {
      try {
        const analysis = payload.analysis || {}
        await supabaseAdmin
          .from('candidate_ai_analysis')
          .insert({
            candidate_id: userId,
            session_id: anon_session_id,
            overall_score: analysis.score || 65,
            key_strengths: analysis.highlights || [],
            improvements: analysis.improvements || [],
            section_analysis: {
              extractedName: analysis.extractedName,
              extractedEmail: analysis.extractedEmail,
              extractedTitle: analysis.extractedTitle,
              experienceYears: analysis.experienceYears,
              skillsFound: analysis.skillsFound || []
            },
            files_analyzed: [{
              fileName: payload.fileName,
              fileSize: payload.fileSize,
              processedAt: payload.processedAt
            }],
            analysis_metadata: {
              grade: analysis.grade,
              summary: analysis.summary,
              extractedTextLength: payload.extractedText?.length || 0
            }
          })
        console.log(`✅ Migrated resume analysis for user ${userId} from anon session ${anon_session_id}`)
      } catch (migrateError) {
        console.error('❌ Failed to migrate resume analysis:', migrateError)
        // Continue to mark as claimed even if migration fails
      }
    }

    // ALWAYS claim chat conversations for this anonymous session (regardless of channel)
    // This ensures chat history is never lost when users sign up
    try {
      const { data: claimedChats, error: chatClaimError } = await supabaseAdmin
        .from('chat_agent_conversations')
        .update({
          user_id: userId,
          user_type: 'candidate',
          // Keep anon_session_id for audit trail
        })
        .eq('anon_session_id', anon_session_id)
        .is('user_id', null)
        .select('id')

      if (claimedChats && claimedChats.length > 0) {
        console.log(`✅ Claimed ${claimedChats.length} chat conversation(s) for user ${userId} from anon session ${anon_session_id}`)
      }
      if (chatClaimError) {
        console.error('⚠️ Error claiming chat conversations:', chatClaimError)
      }
    } catch (chatError) {
      console.error('❌ Failed to claim chat conversations:', chatError)
      // Continue - don't fail the whole claim process
    }

    // Mark session as claimed
    const { error: updateError } = await supabaseAdmin
      .from('anonymous_sessions')
      .update({
        claimed_by: userId,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('anon_session_id', anon_session_id)

    if (updateError) {
      console.error('Anon claim update error:', updateError)
      return NextResponse.json({ error: 'Failed to claim session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payload: data.payload,
      channel: data.channel,
      email: data.email,
      migrated: channel === 'marketing-resume-analyzer',
      analyticsMigrated
    })
  } catch (error) {
    console.error('Anon claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



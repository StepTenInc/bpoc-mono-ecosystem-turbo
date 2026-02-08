import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
// Game assessments removed
import { getCandidateById, createCandidate } from '@/lib/db/candidates'

/**
 * POST /api/anon/claim-all
 * Automatically claims all anonymous sessions for the authenticated user.
 * Claims sessions by:
 * 1. anon_session_id from localStorage (passed in body)
 * 2. Email matching (if email was provided in anonymous_sessions)
 * Headers: Authorization bearer + x-user-id required
 * Body: { anon_session_ids?: string[], email?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const userId = request.headers.get('x-user-id')
    if (!sessionToken || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { anon_session_ids, email } = await request.json()

    // Get user email from auth if not provided
    let userEmail = email
    if (!userEmail) {
      const { data: authUser } = await supabaseAdmin.auth.getUser(sessionToken)
      userEmail = authUser?.user?.email || null
    }

    console.log('🔍 Claiming anonymous sessions:', {
      userId,
      userEmail,
      anon_session_ids,
      hasAnonIds: anon_session_ids && Array.isArray(anon_session_ids) && anon_session_ids.length > 0
    })

    // Find all unclaimed anonymous sessions
    let query = supabaseAdmin
      .from('anonymous_sessions')
      .select('*')
      .is('claimed_by', null)

    // Filter by anon_session_ids if provided
    if (anon_session_ids && Array.isArray(anon_session_ids) && anon_session_ids.length > 0) {
      query = query.in('anon_session_id', anon_session_ids)
      console.log('🔍 Searching by anon_session_ids:', anon_session_ids)
    } else if (userEmail) {
      // Or filter by email if available
      query = query.eq('email', userEmail)
      console.log('🔍 Searching by email:', userEmail)
    } else {
      // If no identifiers provided, try to find recent unclaimed sessions (last 24 hours)
      // This is a fallback for cases where localStorage was cleared
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)
      query = query.gte('created_at', yesterday.toISOString())
      console.log('🔍 Searching for recent unclaimed sessions (last 24 hours)')
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('❌ Error fetching anonymous sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    if (!sessions || sessions.length === 0) {
      console.log('⚠️ No unclaimed anonymous sessions found')
      return NextResponse.json({ 
        success: true, 
        claimed: 0, 
        message: 'No unclaimed anonymous sessions found' 
      })
    }

    console.log(`📋 Found ${sessions.length} unclaimed anonymous session(s) to claim`)

    // Ensure candidate record exists (candidate_id = user_id in Supabase)
    let candidate = await getCandidateById(userId, true)
    if (!candidate) {
      console.log('⚠️ Candidate record not found, creating one...')
      try {
        // Get user email from auth
        const { data: authUser } = await supabaseAdmin.auth.getUser(sessionToken)
        if (!authUser?.user?.email) {
          return NextResponse.json({ error: 'User email not found' }, { status: 400 })
        }
        
        // Create candidate record
        candidate = await createCandidate({
          id: userId,
          email: authUser.user.email,
          first_name: authUser.user.user_metadata?.first_name || authUser.user.email.split('@')[0],
          last_name: authUser.user.user_metadata?.last_name || '',
          phone: authUser.user.user_metadata?.phone || null,
          avatar_url: authUser.user.user_metadata?.avatar_url || null,
        })
        console.log('✅ Candidate record created:', candidate.id)
      } catch (createError) {
        console.error('❌ Failed to create candidate record:', createError)
        return NextResponse.json({ error: 'Failed to create candidate record' }, { status: 500 })
      }
    }

    let claimedCount = 0
    let migratedCount = 0
    const errors: string[] = []

    // Claim each session
    for (const session of sessions) {
      try {
        const payload = session.payload || {}
        const channel = session.channel

        // Game data migration removed - games no longer part of platform
        if (channel === 'marketing-resume-analyzer') {
          try {
            const analysis = payload.analysis || {}
            await supabaseAdmin
              .from('candidate_ai_analysis')
              .insert({
                candidate_id: userId,
                session_id: session.anon_session_id,
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
            migratedCount++
            console.log(`✅ Auto-migrated resume analysis for user ${userId} from session ${session.anon_session_id}`)
          } catch (migrateError) {
            console.error(`❌ Failed to migrate resume analysis for session ${session.anon_session_id}:`, migrateError)
            errors.push(`Resume analysis migration failed for ${session.anon_session_id}`)
          }
        } else if (channel === 'analytics-tracking') {
          try {
            // Analytics data is already stored in the session payload
            // We keep it there for reference but log that we captured it
            const analyticsData = payload.analytics || {}
            migratedCount++
            console.log(`✅ Captured analytics data for user ${userId} from session ${session.anon_session_id}:`, {
              totalEvents: analyticsData.total_events || 0,
              pageViews: analyticsData.page_views?.length || 0,
              firstSeen: analyticsData.first_seen,
              lastSeen: analyticsData.last_seen
            })
          } catch (migrateError) {
            console.error(`❌ Failed to capture analytics for session ${session.anon_session_id}:`, migrateError)
            errors.push(`Analytics capture failed for ${session.anon_session_id}`)
          }
        }

        // Mark session as claimed
        const { error: updateError } = await supabaseAdmin
          .from('anonymous_sessions')
          .update({
            claimed_by: userId,
            claimed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('anon_session_id', session.anon_session_id)

        if (updateError) {
          console.error(`❌ Failed to claim session ${session.anon_session_id}:`, updateError)
          errors.push(`Claim failed for ${session.anon_session_id}`)
        } else {
          claimedCount++
        }
      } catch (sessionError) {
        console.error(`❌ Error processing session ${session.anon_session_id}:`, sessionError)
        errors.push(`Processing failed for ${session.anon_session_id}`)
      }
    }

    return NextResponse.json({ 
      success: true, 
      claimed: claimedCount,
      migrated: migratedCount,
      total: sessions.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Claimed ${claimedCount} of ${sessions.length} anonymous sessions${migratedCount > 0 ? `, migrated ${migratedCount} game assessments` : ''}`
    })
  } catch (error) {
    console.error('Anon claim-all error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


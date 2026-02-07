import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/user/claim-anon-resume
 * Takes anonymous resume/analysis payload from localStorage and saves it
 * to the authenticated candidate's records.
 *
 * Expects Authorization bearer token + x-user-id headers (middleware sets x-user-id).
 * Body should include:
 * {
 *   extractedData: {...},           // raw/extracted resume data
 *   improvedResume?: {...},         // optional improved resume data
 *   analysisPayload?: {...},        // payload used for /ai-analysis/save
 *   analysis?: {...},               // analysis result (scores, recommendations, etc.)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const userId = request.headers.get('x-user-id')

    if (!sessionToken || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { extractedData, improvedResume, analysisPayload, analysis } = body || {}

    if (!extractedData && !improvedResume && !analysisPayload) {
      return NextResponse.json({ error: 'No data to claim' }, { status: 400 })
    }

    // 1) Upsert resume (use improvedResume if provided, else extractedData)
    const resumeData = improvedResume || extractedData
    if (resumeData) {
      const { error: resumeError } = await supabaseAdmin
        .from('candidate_resumes')
        .upsert({
          candidate_id: userId,
          resume_data: resumeData,
          is_primary: true,
          is_public: false,
          slug: `${userId}-claimed-${Date.now()}`
        }, {
          onConflict: 'candidate_id'
        })

      if (resumeError) {
        console.error('❌ Claim: failed to save resume', resumeError)
        // Do not fail the entire claim; proceed to analysis
      }
    }

    // 2) Insert analysis if provided
    if (analysisPayload || analysis) {
      const payload = analysisPayload || {}
      const sessionId = payload.session_id || `analysis-${userId}-${Date.now()}`

      const { error: analysisError } = await supabaseAdmin
        .from('candidate_ai_analysis')
        .insert({
          candidate_id: userId,
          session_id: sessionId,
          overall_score: payload.overall_score ?? analysis?.overallScore ?? null,
          ats_compatibility_score: payload.ats_compatibility_score ?? analysis?.atsCompatibility ?? null,
          content_quality_score: payload.content_quality_score ?? analysis?.contentQuality ?? null,
          professional_presentation_score: payload.professional_presentation_score ?? analysis?.professionalPresentation ?? null,
          skills_alignment_score: payload.skills_alignment_score ?? null,
          key_strengths: payload.key_strengths ?? analysis?.keyStrengths ?? [],
          strengths_analysis: payload.strengths_analysis ?? {},
          improvements: payload.improvements ?? analysis?.improvements ?? [],
          recommendations: payload.recommendations ?? analysis?.recommendations ?? [],
          section_analysis: payload.section_analysis ?? {},
          improved_summary: payload.improved_summary ?? analysis?.improvedSummary ?? null,
          salary_analysis: payload.salary_analysis ?? null,
          career_path: payload.career_path ?? null,
          candidate_profile_snapshot: payload.candidate_profile_snapshot ?? null,
          skills_snapshot: payload.skills_snapshot ?? analysis?.skills ?? [],
          experience_snapshot: payload.experience_snapshot ?? analysis?.experience ?? [],
          education_snapshot: payload.education_snapshot ?? analysis?.education ?? [],
          analysis_metadata: {
            ...(payload.analysis_metadata || {}),
            claimed_at: new Date().toISOString(),
            source: 'anonymous-claim',
          },
          portfolio_links: payload.portfolio_links ?? null,
          files_analyzed: payload.files_analyzed ?? null,
        })

      if (analysisError) {
        console.error('❌ Claim: failed to save analysis', analysisError)
        // Still return success because resume may have been saved
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Claim anon resume error:', error)
    return NextResponse.json(
      { error: 'Failed to claim anonymous resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



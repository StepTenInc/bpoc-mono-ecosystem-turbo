import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCandidateById } from '@/lib/db/candidates'
import { syncAllFromAnalysis } from '@/lib/db/candidates/sync-from-analysis'

/**
 * POST /api/candidates/ai-analysis/save
 * Save AI analysis to candidate_ai_analysis table and sync to structured tables
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [POST /api/candidates/ai-analysis/save] Starting...')
    
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const userId = request.headers.get('x-user-id')
    if (!sessionToken || !userId) {
      // Anonymous flow: skip DB persistence but return success so UX can proceed
      return NextResponse.json({
        success: true,
        saved: false,
        reason: 'anonymous_session'
      })
    }

    // Verify candidate exists
    const candidate = await getCandidateById(userId, true)
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      session_id,
      resume_id,
      overall_score,
      ats_compatibility_score,
      content_quality_score,
      professional_presentation_score,
      skills_alignment_score,
      key_strengths,
      strengths_analysis,
      improvements,
      recommendations,
      section_analysis,
      improved_summary,
      salary_analysis,
      career_path,
      candidate_profile_snapshot,
      skills_snapshot,
      experience_snapshot,
      education_snapshot,
      analysis_metadata,
      portfolio_links,
      files_analyzed,
    } = body

    if (!session_id || overall_score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, overall_score' },
        { status: 400 }
      )
    }

    console.log('💾 Saving AI analysis to Supabase:', {
      candidate_id: userId,
      session_id,
      overall_score,
      has_skills_snapshot: !!skills_snapshot,
      has_experience_snapshot: !!experience_snapshot,
      has_education_snapshot: !!education_snapshot,
    })

    // Save to candidate_ai_analysis table (insert new record per session)
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('candidate_ai_analysis')
      .insert({
        candidate_id: userId,
        resume_id: resume_id || null,
        session_id,
        overall_score,
        ats_compatibility_score: ats_compatibility_score || null,
        content_quality_score: content_quality_score || null,
        professional_presentation_score: professional_presentation_score || null,
        skills_alignment_score: skills_alignment_score || null,
        key_strengths: key_strengths || [],
        strengths_analysis: strengths_analysis || {},
        improvements: improvements || [],
        recommendations: recommendations || [],
        section_analysis: section_analysis || {},
        improved_summary: improved_summary || null,
        salary_analysis: salary_analysis || null,
        career_path: career_path || null,
        candidate_profile_snapshot: candidate_profile_snapshot || null,
        skills_snapshot: skills_snapshot || null,
        experience_snapshot: experience_snapshot || null,
        education_snapshot: education_snapshot || null,
        analysis_metadata: analysis_metadata || null,
        portfolio_links: portfolio_links || null,
        files_analyzed: files_analyzed || null,
      })
      .select()
      .single()

    if (analysisError) {
      console.error('❌ Error saving AI analysis:', analysisError)
      return NextResponse.json(
        { 
          error: 'Failed to save AI analysis',
          details: analysisError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ AI analysis saved successfully:', analysis.id)

    // Sync to structured tables (skills, work_experiences, educations)
    try {
      await syncAllFromAnalysis(userId, {
        skills_snapshot: skills_snapshot,
        experience_snapshot: experience_snapshot,
        education_snapshot: education_snapshot,
      })
      console.log('✅ Structured data synced successfully')
    } catch (syncError) {
      console.error('⚠️ Error syncing structured data (non-critical):', syncError)
      // Don't fail the request if sync fails - analysis is still saved
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        candidate_id: analysis.candidate_id,
        session_id: analysis.session_id,
        overall_score: analysis.overall_score,
      }
    })
  } catch (error) {
    console.error('❌ Error saving AI analysis:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { saveResume } from '@/lib/db/resumes'
import { getCandidateById } from '@/lib/db/candidates'
import { getSessionToken } from '@/lib/auth-helpers'

/**
 * POST /api/candidates/resume/save
 * Save resume to Supabase candidate_resumes table
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [POST /api/candidates/resume/save] Starting resume save...')
    
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { resume_data, template_used, title, slug, is_primary, is_public } = body

    if (!resume_data) {
      return NextResponse.json(
        { error: 'Missing required field: resume_data' },
        { status: 400 }
      )
    }

    // Get user ID from middleware (set by middleware.ts)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found. Please ensure you are authenticated.' },
        { status: 401 }
      )
    }

    // Verify candidate exists
    const candidate = await getCandidateById(userId, true)
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    console.log('💾 Saving resume to Supabase:', {
      candidate_id: userId,
      has_resume_data: !!resume_data,
      template_used,
      title,
      slug
    })

    // Save resume to Supabase
    const resume = await saveResume({
      candidate_id: userId,
      resume_data: resume_data,
      slug: slug || null,
      title: title || 'My Resume',
      is_primary: is_primary ?? true,
      is_public: is_public ?? false,
    })

    console.log('✅ Resume saved successfully:', resume.id)

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        slug: resume.slug,
        title: title || 'My Resume',
      },
      resumeUrl: resume.slug ? `/resume/${resume.slug}` : null
    })
  } catch (error) {
    console.error('❌ Error saving resume:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


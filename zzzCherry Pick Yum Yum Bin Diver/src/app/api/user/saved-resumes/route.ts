import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResumeByCandidateId, deleteResume } from '@/lib/db/resumes'
import { getCandidateById } from '@/lib/db/candidates'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Verify candidate exists - use admin client to bypass RLS
    const candidate = await getCandidateById(userId, true)
    if (!candidate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get resume from Supabase
    const resume = await getResumeByCandidateId(userId)

    if (resume) {
      return NextResponse.json({
        success: true,
        hasSavedResume: true,
        id: resume.id,
        resumeId: resume.id,
        resumeSlug: resume.slug,
        resumeTitle: resume.title || 'Resume',
        resumeUrl: resume.slug ? `/resume/${resume.slug}` : '/resume-builder'
      })
    } else {
      return NextResponse.json({
        success: true,
        hasSavedResume: false,
        resumeUrl: '/resume-builder'
      })
    }
  } catch (error) {
    console.error('❌ Error checking saved resumes:', error)
    return NextResponse.json(
      { error: 'Failed to check saved resumes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete resume from Supabase
    await deleteResume(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting saved resumes:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved resumes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



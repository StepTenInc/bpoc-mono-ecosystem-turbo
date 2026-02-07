import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/get-saved-resume/[slug]
 * Fetch a public resume by its slug for viewing
 * Uses Supabase with candidates table (NOT old Railway database)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    console.log('🔍 Getting saved resume for slug:', slug)

    if (!slug) {
      return NextResponse.json(
        { error: 'Resume slug is required' },
        { status: 400 }
      )
    }

    // Get the resume from candidate_resumes
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('candidate_resumes')
      .select(`
        id,
        candidate_id,
        slug,
        title,
        resume_data,
        generated_data,
        template_used,
        is_public,
        view_count,
        created_at,
        updated_at
      `)
      .eq('slug', slug)
      .single()

    if (resumeError || !resume) {
      console.log('❌ Resume not found for slug:', slug, resumeError?.message)
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Get candidate info
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url
      `)
      .eq('id', resume.candidate_id)
      .single()

    // Get candidate profile for additional info (location, position)
    const { data: profile } = await supabaseAdmin
      .from('candidate_profiles')
      .select(`
        location,
        position,
        location_city,
        location_country
      `)
      .eq('candidate_id', resume.candidate_id)
      .single()

    console.log('✅ Resume found:', resume.title)

    // Increment view count (non-blocking)
    supabaseAdmin
      .from('candidate_resumes')
      .update({ view_count: (resume.view_count || 0) + 1 })
      .eq('id', resume.id)
      .then(() => console.log('👁️ View count incremented'))
      .catch(err => console.warn('⚠️ Failed to increment view count:', err))

    // Use generated_data if available, otherwise use resume_data
    const resumeContent = resume.generated_data || resume.resume_data || {}

    // Build location string from profile
    const locationString = profile?.location || 
      (profile?.location_city && profile?.location_country 
        ? `${profile.location_city}, ${profile.location_country}` 
        : profile?.location_city || '')

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        userId: resume.candidate_id,
        slug: resume.slug,
        title: resume.title,
        data: resumeContent,
        template: resume.template_used || resumeContent.selectedTemplate || 'modern',
        isPublic: resume.is_public,
        viewCount: resume.view_count || 0,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at,
        user: {
          fullName: resumeContent.name || candidate?.full_name || 'Unknown User',
          avatarUrl: resumeContent.profilePhoto || candidate?.avatar_url || null,
          email: resumeContent.email || candidate?.email || '',
          phone: resumeContent.phone || candidate?.phone || '',
          location: resumeContent.location || locationString || '',
          position: resumeContent.bestJobTitle || profile?.position || ''
        }
      }
    })

  } catch (error) {
    console.error('❌ Error getting saved resume:', error)
    return NextResponse.json(
      {
        error: 'Failed to get saved resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

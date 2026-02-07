import { NextRequest, NextResponse } from 'next/server'
import { getResumeByCandidateId } from '@/lib/db/resumes'
import { getCandidateById } from '@/lib/db/candidates'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/candidates/resume/save-generated
 * Save generated resume data to candidate_resumes.generated_data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [POST /api/candidates/resume/save-generated] Starting...')
    
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { generated_data, template_used, generation_metadata } = body

    if (!generated_data) {
      return NextResponse.json(
        { error: 'Missing required field: generated_data' },
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

    console.log('👤 Checking candidate for user:', userId)

    // Verify candidate exists
    const candidate = await getCandidateById(userId, true)
    console.log('🔍 getCandidateById result:', candidate ? 'FOUND' : 'NOT FOUND', { userId })
    
    if (!candidate) {
      // Try direct Supabase query to debug
      const { data: directCheck, error: directError } = await supabaseAdmin
        .from('candidates')
        .select('id, email')
        .eq('id', userId)
        .single()
      
      console.error('❌ Candidate not found. Direct check result:', { 
        directCheck, 
        directError: directError?.message,
        userId 
      })
      
      return NextResponse.json(
        { 
          error: 'Candidate not found. Please ensure your account is fully set up.',
          details: `User ${userId} exists in auth but not in candidates table. Try signing out and back in.`,
          debug: { directCheck, directError: directError?.message }
        },
        { status: 404 }
      )
    }

    console.log('💾 Saving generated resume data to Supabase:', {
      candidate_id: userId,
      has_generated_data: !!generated_data,
      template_used
    })

    // Check if resume exists, if not create one
    let existingResume = await getResumeByCandidateId(userId)
    
    if (existingResume) {
      // Update existing resume with generated_data
      const { data: resume, error } = await supabaseAdmin
        .from('candidate_resumes')
        .update({
          generated_data: generated_data,
          template_used: template_used || null,
          generation_metadata: generation_metadata || null,
        })
        .eq('candidate_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update resume: ${error.message}`)
      }

      console.log('✅ Generated resume data updated:', resume.id)
      return NextResponse.json({
        success: true,
        resume: {
          id: resume.id,
          slug: resume.slug,
        }
      })
    } else {
      // Create new resume with generated_data
      const { data: resume, error } = await supabaseAdmin
        .from('candidate_resumes')
        .insert({
          candidate_id: userId,
          generated_data: generated_data,
          resume_data: {}, // Empty for now, will be filled when final save happens
          template_used: template_used || null,
          generation_metadata: generation_metadata || null,
          title: generated_data?.name ? `${generated_data.name}'s Resume` : 'Resume',
          slug: `${userId.slice(0,8)}-${Date.now()}`,
          is_primary: true,
          is_public: true, // Public so it can be shared!
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create resume: ${error.message}`)
      }

      console.log('✅ Generated resume data created:', resume.id)
      return NextResponse.json({
        success: true,
        resume: {
          id: resume.id,
          slug: resume.slug,
        }
      })
    }
  } catch (error) {
    console.error('❌ Error saving generated resume:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save generated resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCandidateById } from '@/lib/db/candidates'

// Helper function to trigger match generation (non-blocking)
async function triggerMatchGeneration(userId: string) {
  try {
    console.log('🎯 Triggering match generation for candidate:', userId)

    // Get candidate data from candidate_truth view
    const { data: candidateData, error: candidateError } = await supabaseAdmin
      .from('candidate_truth')
      .select('*')
      .eq('id', userId)
      .single()

    if (candidateError || !candidateData) {
      console.log('⚠️ Could not fetch candidate truth for matching:', candidateError?.message)
      return
    }

    // Get active jobs
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .limit(50)

    if (jobsError || !jobs?.length) {
      console.log('⚠️ No active jobs found for matching')
      return
    }

    // Get job skills
    const jobIds = jobs.map(j => j.id)
    const { data: allJobSkills } = await supabaseAdmin
      .from('job_skills')
      .select('job_id, skill_name')
      .in('job_id', jobIds)

    const skillsByJob = new Map()
    allJobSkills?.forEach(skill => {
      if (!skillsByJob.has(skill.job_id)) {
        skillsByJob.set(skill.job_id, [])
      }
      skillsByJob.get(skill.job_id).push({ skill_name: skill.skill_name })
    })

    jobs.forEach(job => {
      job.job_skills = skillsByJob.get(job.id) || []
    })

    // Import and use matching service dynamically
    const { calculateJobMatch, saveJobMatch } = await import('@/lib/matching/match-service')

    let matchesGenerated = 0

    for (const jobData of jobs) {
      try {
        const candidate = {
          id: candidateData.id,
          skills: Array.isArray(candidateData.skills) ? candidateData.skills : [],
          work_experiences: Array.isArray(candidateData.work_experiences) ? candidateData.work_experiences : [],
          expected_salary_min: candidateData.expected_salary_min,
          expected_salary_max: candidateData.expected_salary_max,
          experience_years: candidateData.experience_years || 0,
          preferred_shift: candidateData.preferred_shift,
          preferred_work_setup: candidateData.preferred_work_setup,
          work_status: candidateData.work_status,
        }

        const job = {
          id: jobData.id,
          title: jobData.title,
          description: jobData.description || '',
          requirements: jobData.requirements,
          salary_min: jobData.salary_min,
          salary_max: jobData.salary_max,
          currency: jobData.currency || 'PHP',
          skills: jobData.job_skills?.map((s: any) => s.skill_name) || [],
          work_arrangement: jobData.work_arrangement,
          shift: jobData.shift,
        }

        const matchResult = await calculateJobMatch(candidate, job)
        await saveJobMatch(userId, jobData.id, matchResult)
        matchesGenerated++

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (err) {
        console.error('Match error for job', jobData.id, err)
      }
    }

    console.log(`✅ Generated ${matchesGenerated} job matches for candidate ${userId}`)
  } catch (error) {
    console.error('❌ Error generating matches:', error)
  }
}


/**
 * POST /api/save-resume
 * Save extracted resume data to candidate_resumes table
 * Called by processResumeFile in utils.ts during extraction
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [POST /api/save-resume] Starting...')

    const { resumeData, originalFilename } = await request.json()
    console.log('📥 Received data:', {
      hasResumeData: !!resumeData,
      originalFilename,
      resumeDataKeys: resumeData ? Object.keys(resumeData) : null
    })

    if (!resumeData) {
      console.log('❌ Missing resumeData')
      return NextResponse.json(
        { error: 'Missing required field: resumeData' },
        { status: 400 }
      )
    }

    // Get the user from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    console.log('👤 User ID from headers:', userId)

    if (!userId) {
      console.log('❌ No user ID found in headers')
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Check if candidate exists
    const candidate = await getCandidateById(userId, true)
    if (!candidate) {
      console.log('❌ Candidate not found:', userId)
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    console.log('✅ Candidate found')

    // Generate slug
    const slug = `${userId}-${Date.now()}`

    // Check if resume already exists
    const { data: existingResume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id')
      .eq('candidate_id', userId)
      .eq('is_primary', true)
      .single()

    let savedResume

    if (existingResume) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('candidate_resumes')
        .update({
          resume_data: resumeData,
          original_filename: originalFilename || 'extracted_resume.json',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingResume.id)
        .select()
        .single()

      if (error) throw error
      savedResume = data
      console.log('✅ Updated existing resume:', savedResume.id)
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from('candidate_resumes')
        .insert({
          candidate_id: userId,
          resume_data: resumeData,
          original_filename: originalFilename || 'extracted_resume.json',
          slug: slug,
          title: 'Extracted Resume',
          is_primary: true,
          is_public: false,
        })
        .select()
        .single()

      if (error) throw error
      savedResume = data
      console.log('✅ Created new resume:', savedResume.id)
    }

    // Trigger job match generation in the background (don't await to avoid blocking)
    triggerMatchGeneration(userId).catch(err =>
      console.error('Background match generation failed:', err)
    )

    return NextResponse.json({
      success: true,
      resumeId: savedResume.id,
      message: 'Resume saved successfully',
      matchesGenerating: true
    })

  } catch (error) {
    console.error('❌ Error saving resume:', error)
    return NextResponse.json(
      {
        error: 'Failed to save resume to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('candidate_resumes')
      .delete()
      .eq('candidate_id', userId)
      .eq('is_primary', true)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting resume:', error)
    return NextResponse.json({
      error: 'Failed to delete resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


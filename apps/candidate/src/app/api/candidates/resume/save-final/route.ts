import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCandidateById } from '@/lib/db/candidates';

/**
 * POST /api/candidates/resume/save-final
 * Save the final edited resume with template and customizations
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [POST /api/candidates/resume/save-final] Starting...');
    
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Verify candidate exists
    const candidate = await getCandidateById(userId, true);
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { resumeData, template, candidateId } = body;

    if (!resumeData) {
      return NextResponse.json(
        { error: 'No resume data provided' },
        { status: 400 }
      );
    }

    console.log('💾 Saving final resume for candidate:', userId);

    // Generate slug if needed
    const slug = `${userId}-${Date.now()}`;

    // Check if resume exists
    const { data: existingResume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id, slug')
      .eq('candidate_id', userId)
      .eq('is_primary', true)
      .single();

    let savedResume;
    
    if (existingResume) {
      // Update existing resume
      const { data, error } = await supabaseAdmin
        .from('candidate_resumes')
        .update({
          resume_data: resumeData,
          template_used: template?.id || null,
          title: resumeData.name ? `${resumeData.name}'s Resume` : 'My Resume',
          is_public: true, // Make it publicly viewable
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingResume.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating resume:', error);
        throw new Error(error.message);
      }
      savedResume = data;
      console.log('✅ Updated existing resume:', savedResume.id);
    } else {
      // Insert new resume
      const { data, error } = await supabaseAdmin
        .from('candidate_resumes')
        .insert({
          candidate_id: userId,
          resume_data: resumeData,
          template_used: template?.id || null,
          slug: slug,
          title: resumeData.name ? `${resumeData.name}'s Resume` : 'My Resume',
          is_primary: true,
          is_public: true,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting resume:', error);
        throw new Error(error.message);
      }
      savedResume = data;
      console.log('✅ Created new resume:', savedResume.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Resume saved successfully',
      resume: {
        id: savedResume.id,
        slug: savedResume.slug,
        title: savedResume.title,
        is_public: savedResume.is_public,
      },
      slug: savedResume.slug
    });

  } catch (error) {
    console.error('❌ Error saving final resume:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/user/extracted-resume
 * Get the user's extracted resume data from candidate_resumes
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!userId || !sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch extracted resume from candidate_resumes
    const { data: resume, error } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id, resume_data, original_filename, created_at, updated_at')
      .eq('candidate_id', userId)
      .eq('is_primary', true)
      .single();

    if (error || !resume) {
      return NextResponse.json({
        success: true,
        hasData: false,
        resumeData: null
      });
    }

    return NextResponse.json({
      success: true,
      hasData: true,
      resumeData: resume.resume_data,
      originalFileName: resume.original_filename,
      resumeId: resume.id,
      createdAt: resume.created_at,
      updatedAt: resume.updated_at
    });

  } catch (error) {
    console.error('Error fetching extracted resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume data' },
      { status: 500 }
    );
  }
}


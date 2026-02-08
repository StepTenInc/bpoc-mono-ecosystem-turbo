import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Get total users (candidates)
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('candidates')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get active resumes
    const { count: activeResumes, error: resumesError } = await supabaseAdmin
      .from('candidate_resumes')
      .select('*', { count: 'exact', head: true });

    if (resumesError) throw resumesError;

    // Get active jobs
    const { count: activeJobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (jobsError) throw jobsError;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeResumes: activeResumes || 0,
      activeJobs: activeJobs || 0
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    // Return default values on error to prevent UI breakage
    return NextResponse.json({
      totalUsers: 0,
      activeResumes: 0,
      activeJobs: 0
    });
  }
}


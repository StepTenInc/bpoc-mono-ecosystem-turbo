import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/user/job-matches-count
 * Get count of job matches for the authenticated candidate
 */
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

    // Get count of job matches
    // Job matches are based on the candidate's skills/profile matching active jobs
    const { count, error: matchError } = await supabaseAdmin
      .from('job_matches')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', user.id)

    if (matchError) {
      console.error('Error fetching job matches count:', matchError)
      // If table doesn't exist or query fails, return 0 gracefully
      return NextResponse.json({
        success: true,
        count: 0,
      })
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/user/job-matches-count:', error)
    // Return 0 gracefully instead of error for new users
    return NextResponse.json({
      success: true,
      count: 0,
    })
  }
}

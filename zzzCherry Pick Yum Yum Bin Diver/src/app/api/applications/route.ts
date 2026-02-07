import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/applications
 * Get all applications for the authenticated candidate
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

    // Get all job applications for this candidate
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          work_type,
          work_arrangement,
          industry
        )
      `)
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false })

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      return NextResponse.json(
        { error: 'Failed to fetch applications', details: appsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      applications: applications || [],
      count: applications?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

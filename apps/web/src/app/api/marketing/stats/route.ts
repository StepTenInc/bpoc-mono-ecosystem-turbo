import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Fetch all stats in parallel
    const [
      resumesAnalyzedResult,
      candidatesResult,
      placementsResult,
      interviewsResult,
      activeJobsResult
    ] = await Promise.all([
      // Total resumes analyzed (from anonymous sessions)
      supabaseAdmin
        .from('anonymous_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('channel', 'marketing-resume-analyzer')
        .not('payload->analysis', 'is', null),

      // Total candidates registered
      supabaseAdmin
        .from('candidates')
        .select('*', { count: 'exact', head: true }),

      // Get placements to calculate salary increases and hiring stats
      supabaseAdmin
        .from('placements')
        .select('id, start_date, candidate_id, salary')
        .eq('status', 'active')
        .not('salary', 'is', null)
        .order('start_date', { ascending: false })
        .limit(100),

      // Get interviews to calculate average time
      supabaseAdmin
        .from('job_interviews')
        .select('id, scheduled_at, application:job_applications!job_interviews_application_id_fkey(created_at)')
        .eq('status', 'completed')
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: false })
        .limit(50),

      // Count active jobs
      supabaseAdmin
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
    ])

    // Calculate average days to first interview
    let avgDaysToInterview = 7 // Default fallback
    if (interviewsResult.data && interviewsResult.data.length > 0) {
      const validInterviews = interviewsResult.data.filter(
        interview => interview.application?.created_at && interview.scheduled_at
      )

      if (validInterviews.length > 0) {
        const totalDays = validInterviews.reduce((sum, interview) => {
          const appDate = new Date(interview.application.created_at)
          const interviewDate = new Date(interview.scheduled_at)
          const days = Math.floor((interviewDate.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24))
          return sum + Math.max(0, days) // Ensure non-negative
        }, 0)

        avgDaysToInterview = Math.round(totalDays / validInterviews.length)
      }
    }

    // Calculate average salary and salary increase
    let avgSalaryIncrease = 8000 // Default fallback
    if (placementsResult.data && placementsResult.data.length > 0) {
      const validSalaries = placementsResult.data
        .map(p => p.salary)
        .filter((s): s is number => typeof s === 'number' && s > 0)

      if (validSalaries.length > 0) {
        const avgSalary = validSalaries.reduce((sum, s) => sum + s, 0) / validSalaries.length
        // Assume average baseline BPO salary is around 20-22k
        // Calculate increase as difference from market baseline
        const baselineSalary = 20000
        avgSalaryIncrease = Math.round(Math.max(0, avgSalary - baselineSalary))
      }
    }

    const stats = {
      resumesAnalyzed: resumesAnalyzedResult.count || 0,
      candidatesHired: placementsResult.data?.length || 0,
      totalCandidates: candidatesResult.count || 0,
      activeJobs: activeJobsResult.count || 0,
      avgDaysToInterview,
      avgSalaryIncrease
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Marketing stats error:', error)

    // Return fallback stats if query fails
    return NextResponse.json({
      stats: {
        resumesAnalyzed: 0,
        candidatesHired: 0,
        totalCandidates: 0,
        activeJobs: 0,
        avgDaysToInterview: 7,
        avgSalaryIncrease: 8000
      }
    })
  }
}


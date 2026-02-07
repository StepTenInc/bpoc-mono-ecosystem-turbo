import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // Fetch recent activities from multiple sources in parallel
    const [
      recentCandidates,
      recentApplications,
      recentOffers,
      recentInterviews
    ] = await Promise.all([
      // Recent signups - last 5 candidates
      supabaseAdmin
        .from('candidates')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent job applications - last 5 applications
      supabaseAdmin
        .from('job_applications')
        .select(`
          id,
          created_at,
          candidate:candidates!job_applications_candidate_id_fkey(first_name, last_name),
          job:jobs!job_applications_job_id_fkey(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent offers - last 3 offers
      supabaseAdmin
        .from('job_offers')
        .select(`
          id,
          created_at,
          salary_amount,
          candidate:candidates!job_offers_candidate_id_fkey(first_name, last_name)
        `)
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(3),

      // Recent interviews - last 3 scheduled interviews
      supabaseAdmin
        .from('job_interviews')
        .select(`
          id,
          created_at,
          candidate:candidates!job_interviews_candidate_id_fkey(first_name, last_name)
        `)
        .eq('status', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(3)
    ])

    // Combine and format all activities
    const activities: Array<{
      name: string
      action: string
      detail: string
      emoji: string
      avatar: string
      timestamp: Date
    }> = []

    // Add recent signups
    if (recentCandidates.data) {
      recentCandidates.data.forEach(candidate => {
        if (candidate.first_name && candidate.last_name) {
          activities.push({
            name: `${candidate.first_name} ${candidate.last_name}`,
            action: 'just signed up',
            detail: '',
            emoji: '🎉',
            avatar: `${candidate.first_name.charAt(0)}${candidate.last_name.charAt(0)}`,
            timestamp: new Date(candidate.created_at)
          })
        }
      })
    }

    // Add recent job applications
    if (recentApplications.data) {
      recentApplications.data.forEach(application => {
        if (application.candidate && application.job) {
          activities.push({
            name: `${application.candidate.first_name} ${application.candidate.last_name}`,
            action: 'applied to a job',
            detail: '',
            emoji: '🚀',
            avatar: `${application.candidate.first_name.charAt(0)}${application.candidate.last_name.charAt(0)}`,
            timestamp: new Date(application.created_at)
          })
        }
      })
    }

    // Add recent offers
    if (recentOffers.data) {
      recentOffers.data.forEach(offer => {
        if (offer.candidate && offer.salary_amount) {
          const salaryFormatted = `₱${(offer.salary_amount / 1000).toFixed(0)}k/month`
          activities.push({
            name: `${offer.candidate.first_name} ${offer.candidate.last_name}`,
            action: 'received job offer',
            detail: salaryFormatted,
            emoji: '💼',
            avatar: `${offer.candidate.first_name.charAt(0)}${offer.candidate.last_name.charAt(0)}`,
            timestamp: new Date(offer.created_at)
          })
        }
      })
    }

    // Add recent interviews
    if (recentInterviews.data) {
      recentInterviews.data.forEach(interview => {
        if (interview.candidate) {
          activities.push({
            name: `${interview.candidate.first_name} ${interview.candidate.last_name}`,
            action: 'interview scheduled',
            detail: '',
            emoji: '📅',
            avatar: `${interview.candidate.first_name.charAt(0)}${interview.candidate.last_name.charAt(0)}`,
            timestamp: new Date(interview.created_at)
          })
        }
      })
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Return top 10 most recent activities without the timestamp (frontend doesn't need it)
    const formattedActivities = activities.slice(0, 10).map(({ timestamp, ...activity }) => activity)

    return NextResponse.json({ activities: formattedActivities })

  } catch (error) {
    console.error('Live activity fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live activity' },
      { status: 500 }
    )
  }
}

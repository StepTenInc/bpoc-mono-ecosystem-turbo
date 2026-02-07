import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel for better performance using Supabase
    const [
      candidateRes,
      profileRes,
      applicationsRes,
      aiAnalysisRes,
      notificationsRes,
      resumesRes,
    ] = await Promise.all([
      // Candidate basic info
      supabaseAdmin
        .from('candidates')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('id', userId)
        .single(),
      // Candidate profile
      supabaseAdmin
        .from('candidate_profiles')
        .select('position, location, location_city')
        .eq('candidate_id', userId)
        .single(),
      // Applications with job info
      supabaseAdmin
        .from('job_applications')
        .select(`
          id,
          status,
          created_at,
          jobs (
            id,
            title,
            work_arrangement,
            status,
            agency_clients (
              companies (
                name
              )
            )
          )
        `)
        .eq('candidate_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      // AI analysis
      supabaseAdmin
        .from('candidate_ai_analysis')
        .select('overall_score, created_at')
        .eq('candidate_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
      // Notifications
      supabaseAdmin
        .from('notifications')
        .select('id, type, title, message, action_url, created_at')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5),
      // Resumes
      supabaseAdmin
        .from('candidate_resumes')
        .select('id')
        .eq('candidate_id', userId)
        .limit(1),
    ]);

    const candidate = candidateRes.data;
    const profile = profileRes.data;
    const applications = applicationsRes.data || [];
    const aiAnalysis = aiAnalysisRes.data?.[0] || null;
    const notifications = notificationsRes.data || [];
    const resumes = resumesRes.data || [];

    // Calculate stats
    const applicationStats = {
      total: applications.length,
      submitted: applications.filter(a => a.status === 'submitted').length,
      inReview: applications.filter(a => ['qualified', 'under_review', 'shortlisted', 'verified'].includes(a.status)).length,
      interviewing: applications.filter(a => ['interview_scheduled', 'initial_interview', 'final_interview'].includes(a.status)).length,
      offers: applications.filter(a => ['offer_sent', 'offer_viewed'].includes(a.status)).length,
      hired: applications.filter(a => a.status === 'hired').length,
    };

    // Profile completion calculation
    const profileFields = [
      candidate?.first_name,
      candidate?.last_name,
      candidate?.email,
      profile?.position,
      profile?.location || profile?.location_city,
      candidate?.avatar_url,
    ];
    const filledFields = profileFields.filter(Boolean).length;
    const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

    // Assessment completion (games removed - only resume analysis remains)
    const assessments = {
      resume: {
        completed: !!aiAnalysis && (aiAnalysis.overall_score || 0) > 0,
        score: aiAnalysis?.overall_score || 0,
        hasResume: resumes.length > 0,
      },
    };

    // Format applications
    const formattedApplications = applications.map(a => {
      const job = a.jobs as any;
      const company = job?.agency_clients?.companies?.name || 'Unknown Company';
      return {
        id: a.id,
        jobTitle: job?.title || 'Unknown Job',
        company,
        status: a.status,
        appliedAt: a.created_at,
      };
    });

    // Get upcoming interviews (applications with interview status)
    const upcomingInterviews = formattedApplications.filter(a => 
      ['interview_scheduled', 'initial_interview', 'final_interview'].includes(a.status)
    );

    // Recent applications for quick view
    const recentApplications = formattedApplications.slice(0, 5);

    return NextResponse.json({
      user: {
        id: candidate?.id,
        firstName: candidate?.first_name,
        lastName: candidate?.last_name,
        email: candidate?.email,
        avatarUrl: candidate?.avatar_url,
        position: profile?.position,
        location: profile?.location || profile?.location_city,
      },
      stats: {
        applications: applicationStats,
        profileCompletion,
        assessmentsCompleted: Object.values(assessments).filter(a => a.completed).length,
        totalAssessments: 1, // Only resume analysis
      },
      assessments,
      upcomingInterviews,
      recentApplications,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.action_url,
        createdAt: n.created_at,
      })),
      unreadNotifications: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

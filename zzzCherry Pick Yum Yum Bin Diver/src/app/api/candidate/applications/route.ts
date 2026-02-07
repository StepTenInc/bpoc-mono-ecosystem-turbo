import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

/**
 * GET /api/candidate/applications
 * Fetch all applications for the logged-in candidate
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    // Fetch applications with job details
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        job_id,
        status,
        created_at,
        released_to_client,
        released_at,
        rejection_reason,
        jobs (
          id,
          title,
          work_type,
          work_arrangement,
          salary_min,
          salary_max,
          currency,
          agency_clients (
            companies (
              name
            ),
            agencies (
              name
            )
          )
        )
      `)
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Format response
    const formattedApplications = (applications || []).map(app => {
      const job = app.jobs as any;
      const agencyClient = job?.agency_clients;

      return {
        id: app.id,
        jobId: app.job_id,
        jobTitle: job?.title || 'Unknown Job',
        company: agencyClient?.agencies?.name || agencyClient?.companies?.name || 'Unknown Company',
        status: app.status,
        appliedAt: app.created_at,
        releasedToClient: (app as any).released_to_client || false,
        releasedAt: (app as any).released_at || null,
        rejectionReason: (app as any).rejection_reason || null,
        workType: job?.work_type,
        workArrangement: job?.work_arrangement,
        salary: job?.salary_min ? {
          min: job.salary_min,
          max: job.salary_max,
          currency: job.currency || 'PHP'
        } : null
      };
    });

    return NextResponse.json({
      applications: formattedApplications,
      total: formattedApplications.length
    });

  } catch (error) {
    console.error('Error in candidate applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/candidate/applications
 * Submit a new job application
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    const { jobId, resumeId, coverNote } = await request.json();

    // Validation
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, status, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'active') {
      return NextResponse.json({ error: 'Job is not accepting applications' }, { status: 400 });
    }

    // Check if candidate already applied
    const { data: existingApplication } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .eq('candidate_id', user.id)
      .eq('job_id', jobId)
      .single();

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 });
    }

    // Create application
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .insert({
        candidate_id: user.id,
        job_id: jobId,
        resume_id: resumeId || null,
        recruiter_notes: coverNote || null,
        status: 'submitted',
      })
      .select()
      .single();

    if (appError) {
      console.error('Error creating application:', appError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // Add activity timeline entry
    await supabaseAdmin
      .from('application_activity_timeline')
      .insert({
        application_id: application.id,
        action_type: 'applied',
        performed_by_type: 'candidate',
        performed_by_id: user.id,
        description: `Applied to ${job.title}`,
        metadata: {
          jobId: jobId,
          timestamp: new Date().toISOString(),
        }
      });

    // Increment applicants count
    await supabaseAdmin.rpc('increment_applicants_count', { job_id_param: jobId });

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        jobId: application.job_id,
        status: application.status,
        appliedAt: application.created_at,
      },
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('[Submit Application API] Error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

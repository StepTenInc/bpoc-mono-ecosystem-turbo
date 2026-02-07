import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/recruiter/onboarding
 * Get all onboarding candidates for jobs in this recruiter's agency
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ onboardings: [], message: 'Recruiter not found' });
    }

    // Get agency clients
    const { data: clients } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('agency_id', recruiter.agency_id);

    if (!clients || clients.length === 0) {
      return NextResponse.json({ onboardings: [], message: 'No clients found' });
    }

    const clientIds = clients.map(c => c.id);

    // Get jobs for these clients
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title, agency_clients(companies(name))')
      .in('agency_client_id', clientIds);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ onboardings: [], message: 'No jobs found' });
    }

    const jobIds = jobs.map(j => j.id);
    const jobMap = new Map(jobs.map(j => [j.id, {
      title: j.title,
      company: (j.agency_clients as any)?.companies?.name || 'Unknown'
    }]));

    // Get applications for these jobs that have onboarding
    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('id, job_id, candidate_id')
      .in('job_id', jobIds)
      .in('status', ['offer_accepted', 'hired', 'onboarding']);

    if (!applications || applications.length === 0) {
      return NextResponse.json({ onboardings: [] });
    }

    const appIds = applications.map(a => a.id);
    const appMap = new Map(applications.map(a => [a.id, { jobId: a.job_id, candidateId: a.candidate_id }]));

    // Get onboarding records
    const { data: onboardings, error: onboardingError } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('*')
      .in('job_application_id', appIds)
      .order('created_at', { ascending: false });

    if (onboardingError) {
      console.error('Error fetching onboardings:', onboardingError);
      return NextResponse.json({ error: 'Failed to fetch onboardings' }, { status: 500 });
    }

    // Format response
    const formattedOnboardings = (onboardings || []).map(o => {
      const app = appMap.get(o.job_application_id);
      const job = app ? jobMap.get(app.jobId) : null;
      
      return {
        id: o.id,
        candidateId: o.candidate_id,
        applicationId: o.job_application_id,
        firstName: o.first_name,
        lastName: o.last_name,
        email: o.email,
        position: job?.title || o.position || 'Unknown Position',
        company: job?.company || 'Unknown Company',
        jobId: app?.jobId,
        completionPercent: o.completion_percent || 0,
        isComplete: o.is_complete || false,
        contractSigned: o.contract_signed || false,
        employmentStarted: o.employment_started || false,
        startDate: o.start_date || o.employment_start_date,
        createdAt: o.created_at,
        checklist: {
          personalInfo: o.personal_info_status,
          govId: o.gov_id_status,
          education: o.education_status,
          medical: o.medical_status,
          dataPrivacy: o.data_privacy_status,
          resume: o.resume_status,
          signature: o.signature_status,
          emergencyContact: o.emergency_contact_status,
        },
      };
    });

    return NextResponse.json({ onboardings: formattedOnboardings });
  } catch (error: any) {
    console.error('Error in recruiter onboarding API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

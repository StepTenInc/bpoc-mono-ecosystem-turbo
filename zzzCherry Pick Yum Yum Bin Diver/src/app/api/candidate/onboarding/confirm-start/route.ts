import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/candidate/onboarding/confirm-start
 * Confirm candidate's first day of employment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const candidateId = session.user.id;

    // Get candidate's onboarding record
    const { data: onboarding, error: fetchError } = await supabase
      .from('candidate_onboarding')
      .select(`
        id,
        employment_started,
        job_application_id,
        position,
        first_name,
        last_name,
        job_applications!inner(
          id,
          job:jobs!inner(
            id,
            title,
            agency_client_id,
            agency_clients!inner(
              agency_id,
              agencies!inner(
                agency_recruiters!inner(
                  user_id
                )
              )
            )
          )
        )
      `)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !onboarding) {
      return NextResponse.json({ error: 'No onboarding record found' }, { status: 404 });
    }

    // Check if already confirmed
    if (onboarding.employment_started) {
      return NextResponse.json({ error: 'First day already confirmed' }, { status: 400 });
    }

    // Update onboarding record
    const { error: updateError } = await supabase
      .from('candidate_onboarding')
      .update({
        employment_started: true,
        employment_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', onboarding.id);

    if (updateError) {
      console.error('Error updating onboarding:', updateError);
      return NextResponse.json({ error: 'Failed to update onboarding' }, { status: 500 });
    }

    // Get job details for notification
    const application = Array.isArray(onboarding.job_applications)
      ? onboarding.job_applications[0]
      : onboarding.job_applications;

    const job = application?.job;
    const jobData = Array.isArray(job) ? job[0] : job;
    const agencyClient = Array.isArray(jobData?.agency_clients)
      ? jobData.agency_clients[0]
      : jobData?.agency_clients;

    const agency = agencyClient?.agencies;
    const recruiters = Array.isArray(agency?.agency_recruiters)
      ? agency.agency_recruiters
      : agency?.agency_recruiters ? [agency.agency_recruiters] : [];

    // Notify all recruiters in the agency
    for (const recruiter of recruiters) {
      await createNotification({
        recipientId: recruiter.user_id,
        recipientType: 'recruiter',
        type: 'onboarding_started',
        title: `First Day Confirmed: ${onboarding.first_name} ${onboarding.last_name}`,
        message: `${onboarding.first_name} ${onboarding.last_name} has confirmed completing their first day as ${onboarding.position || jobData?.title || 'Position'}.`,
        actionUrl: `/recruiter/applications/${application.id}`,
        relatedId: onboarding.id,
        relatedType: 'onboarding',
        isUrgent: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'First day confirmed successfully',
    });

  } catch (error: any) {
    console.error('Confirm start error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

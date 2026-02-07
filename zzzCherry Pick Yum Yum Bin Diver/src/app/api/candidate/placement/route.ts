import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    // Find hired application with job details
    const { data: hiredApplication, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        job_id,
        status,
        created_at,
        updated_at,
        offer_acceptance_date,
        contract_signed,
        first_day_date,
        started_status,
        jobs (
          id,
          title,
          work_type,
          work_arrangement,
          shift,
          salary_min,
          salary_max,
          salary_type,
          currency,
          benefits,
          agency_clients (
            companies (
              name,
              logo_url
            ),
            agencies (
              name
            )
          )
        )
      `)
      .eq('candidate_id', user.id)
      .eq('status', 'hired')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) {
      console.error('Error fetching hired application:', appError);
      return NextResponse.json({ error: 'Failed to fetch placement' }, { status: 500 });
    }

    if (!hiredApplication) {
      return NextResponse.json({ placement: null });
    }

    const job = hiredApplication.jobs as any;
    const agencyClient = job?.agency_clients;
    const company = agencyClient?.companies;

    return NextResponse.json({
      placement: {
        id: hiredApplication.id,
        jobTitle: job?.title || 'Unknown Position',
        company: agencyClient?.agencies?.name || company?.name || 'Unknown Company',
        companyLogo: company?.logo_url || null,
        salary: job?.salary_max || job?.salary_min || 0,
        salaryType: job?.salary_type || 'monthly',
        currency: job?.currency || 'PHP',
        startDate: hiredApplication.first_day_date || null,
        hiredAt: hiredApplication.updated_at || hiredApplication.created_at,
        benefits: job?.benefits || [],
        workArrangement: job?.work_arrangement || null,
        shift: job?.shift || null,
        // Contract URL - candidate-specific contract view
        contractUrl: `/candidate/contracts/${hiredApplication.id}`,
        recruiterName: null,
        recruiterEmail: null,
        // Status tracking fields
        startedStatus: hiredApplication.started_status || null,
        contractSigned: hiredApplication.contract_signed || false,
        offerAcceptanceDate: hiredApplication.offer_acceptance_date || null,
      },
    });
  } catch (error) {
    console.error('Error fetching placement:', error);
    return NextResponse.json({ error: 'Failed to fetch placement' }, { status: 500 });
  }
}

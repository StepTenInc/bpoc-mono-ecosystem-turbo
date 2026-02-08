import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken } from '@/lib/client-tokens';

// GET - Get onboarding status and details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: onboardingId } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const jobId = tokenData.job_id;

    // Get onboarding with application verification
    const { data: onboarding, error: obError } = await supabaseAdmin
      .from('candidate_onboarding')
      .select(`
        *,
        job_applications!inner(job_id)
      `)
      .eq('id', onboardingId)
      .single();

    if (obError || !onboarding || (onboarding as any).job_applications?.job_id !== jobId) {
      return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
    }

    // Format checklist
    const checklist = [
      { key: 'personal_info', label: 'Personal Information', status: onboarding.personal_info_status, feedback: onboarding.personal_info_feedback },
      { key: 'gov_id', label: 'Government IDs', status: onboarding.gov_id_status, feedback: onboarding.gov_id_feedback },
      { key: 'education', label: 'Education Documents', status: onboarding.education_status, feedback: onboarding.education_feedback },
      { key: 'medical', label: 'Medical Certificate', status: onboarding.medical_status, feedback: onboarding.medical_feedback },
      { key: 'data_privacy', label: 'Data Privacy Consent', status: onboarding.data_privacy_status, feedback: onboarding.data_privacy_feedback },
      { key: 'resume', label: 'Updated Resume', status: onboarding.resume_status, feedback: onboarding.resume_feedback },
      { key: 'signature', label: 'Digital Signature', status: onboarding.signature_status, feedback: onboarding.signature_feedback },
      { key: 'emergency_contact', label: 'Emergency Contact', status: onboarding.emergency_contact_status, feedback: onboarding.emergency_contact_feedback },
    ];

    // Get uploaded documents
    const documents = {
      sss: onboarding.sss_doc_url,
      tin: onboarding.tin_doc_url,
      philhealth: onboarding.philhealth_doc_url,
      pagibig: onboarding.pagibig_doc_url,
      validId: onboarding.valid_id_url,
      education: onboarding.education_doc_url,
      medical: onboarding.medical_cert_url,
      resume: onboarding.resume_url,
      signature: onboarding.signature_url,
      contract: onboarding.contract_pdf_url,
    };

    return NextResponse.json({
      id: onboarding.id,
      candidate_id: onboarding.candidate_id,
      name: `${onboarding.first_name} ${onboarding.last_name}`,
      email: onboarding.email,
      phone: onboarding.contact_no,
      completionPercent: onboarding.completion_percent,
      isComplete: onboarding.is_complete,
      checklist,
      documents,
      employment: {
        position: onboarding.position,
        start_date: onboarding.start_date,
        salary: onboarding.basic_salary,
        schedule: onboarding.work_schedule,
        contractSigned: onboarding.contract_signed,
        contractSignedAt: onboarding.contract_signed_at,
        employmentStarted: onboarding.employment_started,
        employmentStartDate: onboarding.employment_start_date,
        employmentConfirmedAt: onboarding.employment_confirmed_at,
      },
    });
  } catch (error) {
    console.error('Error fetching onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

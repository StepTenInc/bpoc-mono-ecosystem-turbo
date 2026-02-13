import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { format } from 'date-fns';

/**
 * GET /api/contracts/[applicationId]
 * Fetch BPOC employment contract template and populate with real data
 * Uses document_templates table for agency-specific or BPOC default templates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Get application with ALL related data including agency
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs (
          id,
          title,
          description,
          salary_min,
          salary_max,
          salary_type,
          currency,
          work_type,
          work_arrangement,
          requirements,
          shift,
          agency_clients (
            id,
            agency_id,
            agencies (
              id,
              name,
              address,
              city,
              country,
              email,
              phone,
              logo_url,
              tin_number,
              primary_color,
              authorized_signatory_name,
              authorized_signatory_title
            ),
            companies (
              id,
              name,
              phone,
              email,
              website,
              industry
            )
          )
        ),
        candidates (
          id,
          first_name,
          last_name,
          email
        ),
        job_offers (
          id,
          salary_offered,
          salary_type,
          currency,
          start_date,
          benefits_offered,
          additional_terms,
          status,
          sent_at,
          responded_at,
          created_at
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('Application not found:', appError);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
    const candidate = Array.isArray(application.candidates) ? application.candidates[0] : application.candidates;
    const agency = job?.agency_clients?.agencies;
    const company = job?.agency_clients?.companies;
    const agencyId = job?.agency_clients?.agency_id;
    
    // Verify user has access
    const isCandidate = candidate?.id === userId;
    if (!isCandidate) {
      // Check if recruiter
      const { data: recruiter } = await supabaseAdmin
        .from('agency_recruiters')
        .select('agency_id')
        .eq('user_id', userId)
        .single();
      
      if (!recruiter || recruiter.agency_id !== agencyId) {
        return NextResponse.json({ error: 'Unauthorized to view this contract' }, { status: 403 });
      }
    }

    // Get the accepted offer
    const offer = application.job_offers?.[0];
    
    if (!offer || offer.status !== 'accepted') {
      return NextResponse.json({ error: 'No accepted offer found for this application' }, { status: 404 });
    }

    // Get candidate profile for address
    const { data: candidateProfile } = await supabaseAdmin
      .from('candidate_profiles')
      .select('location, location_city, location_province, location_country, phone')
      .eq('candidate_id', candidate.id)
      .single();

    // Fetch employment contract template (agency-specific or BPOC default)
    const { data: template, error: templateError } = await supabaseAdmin
      .from('document_templates')
      .select('*')
      .eq('type', 'employment_contract')
      .eq('is_active', true)
      .or(`agency_id.eq.${agencyId},is_bpoc_default.eq.true`)
      .order('is_bpoc_default', { ascending: true }) // Prefer agency-specific
      .limit(1)
      .single();

    if (templateError || !template) {
      console.error('No employment contract template found:', templateError);
      return NextResponse.json({ error: 'Employment contract template not found' }, { status: 404 });
    }

    // Get signature if exists
    const { data: signature } = await supabaseAdmin
      .from('offer_signatures')
      .select('*')
      .eq('offer_id', offer.id)
      .eq('signatory_role', 'candidate')
      .single();

    // Build candidate address
    const candidateAddress = candidateProfile?.location || 
      [candidateProfile?.location_city, candidateProfile?.location_province, candidateProfile?.location_country]
        .filter(Boolean).join(', ') || 
      'Philippines';

    // Format benefits as HTML list
    const benefitsHtml = offer.benefits_offered && offer.benefits_offered.length > 0
      ? offer.benefits_offered.map((b: string) => `<li>${b}</li>`).join('')
      : '<li>As per company policy</li>';

    // Build duties from job description/requirements
    const duties = job.requirements || ['As assigned by immediate supervisor'];
    const dutiesHtml = Array.isArray(duties) 
      ? duties.map((d: string) => `<li>${d}</li>`).join('')
      : `<li>${duties}</li>`;

    // Contract reference
    const contractRef = `EC-${applicationId.substring(0, 8).toUpperCase()}-${format(new Date(), 'yyyyMMdd')}`;

    // Populate placeholders
    const placeholderValues: Record<string, string> = {
      // Agency/Employer info
      AGENCY_LOGO_URL: agency?.logo_url || '',
      AGENCY_NAME: agency?.name || 'BPOC Agency',
      AGENCY_ADDRESS: agency?.address || '',
      AGENCY_CITY: agency?.city || 'Philippines',
      AGENCY_COUNTRY: agency?.country || 'Philippines',
      AGENCY_TIN: agency?.tin_number || 'TIN Pending',
      AGENCY_EMAIL: agency?.email || '',
      AGENCY_PHONE: agency?.phone || '',
      PRIMARY_COLOR: agency?.primary_color || '#0ea5e9',
      
      // Contract info
      CONTRACT_REFERENCE: contractRef,
      CONTRACT_DATE: format(new Date(), 'MMMM d, yyyy'),
      DOCUMENT_ID: `DOC-${applicationId.substring(0, 8).toUpperCase()}`,
      VERSION: '1',
      GENERATED_AT: new Date().toISOString(),
      
      // Signatory
      AUTHORIZED_SIGNATORY_NAME: agency?.authorized_signatory_name || 'Authorized Representative',
      AUTHORIZED_SIGNATORY_TITLE: agency?.authorized_signatory_title || 'HR Manager',
      
      // Employee info
      CANDIDATE_FULL_NAME: `${candidate.first_name} ${candidate.last_name}`,
      CANDIDATE_ADDRESS: candidateAddress,
      
      // Position
      JOB_TITLE: job.title,
      DUTIES: dutiesHtml,
      
      // Term
      START_DATE: offer.start_date ? format(new Date(offer.start_date), 'MMMM d, yyyy') : 'To be confirmed',
      PROBATION_PERIOD: '6 months',
      PROBATION_NOTICE_PERIOD: '7 days',
      
      // Compensation
      CURRENCY: offer.currency || 'PHP',
      BASIC_SALARY: Number(offer.salary_offered).toLocaleString(),
      DE_MINIMIS: '0', // Can be updated by agency
      TOTAL_MONTHLY: Number(offer.salary_offered).toLocaleString(),
      PAY_FREQUENCY: offer.salary_type === 'monthly' ? 'Monthly' : 'Bi-monthly',
      PAY_DATES: offer.salary_type === 'monthly' ? 'Every end of the month' : '15th and 30th of every month',
      PAYMENT_METHOD: 'Bank Transfer',
      
      // Work Schedule
      WORKING_HOURS: '8 hours per day',
      WORK_DAYS_PER_WEEK: '5',
      WORK_SCHEDULE: job.shift || 'Day Shift (9:00 AM - 6:00 PM)',
      REST_DAYS: 'Saturday and Sunday (or as designated)',
      
      // Leave
      SIL_DAYS: '5',
      SICK_LEAVE_DAYS: '5',
      VACATION_LEAVE_DAYS: '5',
      ADDITIONAL_LEAVES: 'As per company policy and Philippine law',
      BENEFITS: benefitsHtml,
      
      // Termination
      NOTICE_PERIOD: '30 days',
      
      // Signatures (to be filled when signing)
      EMPLOYER_SIGN_DATE: '',
      EMPLOYEE_SIGN_DATE: signature?.signed_at ? format(new Date(signature.signed_at), 'MMMM d, yyyy') : '',
      IP_ADDRESS: '',
      USER_AGENT: '',
    };

    // Replace placeholders in template HTML
    let contractHtml = template.html_content;
    for (const [key, value] of Object.entries(placeholderValues)) {
      // Handle both {{KEY}} and {{#KEY}}...{{/KEY}} patterns
      contractHtml = contractHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Clean up any Mustache-style list patterns that we handled differently
    contractHtml = contractHtml.replace(/\{\{#DUTIES\}\}[\s\S]*?\{\{\/DUTIES\}\}/g, placeholderValues.DUTIES);

    // Build contract response
    const contract = {
      contractId: contractRef,
      templateId: template.id,
      templateName: template.name,
      templateVersion: template.version,
      generatedAt: new Date().toISOString(),
      
      // Rendered HTML
      html: contractHtml,
      
      // Parties (for UI summary)
      employer: {
        name: agency?.name || 'BPOC Agency',
        address: `${agency?.address || ''}, ${agency?.city || 'Philippines'}`,
        email: agency?.email,
        phone: agency?.phone,
        tin: agency?.tin_number,
        signatory: agency?.authorized_signatory_name,
        signatoryTitle: agency?.authorized_signatory_title,
      },
      
      employee: {
        name: `${candidate.first_name} ${candidate.last_name}`,
        email: candidate.email,
        phone: candidateProfile?.phone,
        address: candidateAddress,
        candidateId: candidate.id,
      },

      // Position summary
      position: {
        title: job.title,
        description: job.description,
        type: job.work_type || 'full-time',
        location: job.work_arrangement || 'onsite',
      },

      // Compensation summary
      compensation: {
        salary: Number(offer.salary_offered),
        salaryType: offer.salary_type,
        currency: offer.currency || 'PHP',
        benefits: offer.benefits_offered || [],
      },

      // Period summary
      period: {
        startDate: offer.start_date,
        probationPeriod: '6 months',
      },

      // Signature status
      signatures: {
        candidate: signature ? {
          signed: true,
          signedAt: signature.signed_at,
          signatoryName: signature.signatory_name,
          certificateId: signature.certificate_id,
          documentHash: signature.document_hash,
        } : {
          signed: false,
        },
        employer: {
          signed: false, // Agency signs after candidate
          signedBy: agency?.authorized_signatory_name,
        },
      },

      // Legal compliance
      legalCompliance: {
        compliantWith: 'Philippine Labor Code (P.D. 442, as amended)',
        jurisdiction: 'Republic of the Philippines',
        applicableLaws: [
          'Presidential Decree No. 442 (Labor Code)',
          'Republic Act No. 8792 (E-Commerce Act)',
          'Republic Act No. 11210 (Expanded Maternity Leave)',
          'Republic Act No. 8187 (Paternity Leave Act)',
          'Presidential Decree No. 851 (13th Month Pay)',
        ],
      },

      // Metadata
      metadata: {
        applicationId: application.id,
        offerId: offer.id,
        jobId: job.id,
        candidateId: candidate.id,
        agencyId: agencyId,
        companyId: company?.id,
        offerAcceptedAt: offer.responded_at,
      },
    };

    return NextResponse.json({
      success: true,
      contract,
    });

  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}

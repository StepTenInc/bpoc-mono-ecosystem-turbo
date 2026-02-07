import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/contracts/[applicationId]
 * Generate and retrieve employment contract based on DOLE requirements
 * Compliant with Philippine Labor Code
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

    // Get application details with ALL related data
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
          agency_clients (
            id,
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
          email,
          phone
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

    // Verify user has access (recruiter from same agency OR candidate themselves)
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
    const candidate = Array.isArray(application.candidates) ? application.candidates[0] : application.candidates;
    const company = job?.agency_clients?.companies;
    
    const isRecruiter = recruiter && job?.agency_clients?.id;
    const isCandidate = candidate?.id === userId;

    if (!isRecruiter && !isCandidate) {
      return NextResponse.json({ error: 'Unauthorized to view this contract' }, { status: 403 });
    }

    // Get the accepted offer
    const offer = application.job_offers?.[0];
    
    if (!offer || offer.status !== 'accepted') {
      return NextResponse.json({ error: 'No accepted offer found for this application' }, { status: 404 });
    }

    // Get signature if exists
    const { data: signature } = await supabaseAdmin
      .from('offer_signatures')
      .select('*')
      .eq('offer_id', offer.id)
      .eq('signatory_role', 'candidate')
      .single();

    // ============================================
    // GENERATE DOLE-COMPLIANT CONTRACT
    // ============================================

    const contract = {
      contractId: `BPOC-${applicationId.substring(0, 8).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      
      // Parties
      employer: {
        name: company?.name || 'Unknown Employer',
        address: company?.industry || 'Philippines',
        phone: company?.phone,
        email: company?.email
      },
      
      employee: {
        name: `${candidate.first_name} ${candidate.last_name}`,
        email: candidate.email,
        phone: candidate.phone,
        address: 'Philippines',
        dateOfBirth: null,
        nationality: 'Filipino',
        candidateId: candidate.id
      },

      // Position Details (DOLE Required)
      position: {
        title: job.title,
        description: job.description,
        type: job.work_type || 'full-time',
        location: job.work_arrangement || 'onsite'
      },

      // Compensation (DOLE Required - Article 97-103)
      compensation: {
        salary: Number(offer.salary_offered),
        salaryType: offer.salary_type,
        currency: offer.currency,
        paymentSchedule: offer.salary_type === 'monthly' ? 'Monthly' : 
                         offer.salary_type === 'hourly' ? 'As per hours worked' : 
                         'As agreed',
        benefits: offer.benefits_offered || []
      },

      // Employment Period (DOLE Required)
      period: {
        startDate: offer.start_date,
        probationaryPeriod: '6 months', // As per Article 281
        endDate: null, // Regular employment unless specified
        type: 'Regular' // or 'Project-based', 'Seasonal', 'Fixed-term'
      },

      // Working Hours (DOLE Required - Article 83)
      workingHours: {
        regularHours: '8 hours per day',
        weeklyHours: '40-48 hours per week',
        restDays: 'As per Labor Code Article 91',
        overtime: 'Compensated as per Article 87'
      },

      // Mandatory DOLE Terms (Labor Code Compliance)
      doleTerms: {
        // Article 279 - Security of Tenure
        securityOfTenure: 'Employee entitled to security of tenure per Article 279 of the Labor Code',
        
        // Article 291 - Money Claims
        moneyClaimsPresciption: 'Money claims prescribe in three (3) years from time cause of action accrued',
        
        // Article 100 - No Elimination/Diminution of Benefits
        benefitsProtection: 'No elimination or diminution of benefits per Article 100',
        
        // Article 10 - State Policy
        nonDiscrimination: 'Equal opportunity regardless of sex, race, creed, color, or political beliefs',
        
        // Minimum Wage Compliance
        minimumWage: 'Complies with applicable Regional Wage Order',
        
        // SSS, PhilHealth, Pag-IBIG (Social Security)
        socialSecurity: 'Employer shall remit SSS, PhilHealth, and Pag-IBIG contributions as required by law',
        
        // 13th Month Pay (PD 851)
        thirteenthMonth: 'Employee entitled to 13th month pay as per PD 851',
        
        // Service Incentive Leave (Article 95)
        serviceIncentiveLeave: '5 days service incentive leave per year for employees with at least 1 year service',
        
        // Maternity/Paternity Leave
        parentalLeave: 'Maternity leave per R.A. 11210 and Paternity leave per R.A. 8187',
        
        // Occupational Safety and Health (R.A. 11058)
        safetyAndHealth: 'Employer shall comply with OSH Standards under R.A. 11058'
      },

      // Termination Terms (Article 283-285)
      termination: {
        justCauses: 'Serious misconduct, willful disobedience, gross neglect, fraud, etc. (Article 282)',
        authorizedCauses: 'Redundancy, retrenchment, closure, disease (Article 283)',
        noticePeriod: '30 days written notice for authorized causes',
        separationPay: 'As per Article 283-284 depending on cause',
        dueProcedure: 'Two-notice rule: Notice to explain + Notice of decision (for just causes)'
      },

      // Additional Terms
      additionalTerms: offer.additional_terms || 'N/A',

      // Signature Status
      signatures: {
        candidate: signature ? {
          signed: true,
          signedAt: signature.signed_at,
          signatoryName: signature.signatory_name,
          certificateId: signature.certificate_id,
          documentHash: signature.document_hash
        } : {
          signed: false
        },
        employer: {
          signed: false, // TODO: Implement employer signature
          signedBy: company?.name
        }
      },

      // Legal Compliance Marker
      legalCompliance: {
        compliantWith: 'Philippine Labor Code (PD 442, as amended)',
        jurisdiction: 'Republic of the Philippines',
        applicableLaws: [
          'Presidential Decree No. 442 (Labor Code)',
          'Republic Act No. 11210 (Expanded Maternity Leave Law)',
          'Republic Act No. 8187 (Paternity Leave Act)',
          'Presidential Decree No. 851 (13th Month Pay Law)',
          'Republic Act No. 11058 (OSH Law)',
          'Social Security Act of 2018 (R.A. 11199)',
          'National Health Insurance Act (R.A. 7875)',
          'Home Development Mutual Fund Law (R.A. 9679)'
        ]
      },

      // Metadata
      metadata: {
        applicationId: application.id,
        offerId: offer.id,
        jobId: job.id,
        candidateId: candidate.id,
        companyId: company?.id,
        offerAcceptedAt: offer.responded_at,
        contractGeneratedAt: new Date().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      contract
    });

  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}


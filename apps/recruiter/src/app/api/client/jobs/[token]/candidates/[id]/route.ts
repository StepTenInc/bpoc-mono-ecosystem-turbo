import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateJobToken, logClientAccess } from '@/lib/client-tokens';

/**
 * GET /api/client/jobs/[token]/candidates/[id]
 *
 * Get candidate profile details (via job token)
 *
 * Returns:
 * - Full candidate profile
 * - Resume
 * - Work experience
 * - Education
 * - Skills
 * - Application timeline
 * - Upcoming interview (if any)
 * - Offers with counter-offers
 * - Onboarding status
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id: application_id } = await context.params;

    // Validate job token
    const tokenData = await validateJobToken(token);
    if (!tokenData || !tokenData.isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired access link' },
        { status: 403 }
      );
    }

    if (!tokenData.canViewReleasedCandidates) {
      return NextResponse.json(
        { error: 'You do not have permission to view candidates' },
        { status: 403 }
      );
    }

    // Get client IP and user agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Fetch application and verify it's released to client
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        job_id,
        candidate_id,
        status,
        created_at,
        released_to_client,
        released_at,
        client_decision,
        client_decision_at,
        client_notes
      `)
      .eq('id', application_id)
      .eq('job_id', tokenData.jobId)
      .single();

    if (appError || !application) {
      console.error('[Client Candidate API] Application not found:', appError);
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Fetch candidate from candidates table
    const { data: candidateBase, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('id, slug, first_name, last_name, avatar_url, email')
      .eq('id', application.candidate_id)
      .single();

    if (candidateError || !candidateBase) {
      console.error('[Client Candidate API] Candidate not found:', candidateError);
      return NextResponse.json(
        { error: 'Candidate details not found' },
        { status: 404 }
      );
    }

    // Fetch profile details from candidate_profiles table
    const { data: profile } = await supabaseAdmin
      .from('candidate_profiles')
      .select(`
        headline,
        bio,
        phone,
        location,
        work_status,
        expected_salary_min,
        expected_salary_max,
        preferred_shift
      `)
      .eq('candidate_id', application.candidate_id)
      .single();

    // Merge candidate and profile data
    const candidate = {
      ...candidateBase,
      headline: profile?.headline || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      work_status: profile?.work_status || '',
      expected_salary_min: profile?.expected_salary_min || null,
      expected_salary_max: profile?.expected_salary_max || null,
      preferred_shift: profile?.preferred_shift || '',
      years_experience: null,
    };

    // Verify candidate is released to client
    if (!application.released_to_client) {
      return NextResponse.json(
        { error: 'This candidate has not been released to you yet' },
        { status: 403 }
      );
    }

    // Fetch resume
    const { data: resume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('*')
      .eq('candidate_id', application.candidate_id)
      .eq('is_primary', true)
      .single();

    // Fetch skills
    const { data: skills } = await supabaseAdmin
      .from('candidate_skills')
      .select('*')
      .eq('candidate_id', application.candidate_id)
      .order('proficiency_level', { ascending: false });

    // Fetch work experience
    const { data: experience } = await supabaseAdmin
      .from('candidate_work_experience')
      .select('*')
      .eq('candidate_id', application.candidate_id)
      .order('start_date', { ascending: false });

    // Fetch education
    const { data: education } = await supabaseAdmin
      .from('candidate_education')
      .select('*')
      .eq('candidate_id', application.candidate_id)
      .order('start_date', { ascending: false });

    // Fetch upcoming interview
    const { data: upcomingInterview } = await supabaseAdmin
      .from('job_interviews')
      .select('*')
      .eq('application_id', application_id)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .single();

    // Fetch all interviews (for completed ones)
    const { data: allInterviews } = await supabaseAdmin
      .from('job_interviews')
      .select('*')
      .eq('application_id', application_id)
      .order('scheduled_at', { ascending: false });

    // Fetch offers
    const { data: offers } = await supabaseAdmin
      .from('job_offers')
      .select('*')
      .eq('application_id', application_id)
      .order('created_at', { ascending: false });

    // Fetch counter offers for each offer
    const offer_ids = (offers || []).map((o: any) => o.id);
    const { data: counterOffers } = offer_ids.length > 0
      ? await supabaseAdmin
          .from('counter_offers')
          .select('*')
          .in('offer_id', offer_ids)
          .order('created_at', { ascending: false })
      : { data: [] };

    // Create counter offer map
    const counterOfferMap = new Map<string, any[]>();
    (counterOffers || []).forEach((co: any) => {
      if (!counterOfferMap.has(co.offer_id)) {
        counterOfferMap.set(co.offer_id, []);
      }
      counterOfferMap.get(co.offer_id)!.push(co);
    });

    // Fetch onboarding if exists
    const { data: onboarding } = await supabaseAdmin
      .from('candidate_onboarding')
      .select(`
        id,
        first_name,
        middle_name,
        last_name,
        email,
        contact_no,
        date_of_birth,
        address,
        personal_info_status,
        gov_id_status,
        education_status,
        medical_status,
        data_privacy_status,
        resume_status,
        signature_status,
        emergency_contact_status,
        completion_percent,
        is_complete,
        contract_signed,
        contract_signed_at,
        contract_pdf_url,
        position,
        start_date,
        basic_salary,
        work_schedule,
        sss_doc_url,
        tin_doc_url,
        philhealth_doc_url,
        pagibig_doc_url,
        valid_id_url,
        education_doc_url,
        medical_cert_url,
        resume_url,
        employment_started,
        employment_start_date,
        created_at,
        updated_at
      `)
      .eq('job_application_id', application_id)
      .single();

    // Fetch pre-screen rooms
    const { data: preScreenRooms } = await supabaseAdmin
      .from('video_call_rooms')
      .select(`
        id,
        call_title,
        call_type,
        created_at,
        ended_at,
        duration_seconds,
        notes,
        share_with_client
      `)
      .eq('application_id', application_id)
      .eq('share_with_client', true)
      .order('created_at', { ascending: false });

    // Fetch recordings and transcripts for each room
    const room_ids = (preScreenRooms || []).map(r => r.id);
    
    const { data: recordings } = room_ids.length > 0 
      ? await supabaseAdmin
          .from('video_call_recordings')
          .select('room_id, recording_url, duration_seconds')
          .in('room_id', room_ids)
          .eq('shared_with_client', true)
      : { data: [] };
    
    const { data: transcripts } = room_ids.length > 0
      ? await supabaseAdmin
          .from('video_call_transcripts')
          .select('room_id, full_text, summary')
          .in('room_id', room_ids)
      : { data: [] };

    // Create maps for easy lookup
    const recordingMap = new Map((recordings || []).map(r => [r.room_id, r]));
    const transcriptMap = new Map((transcripts || []).map(t => [t.room_id, t]));

    // Build application timeline (simplified)
    const timeline = [
      {
        action: 'applied',
        at: application.created_at,
        description: 'Candidate applied to this position',
      },
      application.released_at ? {
        action: 'released_to_client',
        at: application.released_at,
        description: 'Candidate released for your review',
      } : null,
      upcomingInterview ? {
        action: 'interview_scheduled',
        at: upcomingInterview.created_at,
        description: `Interview scheduled for ${new Date(upcomingInterview.scheduled_at).toLocaleDateString()}`,
      } : null,
    ].filter(Boolean);

    // Log access
    await logClientAccess({
      jobTokenId: tokenData.tokenId,
      action: 'viewed_candidate',
      metadata: {
        applicationId: application_id,
        candidate_id: application.candidate_id,
        candidate_name: `${candidate.first_name} ${candidate.last_name}`,
      },
      ipAddress,
      userAgent,
    });

    // Build onboarding documents list
    const onboardingDocuments = onboarding ? [
      onboarding.sss_doc_url ? { type: 'SSS', url: onboarding.sss_doc_url } : null,
      onboarding.tin_doc_url ? { type: 'TIN', url: onboarding.tin_doc_url } : null,
      onboarding.philhealth_doc_url ? { type: 'PhilHealth', url: onboarding.philhealth_doc_url } : null,
      onboarding.pagibig_doc_url ? { type: 'Pag-IBIG', url: onboarding.pagibig_doc_url } : null,
      onboarding.valid_id_url ? { type: 'Valid ID', url: onboarding.valid_id_url } : null,
      onboarding.education_doc_url ? { type: 'Education', url: onboarding.education_doc_url } : null,
      onboarding.medical_cert_url ? { type: 'Medical Certificate', url: onboarding.medical_cert_url } : null,
      onboarding.resume_url ? { type: 'Resume', url: onboarding.resume_url } : null,
      onboarding.contract_pdf_url ? { type: 'Contract', url: onboarding.contract_pdf_url } : null,
    ].filter(Boolean) : [];

    // Format response
    const response = {
      candidate: {
        id: candidate.id,
        slug: candidate.slug,
        fullName: `${candidate.first_name} ${candidate.last_name}`,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        headline: candidate.headline,
        email: candidate.email,
        avatar: candidate.avatar_url,
        bio: candidate.bio,
        location: candidate.location,
        phone: candidate.phone,
      },
      profile: {
        workStatus: candidate.work_status,
        expectedSalary: {
          min: candidate.expected_salary_min,
          max: candidate.expected_salary_max,
        },
        preferredShift: candidate.preferred_shift,
        yearsExperience: candidate.years_experience,
        skills: (skills || []).map((skill: any) => ({
          name: skill.name,
          proficiency: skill.proficiency_level,
          yearsExperience: skill.years_experience,
        })),
        experience: (experience || []).map((exp: any) => ({
          company: exp.company_name,
          title: exp.job_title,
          start_date: exp.start_date,
          end_date: exp.end_date,
          isCurrent: exp.is_current,
          description: exp.description,
        })),
        education: (education || []).map((edu: any) => ({
          institution: edu.institution_name,
          degree: edu.degree,
          fieldOfStudy: edu.field_of_study,
          start_date: edu.start_date,
          end_date: edu.end_date,
        })),
      },
      resume: resume ? {
        url: resume.file_url,
        filename: resume.filename,
        atsScore: resume.ats_score,
        contentScore: resume.content_score,
      } : null,
      application: {
        id: application.id,
        status: application.status,
        applied_at: application.created_at,
        released_at: application.released_at,
        clientDecision: application.client_decision,
        clientDecisionAt: application.client_decision_at,
        clientNotes: application.client_notes,
        timeline,
      },
      upcomingInterview: upcomingInterview ? {
        id: upcomingInterview.id,
        scheduledAt: upcomingInterview.scheduled_at,
        scheduledAtClientLocal: upcomingInterview.scheduled_at_client_local || null,
        scheduledAtPh: upcomingInterview.scheduled_at_ph || null,
        duration: upcomingInterview.duration_minutes,
        timezone: upcomingInterview.client_timezone || 'Asia/Manila',
        status: upcomingInterview.status,
        meetingLink: upcomingInterview.meeting_link || null,
        outcome: upcomingInterview.outcome,
        rating: upcomingInterview.rating,
        notes: upcomingInterview.interviewer_notes,
      } : null,
      completedInterviews: (allInterviews || [])
        .filter((i: any) => i.status === 'completed')
        .map((i: any) => ({
          id: i.id,
          scheduledAt: i.scheduled_at,
          duration: i.duration_minutes,
          timezone: i.client_timezone || 'Asia/Manila',
          status: i.status,
          meetingLink: i.meeting_link,
          outcome: i.outcome,
          rating: i.rating,
          notes: i.interviewer_notes,
        })),
      offers: (offers || []).map((o: any) => {
        const counters = counterOfferMap.get(o.id) || [];
        return {
          id: o.id,
          salaryOffered: o.salary_offered,
          currency: o.currency || 'PHP',
          start_date: o.start_date,
          benefits: o.benefits_offered,
          additionalTerms: o.additional_terms,
          status: o.status,
          sentAt: o.sent_at,
          viewedAt: o.viewed_at,
          respondedAt: o.responded_at,
          expiresAt: o.expires_at,
          candidateResponse: o.candidate_response,
          rejectionReason: o.rejection_reason,
          counterOffers: counters.map((co: any) => ({
            id: co.id,
            requestedSalary: co.requested_salary,
            currency: co.requested_currency || 'PHP',
            message: co.candidate_message,
            employerResponse: co.employer_response,
            responseType: co.response_type,
            status: co.status,
            created_at: co.created_at,
            respondedAt: co.responded_at,
          })),
        };
      }),
      onboarding: onboarding ? {
        id: onboarding.id,
        candidate_name: `${onboarding.first_name} ${onboarding.middle_name || ''} ${onboarding.last_name}`.trim(),
        email: onboarding.email,
        phone: onboarding.contact_no,
        completionPercent: onboarding.completion_percent,
        isComplete: onboarding.is_complete,
        contractSigned: onboarding.contract_signed,
        contractSignedAt: onboarding.contract_signed_at,
        contractPdfUrl: onboarding.contract_pdf_url,
        employmentStarted: onboarding.employment_started,
        employmentStartDate: onboarding.employment_start_date,
        start_date: onboarding.start_date,
        salary: onboarding.basic_salary,
        position: onboarding.position,
        workSchedule: onboarding.work_schedule,
        checklist: {
          personalInfo: onboarding.personal_info_status,
          govId: onboarding.gov_id_status,
          education: onboarding.education_status,
          medical: onboarding.medical_status,
          dataPrivacy: onboarding.data_privacy_status,
          resume: onboarding.resume_status,
          signature: onboarding.signature_status,
          emergencyContact: onboarding.emergency_contact_status,
        },
        documents: onboardingDocuments,
        created_at: onboarding.created_at,
        updated_at: onboarding.updated_at,
      } : null,
      preScreens: (preScreenRooms || []).map((room: any) => {
        const recording = recordingMap.get(room.id);
        const transcript = transcriptMap.get(room.id);
        return {
          id: room.id,
          title: room.call_title || 'Pre-Screen Call',
          type: room.call_type,
          date: room.created_at,
          endedAt: room.ended_at,
          durationSeconds: recording?.duration_seconds || room.duration_seconds,
          recording_url: recording?.recording_url || null,
          recordingDuration: recording?.duration_seconds || null,
          transcription: transcript?.full_text || null,
          summary: transcript?.summary || null,
          notes: room.notes || null,
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate profile' },
      { status: 500 }
    );
  }
}

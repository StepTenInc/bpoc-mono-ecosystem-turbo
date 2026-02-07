import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../../auth';
import { handleCorsOptions, withCors } from '../../cors';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * GET /api/v1/applications/:id
 * Get single application details with candidate info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { id } = await params;

  try {
    // Get agency's jobs first
    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);
    
    const jobIds = jobs?.map(j => j.id) || [];
    
    if (jobIds.length === 0) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    // Get application
    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs (
          id,
          title,
          agency_client_id,
          agency_clients (
            id,
            companies (
              id,
              name
            )
          )
        ),
        candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('id', id)
      .in('job_id', jobIds)
      .single();

    if (error || !application) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    // Get candidate profile data
    const { data: profile } = await supabaseAdmin
      .from('candidate_profiles')
      .select('headline, bio, location, experience_years')
      .eq('candidate_id', application.candidate_id)
      .single();

    // Get candidate skills
    const { data: skills } = await supabaseAdmin
      .from('candidate_skills')
      .select('name')
      .eq('candidate_id', application.candidate_id);

    // Get resume status
    const { data: resume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id, file_url')
      .eq('candidate_id', application.candidate_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get AI analysis
    const { data: aiAnalysis } = await supabaseAdmin
      .from('candidate_ai_analysis')
      .select('overall_score, strengths, areas_for_growth')
      .eq('candidate_id', application.candidate_id)
      .single();

    // Game assessments removed

    const formattedApplication = {
      id: application.id,
      candidate_id: application.candidate_id,
      job_id: application.job_id,
      resume_id: application.resume_id || null,
      
      // Core status
      status: application.status,
      position: application.position || 0,
      
      // Recruiter handling
      reviewed_by: application.reviewed_by || null,
      reviewed_at: application.reviewed_at || null,
      recruiter_notes: application.recruiter_notes || null,
      
      // Client notes & feedback
      client_notes: application.client_notes || null,
      client_rating: application.client_rating || null,
      client_tags: [],
      
      // Rejection data
      rejection_reason: application.rejection_reason || null,
      rejected_by: application.rejected_by || null,
      rejected_date: application.rejected_date || null,
      
      // Hired/Started tracking
      offer_acceptance_date: application.offer_acceptance_date || null,
      contract_signed: application.contract_signed || false,
      first_day_date: application.first_day_date || null,
      started_status: application.started_status || null,
      
      // Timestamps
      appliedAt: application.created_at,
      updatedAt: application.updated_at,
      
      job: {
        id: application.jobs?.id,
        title: application.jobs?.title,
        client: {
          id: application.jobs?.agency_clients?.id,
          name: application.jobs?.agency_clients?.companies?.name,
        },
      },
      candidate: {
        id: application.candidates?.id,
        firstName: application.candidates?.first_name,
        lastName: application.candidates?.last_name,
        email: application.candidates?.email,
        phone: application.candidates?.phone,
        avatarUrl: application.candidates?.avatar_url,
        headline: profile?.headline || null,
        bio: profile?.bio || null,
        location: profile?.location || null,
        experienceYears: profile?.experience_years || null,
        skills: skills?.map(s => s.name) || [],
        hasResume: !!resume,
        resumeUrl: resume?.file_url || null,
        aiScore: aiAnalysis?.overall_score || null,
        strengths: aiAnalysis?.strengths || [],
        areasForGrowth: aiAnalysis?.areas_for_growth || [],
      },
    };

    return withCors(NextResponse.json({ application: formattedApplication }), request);

  } catch (error) {
    console.error('API v1 applications/:id error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

/**
 * PATCH /api/v1/applications/:id
 * Update application status
 * 
 * Body:
 *   status: 'reviewed' | 'shortlisted' | 'rejected' | 'interview_scheduled' | 'offer_sent' | 'hired'
 *   notes?: string
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { id } = await params;

  try {
    // Get agency's jobs
    const clientIds = await getAgencyClientIds(auth.agencyId);
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .in('agency_client_id', clientIds);
    
    const jobIds = jobs?.map(j => j.id) || [];

    // Verify application belongs to agency
    const { data: existingApp } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .eq('id', id)
      .in('job_id', jobIds)
      .single();

    if (!existingApp) {
      return withCors(NextResponse.json({ error: 'Application not found' }, { status: 404 }), request);
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return withCors(NextResponse.json({ error: 'status is required' }, { status: 400 }), request);
    }

    const normalizeStatus = (raw: any): string => {
      const s = String(raw || '').toLowerCase().trim();
      // Backwards-compat aliases
      if (s === 'reviewed' || s === 'review') return 'under_review';
      return s;
    };

    const normalizedStatus = normalizeStatus(status);
    const validStatuses = [
      // Full enum set we support in DB
      'invited',
      'submitted',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'interviewed',
      'offer_pending',
      'offer_sent',
      'offer_accepted',
      'hired',
      'rejected',
      'withdrawn',
    ];
    if (!validStatuses.includes(normalizedStatus)) {
      return withCors(NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 }), request);
    }

    const updateData: any = {
      status: normalizedStatus,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) updateData.recruiter_notes = notes;

    const { data: application, error } = await supabaseAdmin
      .from('job_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return withCors(NextResponse.json({ error: 'Failed to update application' }, { status: 500 }), request);
    }

    return withCors(NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        updatedAt: application.updated_at,
      },
    }), request);

  } catch (error) {
    console.error('API v1 applications/:id PATCH error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}


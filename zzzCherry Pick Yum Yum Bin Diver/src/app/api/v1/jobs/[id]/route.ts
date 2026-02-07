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
 * GET /api/v1/jobs/:id
 * Get single job details
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
    // Verify job belongs to agency
    const clientIds = await getAgencyClientIds(auth.agencyId);
    
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        agency_clients (
          id,
          companies (
            id,
            name,
            industry,
            website
          )
        )
      `)
      .eq('id', id)
      .in('agency_client_id', clientIds)
      .single();

    if (error || !job) {
      return withCors(NextResponse.json({ error: 'Job not found' }, { status: 404 }), request);
    }

    // Format response - return ALL fields
    const formattedJob = {
      ...job, // Return ALL database fields
      // Also include camelCase versions for backward compatibility
      agencyClientId: job.agency_client_id,
      postedBy: job.posted_by,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      salaryType: job.salary_type,
      workArrangement: job.work_arrangement,
      workType: job.work_type,
      experienceLevel: job.experience_level,
      applicationDeadline: job.application_deadline,
      applicantsCount: job.applicants_count,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      client: {
        id: job.agency_clients?.id,
        name: job.agency_clients?.companies?.name,
        industry: job.agency_clients?.companies?.industry,
      },
    };

    return withCors(NextResponse.json({ job: formattedJob }), request);

  } catch (error) {
    console.error('API v1 jobs/:id error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

/**
 * PATCH /api/v1/jobs/:id
 * Update job (status, details)
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
    // Verify job belongs to agency
    const clientIds = await getAgencyClientIds(auth.agencyId);
    
    const { data: existingJob } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('id', id)
      .in('agency_client_id', clientIds)
      .single();

    if (!existingJob) {
      return withCors(NextResponse.json({ error: 'Job not found' }, { status: 404 }), request);
    }

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      salaryMin,
      salaryMax,
      currency,
      workArrangement,
      workType,
      shift,
      experienceLevel,
      status,
    } = body;

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (responsibilities !== undefined) updateData.responsibilities = responsibilities;
    if (benefits !== undefined) updateData.benefits = benefits;
    if (salaryMin !== undefined) updateData.salary_min = salaryMin;
    if (salaryMax !== undefined) updateData.salary_max = salaryMax;
    if (currency !== undefined) updateData.currency = currency;
    if (workArrangement !== undefined) updateData.work_arrangement = workArrangement;
    if (workType !== undefined) updateData.work_type = workType;
    if (shift !== undefined) updateData.shift = shift;
    if (experienceLevel !== undefined) updateData.experience_level = experienceLevel;
    if (status !== undefined) updateData.status = status;

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return withCors(NextResponse.json({ error: 'Failed to update job' }, { status: 500 }), request);
    }

    return withCors(NextResponse.json({
      success: true,
      job: {
        ...job, // Return ALL fields
        updatedAt: job.updated_at,
      },
    }), request);

  } catch (error) {
    console.error('API v1 jobs/:id PATCH error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}


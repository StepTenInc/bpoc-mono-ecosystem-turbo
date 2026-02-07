import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/recruiter/jobs/[id]
 * Fetch a single job by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Get job with client info
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        agency_clients (
          id,
          agency_id,
          companies (
            name
          )
        ),
        job_skills (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify job belongs to recruiter's agency
    if (job.agency_clients?.agency_id !== recruiter.agency_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        clientName: job.agency_clients?.companies?.name || 'Unknown Client',
        skills: (job.job_skills || []).map((s: { name: string }) => s.name),
      }
    });

  } catch (error) {
    console.error('Fetch job error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

/**
 * PATCH /api/recruiter/jobs/[id]
 * Update a job
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Verify job belongs to recruiter's agency
    const { data: existingJob } = await supabaseAdmin
      .from('jobs')
      .select('agency_clients(agency_id)')
      .eq('id', id)
      .single();

    if (!existingJob || (existingJob as any).agency_clients?.agency_id !== recruiter.agency_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      skills,
      salary_min,
      salary_max,
      salaryMin,
      salaryMax,
      currency,
      workType,
      workArrangement,
      shift,
      experienceLevel,
      status,
    } = body;

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (responsibilities !== undefined) updateData.responsibilities = responsibilities;
    if (benefits !== undefined) updateData.benefits = benefits;
    
    const finalSalaryMin = salary_min ?? salaryMin;
    const finalSalaryMax = salary_max ?? salaryMax;
    if (finalSalaryMin !== undefined) updateData.salary_min = finalSalaryMin;
    if (finalSalaryMax !== undefined) updateData.salary_max = finalSalaryMax;
    
    if (currency !== undefined) updateData.currency = currency;
    if (workType !== undefined) updateData.work_type = workType;
    if (workArrangement !== undefined) updateData.work_arrangement = workArrangement;
    if (shift !== undefined) updateData.shift = shift;
    if (experienceLevel !== undefined) updateData.experience_level = experienceLevel;
    if (status !== undefined) updateData.status = status;

    // Update job
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update job error:', error);
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }

    // Update skills if provided
    if (skills !== undefined) {
      // Delete existing skills
      await supabaseAdmin
        .from('job_skills')
        .delete()
        .eq('job_id', id);

      // Insert new skills
      if (skills.length > 0) {
        const skillInserts = skills.map((skill: string) => ({
          job_id: id,
          name: skill,
          is_required: true,
        }));

        await supabaseAdmin
          .from('job_skills')
          .insert(skillInserts);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      job
    });

  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

/**
 * DELETE /api/recruiter/jobs/[id]
 * Delete a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Verify job belongs to recruiter's agency
    const { data: existingJob } = await supabaseAdmin
      .from('jobs')
      .select('agency_clients(agency_id)')
      .eq('id', id)
      .single();

    if (!existingJob || (existingJob as any).agency_clients?.agency_id !== recruiter.agency_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete job (skills will cascade)
    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete job error:', error);
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}


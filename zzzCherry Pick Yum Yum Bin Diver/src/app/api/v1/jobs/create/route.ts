import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey, getAgencyClientIds } from '../../auth';
import { handleCorsOptions, withCors } from '../../cors';
import { transformToApi, transformFromApi } from '@/lib/api/transform';

// Normalize enum values - convert various formats to what the database expects
function normalizeExperienceLevel(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/-/g, '_');
  const mapping: Record<string, string> = {
    'entry': 'entry_level',
    'entry_level': 'entry_level',
    'entrylevel': 'entry_level',
    'junior': 'entry_level',
    'mid': 'mid_level',
    'mid_level': 'mid_level',
    'midlevel': 'mid_level',
    'intermediate': 'mid_level',
    'senior': 'senior_level',
    'senior_level': 'senior_level',
    'seniorlevel': 'senior_level',
    'lead': 'senior_level',
    'manager': 'senior_level',
  };
  return mapping[normalized] || null; // Return null if not recognized (skip the field)
}

function normalizeWorkType(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/-/g, '_');
  const mapping: Record<string, string> = {
    'full_time': 'full_time',
    'fulltime': 'full_time',
    'full': 'full_time',
    'part_time': 'part_time',
    'parttime': 'part_time',
    'part': 'part_time',
    'contract': 'contract',
    'contractor': 'contract',
    'freelance': 'contract',
  };
  return mapping[normalized] || 'full_time';
}

function normalizeWorkArrangement(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/-/g, '_');
  const mapping: Record<string, string> = {
    'remote': 'remote',
    'wfh': 'remote',
    'work_from_home': 'remote',
    'onsite': 'onsite',
    'on_site': 'onsite',
    'office': 'onsite',
    'hybrid': 'hybrid',
    'mixed': 'hybrid',
  };
  return mapping[normalized] || 'remote';
}

function normalizeShift(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/-/g, '_');
  const mapping: Record<string, string> = {
    'day': 'day',
    'daytime': 'day',
    'morning': 'day',
    'night': 'night',
    'nightshift': 'night',
    'graveyard': 'night',
    'flexible': 'flexible',
    'rotating': 'flexible',
    'any': 'flexible',
  };
  return mapping[normalized] || 'day';
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * POST /api/v1/jobs/create
 * Create a new job listing
 * 
 * TIER: Pro+
 * 
 * Body:
 *   title: string (required)
 *   description: string (required)
 *   requirements: string[]
 *   responsibilities: string[]
 *   benefits: string[]
 *   salaryMin: number
 *   salaryMax: number
 *   currency: string (default: PHP)
 *   workArrangement: 'remote' | 'onsite' | 'hybrid'
 *   workType: 'full_time' | 'part_time' | 'contract'
 *   experienceLevel: 'entry_level' | 'mid_level' | 'senior_level'
 *   clientId?: string (optional, defaults to first client)
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }));
  }

  // Check tier access (Pro or Enterprise)
  const tier = await getAgencyTier(auth.agencyId);
  if (tier === 'free') {
    return withCors(NextResponse.json({ 
      error: 'Creating jobs via API requires Pro plan',
      upgrade: 'Upgrade to Pro to create jobs via API'
    }, { status: 403 }));
  }

  try {
    const body = await request.json();
    // Accept both camelCase and snake_case input
    const input = transformFromApi(body);
    const {
      title,
      description,
      requirements,
      responsibilities,
      benefits,
      salary_min,
      salary_max,
      currency = 'PHP',
      work_arrangement = 'remote',
      work_type = 'full_time',
      shift = 'day',
      experience_level = 'mid_level',
      client_id,
      skills,
    } = input;

    // Validation
    if (!title || !description) {
      return withCors(NextResponse.json({ 
        error: 'Missing required fields: title, description' 
      }, { status: 400 }));
    }

    // Get or validate client
    const clientIds = await getAgencyClientIds(auth.agencyId);
    
    if (clientIds.length === 0) {
      return withCors(NextResponse.json({ 
        error: 'No clients found. Create a client first before posting jobs.' 
      }, { status: 400 }));
    }

    let targetClientId = client_id;
    if (client_id) {
      if (!clientIds.includes(client_id)) {
        return withCors(NextResponse.json({ 
          error: 'Invalid clientId. Client does not belong to your agency.' 
        }, { status: 400 }));
      }
    } else {
      targetClientId = clientIds[0];
    }

    // Generate slug
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 10)}`;

    // Normalize enum values to match database expectations
    const normalizedExperienceLevel = normalizeExperienceLevel(experience_level);
    const normalizedWorkType = normalizeWorkType(work_type);
    const normalizedWorkArrangement = normalizeWorkArrangement(work_arrangement);
    const normalizedShift = normalizeShift(shift);

    // Build job data - only include fields that exist in the table
    const jobData: Record<string, any> = {
      agency_client_id: targetClientId,
      title,
      slug,
      description,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      benefits: benefits || [],
      status: 'active',
    };

    // Add optional fields if provided
    if (salary_min !== undefined && salary_min !== null) jobData.salary_min = salary_min;
    if (salary_max !== undefined && salary_max !== null) jobData.salary_max = salary_max;
    if (currency) jobData.currency = currency;
    if (normalizedWorkArrangement) jobData.work_arrangement = normalizedWorkArrangement;
    if (normalizedWorkType) jobData.work_type = normalizedWorkType;
    if (normalizedShift) jobData.shift = normalizedShift;
    if (normalizedExperienceLevel) jobData.experience_level = normalizedExperienceLevel;

    console.log('Creating job with data:', JSON.stringify(jobData, null, 2));

    // Create job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create job:', jobError);
      console.error('Job error details:', JSON.stringify(jobError, null, 2));
      return withCors(NextResponse.json({ 
        error: 'Failed to create job',
        details: jobError?.message || 'Unknown database error',
        code: jobError?.code,
      }, { status: 500 }));
    }

    // Add skills if provided
    if (skills && skills.length > 0) {
      const skillInserts = skills.map((skill: string) => ({
        job_id: job.id,
        name: skill,
        is_required: true,
      }));

      await supabaseAdmin.from('job_skills').insert(skillInserts);
    }

    const response = {
      success: true,
      job: {
        id: job.id,
        title: job.title,
        slug: job.slug,
        status: job.status,
        created_at: job.created_at,
      },
      message: 'Job created successfully',
    };
    return withCors(NextResponse.json(transformToApi(response), { status: 201 }));

  } catch (error: any) {
    console.error('API v1 jobs create error:', error);
    return withCors(NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
    }, { status: 500 }));
  }
}

async function getAgencyTier(agencyId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('api_tier')
    .eq('id', agencyId)
    .single();
  
  return data?.api_tier || 'free';
}

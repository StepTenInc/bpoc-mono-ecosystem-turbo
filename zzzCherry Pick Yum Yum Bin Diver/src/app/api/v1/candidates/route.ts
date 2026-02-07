import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey } from '../auth';
import { handleCorsOptions, withCors } from '../cors';
import { transformToApi, transformFromApi, apiError, apiSuccess, API_ERROR_CODES } from '@/lib/api/transform';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/v1/candidates
 * Search and list candidates from the talent pool
 * 
 * TIER: Enterprise
 * 
 * Query params:
 *   ?search=keyword
 *   ?skills=skill1,skill2
 *   ?hasResume=true
 *   ?limit=50
 *   ?offset=0
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(
      NextResponse.json({ error: auth.error }, { status: auth.status }),
      request,
      'rateLimit' in auth ? auth.rateLimit : undefined
    );
  }

  // Check tier access (Enterprise only)
  const tier = await getAgencyTier(auth.agencyId);
  if (tier !== 'enterprise') {
    return withCors(NextResponse.json({ 
      error: 'Talent pool access requires Enterprise plan',
      upgrade: 'Contact sales to upgrade your plan'
    }, { status: 403 }));
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const skills = searchParams.get('skills')?.split(',');
  const hasResume = searchParams.get('hasResume') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabaseAdmin
      .from('candidates')
      .select(`
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        username,
        slug,
        is_active,
        email_verified,
        created_at
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: candidates, count, error } = await query;

    if (error) {
      return withCors(NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 }));
    }

    // Get additional data for candidates
    const candidateIds = candidates?.map(c => c.id) || [];
    
    // Get profiles
    const { data: profiles } = await supabaseAdmin
      .from('candidate_profiles')
      .select('candidate_id, headline, location, experience_years')
      .in('candidate_id', candidateIds.length > 0 ? candidateIds : ['none']);

    const profileMap = Object.fromEntries(
      (profiles || []).map(p => [p.candidate_id, p])
    );

    // Get skills
    const { data: skillsData } = await supabaseAdmin
      .from('candidate_skills')
      .select('candidate_id, name')
      .in('candidate_id', candidateIds.length > 0 ? candidateIds : ['none']);

    const skillsMap: Record<string, string[]> = {};
    (skillsData || []).forEach(s => {
      if (!skillsMap[s.candidate_id]) skillsMap[s.candidate_id] = [];
      skillsMap[s.candidate_id].push(s.name);
    });

    // Get resumes
    const { data: resumes } = await supabaseAdmin
      .from('candidate_resumes')
      .select('candidate_id')
      .in('candidate_id', candidateIds.length > 0 ? candidateIds : ['none']);

    const resumeSet = new Set((resumes || []).map(r => r.candidate_id));

    // Game assessments removed - focus on professional metrics only

    // Format response - build with snake_case then transform
    let formattedCandidates = (candidates || []).map(c => {
      const profile = profileMap[c.id];
      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        avatar_url: c.avatar_url,
        headline: profile?.headline || null,
        location: profile?.location || null,
        experience_years: profile?.experience_years || null,
        skills: skillsMap[c.id] || [],
        has_resume: resumeSet.has(c.id),
        created_at: c.created_at,
      };
    });

    // Filter by skills if specified
    if (skills && skills.length > 0) {
      formattedCandidates = formattedCandidates.filter(c => 
        skills.some(skill => c.skills.some(s => s.toLowerCase().includes(skill.toLowerCase())))
      );
    }

    // Filter by hasResume if specified
    if (hasResume) {
      formattedCandidates = formattedCandidates.filter(c => c.has_resume);
    }

    // Transform to camelCase for API response
    const response = {
      candidates: formattedCandidates,
      total: count || 0,
      limit,
      offset,
    };

    return withCors(NextResponse.json(transformToApi(response)));

  } catch (error) {
    console.error('API v1 candidates error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

/**
 * POST /api/v1/candidates
 * Create a new candidate in the talent pool
 * 
 * Body (camelCase or snake_case accepted):
 *   firstName/first_name: string (required)
 *   lastName/last_name: string (required)
 *   email: string (required)
 *   phone: string (optional)
 *   avatarUrl/avatar_url: string (optional)
 *   headline: string (optional)
 *   location: string (optional)
 *   experienceYears/experience_years: number (optional)
 *   skills: string[] (optional)
 *   resumeUrl/resume_url: string (optional)
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }));
  }

  try {
    const body = await request.json();
    
    // Transform input to snake_case for database
    const input = transformFromApi(body);
    
    // Validate required fields
    if (!input.first_name || !input.last_name || !input.email) {
      const error = apiError(
        'Missing required fields: firstName, lastName, email',
        API_ERROR_CODES.MISSING_REQUIRED_FIELD,
        400
      );
      return withCors(NextResponse.json(error.body, { status: error.status }));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      const error = apiError(
        'Invalid email format',
        API_ERROR_CODES.INVALID_FORMAT,
        400
      );
      return withCors(NextResponse.json(error.body, { status: error.status }));
    }

    // Check if candidate with this email already exists
    const { data: existingCandidate } = await supabaseAdmin
      .from('candidates')
      .select('id, email')
      .eq('email', input.email.toLowerCase())
      .single();

    if (existingCandidate) {
      const error = apiError(
        'A candidate with this email already exists',
        API_ERROR_CODES.ALREADY_EXISTS,
        409,
        { candidateId: existingCandidate.id }
      );
      return withCors(NextResponse.json(error.body, { status: error.status }));
    }

    // Create auth user first (required for candidates table foreign key)
    const tempPassword = `Temp${Math.random().toString(36).substring(2, 15)}!${Date.now()}`;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email.toLowerCase(),
      password: tempPassword,
      email_confirm: false, // They'll need to verify email
      user_metadata: {
        first_name: input.first_name,
        last_name: input.last_name,
      }
    });

    if (authError || !authUser.user) {
      console.error('Failed to create auth user:', authError);
      const error = apiError(
        'Failed to create candidate auth user',
        API_ERROR_CODES.DATABASE_ERROR,
        500,
        { details: authError?.message }
      );
      return withCors(NextResponse.json(error.body, { status: error.status }));
    }

    // Create candidate record with auth user ID
    const { data: newCandidate, error: candidateError} = await supabaseAdmin
      .from('candidates')
      .insert({
        id: authUser.user.id, // Use auth user ID
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email.toLowerCase(),
      })
      .select()
      .single();

    if (candidateError || !newCandidate) {
      console.error('Failed to create candidate:', candidateError);
      const error = apiError(
        'Failed to create candidate',
        API_ERROR_CODES.DATABASE_ERROR,
        500,
        { details: candidateError?.message }
      );
      return withCors(NextResponse.json(error.body, { status: error.status }));
    }

    // Create candidate profile if profile data provided
    if (input.headline || input.location || input.experience_years) {
      const { error: profileError } = await supabaseAdmin
        .from('candidate_profiles')
        .insert({
          candidate_id: newCandidate.id,
          headline: input.headline || null,
          location: input.location || null,
          experience_years: input.experience_years || null,
        });

      if (profileError) {
        console.error('Failed to create candidate profile:', profileError);
        // Don't fail the request, profile is optional
      }
    }

    // Add skills if provided
    if (input.skills && Array.isArray(input.skills) && input.skills.length > 0) {
      const skillsToInsert = input.skills.map((skill: string) => ({
        candidate_id: newCandidate.id,
        name: skill,
      }));

      const { error: skillsError } = await supabaseAdmin
        .from('candidate_skills')
        .insert(skillsToInsert);

      if (skillsError) {
        console.error('Failed to add candidate skills:', skillsError);
        // Don't fail the request, skills are optional
      }
    }

    // Add resume URL if provided
    if (input.resume_url) {
      const { error: resumeError } = await supabaseAdmin
        .from('candidate_resumes')
        .insert({
          candidate_id: newCandidate.id,
          file_url: input.resume_url,
          file_name: 'Resume',
          file_type: 'application/pdf',
          is_primary: true,
        });

      if (resumeError) {
        console.error('Failed to add candidate resume:', resumeError);
        // Don't fail the request, resume is optional
      }
    }

    // Fetch complete candidate data
    const { data: completeCandidate } = await supabaseAdmin
      .from('candidates')
      .select(`
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        username,
        slug,
        is_active,
        email_verified,
        created_at,
        updated_at
      `)
      .eq('id', newCandidate.id)
      .single();

    const success = apiSuccess(completeCandidate, 201);
    return withCors(NextResponse.json(success.body, { status: success.status }));

  } catch (error) {
    console.error('API v1 POST candidates error:', error);
    const err = apiError(
      'Internal server error',
      API_ERROR_CODES.INTERNAL_ERROR,
      500
    );
    return withCors(NextResponse.json(err.body, { status: err.status }));
  }
}

/**
 * Get agency tier from database
 */
async function getAgencyTier(agencyId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('api_tier')
    .eq('id', agencyId)
    .single();
  
  return data?.api_tier || 'free';
}


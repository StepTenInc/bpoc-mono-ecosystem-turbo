import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey } from '../../auth';
import { handleCorsOptions, withCors } from '../../cors';
import { transformFromApi, apiError, apiSuccess, API_ERROR_CODES } from '@/lib/api/transform';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * POST /api/v1/candidates/bulk
 * Bulk import candidates (up to 100 at a time)
 * 
 * TIER: Enterprise
 * 
 * Body:
 *   candidates: Array of candidate objects (max 100)
 *   skipDuplicates: boolean (default true) - Skip existing emails vs fail
 */
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(
      NextResponse.json({ error: auth.error }, { status: auth.status }),
      request,
      'rateLimit' in auth ? auth.rateLimit : undefined
    );
  }

  // Check tier access (Enterprise only)
  const tier = await getAgencyTier(auth.agency_id);
  if (tier !== 'enterprise') {
    return withCors(NextResponse.json({
      error: 'Bulk import requires Enterprise plan',
      upgrade: 'Contact sales to upgrade your plan'
    }, { status: 403 }));
  }

  try {
    const body = await request.json();
    const input = transformFromApi(body);
    const { candidates, skip_duplicates = true } = input;

    if (!candidates || !Array.isArray(candidates)) {
      return withCors(NextResponse.json({
        error: 'candidates array is required'
      }, { status: 400 }));
    }

    if (candidates.length === 0) {
      return withCors(NextResponse.json({
        error: 'candidates array cannot be empty'
      }, { status: 400 }));
    }

    if (candidates.length > 100) {
      return withCors(NextResponse.json({
        error: 'Maximum 100 candidates per request'
      }, { status: 400 }));
    }

    // Validate all candidates have required fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < candidates.length; i++) {
      const c = transformFromApi(candidates[i]);
      if (!c.first_name || !c.last_name || !c.email) {
        return withCors(NextResponse.json({
          error: `Candidate at index ${i} missing required fields: first_name, last_name, email`
        }, { status: 400 }));
      }
      if (!emailRegex.test(c.email)) {
        return withCors(NextResponse.json({
          error: `Invalid email format at index ${i}: ${c.email}`
        }, { status: 400 }));
      }
    }

    // Get existing emails
    const emails = candidates.map((c: any) => 
      (c.email || c.email).toLowerCase()
    );

    const { data: existing } = await supabaseAdmin
      .from('candidates')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set((existing || []).map(e => e.email.toLowerCase()));

    // Filter out duplicates if skip_duplicates is true
    const toProcess = skip_duplicates
      ? candidates.filter((c: any) => !existingEmails.has((c.email || c.email).toLowerCase()))
      : candidates;

    if (!skip_duplicates && existingEmails.size > 0) {
      return withCors(NextResponse.json({
        error: 'Duplicate emails found',
        duplicates: Array.from(existingEmails)
      }, { status: 409 }));
    }

    // Process candidates
    const results = {
      created: [] as any[],
      skipped: [] as any[],
      failed: [] as any[],
    };

    for (const candidate of toProcess) {
      const c = transformFromApi(candidate);
      
      try {
        // Create auth user
        const tempPassword = `Temp${Math.random().toString(36).substring(2, 15)}!${Date.now()}`;
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: c.email.toLowerCase(),
          password: tempPassword,
          email_confirm: false,
          user_metadata: {
            first_name: c.first_name,
            last_name: c.last_name,
            source: 'api_bulk_import'
          }
        });

        if (authError || !authUser.user) {
          results.failed.push({ email: c.email, error: authError?.message || 'Failed to create auth user' });
          continue;
        }

        // Create candidate record
        const { data: newCandidate, error: candidateError } = await supabaseAdmin
          .from('candidates')
          .insert({
            id: authUser.user.id,
            first_name: c.first_name,
            last_name: c.last_name,
            email: c.email.toLowerCase(),
            phone: c.phone || null,
          })
          .select('id, email')
          .single();

        if (candidateError) {
          // Rollback auth user
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          results.failed.push({ email: c.email, error: candidateError.message });
          continue;
        }

        // Create profile if provided
        if (c.headline || c.location || c.experience_years) {
          await supabaseAdmin
            .from('candidate_profiles')
            .insert({
              candidate_id: newCandidate.id,
              headline: c.headline || null,
              location: c.location || null,
              experience_years: c.experience_years || null,
            });
        }

        // Add skills if provided
        if (c.skills && Array.isArray(c.skills) && c.skills.length > 0) {
          await supabaseAdmin
            .from('candidate_skills')
            .insert(c.skills.map((skill: string) => ({
              candidate_id: newCandidate.id,
              name: skill,
            })));
        }

        results.created.push({ id: newCandidate.id, email: newCandidate.email });
      } catch (error: any) {
        results.failed.push({ email: c.email, error: error.message });
      }
    }

    // Add skipped candidates
    for (const candidate of candidates) {
      const email = (candidate.email || candidate.email).toLowerCase();
      if (existingEmails.has(email)) {
        results.skipped.push({ email, reason: 'Already exists' });
      }
    }

    return withCors(NextResponse.json({
      success: true,
      summary: {
        total: candidates.length,
        created: results.created.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
      },
      results,
    }), request);

  } catch (error) {
    console.error('Bulk import error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

async function getAgencyTier(agency_id: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('api_tier')
    .eq('id', agency_id)
    .single();
  
  return data?.api_tier || 'free';
}

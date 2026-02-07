import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getAgencyClientIds } from '../../../auth';
import { handleCorsOptions, withCors } from '../../../cors';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

/**
 * GET /api/v1/candidates/:id/complete
 * Get COMPLETE candidate data - everything in one response
 * 
 * This is the "Candidate Truth" endpoint - returns all candidate information
 * from multiple tables aggregated into a single, comprehensive response.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }), request);
  }

  const { agencyId } = auth;
  const { id } = await params;

  try {
    // Check agency tier
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('api_tier')
      .eq('id', agencyId)
      .single();

    const tier = agency?.api_tier || 'free';
    const isEnterprise = tier === 'enterprise';

    // Enterprise clients have FULL ACCESS to ALL candidates (that's what they pay for!)
    // Pro/Free: only candidates who applied to their jobs
    if (!isEnterprise) {
      const clientIds = await getAgencyClientIds(agencyId);
      const { data: application } = await supabaseAdmin
        .from('job_applications')
        .select(`
          candidate_id,
          jobs!inner(
            id,
            agency_client_id
          )
        `)
        .eq('candidate_id', id)
        .in('jobs.agency_client_id', clientIds)
        .limit(1)
        .single();

      if (!application) {
        return withCors(NextResponse.json(
          { error: 'Candidate not found or access denied. Candidate must have applied to one of your jobs. Enterprise tier required for full talent pool access.' },
          { status: 404 }
        ), request);
      }
    }

    // For Enterprise: Try to use the candidate_truth view (single source of truth)
    // Falls back to individual queries if view doesn't exist
    if (isEnterprise) {
      try {
        const { data: candidateTruth, error: viewError } = await supabaseAdmin
          .from('candidate_truth')
          .select('*')
          .eq('id', id)
          .single();

        if (!viewError && candidateTruth) {
          // Transform view data to match API response format
          // NOTE: Contact details (email/phone) are EXCLUDED - use platform to contact candidates
          return withCors(NextResponse.json({
            candidate: {
              id: candidateTruth.id,
              firstName: candidateTruth.first_name,
              lastName: candidateTruth.last_name,
              fullName: candidateTruth.full_name,
              avatarUrl: candidateTruth.avatar_url,
              username: candidateTruth.username,
              slug: candidateTruth.slug,
              isActive: candidateTruth.is_active,
              createdAt: candidateTruth.candidate_created_at,
              updatedAt: candidateTruth.candidate_updated_at,
              headline: candidateTruth.headline,
              bio: candidateTruth.bio,
              birthday: candidateTruth.birthday,
              gender: candidateTruth.gender,
              location: candidateTruth.location,
              locationCity: candidateTruth.location_city,
              locationProvince: candidateTruth.location_province,
              locationCountry: candidateTruth.location_country,
              locationRegion: candidateTruth.location_region,
              experienceYears: candidateTruth.experience_years,
              currentRole: candidateTruth.current_position,
              currentCompany: candidateTruth.current_employer,
              workStatus: candidateTruth.work_status,
              salaryExpectation: candidateTruth.expected_salary_min || candidateTruth.expected_salary_max ? {
                min: candidateTruth.expected_salary_min,
                max: candidateTruth.expected_salary_max,
                currency: 'PHP',
              } : null,
              currentSalary: candidateTruth.current_salary,
              noticePeriodDays: candidateTruth.notice_period_days,
              preferredShift: candidateTruth.preferred_shift,
              preferredWorkSetup: candidateTruth.preferred_work_setup,
              skills: candidateTruth.skills || [],
              assessments: {
                disc: candidateTruth.disc_assessment,
                typing: candidateTruth.typing_assessment,
              },
              workExperiences: candidateTruth.work_experiences || [],
              educations: candidateTruth.educations || [],
              languages: (candidateTruth.skills || []).filter((s: any) => s.category === 'Language').map((s: any) => ({
                language: s.name,
                proficiency: s.proficiencyLevel,
                yearsExperience: s.yearsExperience,
              })),
              resume: candidateTruth.resume,
              aiAnalysis: candidateTruth.ai_analysis,
              profileCompleteness: candidateTruth.profile_completion_percentage || 0,
              profileCompleted: candidateTruth.profile_completed || false,
              lastActive: candidateTruth.candidate_updated_at,
            },
          }), request);
        }
      } catch (viewErr) {
        // View might not exist yet, fall through to individual queries
        console.log('candidate_truth view not available, using individual queries', viewErr);
      }
    }

    // Fallback: Individual queries (works for all tiers)
    // 1. Get basic candidate info
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (candidateError || !candidate) {
      return withCors(NextResponse.json({ error: 'Candidate not found' }, { status: 404 }), request);
    }

    // 2. Get profile data
    const { data: profile } = await supabaseAdmin
      .from('candidate_profiles')
      .select('*')
      .eq('candidate_id', id)
      .single();

    // 3. Get skills
    const { data: skills } = await supabaseAdmin
      .from('candidate_skills')
      .select('*')
      .eq('candidate_id', id)
      .order('is_primary', { ascending: false })
      .order('years_experience', { ascending: false });

    // 4. Get work experiences
    const { data: workExperiences } = await supabaseAdmin
      .from('candidate_work_experiences')
      .select('*')
      .eq('candidate_id', id)
      .order('start_date', { ascending: false });

    // 5. Get education
    const { data: educations } = await supabaseAdmin
      .from('candidate_educations')
      .select('*')
      .eq('candidate_id', id)
      .order('end_date', { ascending: false, nullsFirst: false });

    // Game assessments removed - focus on professional credentials only

    // 6. Get resume (primary)
    const { data: resumes } = await supabaseAdmin
      .from('candidate_resumes')
      .select('*')
      .eq('candidate_id', id)
      .eq('is_primary', true)
      .limit(1);

    // 9. Get AI analysis (latest)
    const { data: aiAnalyses } = await supabaseAdmin
      .from('candidate_ai_analysis')
      .select('*')
      .eq('candidate_id', id)
      .order('created_at', { ascending: false })
      .limit(1);

    // Calculate experience years from work experiences
    const experienceYears = workExperiences?.reduce((total, exp) => {
      if (exp.start_date) {
        const start = new Date(exp.start_date);
        const end = exp.end_date ? new Date(exp.end_date) : new Date();
        const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return total + years;
      }
      return total;
    }, 0) || 0;

    // Build comprehensive response
    // NOTE: Contact details (email/phone) are EXCLUDED - use platform to contact candidates
    const response = {
      candidate: {
        // Basic Info (NO CONTACT DETAILS)
        id: candidate.id,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        fullName: candidate.full_name,
        avatarUrl: candidate.avatar_url,
        username: candidate.username,
        slug: candidate.slug,
        isActive: candidate.is_active,
        createdAt: candidate.created_at,
        updatedAt: candidate.updated_at,

        // Profile Data
        headline: profile?.position || null,
        bio: profile?.bio || null,
        birthday: profile?.birthday || null,
        gender: profile?.gender || null,
        location: profile?.location || null,
        locationCity: profile?.location_city || null,
        locationProvince: profile?.location_province || null,
        locationCountry: profile?.location_country || null,
        locationRegion: profile?.location_region || null,

        // Professional Info
        experienceYears: Math.round(experienceYears * 10) / 10, // Round to 1 decimal
        currentRole: profile?.current_position || null,
        currentCompany: profile?.current_employer || null,
        workStatus: profile?.work_status || null,
        salaryExpectation: profile?.expected_salary_min || profile?.expected_salary_max ? {
          min: profile?.expected_salary_min || null,
          max: profile?.expected_salary_max || null,
          currency: 'PHP', // Default, could be from profile if stored
        } : null,
        currentSalary: profile?.current_salary || null,
        noticePeriodDays: profile?.notice_period_days || null,
        preferredShift: profile?.preferred_shift || null,
        preferredWorkSetup: profile?.preferred_work_setup || null,

        // Skills
        skills: (skills || []).map(skill => ({
          name: skill.name,
          category: skill.category,
          proficiencyLevel: skill.proficiency_level,
          yearsExperience: skill.years_experience,
          isPrimary: skill.is_primary,
          verified: skill.verified,
        })),

        // Game assessments removed - professional credentials only

        // Work History (FULL)
        workExperiences: (workExperiences || []).map(exp => ({
          id: exp.id,
          role: exp.job_title,
          company: exp.company_name,
          location: exp.location,
          startDate: exp.start_date,
          endDate: exp.end_date,
          isCurrent: exp.is_current,
          description: exp.description,
          responsibilities: exp.responsibilities || [],
          achievements: exp.achievements || [],
        })),

        // Education (FULL)
        educations: (educations || []).map(edu => ({
          id: edu.id,
          degree: edu.degree,
          fieldOfStudy: edu.field_of_study,
          institution: edu.institution,
          startDate: edu.start_date,
          endDate: edu.end_date,
          isCurrent: edu.is_current,
          grade: edu.grade,
          description: edu.description,
        })),

        // Languages (extracted from skills with Language category)
        languages: (skills || [])
          .filter(skill => skill.category === 'Language')
          .map(skill => ({
            language: skill.name,
            proficiency: skill.proficiency_level,
            yearsExperience: skill.years_experience,
          })),

        // Documents
        resume: resumes && resumes.length > 0 ? {
          id: resumes[0].id,
          url: resumes[0].file_url,
          title: resumes[0].title,
          slug: resumes[0].slug,
          uploadedAt: resumes[0].created_at,
          isPrimary: resumes[0].is_primary,
          isPublic: resumes[0].is_public,
        } : null,

        // AI Analysis
        aiAnalysis: aiAnalyses && aiAnalyses.length > 0 ? {
          overallScore: aiAnalyses[0].overall_score,
          atsCompatibilityScore: aiAnalyses[0].ats_compatibility_score,
          contentQualityScore: aiAnalyses[0].content_quality_score,
          professionalPresentationScore: aiAnalyses[0].professional_presentation_score,
          skillsAlignmentScore: aiAnalyses[0].skills_alignment_score,
          strengths: aiAnalyses[0].key_strengths || [],
          areasForGrowth: aiAnalyses[0].improvements || [],
          recommendations: aiAnalyses[0].recommendations || [],
          summary: aiAnalyses[0].improved_summary || null,
          strengthsAnalysis: aiAnalyses[0].strengths_analysis || {},
          sectionAnalysis: aiAnalyses[0].section_analysis || {},
          createdAt: aiAnalyses[0].created_at,
        } : null,

        // Metadata
        profileCompleteness: profile?.profile_completion_percentage || 0,
        profileCompleted: profile?.profile_completed || false,
        lastActive: candidate.updated_at,
      },
    };

    return withCors(NextResponse.json(response), request);
  } catch (error) {
    console.error('Error fetching complete candidate data:', error);
    return withCors(NextResponse.json(
      { error: 'Failed to fetch candidate data' },
      { status: 500 }
    ), request);
  }
}


/**
 * Supabase Queries for Candidate Profiles
 * Direct queries to new Supabase candidate_profiles table
 */
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { CandidateProfile } from './types'

export async function getProfileByCandidate(candidateId: string, useAdmin: boolean = false): Promise<CandidateProfile | null> {
  // Use admin client if requested (for server-side operations that need to bypass RLS)
  const supabase = useAdmin ? supabaseAdmin : await createClient()

  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('candidate_id', candidateId)
    .single()

  if (error || !data) {
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (expected)
      console.error('❌ [getProfileByCandidate] Query error:', {
        code: error.code,
        message: error.message,
        candidate_id: candidateId,
        useAdmin,
      })
    }
    return null
  }

  return {
    id: data.id,
    candidate_id: data.candidate_id,
    bio: data.bio,
    headline: data.headline,
    phone: data.phone,
    position: data.position,
    birthday: data.birthday,
    gender: data.gender,
    gender_custom: data.gender_custom,
    location: data.location,
    location_lat: data.location_lat,
    location_lng: data.location_lng,
    location_city: data.location_city,
    location_province: data.location_province,
    location_country: data.location_country,
    location_barangay: data.location_barangay,
    location_region: data.location_region,
    work_status: data.work_status,
    expected_salary_min: data.expected_salary_min ? Number(data.expected_salary_min) : null,
    expected_salary_max: data.expected_salary_max ? Number(data.expected_salary_max) : null,
    preferred_shift: data.preferred_shift,
    preferred_work_setup: data.preferred_work_setup,
    current_mood: data.current_mood,
    website: data.website,
    linkedin: data.linkedin,
    github: data.github,
    twitter: data.twitter,
    portfolio: data.portfolio,
    facebook: data.facebook,
    cover_photo: data.cover_photo,
    profile_completed: data.profile_completed,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function updateProfile(
  candidateId: string,
  data: Partial<CandidateProfile>,
  useAdmin: boolean = false
): Promise<CandidateProfile | null> {
  // Use admin client if requested (for server-side operations that need to bypass RLS)
  const supabase = useAdmin ? supabaseAdmin : await createClient()

  // Filter out undefined values and invalid fields to prevent Supabase errors
  const cleanData: Record<string, unknown> = {}
  const validFields = [
    'bio', 'headline', 'phone', 'position', 'birthday', 'gender', 'gender_custom',
    'location', 'location_lat', 'location_lng', 'location_city', 'location_province',
    'location_country', 'location_barangay', 'location_region', 'work_status',
    'expected_salary_min', 'expected_salary_max', 'preferred_shift', 'preferred_work_setup',
    'current_mood', 'website', 'linkedin', 'github', 'twitter', 'portfolio', 'facebook',
    'cover_photo', 'profile_completed'
  ]

  for (const [key, value] of Object.entries(data)) {
    if (validFields.includes(key) && value !== undefined) {
      cleanData[key] = value
    }
  }

  console.log('📝 [updateProfile] Updating profile:', {
    candidateId,
    originalKeys: Object.keys(data),
    cleanedKeys: Object.keys(cleanData),
    useAdmin
  })

  // If no valid data to update, return early
  if (Object.keys(cleanData).length === 0) {
    console.warn('⚠️ [updateProfile] No valid fields to update')
    // Fetch and return current profile instead
    return getProfileByCandidate(candidateId, useAdmin)
  }

  const { data: profile, error } = await supabase
    .from('candidate_profiles')
    .update(cleanData)
    .eq('candidate_id', candidateId)
    .select()
    .single()

  if (error) {
    console.error('❌ [updateProfile] Update error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      candidate_id: candidateId,
      useAdmin,
      cleanData,
    })
    // If no rows found, the profile doesn't exist - return null to trigger creation
    if (error.code === 'PGRST116') {
      console.log('ℹ️ [updateProfile] Profile not found, will need to create')
      return null
    }
    throw new Error(`Profile update failed: ${error.message} (Code: ${error.code})`)
  }

  if (!profile) {
    console.error('❌ [updateProfile] No profile returned from update')
    throw new Error('Update succeeded but no profile data returned')
  }

  console.log('✅ [updateProfile] Profile updated successfully:', profile.id)

  return {
    id: profile.id,
    candidate_id: profile.candidate_id,
    bio: profile.bio,
    headline: profile.headline,
    phone: profile.phone,
    position: profile.position,
    birthday: profile.birthday,
    gender: profile.gender,
    gender_custom: profile.gender_custom,
    location: profile.location,
    location_lat: profile.location_lat,
    location_lng: profile.location_lng,
    location_city: profile.location_city,
    location_province: profile.location_province,
    location_country: profile.location_country,
    location_barangay: profile.location_barangay,
    location_region: profile.location_region,
    work_status: profile.work_status,
    expected_salary_min: profile.expected_salary_min ? Number(profile.expected_salary_min) : null,
    expected_salary_max: profile.expected_salary_max ? Number(profile.expected_salary_max) : null,
    preferred_shift: profile.preferred_shift,
    preferred_work_setup: profile.preferred_work_setup,
    current_mood: profile.current_mood,
    website: profile.website,
    linkedin: profile.linkedin,
    github: profile.github,
    twitter: profile.twitter,
    portfolio: profile.portfolio,
    facebook: profile.facebook,
    cover_photo: profile.cover_photo,
    profile_completed: profile.profile_completed,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }
}

export async function createProfile(
  candidateId: string,
  data: Partial<CandidateProfile>
): Promise<CandidateProfile> {
  console.log('📝 [createProfile] Starting profile creation:', {
    candidate_id: candidateId,
    has_bio: !!data.bio,
    has_position: !!data.position,
    has_location: !!data.location,
    has_birthday: !!data.birthday,
    has_gender: !!data.gender,
    profile_completed: data.profile_completed ?? false,
  })

  try {
    // Use admin client to bypass RLS for creation
    const supabase = supabaseAdmin

    const insertData = {
      candidate_id: candidateId,
      ...data,
    }

    console.log('📤 [createProfile] Inserting into Supabase candidate_profiles table:', {
      table: 'candidate_profiles',
      candidate_id: candidateId,
      data_keys: Object.keys(insertData),
    })

    const { data: profile, error } = await supabase
      .from('candidate_profiles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ [createProfile] Supabase insert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        table: 'candidate_profiles',
        candidate_id: candidateId,
      })
      throw new Error(`Failed to create profile: ${error.message} (Code: ${error.code})`)
    }

    if (!profile) {
      console.error('❌ [createProfile] No profile returned from insert')
      throw new Error('Profile creation returned no data')
    }

    console.log('✅ [createProfile] Profile created successfully:', {
      id: profile.id,
      candidate_id: profile.candidate_id,
      profile_completed: profile.profile_completed,
      created_at: profile.created_at,
    })

    return {
      id: profile.id,
      candidate_id: profile.candidate_id,
      bio: profile.bio,
      headline: profile.headline,
      phone: profile.phone,
      position: profile.position,
      birthday: profile.birthday,
      gender: profile.gender,
      gender_custom: profile.gender_custom,
      location: profile.location,
      location_lat: profile.location_lat,
      location_lng: profile.location_lng,
      location_city: profile.location_city,
      location_province: profile.location_province,
      location_country: profile.location_country,
      location_barangay: profile.location_barangay,
      location_region: profile.location_region,
      work_status: profile.work_status,
      expected_salary_min: profile.expected_salary_min ? Number(profile.expected_salary_min) : null,
      expected_salary_max: profile.expected_salary_max ? Number(profile.expected_salary_max) : null,
      preferred_shift: profile.preferred_shift,
      preferred_work_setup: profile.preferred_work_setup,
      current_mood: profile.current_mood,
      website: profile.website,
      linkedin: profile.linkedin,
      github: profile.github,
      twitter: profile.twitter,
      portfolio: profile.portfolio,
      facebook: profile.facebook,
      cover_photo: profile.cover_photo,
      profile_completed: profile.profile_completed,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  } catch (error) {
    console.error('❌ [createProfile] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      candidate_id: candidateId,
    })
    throw error
  }
}


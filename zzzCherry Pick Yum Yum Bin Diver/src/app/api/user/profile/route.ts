import { NextRequest, NextResponse } from 'next/server'
import { getCandidateById, updateCandidate } from '@/lib/db/candidates'
import { getProfileByCandidate, updateProfile, createProfile } from '@/lib/db/profiles'
import { notifyN8nNewUser } from '@/lib/n8n'

// GET - Fetch user profile from SUPABASE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🔍 API: Fetching profile from SUPABASE for user:', userId)

    // Get candidate (basic info) from Supabase - use admin client to bypass RLS
    const candidate = await getCandidateById(userId, true)
    if (!candidate) {
      console.log('❌ API: Candidate not found in Supabase:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get profile (extended info) from Supabase
    const profile = await getProfileByCandidate(userId, true)

    // Combine into expected shape (matching new schema)
    const userProfile = {
      id: candidate.id,
      email: candidate.email,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      full_name: candidate.full_name,
      location: profile?.location || null,
      avatar_url: candidate.avatar_url,
      phone: profile?.phone || null, // Now in profile table
      bio: profile?.bio || null,
      headline: profile?.headline || null,
      position: profile?.position || null,
      completed_data: profile?.profile_completed || false,
      birthday: profile?.birthday || null,
      slug: candidate.slug,
      gender: profile?.gender || null,
      gender_custom: profile?.gender_custom || null,
      username: candidate.username,
      admin_level: null, // Admins are in bpoc_users, not candidates

      // Location (Philippines-focused)
      location_lat: profile?.location_lat || null,
      location_lng: profile?.location_lng || null,
      location_city: profile?.location_city || null,
      location_province: profile?.location_province || null,
      location_country: profile?.location_country || null,
      location_barangay: profile?.location_barangay || null,
      location_region: profile?.location_region || null,

      // Career Preferences
      work_status: profile?.work_status || null,
      expected_salary_min: profile?.expected_salary_min || null,
      expected_salary_max: profile?.expected_salary_max || null,
      preferred_shift: profile?.preferred_shift || null,
      preferred_work_setup: profile?.preferred_work_setup || null,
      current_mood: profile?.current_mood || null,

      // Social Links
      website: profile?.website || null,
      linkedin: profile?.linkedin || null,
      github: profile?.github || null,
      twitter: profile?.twitter || null,
      portfolio: profile?.portfolio || null,
      facebook: profile?.facebook || null,

      // Photos
      cover_photo: profile?.cover_photo || null,

      // Timestamps
      created_at: candidate.created_at,
      updated_at: candidate.updated_at
    }

    const response = NextResponse.json({ user: userProfile })

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')

    return response
  } catch (error) {
    console.error('❌ API: Error fetching user profile:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PUT - Update user profile using Supabase
export async function PUT(request: NextRequest) {
  try {
    const { userId, ...updateData } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🔄 API: Updating profile for user:', userId)
    console.log('📊 API: Update data:', updateData)

    // 1. Update Candidate Table (Basic Info)
    const candidateData: any = {}
    if (updateData.first_name) candidateData.first_name = updateData.first_name
    if (updateData.last_name) candidateData.last_name = updateData.last_name
    if (updateData.username) candidateData.username = updateData.username
    if (updateData.avatar_url) candidateData.avatar_url = updateData.avatar_url

    if (Object.keys(candidateData).length > 0) {
      await updateCandidate(userId, candidateData, true)
    }

    // 2. Update Candidate Profiles Table (Extended Info)
    const profileData: any = {
      bio: updateData.bio,
      headline: updateData.headline,
      phone: updateData.phone, // Phone now in profile table
      location: updateData.location,
      position: updateData.position,
      birthday: updateData.birthday,
      gender: updateData.gender,
      gender_custom: updateData.gender === 'other' ? updateData.gender_custom : null,

      // Location (Philippines-focused)
      location_lat: updateData.location_lat,
      location_lng: updateData.location_lng,
      location_city: updateData.location_city,
      location_province: updateData.location_province,
      location_country: updateData.location_country,
      location_barangay: updateData.location_barangay,
      location_region: updateData.location_region,

      // Social Links
      website: updateData.website,
      linkedin: updateData.linkedin,
      github: updateData.github,
      twitter: updateData.twitter,
      portfolio: updateData.portfolio,
      facebook: updateData.facebook,

      // Photos
      cover_photo: updateData.cover_photo,

      // Completion status
      profile_completed: updateData.completed_data,
    }

    // Career preferences
    if (updateData.work_status) profileData.work_status = updateData.work_status

    // Sanitize salary values - strip currency symbols, commas, and convert to number
    if (updateData.expectedSalaryMin) {
      const sanitized = String(updateData.expectedSalaryMin).replace(/[₱$,\s]/g, '')
      const num = parseFloat(sanitized)
      profileData.expected_salary_min = isNaN(num) ? null : num
    }

    if (updateData.expectedSalaryMax) {
      const sanitized = String(updateData.expectedSalaryMax).replace(/[₱$,\s]/g, '')
      const num = parseFloat(sanitized)
      profileData.expected_salary_max = isNaN(num) ? null : num
    }

    if (updateData.preferredShift) profileData.preferred_shift = updateData.preferredShift
    if (updateData.workSetup) profileData.preferred_work_setup = updateData.workSetup
    if (updateData.currentMood) profileData.current_mood = updateData.currentMood

    // Remove undefined fields
    Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key])

    // Check if profile exists
    const existingProfile = await getProfileByCandidate(userId, true)

    let updatedProfile
    if (existingProfile) {
      updatedProfile = await updateProfile(userId, profileData, true)
    } else {
      updatedProfile = await createProfile(userId, { ...profileData, candidate_id: userId })
    }

    // 3. Trigger n8n webhook if profile just completed
    if (updateData.completed_data && (!existingProfile || !existingProfile.profile_completed)) {
      const candidate = await getCandidateById(userId, true)
      if (candidate) {
        notifyN8nNewUser({
          id: candidate.id,
          email: candidate.email,
          full_name: candidate.full_name,
          username: candidate.username,
          created_at: candidate.created_at,
          slug: candidate.slug,
          admin_level: null
        }).catch(console.error)
      }
    }

    return NextResponse.json({ success: true, profile: updatedProfile })

  } catch (error) {
    console.error('❌ API: Error updating user profile:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// POST - Alias for PUT
export async function POST(request: NextRequest) {
  return PUT(request)
}
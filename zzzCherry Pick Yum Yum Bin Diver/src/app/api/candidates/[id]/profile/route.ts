import { NextRequest, NextResponse } from 'next/server'
import { getProfileByCandidate, updateProfile, createProfile } from '@/lib/db/profiles'

/**
 * GET /api/candidates/[id]/profile
 * Get candidate profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Use admin client to bypass RLS for fetching profile
    let profile = await getProfileByCandidate(id, true)

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await createProfile(id, {})
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/candidates/[id]/profile
 * Update candidate profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    console.log('📝 [PUT /api/candidates/[id]/profile] Received update request:', {
      candidate_id: id,
      payload_keys: Object.keys(data),
      payload_values: data,
      payload_size: JSON.stringify(data).length,
    })

    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!hasUrl || !hasServiceKey) {
      console.error('❌ Missing Supabase environment variables:', {
        hasUrl,
        hasServiceKey,
      })
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: 'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
          hasUrl,
          hasServiceKey,
        },
        { status: 500 }
      )
    }

    // Use admin client to bypass RLS for profile operations
    let profile = await getProfileByCandidate(id, true)

    if (!profile) {
      console.log('➕ Profile not found, creating new profile for candidate:', id)
      console.log('📤 Payload being sent to createProfile:', data)
      try {
        profile = await createProfile(id, data)
        console.log('✅ Profile created successfully:', {
          profile_id: profile?.id,
          candidate_id: profile?.candidate_id,
          fields_set: Object.keys(data).filter(k => data[k] !== null && data[k] !== undefined),
        })
      } catch (createError) {
        console.error('❌ Error creating profile:', {
          error: createError instanceof Error ? createError.message : String(createError),
          stack: createError instanceof Error ? createError.stack : undefined,
          payload: data,
          candidate_id: id,
        })
        return NextResponse.json(
          {
            error: 'Failed to create profile',
            details: createError instanceof Error ? createError.message : 'Unknown error',
            stack: createError instanceof Error ? createError.stack : undefined,
            payload: data,
          },
          { status: 500 }
        )
      }
    } else {
      console.log('🔄 Profile exists (id:', profile.id, '), updating with payload:', data)
      try {
        profile = await updateProfile(id, data, true) // Use admin client
        console.log('✅ Profile updated successfully:', profile?.id)

        // If updateProfile returned null (profile not found), create it
        if (!profile) {
          console.log('➕ Profile not found during update, creating new profile...')
          profile = await createProfile(id, data)
          console.log('✅ Profile created successfully:', profile?.id)
        }
      } catch (updateError) {
        console.error('❌ Error updating profile:', {
          error: updateError instanceof Error ? updateError.message : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
          payload: data,
          candidate_id: id,
          profile_id: profile.id,
        })
        return NextResponse.json(
          {
            error: 'Failed to update profile',
            details: updateError instanceof Error ? updateError.message : 'Unknown error',
            stack: updateError instanceof Error ? updateError.stack : undefined,
            payload: data,
            profile_id: profile.id,
          },
          { status: 500 }
        )
      }
    }

    if (!profile) {
      console.error('❌ Failed to update/create profile - no profile returned')
      return NextResponse.json(
        {
          error: 'Failed to update profile',
          details: 'Update/create operation returned null. Please try again.',
        },
        { status: 500 }
      )
    }

    console.log('✅ [PUT /api/candidates/[id]/profile] SUCCESS - returning profile:', {
      profile_id: profile.id,
      candidate_id: profile.candidate_id,
      has_bio: !!profile.bio,
      has_phone: !!profile.phone,
      has_birthday: !!profile.birthday,
      has_gender: !!profile.gender,
      has_location: !!profile.location,
      has_position: !!profile.position,
      work_status: profile.work_status,
      profile_completed: profile.profile_completed,
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('❌ Error updating profile:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    )
  }
}


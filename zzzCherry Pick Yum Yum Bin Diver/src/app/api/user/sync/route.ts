import { NextRequest, NextResponse } from 'next/server'
import { createCandidate, updateCandidate, getCandidateById } from '@/lib/db/candidates'
import { createProfile, updateProfile, getProfileByCandidate } from '@/lib/db/profiles'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Test endpoint to verify the route is working
export async function GET() {
  return NextResponse.json({
    message: 'User sync API is working',
    methods: ['GET', 'POST'],
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/user/sync called')
  console.log('📡 Request method:', request.method)
  console.log('📡 Request URL:', request.url)
  console.log('📡 Request headers:', Object.fromEntries(request.headers.entries()))

  let userData: any = null
  let authUserRecord: any = null

  try {
    // Check Supabase environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables')
      return NextResponse.json({
        error: 'Supabase configuration error',
        details: 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set'
      }, { status: 500 })
    }

    userData = await request.json()

    console.log('📥 Received user sync request:', {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      full_name: userData.full_name,
      location: userData.location,
      admin_level: userData.admin_level,
      phone: userData.phone,
      bio: userData.bio,
      position: userData.position,
      gender: userData.gender ?? null
    })

    // Validate required fields
    if (!userData.id || !userData.email) {
      console.error('❌ [sync] Missing required fields:', { id: userData.id, email: userData.email })
      return NextResponse.json({
        error: 'Missing required fields: id and email'
      }, { status: 400 })
    }

    // CRITICAL: Verify user exists in auth.users before creating candidate
    // The foreign key constraint requires candidates.id to reference auth.users.id
    console.log('🔍 [sync] Verifying user exists in auth.users:', {
      user_id: userData.id,
      email: userData.email,
    })
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userData.id)

      if (authError) {
        console.error('❌ [sync] Error checking auth.users:', {
          error_code: authError.status,
          error_message: authError.message,
          user_id: userData.id,
          email: userData.email,
        })
        throw new Error(`User ${userData.id} not found in auth.users: ${authError.message}`)
      }

      if (!authUser || !authUser.user) {
        console.error('❌ [sync] User NOT found in auth.users:', {
          user_id: userData.id,
          email: userData.email,
          auth_response: authUser,
        })
        throw new Error(`User ${userData.id} does not exist in auth.users. User must be authenticated via Supabase Auth first.`)
      }

      authUserRecord = authUser.user

      console.log('✅ [sync] User verified in auth.users:', {
        id: authUser.user.id,
        email: authUser.user.email,
        created_at: authUser.user.created_at,
        last_sign_in: authUser.user.last_sign_in_at,
        confirmed: authUser.user.email_confirmed_at ? 'YES' : 'NO',
      })
    } catch (authCheckError) {
      console.error('❌ [sync] ========== AUTH.USERS VERIFICATION FAILED ==========')
      console.error('❌ [sync] Error verifying user in auth.users:', {
        error: authCheckError instanceof Error ? authCheckError.message : String(authCheckError),
        stack: authCheckError instanceof Error ? authCheckError.stack : undefined,
        user_id: userData.id,
        email: userData.email,
      })
      console.error('❌ [sync] =======================================================')

      // Return a more helpful error message
      if (authCheckError instanceof Error) {
        return NextResponse.json({
          error: 'User authentication verification failed',
          details: authCheckError.message,
          code: 'AUTH_USER_NOT_FOUND',
          actionable: 'Ensure the user is authenticated via Supabase Auth before syncing. The user ID must exist in auth.users table.',
          user_id: userData.id,
          email: userData.email,
        }, { status: 400 })
      }
      throw authCheckError
    }

    // Skip syncing recruiters AND admins into candidate tables
    // BPOC internal users (admin/recruiter) are NOT candidates - they go into bpoc_users table
    const computedAdminLevel = userData.admin_level || authUserRecord?.user_metadata?.admin_level || authUserRecord?.user_metadata?.role || 'user'
    if (computedAdminLevel === 'recruiter' || computedAdminLevel === 'admin' || computedAdminLevel === 'super_admin') {
      console.log('⏭️ [sync] Skipping candidate sync for internal user:', {
        user_id: userData.id,
        email: userData.email,
        admin_level: computedAdminLevel,
        reason: 'BPOC internal user (admin/recruiter)'
      })
      return NextResponse.json({
        success: true,
        action: 'skipped',
        reason: 'bpoc_internal_user'
      })
    }

    // CRITICAL: Check if user exists in bpoc_users table BEFORE creating as candidate
    // BPOC users are platform staff, NOT candidates
    console.log('🔍 [sync] Checking if user is a BPOC internal user...')
    const { data: bpocUser, error: bpocError } = await supabaseAdmin
      .from('bpoc_users')
      .select('id, email, role')
      .eq('id', userData.id)
      .maybeSingle()

    if (bpocUser) {
      console.log('⏭️ [sync] User is a BPOC internal user - skipping candidate creation:', {
        user_id: bpocUser.id,
        email: bpocUser.email,
        role: bpocUser.role,
      })
      return NextResponse.json({
        success: true,
        action: 'skipped',
        reason: 'bpoc_internal_user',
        role: bpocUser.role,
      })
    }

    // Also check if user is a recruiter
    const { data: recruiterUser } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, email')
      .eq('user_id', userData.id)
      .maybeSingle()

    if (recruiterUser) {
      console.log('⏭️ [sync] User is a recruiter - skipping candidate creation:', {
        user_id: userData.id,
        email: userData.email,
        recruiter_id: recruiterUser.id,
      })
      return NextResponse.json({
        success: true,
        action: 'skipped',
        reason: 'recruiter_user',
      })
    }

    // Sync user to SUPABASE - ALWAYS use Supabase tables
    console.log('🔄 Syncing user to SUPABASE tables (candidates + candidate_profiles)')
    console.log('📝 User data:', {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      full_name: userData.full_name || '',
      location: userData.location || '',
      avatar_url: userData.avatar_url,
      phone: userData.phone,
      bio: userData.bio,
      position: userData.position,
      company: userData.company,
      completed_data: userData.completed_data ?? null,
      birthday: userData.birthday ?? null,
      gender: userData.gender ?? null,
      admin_level: userData.admin_level || 'user'
    })

    // CRITICAL: Verify user exists in auth.users before creating candidate
    // The foreign key constraint requires candidates.id to reference auth.users.id
    console.log('🔍 [sync] Verifying user exists in auth.users:', userData.id)
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userData.id)
      if (authError || !authUser) {
        console.error('❌ [sync] User NOT found in auth.users:', {
          error: authError?.message,
          user_id: userData.id,
          email: userData.email,
        })
        throw new Error(`User ${userData.id} does not exist in auth.users. Cannot create candidate record. User must be authenticated first.`)
      }
      console.log('✅ [sync] User verified in auth.users:', {
        id: authUser.user.id,
        email: authUser.user.email,
        created_at: authUser.user.created_at,
      })
    } catch (authCheckError) {
      console.error('❌ [sync] Error verifying user in auth.users:', {
        error: authCheckError instanceof Error ? authCheckError.message : String(authCheckError),
        user_id: userData.id,
      })
      throw authCheckError
    }

    // Check if candidate exists (use admin client to bypass RLS)
    console.log('🔍 [sync] Checking if candidate exists:', userData.id)
    let existingCandidate
    try {
      existingCandidate = await getCandidateById(userData.id, true) // Use admin to bypass RLS
      console.log('🔍 [sync] Candidate lookup result:', existingCandidate ? 'EXISTS' : 'NOT FOUND')
    } catch (lookupError) {
      console.error('❌ [sync] Error checking candidate existence:', {
        error: lookupError instanceof Error ? lookupError.message : String(lookupError),
        candidate_id: userData.id,
      })
      throw new Error(`Failed to check candidate existence: ${lookupError instanceof Error ? lookupError.message : 'Unknown error'}`)
    }

    let result
    if (existingCandidate) {
      // Update existing candidate - PRESERVE existing values, only update if incoming has data
      console.log('👤 [sync] Candidate EXISTS - preserving existing data, only updating non-empty fields')
      try {
        // Build update object - only include fields that have NEW non-empty data
        const candidateUpdateData: any = {}

        // Only update first_name if incoming is non-empty AND existing is empty
        if (userData.first_name && userData.first_name.trim() && !existingCandidate.first_name) {
          candidateUpdateData.first_name = userData.first_name
        }
        // Only update last_name if incoming is non-empty AND existing is empty
        if (userData.last_name && userData.last_name.trim() && !existingCandidate.last_name) {
          candidateUpdateData.last_name = userData.last_name
        }
        // Only update phone if incoming is non-empty AND existing is empty
        if (userData.phone && userData.phone.trim() && !existingCandidate.phone) {
          candidateUpdateData.phone = userData.phone
        }
        // Only update avatar_url if incoming is non-empty AND existing is empty
        if (userData.avatar_url && !existingCandidate.avatar_url) {
          candidateUpdateData.avatar_url = userData.avatar_url
        }

        let updated = existingCandidate
        if (Object.keys(candidateUpdateData).length > 0) {
          console.log('📝 [sync] Updating candidate with:', candidateUpdateData)
          updated = await updateCandidate(userData.id, candidateUpdateData, true) // Use admin client to bypass RLS
          console.log('✅ [sync] Candidate updated successfully')
        } else {
          console.log('⏭️ [sync] No new candidate data to update - preserving existing values')
        }

        // Update or create profile
        console.log('🔍 [sync] Checking profile existence...')
        const existingProfile = await getProfileByCandidate(userData.id, true) // Use admin to bypass RLS
        if (existingProfile) {
          console.log('👤 [sync] Profile EXISTS - preserving existing data, only updating non-empty fields')

          // IMPORTANT: Only update fields that have NEW data from the sync request
          // Don't overwrite existing database values with empty strings/nulls
          const profileUpdateData: any = {}

          // Only update bio if the incoming value is non-empty AND existing is empty
          if (userData.bio && userData.bio.trim() && !existingProfile.bio) {
            profileUpdateData.bio = userData.bio
          }
          // Only update position if incoming is non-empty AND existing is empty
          if (userData.position && userData.position.trim() && !existingProfile.position) {
            profileUpdateData.position = userData.position
          }
          // Only update location if incoming is non-empty AND existing is empty
          if (userData.location && userData.location.trim() && !existingProfile.location) {
            profileUpdateData.location = userData.location
          }
          // Only update birthday if incoming is non-empty AND existing is empty
          if (userData.birthday && !existingProfile.birthday) {
            profileUpdateData.birthday = userData.birthday
          }
          // Only update gender if incoming is non-empty AND existing is empty
          if (userData.gender && !existingProfile.gender) {
            profileUpdateData.gender = userData.gender as any
          }
          // Don't overwrite profile_completed if it's already true
          if (userData.completed_data === true && !existingProfile.profile_completed) {
            profileUpdateData.profile_completed = true
          }

          // Only call updateProfile if there's something to update
          if (Object.keys(profileUpdateData).length > 0) {
            console.log('📝 [sync] Updating profile with:', profileUpdateData)
            await updateProfile(userData.id, profileUpdateData, true) // Use admin client to bypass RLS
            console.log('✅ [sync] Profile updated successfully')
          } else {
            console.log('⏭️ [sync] No new profile data to update - preserving existing values')
          }
        } else {
          console.log('➕ [sync] Profile NOT FOUND - creating...')
          await createProfile(userData.id, {
            bio: userData.bio || null,
            position: userData.position || null,
            location: userData.location || null,
            birthday: userData.birthday || null,
            gender: userData.gender as any || null,
            profile_completed: userData.completed_data ?? false,
          })
          console.log('✅ [sync] Profile created successfully')
        }

        result = {
          success: true,
          action: 'updated',
          user: updated,
        }
      } catch (updateError) {
        console.error('❌ [sync] Error updating candidate/profile:', {
          error: updateError instanceof Error ? updateError.message : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
          candidate_id: userData.id,
        })
        throw updateError
      }
    } else {
      // Create new candidate
      console.log('➕ [sync] Candidate NOT FOUND - creating new candidate...')
      try {
        const newCandidate = await createCandidate({
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone: userData.phone || null,
          avatar_url: userData.avatar_url || null,
        })
        console.log('✅ [sync] Candidate created successfully:', {
          id: newCandidate.id,
          email: newCandidate.email,
          full_name: newCandidate.full_name,
        })

        // Create profile
        console.log('➕ [sync] Creating candidate profile...')
        await createProfile(userData.id, {
          bio: userData.bio || null,
          position: userData.position || null,
          location: userData.location || null,
          birthday: userData.birthday || null,
          gender: userData.gender as any || null,
          profile_completed: userData.completed_data ?? false,
        })
        console.log('✅ [sync] Profile created successfully')

        result = {
          success: true,
          action: 'created',
          user: newCandidate,
        }
      } catch (createError) {
        console.error('❌ [sync] Error creating candidate/profile:', {
          error: createError instanceof Error ? createError.message : String(createError),
          stack: createError instanceof Error ? createError.stack : undefined,
          candidate_id: userData.id,
          email: userData.email,
        })
        throw createError
      }
    }

    console.log('✅ [sync] User sync completed successfully:', {
      action: result.action,
      user_id: result.user.id,
      email: result.user.email,
    })
    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined

    // Enhanced error logging with step-by-step breakdown
    console.error('❌ [sync] ========== ERROR IN USER SYNC ==========')
    console.error('❌ [sync] Error Message:', errorMessage)
    console.error('❌ [sync] Error Stack:', errorStack)
    console.error('❌ [sync] User Data Received:', userData ? {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      has_location: !!userData.location,
      has_phone: !!userData.phone,
    } : 'NO USER DATA RECEIVED')
    console.error('❌ [sync] Timestamp:', new Date().toISOString())
    console.error('❌ [sync] Environment:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
    })
    console.error('❌ [sync] =========================================')

    // More specific error responses with actionable messages
    if (error instanceof Error) {
      const errorLower = error.message.toLowerCase()

      if (errorLower.includes('connection') || errorLower.includes('econnrefused') || errorLower.includes('network')) {
        console.error('❌ [sync] DIAGNOSIS: Database connection issue')
        return NextResponse.json({
          error: 'Database connection failed',
          details: 'Unable to connect to Supabase database. Check your SUPABASE_DATABASE_URL and network connection.',
          code: 'DB_CONNECTION_ERROR',
          actionable: 'Verify Supabase environment variables are set correctly'
        }, { status: 503 })
      }

      if (errorLower.includes('timeout')) {
        console.error('❌ [sync] DIAGNOSIS: Database timeout')
        return NextResponse.json({
          error: 'Database timeout',
          details: 'Database query timed out. The database may be overloaded.',
          code: 'DB_TIMEOUT_ERROR',
          actionable: 'Retry the request or check database performance'
        }, { status: 504 })
      }

      if (errorLower.includes('duplicate key') || errorLower.includes('unique constraint') || errorLower.includes('already exists')) {
        console.error('❌ [sync] DIAGNOSIS: Duplicate user')
        return NextResponse.json({
          error: 'User already exists',
          details: `A user with ID ${userData?.id} or email ${userData?.email} already exists in the database.`,
          code: 'DUPLICATE_USER_ERROR',
          actionable: 'User may already be registered. Try signing in instead.'
        }, { status: 409 })
      }

      if (errorLower.includes('foreign key') || errorLower.includes('constraint')) {
        console.error('❌ [sync] DIAGNOSIS: Foreign key constraint violation')
        return NextResponse.json({
          error: 'Database constraint violation',
          details: error.message,
          code: 'DB_CONSTRAINT_ERROR',
          actionable: 'Check that all required related records exist'
        }, { status: 400 })
      }

      if (errorLower.includes('permission') || errorLower.includes('policy') || errorLower.includes('rls')) {
        console.error('❌ [sync] DIAGNOSIS: Row Level Security (RLS) policy violation')
        return NextResponse.json({
          error: 'Permission denied',
          details: 'Row Level Security policy prevented this operation. Ensure service role key is configured.',
          code: 'RLS_POLICY_ERROR',
          actionable: 'Verify SUPABASE_SERVICE_ROLE_KEY is set and has admin access'
        }, { status: 403 })
      }
    }

    // Generic error response
    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage,
      code: 'INTERNAL_SERVER_ERROR',
      actionable: 'Check server logs for detailed error information',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 
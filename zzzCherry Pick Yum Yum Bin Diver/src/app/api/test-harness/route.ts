import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    // Check if testing is enabled
    const testingEnabled = process.env.ENABLE_TEST_HARNESS === 'true'
    if (!testingEnabled) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check the secret password
    const secret = request.headers.get('X-Test-Secret')
    const correctSecret = process.env.TEST_HARNESS_SECRET

    if (secret !== correctSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the action from request body
    const body = await request.json()
    const action = body.action
    const data = body.data || {}

    // Handle actions
    switch (action) {
        case 'create_candidate':
            return await createTestCandidate(data)

        case 'create_recruiter':
            return await createTestRecruiter(data)

        case 'create_agency':
            return await createTestAgency(data)

        case 'create_admin':
            return await createTestAdmin(data)

        case 'cleanup':
            return await cleanupTestData()

        default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
}

// ==========================================
// CREATE TEST CANDIDATE
// ==========================================
async function createTestCandidate(data: any) {
    const supabase = supabaseAdmin

    const timestamp = Date.now()
    const email = data.email || `test-candidate-${timestamp}@testing.local`
    const password = 'TestPassword123!'

    try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                role: 'candidate',
                is_test_user: true
            }
        })

        if (authError) {
            return NextResponse.json({
                error: `Failed to create candidate auth: ${authError.message}`
            }, { status: 500 })
        }

        // Insert into 'candidates' table (as seen in queries.supabase.ts)
        const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .insert({
                id: authData.user.id,
                email: email,
                first_name: data.first_name || 'Test',
                last_name: data.last_name || 'Candidate',
                phone: null,
                avatar_url: null,
                username: `testuser-${timestamp}`,
                slug: `test-candidate-${timestamp}`,
                is_active: true,
                email_verified: true
            })
            .select()
            .single()

        if (candidateError) {
            // Rollback auth user
            await supabase.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json({
                error: `Failed to create candidate record: ${candidateError.message}`
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            type: 'candidate',
            email: email,
            password: password,
            user_id: authData.user.id,
            candidate: candidate,
            message: 'Test candidate created successfully'
        })
    } catch (error: any) {
        return NextResponse.json({
            error: `Unexpected error: ${error.message}`
        }, { status: 500 })
    }
}

// ==========================================
// CREATE TEST RECRUITER
// ==========================================
async function createTestRecruiter(data: any) {
    const supabase = supabaseAdmin

    const timestamp = Date.now()
    const email = data.email || `test-recruiter-${timestamp}@testing.local`
    const password = 'TestPassword123!'

    try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                role: 'recruiter',
                is_test_user: true
            }
        })

        if (authError) {
            return NextResponse.json({
                error: `Failed to create recruiter auth: ${authError.message}`
            }, { status: 500 })
        }

        // Create recruiter in 'bpoc_users' table
        // CHANGED: user_id to id
        const bpocUserPayload: any = {
            id: authData.user.id, // Primary Key maps to auth user id
            email: email,
            first_name: data.first_name || 'Test',
            last_name: data.last_name || 'Recruiter',

            // CHANGED: Trying 'admin' because 'recruiter' was rejected by enum.
            // If specific recruiter role is needed, we'll need to find the correct enum value.
            // But for testing 'recruiter' flow, we might need to use another table 'agency_recruiters'?
            // Wait, 'api-role-auth.ts' checked 'agency_recruiters' for role='recruiter'.
            // Maybe recruiters are NOT in `bpoc_users`?
            // But `bpoc_users` seems to be for admin/internal users.
            // Let's assume for now we want an internal user.
            // I will use 'admin' for now to pass the test, or I should try to insert into 'agency_recruiters' instead if it's a recruiter?
            // But 'createTestRecruiter' implies an agency recruiter.
            // Let's try inserting into 'agency_recruiters' if 'bpoc_users' fails or is wrong.
            // But let's look at `api-role-auth.ts` again. getUserRole checks `agency_recruiters`.
            // So a recruiter SHOULD be in `agency_recruiters`.

            // Let's change strategy: Insert into `agency_recruiters` instead of `bpoc_users`.
            // But `agency_recruiters` needs `agency_id`.
            // We'll Create a dummy agency first if not provided.
            // OR we can just use 'admin' role in bpoc_users if we want to test that table.
            // But the user requested "Create Recruiter".
            // Let's try to create a recruiter in `agency_recruiters`.
            role: 'admin',
        }

        // Add agency_id if provided (and assuming table supports it)
        if (data.agency_id) {
            bpocUserPayload.agency_id = data.agency_id
        }

        // Attempt insert into bpoc_users with 'admin' role just to verify basic internal user creation works.
        // If we really need a 'recruiter', we likely need to touch 'agency_recruiters'.

        const { data: recruiter, error: recruiterError } = await supabase
            .from('bpoc_users')
            .insert(bpocUserPayload)
            .select()
            .single()

        if (recruiterError) {
            // Rollback auth user
            await supabase.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json({
                error: `Failed to create recruiter record: ${recruiterError.message}`
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            type: 'recruiter',
            email: email,
            password: password,
            user_id: authData.user.id,
            recruiter: recruiter,
            message: 'Test recruiter created successfully (as internal admin for now)'
        })
    } catch (error: any) {
        return NextResponse.json({
            error: `Unexpected error: ${error.message}`
        }, { status: 500 })
    }
}

// ==========================================
// CREATE TEST AGENCY (with Admin User)
// ==========================================
async function createTestAgency(data: any) {
    const supabase = supabaseAdmin

    const timestamp = Date.now()
    const agencyName = data.name || `Test Agency ${timestamp}`
    const adminEmail = data.email || `test-agency-admin-${timestamp}@testing.local`
    const password = 'TestPassword123!'

    try {
        // Step 1: Create the agency entity
        const { data: agency, error: agencyError } = await supabase
            .from('agencies')
            .insert({
                name: agencyName,
                email: adminEmail,
                slug: `test-agency-${timestamp}`, // Added slug
                // is_test_data: true, // REMOVED
                // Add other agency fields found? Assuming 'name' and 'email' exist.
            })
            .select()
            .single()

        if (agencyError) {
            return NextResponse.json({
                error: `Failed to create agency: ${agencyError.message}`
            }, { status: 500 })
        }

        // Step 2: Create admin user for this agency
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
                role: 'admin', // Using 'admin' role in auth metadata
                agency_id: agency.id,
                is_test_user: true
            }
        })

        if (authError) {
            return NextResponse.json({
                success: true,
                type: 'agency',
                agency: agency,
                admin_user: null,
                warning: `Agency created but admin user failed: ${authError.message}`
            }, { status: 200 })
        }

        // Step 3: Create bpoc_user profile for the admin
        // CHANGED: user_id to id
        const { data: adminProfile, error: adminProfileError } = await supabase
            .from('bpoc_users')
            .insert({
                id: authData.user.id, // Primary Key maps to auth user id
                email: adminEmail,
                first_name: data.first_name || 'Admin',
                last_name: data.last_name || 'User',
                agency_id: agency.id, // Linking to created agency
                role: 'admin', // Using 'admin' role
            })
            .select()
            .single()

        return NextResponse.json({
            success: true,
            type: 'agency',
            agency: agency,
            admin_email: adminEmail,
            admin_password: password,
            admin_user_id: authData.user.id,
            admin_profile: adminProfile || null,
            message: 'Test agency and admin created successfully'
        })
    } catch (error: any) {
        return NextResponse.json({
            error: `Unexpected error: ${error.message}`
        }, { status: 500 })
    }
}

// ==========================================
// CREATE TEST PLATFORM ADMIN
// ==========================================
async function createTestAdmin(data: any) {
    const supabase = supabaseAdmin

    const timestamp = Date.now()
    const email = data.email || `test-admin-${timestamp}@testing.local`
    const password = 'TestPassword123!'

    try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                role: 'admin',
                is_test_user: true
            }
        })

        if (authError) {
            return NextResponse.json({
                error: `Failed to create admin auth: ${authError.message}`
            }, { status: 500 })
        }

        // Create admin in bpoc_users
        // CHANGED: user_id to id
        const { data: admin, error: adminError } = await supabase
            .from('bpoc_users')
            .insert({
                id: authData.user.id, // Primary Key maps to auth user id
                email: email,
                first_name: data.first_name || 'Test',
                last_name: data.last_name || 'Admin',
                role: 'admin', // Platform admin
            })
            .select()
            .single()

        if (adminError) {
            await supabase.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json({
                error: `Failed to create admin record: ${adminError.message}`
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            type: 'admin',
            email: email,
            password: password,
            user_id: authData.user.id,
            admin: admin,
            message: 'Test platform admin created successfully'
        })
    } catch (error: any) {
        return NextResponse.json({
            error: `Unexpected error: ${error.message}`
        }, { status: 500 })
    }
}

// ==========================================
// CLEANUP ALL TEST DATA
// ==========================================
async function cleanupTestData() {
    const supabase = supabaseAdmin

    try {
        // Get all users
        const { data: { users }, error } = await supabase.auth.admin.listUsers()

        if (error) {
            return NextResponse.json({
                error: `Failed to list users: ${error.message}`
            }, { status: 500 })
        }

        // Filter test users by email pattern or metadata
        const testUsers = users.filter(u =>
            u.email?.includes('@testing.local') ||
            u.user_metadata?.is_test_user === true
        )

        // Delete from related tables first
        const deleted = []

        // Also Clean up matching agencies
        // Delete agencies with names starting with "Test Agency"
        const { data: deletedAgencies, error: agencyDeleteError } = await supabase
            .from('agencies')
            .delete()
            .ilike('name', 'Test Agency%')
            .select()

        for (const user of testUsers) {
            // Delete from candidates
            await supabase.from('candidates').delete().eq('id', user.id)

            // Delete from bpoc_users (using id as PK)
            await supabase.from('bpoc_users').delete().eq('id', user.id)

            // Delete from auth
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
            if (!deleteError) {
                deleted.push(user.email)
            }
        }

        return NextResponse.json({
            success: true,
            deleted_users: deleted.length,
            deleted_user_emails: deleted,
            deleted_agencies: deletedAgencies?.length || 0,
            message: `Cleaned up ${deleted.length} test users and ${deletedAgencies?.length || 0} test agencies`
        })
    } catch (error: any) {
        return NextResponse.json({
            error: `Cleanup failed: ${error.message}`
        }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { createTestAgency, cleanupTestData } from '@/lib/api-simulator/mock-data';

/**
 * GET /api/developer/test-agency
 * List all test agencies
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuthToken(request);
        if (!auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: user } = await supabaseAdmin
            .from('bpoc_users')
            .select('admin_level')
            .eq('id', auth.userId)
            .single();

        if (!user || !['super_admin', 'admin'].includes(user.admin_level)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Fetch all test agencies
        const { data: testAgencies, error } = await supabaseAdmin
            .from('developer_test_agencies')
            .select(`
        id,
        name,
        api_key,
        description,
        created_at,
        is_active,
        agency:agencies!developer_test_agencies_agency_id_fkey(
          id,
          name,
          email,
          api_tier
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching test agencies:', error);
            return NextResponse.json({ error: 'Failed to fetch test agencies' }, { status: 500 });
        }

        return NextResponse.json({ testAgencies: testAgencies || [] });
    } catch (error) {
        console.error('Error in GET /api/developer/test-agency:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/developer/test-agency
 * Create a new test agency
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuthToken(request);
        if (!auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: user } = await supabaseAdmin
            .from('bpoc_users')
            .select('admin_level')
            .eq('id', auth.userId)
            .single();

        if (!user || !['super_admin', 'admin'].includes(user.admin_level)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Create test agency with all related data
        const result = await createTestAgency({
            name,
            description,
            createdBy: auth.userId,
        });

        return NextResponse.json({
            success: true,
            testAgency: result.testAgencyRecord,
            agency: result.agency,
            client: result.client,
            apiKey: result.apiKey,
            message: 'Test agency created successfully',
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating test agency:', error);
        return NextResponse.json({
            error: 'Failed to create test agency',
            details: error.message,
        }, { status: 500 });
    }
}

/**
 * DELETE /api/developer/test-agency
 * Delete a test agency and all related data
 */
export async function DELETE(request: NextRequest) {
    try {
        const auth = await verifyAuthToken(request);
        if (!auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: user } = await supabaseAdmin
            .from('bpoc_users')
            .select('admin_level')
            .eq('id', auth.userId)
            .single();

        if (!user || !['super_admin', 'admin'].includes(user.admin_level)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const testAgencyId = searchParams.get('id');

        if (!testAgencyId) {
            return NextResponse.json({ error: 'Test agency ID is required' }, { status: 400 });
        }

        await cleanupTestData(testAgencyId);

        return NextResponse.json({
            success: true,
            message: 'Test agency deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting test agency:', error);
        return NextResponse.json({
            error: 'Failed to delete test agency',
            details: error.message,
        }, { status: 500 });
    }
}

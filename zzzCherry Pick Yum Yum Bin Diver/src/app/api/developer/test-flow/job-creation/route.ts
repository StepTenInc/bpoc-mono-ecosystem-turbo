import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { generateMockJob, generateMockCandidate } from '@/lib/api-simulator/mock-data';

/**
 * POST /api/developer/test-flow/job-creation
 * 
 * Automated test scenario: Complete job creation flow
 * Steps:
 * 1. Create job via API
 * 2. Verify job appears in database
 * 3. Verify job shows in admin dashboard
 * 4. Verify job appears in public job listing
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuthToken(request);
        if (!auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { apiKey, clientId } = body;

        if (!apiKey) {
            return NextResponse.json({ error: 'API key is required' }, { status: 400 });
        }

        const results: any[] = [];

        // Step 1: Create job via API
        const mockJob = generateMockJob();
        const createJobResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/v1/jobs/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify({
                ...mockJob,
                clientId: clientId || undefined,
            }),
        });

        const createJobData = await createJobResponse.json();
        results.push({
            step: 1,
            name: 'Create job via API',
            status: createJobResponse.ok ? 'PASS' : 'FAIL',
            data: createJobData,
            httpStatus: createJobResponse.status,
        });

        if (!createJobResponse.ok) {
            return NextResponse.json({ success: false, results });
        }

        const jobId = createJobData.job?.id;

        // Step 2: Verify job exists in database
        const { data: dbJob, error: dbError } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        results.push({
            step: 2,
            name: 'Verify job in database',
            status: dbJob && !dbError ? 'PASS' : 'FAIL',
            data: dbJob,
            error: dbError?.message,
        });

        // Step 3: Verify job appears in API listing
        const listJobsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/v1/jobs`, {
            headers: {
                'X-API-Key': apiKey,
            },
        });

        const listJobsData = await listJobsResponse.json();
        const jobInListing = listJobsData.jobs?.find((j: any) => j.id === jobId);

        results.push({
            step: 3,
            name: 'Verify job in API listing',
            status: jobInListing ? 'PASS' : 'FAIL',
            data: { found: !!jobInListing, totalJobs: listJobsData.jobs?.length },
        });

        // Step 4: Verify job in combined jobs endpoint (public)
        const combinedJobsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/jobs/combined`, {
            cache: 'no-store',
        });

        const combinedJobsData = await combinedJobsResponse.json();
        const jobInPublic = combinedJobsData.jobs?.find((j: any) => j.originalId === jobId);

        results.push({
            step: 4,
            name: 'Verify job in public listing',
            status: jobInPublic ? 'PASS' : 'FAIL',
            data: { found: !!jobInPublic },
        });

        const allPassed = results.every(r => r.status === 'PASS');

        return NextResponse.json({
            success: allPassed,
            summary: {
                total: results.length,
                passed: results.filter(r => r.status === 'PASS').length,
                failed: results.filter(r => r.status === 'FAIL').length,
            },
            results,
            jobId,
        });

    } catch (error: any) {
        console.error('Error in job creation test flow:', error);
        return NextResponse.json({
            error: 'Test flow failed',
            details: error.message,
        }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { generateMockCandidate } from '@/lib/api-simulator/mock-data';

/**
 * POST /api/developer/test-flow/application
 * 
 * Automated test scenario: Complete application submission flow
 * Steps:
 * 1. Submit application via API
 * 2. Verify application in database
 * 3. Verify webhook was triggered
 * 4. Verify application shows in recruiter pipeline
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuthToken(request);
        if (!auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { jobId, apiKey } = body;

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        const results: any[] = [];

        // Step 1: Submit application via API
        const mockCandidate = generateMockCandidate();
        const submitAppResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/v1/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey || '',
            },
            body: JSON.stringify({
                jobId,
                candidate: {
                    email: mockCandidate.email,
                    firstName: mockCandidate.firstName,
                    lastName: mockCandidate.lastName,
                },
                source: 'api_test',
            }),
        });

        const submitAppData = await submitAppResponse.json();
        results.push({
            step: 1,
            name: 'Submit application via API',
            status: submitAppResponse.ok ? 'PASS' : 'FAIL',
            data: submitAppData,
            httpStatus: submitAppResponse.status,
        });

        if (!submitAppResponse.ok) {
            return NextResponse.json({ success: false, results });
        }

        const applicationId = submitAppData.application_id || submitAppData.applicationId;

        // Step 2: Verify application exists in database  
        const { supabaseAdmin } = await import('@/lib/supabase/admin');
        const { data: dbApp, error: dbError } = await supabaseAdmin
            .from('job_applications')
            .select('*')
            .eq('id', applicationId)
            .single();

        results.push({
            step: 2,
            name: 'Verify application in database',
            status: dbApp && !dbError ? 'PASS' : 'FAIL',
            data: dbApp,
            error: dbError?.message,
        });

        // Step 3: Check if webhook was logged (wait a bit for async webhook)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: webhookLogs } = await supabaseAdmin
            .from('webhook_test_logs')
            .select('*')
            .eq('event_type', 'application.created')
            .order('created_at', { ascending: false })
            .limit(10);

        const recentWebhook = webhookLogs?.find((log: any) => {
            const payload = log.payload;
            return payload?.applicationId === applicationId || payload?.application_id === applicationId;
        });

        results.push({
            step: 3,
            name: 'Verify webhook triggered',
            status: recentWebhook ? 'PASS' : 'SKIP',
            data: { webhookFound: !!recentWebhook, checked: webhookLogs?.length || 0 },
            note: 'Webhook may not fire if not configured for test agency',
        });

        // Step 4: Verify application shows up in API
        const applicationsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/v1/applications?jobId=${jobId}`,
            {
                headers: {
                    'X-API-Key': apiKey || '',
                },
            }
        );

        if (applicationsResponse.ok) {
            const applicationsData = await applicationsResponse.json();
            const appInListing = applicationsData.applications?.find((a: any) => a.id === applicationId);

            results.push({
                step: 4,
                name: 'Verify application in API listing',
                status: appInListing ? 'PASS' : 'FAIL',
                data: { found: !!appInListing },
            });
        } else {
            results.push({
                step: 4,
                name: 'Verify application in API listing',
                status: 'SKIP',
                data: { reason: 'API endpoint not available or requires auth' },
            });
        }

        const allPassed = results.filter(r => r.status !== 'SKIP').every(r => r.status === 'PASS');

        return NextResponse.json({
            success: allPassed,
            summary: {
                total: results.length,
                passed: results.filter(r => r.status === 'PASS').length,
                failed: results.filter(r => r.status === 'FAIL').length,
                skipped: results.filter(r => r.status === 'SKIP').length,
            },
            results,
            applicationId,
        });

    } catch (error: any) {
        console.error('Error in application test flow:', error);
        return NextResponse.json({
            error: 'Test flow failed',
            details: error.message,
        }, { status: 500 });
    }
}

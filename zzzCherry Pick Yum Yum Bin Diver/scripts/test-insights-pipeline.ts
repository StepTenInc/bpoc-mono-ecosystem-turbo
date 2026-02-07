
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001'; // Adjust if running on a different port

async function testEndpoint(name: string, url: string, method: string = 'POST', body: any = {}) {
    console.log(`\nTesting ${name}...`);
    try {
        const response = await fetch(`${BASE_URL}${url}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        // We expect 401/403 if auth is required, or 200/400/500 depending on logic.
        // If it's a Next.js API route, checking for existence is key.

        if (response.status === 404) {
            console.error(`❌ Endpoint NOT FOUND: ${url}`);
            return false;
        }

        try {
            const data = await response.json();
            console.log('Response:', JSON.stringify(data, null, 2).slice(0, 200) + '...');
        } catch (e) {
            console.log('Response (text):', (await response.text()).slice(0, 200));
        }

        return true;
    } catch (error: any) {
        console.error(`❌ Connection failed to ${url}:`, error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Insights Pipeline API Health Check');

    // 1. Test Research Endpoint
    await testEndpoint(
        'Research Stage',
        '/api/admin/insights/pipeline/research',
        'POST',
        { topic: 'Test Topic' }
    );

    // 2. Test Plan Generation Endpoint
    await testEndpoint(
        'Plan Generation Stage',
        '/api/admin/insights/pipeline/generate-plan',
        'POST',
        { articleTemplate: { title: 'Test' }, research: {} }
    );

    // 3. Test Orchestrator (Run) Endpoint
    await testEndpoint(
        'Pipeline Orchestrator',
        '/api/admin/insights/pipeline/run',
        'POST',
        { mode: 'resume', insightId: 'invalid-id' } // Should fail gracefully
    );

    // 4. Test Humanize Endpoint
    await testEndpoint(
        'Humanize Stage',
        '/api/admin/insights/pipeline/humanize',
        'POST',
        { insightId: 'test-id' }
    );

    console.log('\n✅ Health check complete.');
}

runTests();

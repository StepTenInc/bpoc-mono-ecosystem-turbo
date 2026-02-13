import { NextRequest, NextResponse } from 'next/server';

const CLOUDCONVERT_API_URL = 'https://api.cloudconvert.com/v2';
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES,
  timeout: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      if (response.status >= 500 || response.status === 429) {
        if (attempt < retries) {
          console.warn(`CloudConvert API returned ${response.status}, retrying (${attempt}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`CloudConvert API request timed out after ${timeout}ms (attempt ${attempt}/${retries})`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      console.warn(`CloudConvert API network error (attempt ${attempt}/${retries}):`, error);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[CloudConvert:${requestId}] POST request received`);

  try {
    const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY;

    if (!cloudConvertApiKey) {
      console.error(`[CloudConvert:${requestId}] API key not configured`);
      return NextResponse.json(
        { error: 'CloudConvert API key not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();

    if (!body.tasks || typeof body.tasks !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body - missing tasks object' },
        { status: 400 }
      );
    }

    console.log(`[CloudConvert:${requestId}] Creating job with ${Object.keys(body.tasks).length} tasks`);

    const response = await fetchWithRetry(
      `${CLOUDCONVERT_API_URL}/jobs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(`[CloudConvert:${requestId}] Job creation failed:`, { status: response.status, data });
      return NextResponse.json(
        { error: data.message || 'Job creation failed', details: data },
        { status: response.status }
      );
    }

    console.log(`[CloudConvert:${requestId}] Job created successfully: ${data.data?.id}`);
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[CloudConvert:${requestId}] Proxy error:`, error);
    return NextResponse.json(
      { error: 'Failed to create CloudConvert job', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY;

    if (!cloudConvertApiKey) {
      return NextResponse.json(
        { error: 'CloudConvert API key not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[CloudConvert:${requestId}] Checking status for job: ${jobId}`);

    const response = await fetchWithRetry(
      `${CLOUDCONVERT_API_URL}/jobs/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(`[CloudConvert:${requestId}] Status check failed:`, { status: response.status, jobId });
      return NextResponse.json(
        { error: data.message || 'Status check failed', details: data },
        { status: response.status }
      );
    }

    console.log(`[CloudConvert:${requestId}] Job ${jobId} status: ${data.data?.status}`);
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[CloudConvert:${requestId}] Proxy error:`, error);
    return NextResponse.json(
      { error: 'Failed to get CloudConvert job status', details: errorMessage },
      { status: 500 }
    );
  }
}

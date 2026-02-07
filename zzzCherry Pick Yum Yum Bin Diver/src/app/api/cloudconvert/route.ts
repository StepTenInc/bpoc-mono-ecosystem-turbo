import { NextRequest, NextResponse } from 'next/server';

const CLOUDCONVERT_API_URL = 'https://api.cloudconvert.com/v2';
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * CloudConvert API Proxy
 *
 * This route proxies requests to CloudConvert's API to avoid CORS issues
 * when calling CloudConvert from the browser in production.
 *
 * Features:
 * - Timeout handling (30s default)
 * - Retry logic for transient failures
 * - Detailed error categorization
 * - Request/response logging for debugging
 *
 * Supported operations:
 * - POST: Create a new conversion job
 * - GET: Check job status (requires jobId query parameter)
 */

// Helper: Fetch with timeout and retry
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

      // Don't retry on client errors (4xx) except rate limiting (429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry on server errors (5xx) or rate limiting
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

      // Check if it's an abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`CloudConvert API request timed out after ${timeout}ms (attempt ${attempt}/${retries})`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      // Network error - retry
      console.warn(`CloudConvert API network error (attempt ${attempt}/${retries}):`, error);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

// Helper: Categorize and format error response
function formatErrorResponse(status: number, data: unknown, context: string): { message: string; userFriendly: string } {
  const errorData = data as { message?: string; code?: string; error?: string };
  const serverMessage = errorData?.message || errorData?.error || 'Unknown error';

  switch (status) {
    case 401:
    case 403:
      return {
        message: `Authentication failed: ${serverMessage}`,
        userFriendly: 'Document conversion service is temporarily unavailable. Please try again or upload an image (JPG/PNG) instead.'
      };
    case 402:
      return {
        message: `Payment required: ${serverMessage}`,
        userFriendly: 'Document conversion quota exceeded. Please try uploading an image (JPG/PNG) instead.'
      };
    case 429:
      return {
        message: `Rate limit exceeded: ${serverMessage}`,
        userFriendly: 'Too many requests. Please wait a moment and try again.'
      };
    case 422:
      return {
        message: `Validation error: ${serverMessage}`,
        userFriendly: 'This file format is not supported. Please try a different file or upload an image.'
      };
    case 503:
    case 502:
    case 504:
      return {
        message: `Service unavailable: ${serverMessage}`,
        userFriendly: 'Document conversion service is temporarily unavailable. Please try again in a few minutes.'
      };
    default:
      if (status >= 500) {
        return {
          message: `Server error (${status}): ${serverMessage}`,
          userFriendly: 'An unexpected error occurred. Please try again.'
        };
      }
      return {
        message: `${context} failed (${status}): ${serverMessage}`,
        userFriendly: serverMessage
      };
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[CloudConvert:${requestId}] POST request received`);

  try {
    const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY;

    if (!cloudConvertApiKey) {
      console.error(`[CloudConvert:${requestId}] API key not configured`);
      return NextResponse.json(
        {
          error: 'CloudConvert API key not configured on server',
          userFriendly: 'Document conversion service is not configured. Please contact support.'
        },
        { status: 503 }
      );
    }

    // Validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.error(`[CloudConvert:${requestId}] Invalid JSON body`);
      return NextResponse.json(
        { error: 'Invalid request body - expected JSON' },
        { status: 400 }
      );
    }

    // Basic validation - ensure tasks object exists
    const requestBody = body as { tasks?: unknown };
    if (!requestBody.tasks || typeof requestBody.tasks !== 'object') {
      console.error(`[CloudConvert:${requestId}] Missing or invalid tasks in request body`);
      return NextResponse.json(
        { error: 'Invalid request body - missing tasks object' },
        { status: 400 }
      );
    }

    console.log(`[CloudConvert:${requestId}] Creating job with ${Object.keys(requestBody.tasks as object).length} tasks`);

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

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      console.error(`[CloudConvert:${requestId}] Failed to parse response as JSON`);
      return NextResponse.json(
        {
          error: 'Invalid response from CloudConvert API',
          userFriendly: 'Document conversion service returned an invalid response. Please try again.'
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const { message, userFriendly } = formatErrorResponse(response.status, data, 'Job creation');
      console.error(`[CloudConvert:${requestId}] Job creation failed:`, { status: response.status, message, data });
      return NextResponse.json(
        { error: message, userFriendly, details: data },
        { status: response.status }
      );
    }

    const responseData = data as { data?: { id?: string } };
    console.log(`[CloudConvert:${requestId}] Job created successfully: ${responseData.data?.id}`);
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[CloudConvert:${requestId}] Proxy error:`, error);

    // Check for specific error types
    if (errorMessage.includes('timed out')) {
      return NextResponse.json(
        {
          error: 'Request timed out',
          userFriendly: 'Document conversion service is taking too long. Please try again with a smaller file.'
        },
        { status: 504 }
      );
    }

    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return NextResponse.json(
        {
          error: 'Network error connecting to CloudConvert',
          userFriendly: 'Unable to connect to document conversion service. Please check your internet connection and try again.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create CloudConvert job',
        details: errorMessage,
        userFriendly: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY;

    if (!cloudConvertApiKey) {
      console.error(`[CloudConvert:${requestId}] API key not configured`);
      return NextResponse.json(
        {
          error: 'CloudConvert API key not configured on server',
          userFriendly: 'Document conversion service is not configured. Please contact support.'
        },
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

    // Validate jobId format (UUID-like)
    if (!/^[a-zA-Z0-9-]+$/.test(jobId)) {
      return NextResponse.json(
        { error: 'Invalid jobId format' },
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

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      console.error(`[CloudConvert:${requestId}] Failed to parse status response as JSON`);
      return NextResponse.json(
        {
          error: 'Invalid response from CloudConvert API',
          userFriendly: 'Document conversion service returned an invalid response. Please try again.'
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const { message, userFriendly } = formatErrorResponse(response.status, data, 'Status check');
      console.error(`[CloudConvert:${requestId}] Status check failed:`, { status: response.status, message, jobId });
      return NextResponse.json(
        { error: message, userFriendly, details: data },
        { status: response.status }
      );
    }

    const responseData = data as { data?: { status?: string } };
    console.log(`[CloudConvert:${requestId}] Job ${jobId} status: ${responseData.data?.status}`);
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[CloudConvert:${requestId}] Proxy error:`, error);

    if (errorMessage.includes('timed out')) {
      return NextResponse.json(
        {
          error: 'Request timed out',
          userFriendly: 'Status check timed out. Please try again.'
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to get CloudConvert job status',
        details: errorMessage,
        userFriendly: 'Unable to check conversion status. Please try again.'
      },
      { status: 500 }
    );
  }
}

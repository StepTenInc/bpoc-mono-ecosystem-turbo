/**
 * ERROR LOGGER UTILITY
 * 
 * Wrapper function to catch and log errors from any API route
 * Automatically captures context and sends to error logging system
 * 
 * Usage:
 * 
 * import { withErrorLogging, logError } from '@/lib/error-logger';
 * 
 * // Wrap entire API route
 * export const POST = withErrorLogging(async (req) => {
 *   // Your code here
 * }, { endpoint: '/api/my-route' });
 * 
 * // Or log manually
 * try {
 *   await someAPICall();
 * } catch (error) {
 *   await logError(error, { endpoint: '/api/my-route', external_service: 'openai' });
 *   throw error;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

interface ErrorContext {
  endpoint?: string;
  http_method?: string;
  external_service?: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  request_body?: any;
}

interface LogErrorOptions extends ErrorContext {
  error_code?: string;
  response_body?: any;
  external_error_code?: string;
  rate_limit_remaining?: number;
  rate_limit_reset?: string;
}

/**
 * Log an error to the platform error system
 */
export async function logError(
  error: Error | any,
  options: LogErrorOptions = {}
): Promise<void> {
  try {
    // Don't log in development if you want (optional)
    // if (process.env.NODE_ENV === 'development') {
    //   console.error('🚨 DEV ERROR:', error);
    //   return;
    // }

    const errorPayload = {
      error_message: error.message || String(error),
      error_code: options.error_code || error.code || error.status?.toString(),
      error_stack: error.stack,
      endpoint: options.endpoint,
      http_method: options.http_method,
      request_body: options.request_body,
      response_body: options.response_body,
      user_id: options.user_id,
      user_email: options.user_email,
      user_role: options.user_role,
      external_service: options.external_service,
      external_error_code: options.external_error_code,
      rate_limit_remaining: options.rate_limit_remaining,
      rate_limit_reset: options.rate_limit_reset,
    };

    // Use absolute URL in production, relative in dev
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    await fetch(`${baseUrl}/api/admin/errors/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorPayload),
    }).catch(() => {
      // If error logging fails, just console log
      console.error('Failed to log error to system:', errorPayload);
    });

  } catch (logError) {
    // Never let error logging break the app
    console.error('Error logger failed:', logError);
  }
}

/**
 * Detect external service from error
 */
function detectExternalService(error: any): string | undefined {
  const msg = (error.message || '').toLowerCase();
  
  if (msg.includes('openai') || error.code?.includes('openai')) return 'openai';
  if (msg.includes('anthropic') || msg.includes('claude')) return 'anthropic';
  if (msg.includes('google') || msg.includes('gemini')) return 'google';
  if (msg.includes('serper')) return 'serper';
  if (msg.includes('grok') || msg.includes('x.ai')) return 'grok';
  if (msg.includes('supabase') || msg.includes('postgres')) return 'supabase';
  if (msg.includes('vercel')) return 'vercel';
  if (msg.includes('stripe')) return 'stripe';
  if (msg.includes('daily') || msg.includes('video call')) return 'daily';
  
  return undefined;
}

/**
 * Extract rate limit info from error response
 */
function extractRateLimitInfo(error: any): { remaining?: number; reset?: string } {
  // Check for common rate limit headers in error response
  const headers = error.response?.headers || error.headers;
  if (!headers) return {};

  return {
    remaining: parseInt(headers['x-ratelimit-remaining'] || headers['ratelimit-remaining']),
    reset: headers['x-ratelimit-reset'] || headers['ratelimit-reset'],
  };
}

/**
 * Wrapper function to automatically log errors from API routes
 */
export function withErrorLogging(
  handler: (req: NextRequest) => Promise<NextResponse>,
  context: ErrorContext = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req);
      return response;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Detect external service if not provided
      const external_service = context.external_service || detectExternalService(error);
      
      // Extract rate limit info
      const rateLimitInfo = extractRateLimitInfo(error);
      
      // Get request body if possible
      let requestBody;
      try {
        requestBody = await req.clone().json();
      } catch {
        // Body might not be JSON or already consumed
      }

      // Log the error
      await logError(error, {
        ...context,
        endpoint: context.endpoint || req.nextUrl.pathname,
        http_method: req.method,
        request_body: requestBody,
        external_service,
        rate_limit_remaining: rateLimitInfo.remaining,
        rate_limit_reset: rateLimitInfo.reset,
      });

      // Return error response
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'An error occurred',
          error_code: error.code,
          duration_ms: duration,
        },
        { status: error.status || 500 }
      );
    }
  };
}

/**
 * Log external API call error with detailed context
 */
export async function logExternalAPIError(
  service: string,
  error: any,
  context: {
    endpoint?: string;
    request?: any;
    response?: any;
  } = {}
): Promise<void> {
  const rateLimitInfo = extractRateLimitInfo(error);
  
  await logError(error, {
    external_service: service,
    endpoint: context.endpoint,
    request_body: context.request,
    response_body: context.response,
    external_error_code: error.code || error.error?.code,
    rate_limit_remaining: rateLimitInfo.remaining,
    rate_limit_reset: rateLimitInfo.reset,
  });
}

/**
 * Helper to wrap external API calls with error logging
 */
export async function withExternalAPILogging<T>(
  service: string,
  apiCall: () => Promise<T>,
  context: { endpoint?: string; request?: any } = {}
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    await logExternalAPIError(service, error, context);
    throw error;
  }
}


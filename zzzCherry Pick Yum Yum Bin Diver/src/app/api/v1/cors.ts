import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed CORS origins for API v1 endpoints
 * Can be configured via CORS_ORIGINS environment variable (comma-separated)
 * Default: * (allows all origins)
 * 
 * Examples:
 * - CORS_ORIGINS=https://shoreagents.com,https://www.shoreagents.com
 * - CORS_ORIGINS=*
 * 
 * Note: localhost origins are automatically allowed in development mode
 */
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.CORS_ORIGINS;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Default localhost origins for development
  const localhostOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
  
  if (!envOrigins || envOrigins === '*') {
    return ['*']; // Allow all origins
  }
  
  const origins = envOrigins.split(',').map(origin => origin.trim());
  
  // In development, always include localhost origins
  if (isDevelopment) {
    return [...new Set([...origins, ...localhostOrigins])];
  }
  
  return origins;
};

/**
 * Get the appropriate CORS origin header value based on request origin
 */
function getCorsOrigin(request: NextRequest): string {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = request.headers.get('origin');
  const isDevelopment = process.env.NODE_ENV === 'development';

  // If wildcard is allowed, return *
  if (allowedOrigins.includes('*')) {
    return '*';
  }

  // In development, always allow localhost origins
  if (isDevelopment && requestOrigin) {
    const isLocalhost = requestOrigin.startsWith('http://localhost:') || 
                       requestOrigin.startsWith('http://127.0.0.1:');
    if (isLocalhost) {
      return requestOrigin; // Echo back the localhost origin
    }
  }

  // If request origin matches an allowed origin, return it
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Default: return first allowed origin (or * if none specified)
  return allowedOrigins[0] || '*';
}

/**
 * Get CORS headers for a request
 */
function getCorsHeaders(request: NextRequest) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsOptions(request?: NextRequest) {
  const headers = request ? getCorsHeaders(request) : {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
    'Access-Control-Max-Age': '86400',
  };

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Add CORS headers to a response
 * Optionally includes rate limit headers
 */
export function withCors(
  response: NextResponse,
  request?: NextRequest,
  rateLimit?: {
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  }
) {
  const headers = request ? getCorsHeaders(request) : {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
    'Access-Control-Max-Age': '86400',
  };

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add rate limit headers if provided
  if (rateLimit) {
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString());
    if (rateLimit.retryAfter) {
      response.headers.set('Retry-After', rateLimit.retryAfter.toString());
    }
  }

  return response;
}

/**
 * Default CORS headers (for backward compatibility)
 * @deprecated Use withCors(response, request) instead
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
  'Access-Control-Max-Age': '86400',
};


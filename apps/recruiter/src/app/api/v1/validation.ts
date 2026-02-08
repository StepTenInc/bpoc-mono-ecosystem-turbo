/**
 * Shared validation utilities for v1 API endpoints
 * Ensures consistent validation and error handling across all endpoints
 */

import { NextResponse } from 'next/server';

// CORS headers (consistent across all endpoints)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
  'Access-Control-Max-Age': '86400',
};

/**
 * UUID validation regex (RFC 4122 compliant)
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Email validation regex (basic)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation error response
 */
export function validationError(message: string, field?: string) {
  return NextResponse.json(
    {
      error: 'Validation error',
      message,
      field,
    },
    { status: 400, headers: corsHeaders }
  );
}

/**
 * Not found error response
 */
export function notFoundError(resource: string, id?: string) {
  return NextResponse.json(
    {
      error: `${resource} not found`,
      ...(id && { id }),
    },
    { status: 404, headers: corsHeaders }
  );
}

/**
 * Server error response (sanitized for production)
 */
export function serverError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  console.error(`[API Error]${context ? ` ${context}:` : ''}`, error);

  return NextResponse.json(
    {
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: message, context }),
    },
    { status: 500, headers: corsHeaders }
  );
}

/**
 * Success response
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Validate UUID field
 */
export function validateUUIDField(value: string, fieldName: string): NextResponse | null {
  if (!isValidUUID(value)) {
    return validationError(
      `Invalid ${fieldName} format. Expected UUID (e.g., 092fd214-03c5-435d-9156-4a533d950cc3)`,
      fieldName
    );
  }
  return null;
}

/**
 * Validate email field
 */
export function validateEmailField(value: string, fieldName: string): NextResponse | null {
  if (!isValidEmail(value)) {
    return validationError(
      `Invalid ${fieldName} format. Expected valid email address`,
      fieldName
    );
  }
  return null;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: T[],
  fieldName: string
): NextResponse | null {
  if (!allowedValues.includes(value as T)) {
    return validationError(
      `Invalid ${fieldName}. Allowed values: ${allowedValues.join(', ')}`,
      fieldName
    );
  }
  return null;
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): NextResponse | null {
  if (value < min || value > max) {
    return validationError(
      `${fieldName} must be between ${min} and ${max}`,
      fieldName
    );
  }
  return null;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): NextResponse | null {
  if (value.length < minLength || value.length > maxLength) {
    return validationError(
      `${fieldName} must be between ${minLength} and ${maxLength} characters`,
      fieldName
    );
  }
  return null;
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate URL format
 */
export function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate URL field
 */
export function validateURLField(value: string, fieldName: string): NextResponse | null {
  if (!isValidURL(value)) {
    return validationError(
      `Invalid ${fieldName} format. Expected valid URL`,
      fieldName
    );
  }
  return null;
}

/**
 * API Field Transformation Layer - DEPRECATED
 * 
 * This file has been gutted as part of the snake_case migration.
 * The API now uses snake_case consistently (matching the database).
 * 
 * All transform functions are now identity/passthrough functions.
 */

/**
 * @deprecated No transformation needed - API uses snake_case directly
 */
export function transformToApi<T = any>(data: T): T {
  return data;
}

/**
 * @deprecated No transformation needed - API uses snake_case directly
 */
export function transformFromApi<T = any>(data: T): T {
  return data;
}

/**
 * @deprecated Use transformToApi instead
 */
export function transformToApiWithMappings<T = any>(data: T): T {
  return data;
}

/**
 * @deprecated Use transformFromApi instead
 */
export function transformFromApiWithMappings<T = any>(data: T): T {
  return data;
}

/**
 * @deprecated No normalization needed - API uses snake_case directly
 */
export function normalizeApiInput<T = any>(data: T): T {
  return data;
}

/**
 * Common error codes for consistent API responses
 */
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_API_KEY: 'INVALID_API_KEY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

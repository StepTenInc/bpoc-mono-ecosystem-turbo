/**
 * API Field Transformation Layer
 * 
 * SIMPLIFIED: Now uses snake_case throughout (DB and API responses match).
 * transformToApi and transformFromApi are now pass-through for backwards compatibility.
 */

// Type definitions for common API entities (snake_case)
export interface ApiCandidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  years_of_experience?: number;
  current_job_title?: string;
  current_company?: string;
  desired_salary?: number;
  available_start_date?: string;
  willing_to_relocate?: boolean;
  preferred_locations?: string[];
  skills?: string[];
  education?: any[];
  work_history?: any[];
  created_at: string;
  updated_at: string;
}

export interface ApiApplication {
  id: string;
  candidate_id: string;
  job_id: string;
  status: string;
  released_to_client: boolean;
  applied_at: string;
  released_at?: string;
  candidate?: ApiCandidate;
}

export interface ApiJob {
  id: string;
  client_id: string;
  title: string;
  description: string;
  employment_type: string;
  work_location: string;
  salary_min?: number;
  salary_max?: number;
  experience_level?: string;
  required_skills?: string[];
  nice_to_have_skills?: string[];
  benefits?: string[];
  application_deadline?: string;
  start_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiClient {
  id: string;
  company_name: string;
  industry?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiVideoCall {
  id: string;
  candidate_id: string;
  job_id?: string;
  call_url: string;
  scheduled_at: string;
  duration?: number;
  status: string;
  shared_with_client: boolean;
  recording_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Snake case to camel case conversion (kept for backwards compatibility)
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Camel case to snake case conversion
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively transform object keys
 */
function transformKeys(obj: any, transformer: (key: string) => string): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformer));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = transformer(key);
      transformed[newKey] = transformKeys(value, transformer);
    }
    return transformed;
  }

  return obj;
}

/**
 * PASS-THROUGH: API now uses snake_case directly (matches database).
 * Kept for backwards compatibility - does NOT transform.
 */
export function transformToApi<T = any>(data: any): T {
  return data; // Pass-through - no transformation
}

/**
 * Transform API input to snake_case for database.
 * Still converts camelCase input to snake_case for backwards compatibility with clients.
 */
export function transformFromApi(data: any): any {
  return transformKeys(data, toSnakeCase);
}

/**
 * Field mapping for special cases that don't follow standard snake_case/camelCase rules
 */
const SPECIAL_FIELD_MAPPINGS: Record<string, string> = {
  // Database -> API
  'resume_url': 'resumeUrl',
  'linkedin_url': 'linkedinUrl',
  'portfolio_url': 'portfolioUrl',
  'logo_url': 'logoUrl',
  'recording_url': 'recordingUrl',
  'call_url': 'callUrl',
  
  // API -> Database (reverse mappings)
  'resumeUrl': 'resume_url',
  'linkedinUrl': 'linkedin_url',
  'portfolioUrl': 'portfolio_url',
  'logoUrl': 'logo_url',
  'recordingUrl': 'recording_url',
  'callUrl': 'call_url',
};

/**
 * Apply special field mappings for edge cases
 */
function applySpecialMappings(obj: any, mappings: Record<string, string>): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => applySpecialMappings(item, mappings));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = mappings[key] || key;
      transformed[newKey] = applySpecialMappings(value, mappings);
    }
    return transformed;
  }

  return obj;
}

/**
 * Transform database object with special field mappings applied
 * Use this when you need precise control over specific field names
 */
export function transformToApiWithMappings<T = any>(data: any): T {
  const camelCased = transformToApi(data);
  return applySpecialMappings(camelCased, SPECIAL_FIELD_MAPPINGS);
}

/**
 * Transform API input with special field mappings applied
 * Use this when you need precise control over specific field names
 */
export function transformFromApiWithMappings(data: any): any {
  const withMappings = applySpecialMappings(data, SPECIAL_FIELD_MAPPINGS);
  return transformFromApi(withMappings);
}

/**
 * Validate and normalize API input
 * Accepts both camelCase and snake_case, outputs normalized snake_case
 * 
 * @param data - API input data
 * @param allowedFields - Optional list of allowed field names (snake_case)
 * @returns Normalized data with snake_case keys
 */
export function normalizeApiInput(
  data: any,
  allowedFields?: string[]
): any {
  const normalized = transformFromApi(data);

  if (allowedFields && allowedFields.length > 0) {
    const filtered: any = {};
    for (const field of allowedFields) {
      if (normalized[field] !== undefined) {
        filtered[field] = normalized[field];
      }
    }
    return filtered;
  }

  return normalized;
}

/**
 * Prepare API error response with consistent format
 * Returns plain object for use with NextResponse.json() or withCors()
 */
export function apiError(
  message: string,
  code: string,
  statusCode: number,
  details?: any
) {
  return {
    body: {
      error: {
        message,
        code,
        details: details || undefined, // Pass-through, no transformation
      },
    },
    status: statusCode,
  };
}

/**
 * Prepare API success response (snake_case pass-through)
 * Returns plain object for use with NextResponse.json() or withCors()
 */
export function apiSuccess<T = any>(
  data: T,
  statusCode: number = 200
) {
  return {
    body: data, // Pass-through, no transformation
    status: statusCode,
  };
}

/**
 * Prepare paginated API response (snake_case pass-through)
 * Returns plain object for use with NextResponse.json() or withCors()
 */
export function apiPaginated<T = any>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    body: {
      data: items, // Pass-through, no transformation
      pagination: {
        total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(total / pageSize),
      },
    },
    status: 200,
  };
}

/**
 * Common error codes for consistent API responses
 */
export const API_ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_API_KEY: 'INVALID_API_KEY',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

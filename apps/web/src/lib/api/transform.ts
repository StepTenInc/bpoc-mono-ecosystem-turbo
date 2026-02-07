/**
 * API Field Transformation Layer
 * 
 * Provides consistent field name transformation between database (snake_case)
 * and API responses (camelCase) for the BPOC v1 API.
 * 
 * Usage:
 * - transformToApi(): Convert database objects to API response format
 * - transformFromApi(): Convert API input to database format
 */

// Type definitions for common API entities
export interface ApiCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
  currentJobTitle?: string;
  currentCompany?: string;
  desiredSalary?: number;
  availableStartDate?: string;
  willingToRelocate?: boolean;
  preferredLocations?: string[];
  skills?: string[];
  education?: any[];
  workHistory?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiApplication {
  id: string;
  candidateId: string;
  jobId: string;
  status: string;
  releasedToClient: boolean;
  appliedAt: string;
  releasedAt?: string;
  candidate?: ApiCandidate;
}

export interface ApiJob {
  id: string;
  clientId: string;
  title: string;
  description: string;
  employmentType: string;
  workLocation: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  benefits?: string[];
  applicationDeadline?: string;
  startDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiClient {
  id: string;
  companyName: string;
  industry?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiVideoCall {
  id: string;
  candidateId: string;
  jobId?: string;
  callUrl: string;
  scheduledAt: string;
  duration?: number;
  status: string;
  sharedWithClient: boolean;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Snake case to camel case conversion
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
 * Recursively transform object keys from snake_case to camelCase
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
 * Transform database object (snake_case) to API response format (camelCase)
 * 
 * @param data - Database object or array of objects
 * @returns Transformed object with camelCase keys
 * 
 * @example
 * const dbCandidate = { first_name: 'John', last_name: 'Doe', created_at: '2024-01-01' };
 * const apiCandidate = transformToApi(dbCandidate);
 * // Result: { firstName: 'John', lastName: 'Doe', createdAt: '2024-01-01' }
 */
export function transformToApi<T = any>(data: any): T {
  return transformKeys(data, toCamelCase);
}

/**
 * Transform API input (camelCase or snake_case) to database format (snake_case)
 * 
 * Accepts both formats for flexibility, always outputs snake_case for database operations
 * 
 * @param data - API input object or array of objects
 * @returns Transformed object with snake_case keys
 * 
 * @example
 * const apiInput = { firstName: 'John', lastName: 'Doe' };
 * const dbInput = transformFromApi(apiInput);
 * // Result: { first_name: 'John', last_name: 'Doe' }
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
        details: details ? transformToApi(details) : undefined,
      },
    },
    status: statusCode,
  };
}

/**
 * Prepare API success response with transformed data
 * Returns plain object for use with NextResponse.json() or withCors()
 */
export function apiSuccess<T = any>(
  data: T,
  statusCode: number = 200
) {
  return {
    body: transformToApi(data),
    status: statusCode,
  };
}

/**
 * Prepare paginated API response
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
      data: transformToApi(items),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
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

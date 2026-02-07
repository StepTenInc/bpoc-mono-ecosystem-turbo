/**
 * Environment Variable Validation for Supabase
 * 
 * This module validates that all required Supabase environment variables
 * are present at startup, preventing runtime errors.
 * 
 * Import this at the top of your app to fail fast if env vars are missing.
 */

interface EnvValidationError {
  variable: string
  message: string
}

const REQUIRED_ENV_VARS = {
  // Main Supabase Instance
  NEXT_PUBLIC_SUPABASE_URL: 'Main Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Main Supabase anonymous (public) key',
  SUPABASE_SERVICE_ROLE_KEY: 'Main Supabase service role (admin) key',
  
  // Database URLs (for direct PostgreSQL connections if needed)
  SUPABASE_DATABASE_URL: 'PostgreSQL connection string (pooled)',
  SUPABASE_DIRECT_URL: 'PostgreSQL connection string (direct)',
} as const

const OPTIONAL_ENV_VARS = {
  // ShoreAgents External Database
  NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL: 'ShoreAgents Supabase project URL',
  NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY: 'ShoreAgents anonymous key',
  SHOREAGENTS_SERVICE_ROLE_KEY: 'ShoreAgents service role key',
  
  // Feature Flags
  USE_SUPABASE: 'Enable Supabase globally',
  FEATURE_SUPABASE_AUTH: 'Enable Supabase auth',
  FEATURE_SUPABASE_CANDIDATES: 'Enable Supabase for candidates',
  FEATURE_SUPABASE_PROFILES: 'Enable Supabase for profiles',
  FEATURE_SUPABASE_RESUMES: 'Enable Supabase for resumes',
  FEATURE_SUPABASE_ASSESSMENTS: 'Enable Supabase for assessments',
  FEATURE_SUPABASE_AGENCIES: 'Enable Supabase for agencies',
  FEATURE_SUPABASE_JOBS: 'Enable Supabase for jobs',
  FEATURE_SUPABASE_APPLICATIONS: 'Enable Supabase for applications',
} as const

/**
 * Validate that all required environment variables are present
 * 
 * @param throwOnError - If true, throws error on validation failure. If false, logs warnings.
 * @returns Array of validation errors (empty if all valid)
 */
export function validateSupabaseEnv(throwOnError: boolean = true): EnvValidationError[] {
  const errors: EnvValidationError[] = []
  
  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key]
    
    if (!value || value.trim() === '') {
      errors.push({
        variable: key,
        message: `Missing required environment variable: ${key} (${description})`,
      })
    }
  }
  
  // Log warnings for optional variables
  const warnings: string[] = []
  for (const [key, description] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[key]
    
    if (!value || value.trim() === '') {
      warnings.push(`Optional: ${key} not set (${description})`)
    }
  }
  
  // Report results
  if (errors.length > 0) {
    const errorMessage = [
      '❌ Supabase Environment Variable Validation Failed',
      '',
      'Missing required variables:',
      ...errors.map(e => `  • ${e.message}`),
      '',
      'Please add these to your .env.local file.',
    ].join('\n')
    
    if (throwOnError) {
      throw new Error(errorMessage)
    } else {
      console.error(errorMessage)
    }
  } else {
    console.log('✅ All required Supabase environment variables are present')
  }
  
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️  Optional Supabase variables not set:')
    warnings.forEach(w => console.warn(`  • ${w}`))
    console.warn('')
  }
  
  return errors
}

/**
 * Get an environment variable value with validation
 * 
 * @param key - Environment variable key
 * @param required - If true, throws error if variable is missing
 * @returns Environment variable value
 */
export function getEnv(key: string, required: boolean = true): string {
  const value = process.env[key]
  
  if (!value || value.trim() === '') {
    if (required) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    return ''
  }
  
  return value
}

/**
 * Check if Supabase is properly configured
 * 
 * @returns true if all required env vars are present
 */
export function isSupabaseConfigured(): boolean {
  return validateSupabaseEnv(false).length === 0
}

// Auto-validate on import in development
if (process.env.NODE_ENV === 'development') {
  try {
    validateSupabaseEnv(false)
  } catch (error) {
    // Error already logged by validateSupabaseEnv
  }
}

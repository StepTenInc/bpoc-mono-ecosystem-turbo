/**
 * Feature Flag Configuration
 * Controls which Supabase features are enabled
 */
export const features = {
  supabase: {
    enabled: process.env.USE_SUPABASE === 'true',
    auth: process.env.FEATURE_SUPABASE_AUTH === 'true',
    candidates: process.env.FEATURE_SUPABASE_CANDIDATES === 'true',
    profiles: process.env.FEATURE_SUPABASE_PROFILES === 'true',
    resumes: process.env.FEATURE_SUPABASE_RESUMES === 'true',
    assessments: process.env.FEATURE_SUPABASE_ASSESSMENTS === 'true',
    agencies: process.env.FEATURE_SUPABASE_AGENCIES === 'true',
    jobs: process.env.FEATURE_SUPABASE_JOBS === 'true',
    applications: process.env.FEATURE_SUPABASE_APPLICATIONS === 'true',
  },
}

export function useSupabase(feature: keyof typeof features.supabase): boolean {
  if (!features.supabase.enabled) return false
  return features.supabase[feature] ?? false
}



/**
 * TypeScript types for Candidates
 * Used across Supabase queries
 */

export interface Candidate {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone?: string | null
  avatar_url: string | null
  username: string | null
  slug: string | null
  location?: string | null
  location_city?: string | null
  location_province?: string | null
  location_country?: string | null
  bio?: string | null
  headline?: string | null
  is_active: boolean
  email_verified: boolean
  suspended?: boolean
  suspended_reason?: string | null
  created_at: string
  updated_at: string
}

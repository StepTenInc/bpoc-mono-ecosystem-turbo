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
  avatar_url: string | null
  username: string | null
  slug: string | null
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

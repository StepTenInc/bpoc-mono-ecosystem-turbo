/**
 * TypeScript types for Candidate Profiles
 * Used across Supabase queries
 * Updated to match new clean schema (2026-01-23)
 */

export interface CandidateProfile {
  id: string
  candidate_id: string

  // Personal Info
  bio: string | null
  headline: string | null
  phone: string | null
  birthday: string | null
  gender: string | null
  gender_custom: string | null

  // Location (Philippines-focused)
  location: string | null
  location_lat: number | null
  location_lng: number | null
  location_city: string | null
  location_province: string | null
  location_country: string | null
  location_barangay: string | null
  location_region: string | null

  // Career Preferences
  position: string | null
  work_status: string | null
  expected_salary_min: number | null
  expected_salary_max: number | null
  preferred_shift: string | null
  preferred_work_setup: string | null
  current_mood: string | null

  // Social Links
  website: string | null
  linkedin: string | null
  github: string | null
  twitter: string | null
  portfolio: string | null
  facebook: string | null

  // Photos
  cover_photo: string | null

  // Completion
  profile_completed: boolean

  // Timestamps
  created_at: string
  updated_at: string
}

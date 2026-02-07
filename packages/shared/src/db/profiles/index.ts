/**
 * Profiles Database Layer
 * ALWAYS uses Supabase - Migration complete
 */
import * as supabase from './queries.supabase'

export type { CandidateProfile } from './types'

// ALWAYS use Supabase - no more Railway
export const getProfileByCandidate = (candidateId: string, useAdmin?: boolean) => supabase.getProfileByCandidate(candidateId, useAdmin)
export const updateProfile = (candidateId: string, data: Parameters<typeof supabase.updateProfile>[1], useAdmin?: boolean) => supabase.updateProfile(candidateId, data, useAdmin)
export const createProfile = (candidateId: string, data: Parameters<typeof supabase.createProfile>[1]) => supabase.createProfile(candidateId, data)


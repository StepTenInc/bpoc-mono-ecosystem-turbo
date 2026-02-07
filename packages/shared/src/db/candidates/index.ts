/**
 * Candidates Database Layer
 * ALWAYS uses Supabase - Migration complete
 */
import * as supabase from './queries.supabase'

export type { Candidate } from './types'

// ALWAYS use Supabase - no more Railway
export const getCandidateById = (id: string, useAdmin?: boolean) => supabase.getCandidateById(id, useAdmin)
export const getCandidateByEmail = (email: string) => supabase.getCandidateByEmail(email)
export const getCandidateByUsername = (username: string) => supabase.getCandidateByUsername(username)
export const getCandidateBySlug = (slug: string) => supabase.getCandidateBySlug(slug)
export const createCandidate = (data: Parameters<typeof supabase.createCandidate>[0]) => supabase.createCandidate(data)
export const updateCandidate = (id: string, data: Parameters<typeof supabase.updateCandidate>[1], useAdmin?: boolean) => supabase.updateCandidate(id, data, useAdmin)
export const deleteCandidate = (id: string) => supabase.deleteCandidate(id)


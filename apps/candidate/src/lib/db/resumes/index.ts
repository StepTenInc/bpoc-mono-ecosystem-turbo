/**
 * Resumes Database Layer
 * ALWAYS uses Supabase - Migration complete
 */
import * as supabase from './queries.supabase'

export type { Resume } from './queries.supabase'

// ALWAYS use Supabase - no more Railway
export const getResumeByCandidateId = (candidateId: string) => supabase.getResumeByCandidateId(candidateId)
export const getResumeBySlug = (slug: string) => supabase.getResumeBySlug(slug)
export const saveResume = (data: Parameters<typeof supabase.saveResume>[0]) => supabase.saveResume(data)
export const deleteResume = (candidateId: string) => supabase.deleteResume(candidateId)



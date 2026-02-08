/**
 * Applications Database Layer
 * ALWAYS uses Supabase - Migration complete
 */
import * as supabase from './queries.supabase'

export type { JobApplication } from './queries.supabase'

// ALWAYS use Supabase - no more Railway
export const getApplicationsByCandidate = (candidateId: string) => supabase.getApplicationsByCandidate(candidateId)
export const getApplicationById = (id: string) => supabase.getApplicationById(id)
export const createApplication = (data: Parameters<typeof supabase.createApplication>[0]) => supabase.createApplication(data)
export const updateApplicationStatus = (id: string, candidateId: string, status: string) => supabase.updateApplicationStatus(id, candidateId, status)



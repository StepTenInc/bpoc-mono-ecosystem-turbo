/**
 * Jobs Database Layer
 * ALWAYS uses Supabase - Migration complete
 */
import * as supabase from './queries.supabase'

export type { Job } from './queries.supabase'

// ALWAYS use Supabase - no more Railway
export const getActiveJobs = () => supabase.getActiveJobs()
export const getJobById = (id: string) => supabase.getJobById(id)
export const getJobBySlug = (slug: string) => supabase.getJobBySlug(slug)
export const getJobsByAgencyClient = (agencyClientId: string) => supabase.getJobsByAgencyClient(agencyClientId)
export const getJobsByRecruiter = (recruiterId: string) => supabase.getJobsByRecruiter(recruiterId)
export const incrementJobViews = (jobId: string) => supabase.incrementJobViews(jobId)


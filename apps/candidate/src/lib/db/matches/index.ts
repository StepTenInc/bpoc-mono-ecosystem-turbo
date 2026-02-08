/**
 * Job Matches Database Layer
 * ALWAYS uses Supabase - Migration complete
 */
import * as supabase from './queries.supabase'

export type { JobMatch } from './queries.supabase'

// ALWAYS use Supabase - no more Railway
export const getMatchesByCandidate = (candidateId: string) => supabase.getMatchesByCandidate(candidateId)
export const getMatchCountByCandidate = (candidateId: string) => supabase.getMatchCountByCandidate(candidateId)



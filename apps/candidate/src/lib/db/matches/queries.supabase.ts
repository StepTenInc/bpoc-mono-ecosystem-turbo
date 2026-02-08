/**
 * Supabase Queries for Job Matches
 * Direct queries to Supabase job_matches table
 */
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface JobMatch {
  id: string
  candidate_id: string
  job_id: string
  match_score: number
  status: string
  viewed_at: string | null
  created_at: string
  updated_at: string
}

export async function getMatchesByCandidate(candidateId: string): Promise<JobMatch[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_matches')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('match_score', { ascending: false })

  if (error || !data) return []

  return data.map(match => ({
    id: match.id,
    candidate_id: match.candidate_id,
    job_id: match.job_id,
    match_score: match.match_score,
    status: match.status,
    viewed_at: match.viewed_at,
    created_at: match.created_at,
    updated_at: match.updated_at,
  }))
}

export async function getMatchCountByCandidate(candidateId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('job_matches')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', candidateId)

  if (error) return 0
  return count || 0
}



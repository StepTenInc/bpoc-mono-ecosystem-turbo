/**
 * Client Access Token Utilities
 *
 * This module provides functions for generating and validating client access tokens
 * for the standard platform (non-enterprise clients).
 *
 * Two token types:
 * 1. Job-level tokens - Persistent dashboard access for entire job
 * 2. Candidate-level tokens - Direct links to individual candidates (optional)
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'crypto'

// Enforce secure token secret in production
if (process.env.CLIENT_TOKEN_SECRET === 'default-secret-change-me') {
  throw new Error(
    'CLIENT_TOKEN_SECRET must be changed from default value. Generate a secure random secret (minimum 32 characters).'
  )
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate a secure 64-character token
 *
 * Format: {32-char random}{32-char hash}
 * - First 32 chars: cryptographically random
 * - Last 32 chars: hash of (entity_id + secret + timestamp) for verification
 */
function generateSecureToken(entityId: string): string {
  const randomPart = randomBytes(16).toString('hex') // 32 chars

  // Hash entityId with secret and timestamp for added security
  const secret = process.env.CLIENT_TOKEN_SECRET || 'default-secret-change-me'
  const timestamp = Date.now().toString()
  const hashInput = `${entityId}:${secret}:${timestamp}`
  const hashPart = createHash('sha256').update(hashInput).digest('hex').substring(0, 32)

  return randomPart + hashPart
}

/**
 * Generate job-level access token
 *
 * @param jobId - UUID of the job
 * @param agencyClientId - UUID of the agency client
 * @param createdBy - UUID of the user creating the token (recruiter)
 * @param expiresAt - Expiration date (null = permanent until job closes)
 * @returns Token data with token string and token ID
 */
export async function generateJobToken(
  jobId: string,
  agencyClientId: string,
  createdBy: string,
  expiresAt: Date | null = null
): Promise<{ token: string; tokenId: string; dashboardUrl: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Generate secure token
  const token = generateSecureToken(`job:${jobId}:${agencyClientId}`)

  // Insert into database
  const { data, error } = await supabase
    .from('client_job_access_tokens')
    .insert({
      job_id: jobId,
      agency_client_id: agencyClientId,
      token,
      expires_at: expiresAt,
      created_by: createdBy,
      can_view_statistics: true,
      can_view_released_candidates: true,
      can_download_resumes: true,
      can_join_interviews: true,
    })
    .select('id, token')
    .single()

  if (error) {
    console.error('Error generating job token:', error)
    throw new Error('Failed to generate job token')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const dashboardUrl = `${baseUrl}/client/jobs/${token}`

  return {
    token: data.token,
    tokenId: data.id,
    dashboardUrl,
  }
}

/**
 * Generate candidate-level access token (optional direct link)
 *
 * @param applicationId - UUID of the job application
 * @param agencyClientId - UUID of the agency client
 * @param jobTokenId - UUID of the parent job token (optional)
 * @param createdBy - UUID of the user creating the token
 * @param expiresInDays - Number of days until expiration (default: 30)
 * @returns Token data with token string and token ID
 */
export async function generateCandidateToken(
  applicationId: string,
  agencyClientId: string,
  createdBy: string,
  jobTokenId?: string,
  expiresInDays: number = 30
): Promise<{ token: string; tokenId: string; candidateUrl: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Generate secure token
  const token = generateSecureToken(`candidate:${applicationId}:${agencyClientId}`)

  // Calculate expiration date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  // Insert into database
  const { data, error } = await supabase
    .from('client_candidate_access_tokens')
    .insert({
      application_id: applicationId,
      agency_client_id: agencyClientId,
      job_access_token_id: jobTokenId,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: createdBy,
      can_view_profile: true,
      can_view_resume: true,
      can_view_timeline: true,
      can_join_interviews: true,
    })
    .select('id, token')
    .single()

  if (error) {
    console.error('Error generating candidate token:', error)
    throw new Error('Failed to generate candidate token')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const candidateUrl = `${baseUrl}/client/candidates/${token}`

  return {
    token: data.token,
    tokenId: data.id,
    candidateUrl,
  }
}

// ============================================
// TOKEN VALIDATION
// ============================================

export interface JobTokenData {
  tokenId: string
  jobId: string
  agencyClientId: string
  canViewStatistics: boolean
  canViewReleasedCandidates: boolean
  canDownloadResumes: boolean
  canJoinInterviews: boolean
  isValid: boolean
}

export interface CandidateTokenData {
  tokenId: string
  applicationId: string
  agencyClientId: string
  canViewProfile: boolean
  canViewResume: boolean
  canViewTimeline: boolean
  canJoinInterviews: boolean
  isValid: boolean
}

/**
 * Validate job-level access token
 *
 * @param token - The token string to validate
 * @returns Token data if valid, null if invalid
 */
export async function validateJobToken(
  token: string
): Promise<JobTokenData | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Use helper function from migration
  const { data, error } = await supabase.rpc('validate_job_token', {
    token_value: token,
  })

  if (error || !data || data.length === 0) {
    return null
  }

  const tokenData = data[0]

  // Check if token is valid
  if (!tokenData.is_valid) {
    return null
  }

  return {
    tokenId: tokenData.token_id,
    jobId: tokenData.job_id,
    agencyClientId: tokenData.agency_client_id,
    canViewStatistics: tokenData.can_view_statistics,
    canViewReleasedCandidates: tokenData.can_view_released_candidates,
    canDownloadResumes: tokenData.can_download_resumes,
    canJoinInterviews: tokenData.can_join_interviews,
    isValid: tokenData.is_valid,
  }
}

/**
 * Validate candidate-level access token
 *
 * @param token - The token string to validate
 * @returns Token data if valid, null if invalid
 */
export async function validateCandidateToken(
  token: string
): Promise<CandidateTokenData | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Use helper function from migration
  const { data, error } = await supabase.rpc('validate_candidate_token', {
    token_value: token,
  })

  if (error || !data || data.length === 0) {
    return null
  }

  const tokenData = data[0]

  // Check if token is valid
  if (!tokenData.is_valid) {
    return null
  }

  return {
    tokenId: tokenData.token_id,
    applicationId: tokenData.application_id,
    agencyClientId: tokenData.agency_client_id,
    canViewProfile: tokenData.can_view_profile,
    canViewResume: tokenData.can_view_resume,
    canViewTimeline: tokenData.can_view_timeline,
    canJoinInterviews: tokenData.can_join_interviews,
    isValid: tokenData.is_valid,
  }
}

// ============================================
// ACCESS LOGGING
// ============================================

export interface LogAccessOptions {
  jobTokenId?: string
  candidateTokenId?: string
  action: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log client access event
 *
 * @param options - Access log options
 */
export async function logClientAccess(options: LogAccessOptions): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.from('client_access_log').insert({
    job_token_id: options.jobTokenId,
    candidate_token_id: options.candidateTokenId,
    action: options.action,
    action_metadata: options.metadata || {},
    ip_address: options.ipAddress,
    user_agent: options.userAgent,
  })

  if (error) {
    console.error('Error logging client access:', error)
    // Don't throw - logging failures shouldn't break the app
  }
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

/**
 * Revoke job token
 *
 * @param tokenId - UUID of the token to revoke
 * @param reason - Reason for revocation
 */
export async function revokeJobToken(
  tokenId: string,
  reason: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('client_job_access_tokens')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
    })
    .eq('id', tokenId)

  return !error
}

/**
 * Revoke candidate token
 *
 * @param tokenId - UUID of the token to revoke
 * @param reason - Reason for revocation
 */
export async function revokeCandidateToken(
  tokenId: string,
  reason: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('client_candidate_access_tokens')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
    })
    .eq('id', tokenId)

  return !error
}

/**
 * Extend job token expiration
 *
 * @param tokenId - UUID of the token to extend
 * @param newExpiresAt - New expiration date (null = permanent)
 */
export async function extendJobToken(
  tokenId: string,
  newExpiresAt: Date | null
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('client_job_access_tokens')
    .update({
      expires_at: newExpiresAt ? newExpiresAt.toISOString() : null,
    })
    .eq('id', tokenId)

  return !error
}

/**
 * Extend candidate token expiration
 *
 * @param tokenId - UUID of the token to extend
 * @param additionalDays - Number of days to add to current expiration
 */
export async function extendCandidateToken(
  tokenId: string,
  additionalDays: number = 30
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get current expiration
  const { data: tokenData } = await supabase
    .from('client_candidate_access_tokens')
    .select('expires_at')
    .eq('id', tokenId)
    .single()

  if (!tokenData) {
    return false
  }

  const currentExpiry = new Date(tokenData.expires_at)
  const newExpiry = new Date(currentExpiry)
  newExpiry.setDate(newExpiry.getDate() + additionalDays)

  const { error } = await supabase
    .from('client_candidate_access_tokens')
    .update({
      expires_at: newExpiry.toISOString(),
    })
    .eq('id', tokenId)

  return !error
}

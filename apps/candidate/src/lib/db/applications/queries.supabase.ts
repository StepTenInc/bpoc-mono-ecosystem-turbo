/**
 * Supabase Queries for Job Applications
 * Direct queries to Supabase job_applications table
 */
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface JobApplication {
  id: string
  candidate_id: string
  job_id: string
  resume_id: string | null
  status: string

  // Core fields
  position: number
  reviewed_by: string | null
  reviewed_at: string | null
  recruiter_notes: string | null

  // Recruiter pre-screening
  recruiter_prescreen_video_url?: string | null
  recruiter_prescreen_transcript?: string | null
  recruiter_prescreen_rating?: number | null
  recruiter_prescreen_notes?: string | null
  recruiter_prescreen_date?: string | null
  recruiter_prescreen_status?: string | null
  recruiter_prescreen_screened_by?: string | null

  // Client notes & feedback
  client_notes?: string | null
  client_rating?: number | null

  // Rejection data
  rejection_reason?: string | null
  rejected_by?: string | null
  rejected_date?: string | null

  // Hired/Started tracking
  offer_acceptance_date?: string | null
  contract_signed?: boolean
  first_day_date?: string | null
  started_status?: string | null

  // Legacy fields (for backward compatibility)
  cover_letter?: string | null
  notes?: string | null
  applied_at?: string

  // Timestamps
  created_at: string
  updated_at: string
}

export async function getApplicationsByCandidate(candidateId: string): Promise<JobApplication[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(app => ({
    id: app.id,
    candidate_id: app.candidate_id,
    job_id: app.job_id,
    resume_id: app.resume_id,
    status: app.status,
    position: app.position || 0,
    reviewed_by: app.reviewed_by || null,
    reviewed_at: app.reviewed_at || null,
    recruiter_notes: app.recruiter_notes || null,
    recruiter_prescreen_video_url: app.recruiter_prescreen_video_url || null,
    recruiter_prescreen_transcript: app.recruiter_prescreen_transcript || null,
    recruiter_prescreen_rating: app.recruiter_prescreen_rating || null,
    recruiter_prescreen_notes: app.recruiter_prescreen_notes || null,
    recruiter_prescreen_date: app.recruiter_prescreen_date || null,
    recruiter_prescreen_status: app.recruiter_prescreen_status || null,
    recruiter_prescreen_screened_by: app.recruiter_prescreen_screened_by || null,
    client_notes: app.client_notes || null,
    client_rating: app.client_rating || null,
    // tags removed (notes + rating only)
    rejection_reason: app.rejection_reason || null,
    rejected_by: app.rejected_by || null,
    rejected_date: app.rejected_date || null,
    offer_acceptance_date: app.offer_acceptance_date || null,
    contract_signed: app.contract_signed || false,
    first_day_date: app.first_day_date || null,
    started_status: app.started_status || null,
    cover_letter: app.cover_letter || null,
    notes: app.notes || null,
    applied_at: app.applied_at || app.created_at,
    created_at: app.created_at,
    updated_at: app.updated_at,
  }))
}

export async function getApplicationById(id: string): Promise<JobApplication | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    candidate_id: data.candidate_id,
    job_id: data.job_id,
    resume_id: data.resume_id,
    status: data.status,
    position: data.position || 0,
    reviewed_by: data.reviewed_by || null,
    reviewed_at: data.reviewed_at || null,
    recruiter_notes: data.recruiter_notes || null,
    recruiter_prescreen_video_url: data.recruiter_prescreen_video_url || null,
    recruiter_prescreen_transcript: data.recruiter_prescreen_transcript || null,
    recruiter_prescreen_rating: data.recruiter_prescreen_rating || null,
    recruiter_prescreen_notes: data.recruiter_prescreen_notes || null,
    recruiter_prescreen_date: data.recruiter_prescreen_date || null,
    recruiter_prescreen_status: data.recruiter_prescreen_status || null,
    recruiter_prescreen_screened_by: data.recruiter_prescreen_screened_by || null,
    client_notes: data.client_notes || null,
    client_rating: data.client_rating || null,
    // tags removed (notes + rating only)
    rejection_reason: data.rejection_reason || null,
    rejected_by: data.rejected_by || null,
    rejected_date: data.rejected_date || null,
    offer_acceptance_date: data.offer_acceptance_date || null,
    contract_signed: data.contract_signed || false,
    first_day_date: data.first_day_date || null,
    started_status: data.started_status || null,
    cover_letter: data.cover_letter || null,
    notes: data.notes || null,
    applied_at: data.applied_at || data.created_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function createApplication(data: {
  candidate_id: string
  job_id: string
  resume_id?: string | null
  cover_letter?: string | null
}): Promise<JobApplication> {
  // Check if application already exists
  const existing = await supabaseAdmin
    .from('job_applications')
    .select('id')
    .eq('candidate_id', data.candidate_id)
    .eq('job_id', data.job_id)
    .single()

  if (existing.data) {
    throw new Error('You have already applied to this job')
  }

  const { data: application, error } = await supabaseAdmin
    .from('job_applications')
    .insert({
      candidate_id: data.candidate_id,
      job_id: data.job_id,
      resume_id: data.resume_id || null,
      cover_letter: data.cover_letter || null,
      status: 'submitted',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id: application.id,
    candidate_id: application.candidate_id,
    job_id: application.job_id,
    resume_id: application.resume_id,
    status: application.status,
    position: application.position || 0,
    reviewed_by: application.reviewed_by || null,
    reviewed_at: application.reviewed_at || null,
    recruiter_notes: application.recruiter_notes || null,
    cover_letter: application.cover_letter,
    notes: application.notes,
    applied_at: application.applied_at,
    created_at: application.created_at,
    updated_at: application.updated_at,
  }
}

export async function updateApplicationStatus(
  id: string,
  candidateId: string,
  status: string
): Promise<JobApplication | null> {
  const supabase = await createClient()

  // Verify ownership
  const existing = await getApplicationById(id)
  if (!existing || existing.candidate_id !== candidateId) {
    throw new Error('Application not found or access denied')
  }

  // Validate status transition
  if (existing.status === 'withdrawn') {
    throw new Error('Application is already withdrawn')
  }
  if (existing.status === 'hired') {
    throw new Error('Cannot withdraw a hired application')
  }
  if (existing.status === 'rejected') {
    throw new Error('Cannot withdraw a rejected application')
  }

  const { data, error } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) return null

  return getApplicationById(id)
}

/**
 * Update recruiter pre-screening data
 */
export async function updateRecruiterPrescreen(
  applicationId: string,
  data: {
    video_url?: string
    transcript?: string
    rating?: number
    notes?: string
    status?: 'pending' | 'completed' | 'rejected'
    screened_by?: string
  }
): Promise<JobApplication | null> {
  // Legacy endpoint: prescreen data now lives on video_call_rooms + recordings + transcripts.
  // We map prescreen "notes/rating/status" to the most recent recruiter_prescreen room.
  const { data: room } = await supabaseAdmin
    .from('video_call_rooms')
    .select('id')
    .eq('application_id', applicationId)
    .eq('call_type', 'recruiter_prescreen')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!room?.id) {
    console.warn('[updateRecruiterPrescreen] No recruiter_prescreen room found for application', applicationId)
    return getApplicationById(applicationId)
  }

  const roomUpdate: any = {}
  if (data.notes !== undefined) roomUpdate.notes = data.notes
  if (data.rating !== undefined) roomUpdate.rating = data.rating
  if (data.status !== undefined) {
    // Best-effort mapping. Daily uses created/in_progress/ended; keep our outcome for legacy status.
    if (data.status === 'rejected') roomUpdate.outcome = 'rejected'
    if (data.status === 'completed') roomUpdate.outcome = 'completed'
  }
  // Preserve legacy video_url/transcript in room.description (best-effort) so data isn't lost.
  if (data.video_url || data.transcript) {
    const parts: string[] = []
    if (data.video_url) parts.push(`legacy_video_url=${data.video_url}`)
    if (data.transcript) parts.push(`legacy_transcript=${data.transcript}`)
    roomUpdate.description = parts.join('\n')
  }

  const { error } = await supabaseAdmin
    .from('video_call_rooms')
    .update(roomUpdate)
    .eq('id', room.id)

  if (error) {
    console.error('[updateRecruiterPrescreen] Failed to update room:', error)
    return null
  }

  return getApplicationById(applicationId)
}

/**
 * Update client notes and rating
 */
export async function updateClientFeedback(
  applicationId: string,
  data: {
    notes?: string
    rating?: number
  }
): Promise<{ application_id: string; notes: string | null; rating: number | null } | null> {
  try {
    const now = new Date().toISOString()
    const payload: any = {
      application_id: applicationId,
      updated_at: now,
    }
    if (data.notes !== undefined) payload.notes = data.notes
    if (data.rating !== undefined) payload.rating = data.rating

    const { data: updated, error } = await supabaseAdmin
      .from('application_client_feedback')
      .upsert(payload, { onConflict: 'application_id' })
      .select('application_id, notes, rating')
      .single()

    if (error || !updated) {
      console.error('[updateClientFeedback] Error upserting application_client_feedback:', error)
      return null
    }

    return {
      application_id: updated.application_id,
      notes: updated.notes ?? null,
      rating: updated.rating ?? null,
    }
  } catch (error) {
    console.error('[updateClientFeedback] Unexpected error:', error)
    return null
  }
}


/**
 * Update rejection data
 */
export async function updateRejection(
  applicationId: string,
  data: {
    reason: string
    rejected_by: 'client' | 'recruiter'
    rejected_by_id?: string
  }
): Promise<JobApplication | null> {
  const updateData: any = {
    status: 'rejected',
    rejection_reason: data.reason,
    rejected_by: data.rejected_by,
    rejected_date: new Date().toISOString(),
  }

  if (data.rejected_by === 'recruiter' && data.rejected_by_id) {
    updateData.reviewed_by = data.rejected_by_id
    updateData.reviewed_at = new Date().toISOString()
  }

  const { data: updatedRow, error } = await supabaseAdmin
    .from('job_applications')
    .update(updateData)
    .eq('id', applicationId)
    .select('*')
    .single()

  if (error || !updatedRow) {
    console.error('Error updating rejection:', error)
    throw new Error(error?.message || 'Failed to update rejection')
  }

  // IMPORTANT:
  // This is used by server APIs that run with admin privileges.
  // Do NOT call getApplicationById() here because it uses a user-scoped client (RLS)
  // and can return null even when the update succeeded, causing false "Failed" responses.
  return updatedRow as JobApplication
}

/**
 * Update hired/started status
 */
export async function updateHiredStatus(
  applicationId: string,
  data: {
    offer_acceptance_date?: string
    contract_signed?: boolean
    first_day_date?: string
    started_status?: 'hired' | 'started' | 'no_show'
  }
): Promise<JobApplication | null> {
  const updateData: any = {}

  if (data.offer_acceptance_date !== undefined) updateData.offer_acceptance_date = data.offer_acceptance_date
  if (data.contract_signed !== undefined) updateData.contract_signed = data.contract_signed
  if (data.first_day_date !== undefined) updateData.first_day_date = data.first_day_date
  if (data.started_status !== undefined) {
    updateData.started_status = data.started_status
    if (data.started_status === 'hired') {
      updateData.status = 'hired'
    }
  }

  const { error } = await supabaseAdmin
    .from('job_applications')
    .update(updateData)
    .eq('id', applicationId)

  if (error) {
    console.error('Error updating hired status:', error)
    return null
  }

  return getApplicationById(applicationId)
}

/**
 * Get activity timeline for an application
 */
export async function getApplicationActivityTimeline(applicationId: string) {
  const { data, error } = await supabaseAdmin
    .from('application_activity_timeline')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activity timeline:', error)
    return []
  }

  return data || []
}

/**
 * Manually log an activity (for custom events)
 */
export async function logApplicationActivity(
  applicationId: string,
  data: {
    action_type: string
    performed_by_type: 'candidate' | 'recruiter' | 'client' | 'system'
    performed_by_id?: string
    description: string
    metadata?: Record<string, any>
  }
) {
  const { error } = await supabaseAdmin
    .from('application_activity_timeline')
    .insert({
      application_id: applicationId,
      action_type: data.action_type,
      performed_by_type: data.performed_by_type,
      performed_by_id: data.performed_by_id || null,
      description: data.description,
      metadata: data.metadata || {},
    })

  if (error) {
    console.error('Error logging activity:', error)
    throw new Error(error.message)
  }
}



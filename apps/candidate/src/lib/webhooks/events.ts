/**
 * Webhook Event Helpers
 *
 * Simple functions to trigger webhooks for common events.
 * Import and call these in your API routes when events occur.
 */

import { triggerWebhook } from './delivery';

/**
 * Application Events
 */

export async function webhookApplicationCreated(data: {
  applicationId: string;
  jobId: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  agencyId: string;
}) {
  await triggerWebhook('application.created', {
    applicationId: data.applicationId,
    jobId: data.jobId,
    candidateId: data.candidateId,
    candidateName: data.candidateName,
    candidateEmail: data.candidateEmail,
    jobTitle: data.jobTitle,
  }, data.agencyId);
}

export async function webhookApplicationStatusChanged(data: {
  applicationId: string;
  jobId: string;
  candidateId: string;
  oldStatus: string;
  newStatus: string;
  changedBy?: string;
  agencyId: string;
}) {
  await triggerWebhook('application.status_changed', {
    applicationId: data.applicationId,
    jobId: data.jobId,
    candidateId: data.candidateId,
    oldStatus: data.oldStatus,
    newStatus: data.newStatus,
    changedBy: data.changedBy,
  }, data.agencyId);
}

/**
 * Interview Events
 */

export async function webhookInterviewScheduled(data: {
  interviewId: string;
  applicationId: string;
  candidateId: string;
  scheduledAt: string;
  interviewType: string;
  meetingLink?: string;
  agencyId: string;
}) {
  await triggerWebhook('interview.scheduled', {
    interviewId: data.interviewId,
    applicationId: data.applicationId,
    candidateId: data.candidateId,
    scheduledAt: data.scheduledAt,
    interviewType: data.interviewType,
    meetingLink: data.meetingLink,
  }, data.agencyId);
}

export async function webhookInterviewCompleted(data: {
  interviewId: string;
  applicationId: string;
  candidateId: string;
  duration?: number;
  outcome?: string;
  rating?: number;
  agencyId: string;
}) {
  await triggerWebhook('interview.completed', {
    interviewId: data.interviewId,
    applicationId: data.applicationId,
    candidateId: data.candidateId,
    duration: data.duration,
    outcome: data.outcome,
    rating: data.rating,
  }, data.agencyId);
}

/**
 * Offer Events
 */

export async function webhookOfferSent(data: {
  offerId: string;
  applicationId: string;
  candidateId: string;
  salaryOffered: number;
  currency: string;
  startDate?: string;
  agencyId: string;
}) {
  await triggerWebhook('offer.sent', {
    offerId: data.offerId,
    applicationId: data.applicationId,
    candidateId: data.candidateId,
    salaryOffered: data.salaryOffered,
    currency: data.currency,
    startDate: data.startDate,
  }, data.agencyId);
}

export async function webhookOfferAccepted(data: {
  offerId: string;
  applicationId: string;
  candidateId: string;
  acceptedAt: string;
  agencyId: string;
}) {
  await triggerWebhook('offer.accepted', {
    offerId: data.offerId,
    applicationId: data.applicationId,
    candidateId: data.candidateId,
    acceptedAt: data.acceptedAt,
  }, data.agencyId);
}

export async function webhookOfferRejected(data: {
  offerId: string;
  applicationId: string;
  candidateId: string;
  rejectedAt: string;
  reason?: string;
  agencyId: string;
}) {
  await triggerWebhook('offer.rejected', {
    offerId: data.offerId,
    applicationId: data.applicationId,
    candidateId: data.candidateId,
    rejectedAt: data.rejectedAt,
    reason: data.reason,
  }, data.agencyId);
}

/**
 * Video Events
 */

export async function webhookVideoRecordingReady(data: {
  recordingId: string;
  roomId: string;
  applicationId: string;
  downloadUrl?: string;
  playbackUrl?: string;
  duration?: number;
  agencyId: string;
}) {
  await triggerWebhook('video.recording.ready', {
    recordingId: data.recordingId,
    roomId: data.roomId,
    applicationId: data.applicationId,
    downloadUrl: data.downloadUrl,
    playbackUrl: data.playbackUrl,
    duration: data.duration,
  }, data.agencyId);
}

export async function webhookVideoTranscriptCompleted(data: {
  transcriptId: string;
  recordingId: string;
  roomId: string;
  applicationId: string;
  summary?: string;
  agencyId: string;
}) {
  await triggerWebhook('video.transcript.completed', {
    transcriptId: data.transcriptId,
    recordingId: data.recordingId,
    roomId: data.roomId,
    applicationId: data.applicationId,
    summary: data.summary,
  }, data.agencyId);
}

/**
 * Placement Events
 */

export async function webhookPlacementCreated(data: {
  placementId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  startDate: string;
  salary?: number;
  agencyId: string;
}) {
  await triggerWebhook('placement.created', {
    placementId: data.placementId,
    applicationId: data.applicationId,
    candidateId: data.candidateId,
    jobId: data.jobId,
    startDate: data.startDate,
    salary: data.salary,
  }, data.agencyId);
}

/**
 * Example Integration
 *
 * In your API routes:
 *
 * ```typescript
 * import { webhookApplicationCreated } from '@/lib/webhooks/events';
 *
 * // After creating an application
 * const application = await createApplication(...);
 *
 * // Get agency ID from job
 * const { data: job } = await supabase
 *   .from('jobs')
 *   .select('agency_clients!inner(agency_id)')
 *   .eq('id', jobId)
 *   .single();
 *
 * // Trigger webhook (async, doesn't block response)
 * webhookApplicationCreated({
 *   applicationId: application.id,
 *   jobId: jobId,
 *   candidateId: application.candidate_id,
 *   candidateName: `${candidate.first_name} ${candidate.last_name}`,
 *   candidateEmail: candidate.email,
 *   jobTitle: job.title,
 *   agencyId: job.agency_clients.agency_id,
 * }).catch(err => console.error('Webhook error:', err));
 * ```
 */

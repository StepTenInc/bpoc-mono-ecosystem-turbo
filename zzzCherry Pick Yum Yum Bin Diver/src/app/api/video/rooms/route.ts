/**
 * Video Call Rooms API
 * POST - Create a new video call room
 * GET - Get active rooms for the user
 * 
 * IMPORTANT: All columns in video_call_rooms and video_call_invitations should be populated!
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { 
  createDailyRoom, 
  createMeetingToken, 
  generateMeaningfulRoomName,
  calculateRoomExpiration 
} from '@/lib/daily';

// Call type display names - RECRUITER & CLIENT categories
const CALL_TYPE_LABELS: Record<string, string> = {
  // RECRUITER-LED (BPOC Internal)
  recruiter_prescreen: 'Pre-Screen',
  recruiter_round_1: 'Round 1 Interview',
  recruiter_round_2: 'Round 2 Interview',
  recruiter_round_3: 'Round 3 Interview',
  recruiter_offer: 'Offer Discussion',
  recruiter_general: 'General Call',
  // CLIENT-LED (Client's Process)
  client_round_1: 'Client Round 1',
  client_round_2: 'Client Round 2',
  client_final: 'Client Final Interview',
  client_general: 'Client Call',
  // Legacy support
  prescreen: 'Pre-Screen',
  round_1: 'Round 1 Interview',
  round_2: 'Round 2 Interview',
  round_3: 'Round 3 Interview',
  final_interview: 'Final Interview',
  offer_call: 'Offer Discussion',
  general: 'General Call',
};

/**
 * Generate a logical call title based on context
 * Format: "{CallType} - {HostName} → {ParticipantName}" or with job title
 */
function generateCallTitle(
  callType: string, 
  hostName: string, 
  participantName: string,
  jobTitle?: string
): string {
  const typeLabel = CALL_TYPE_LABELS[callType] || 'Call';
  
  if (jobTitle) {
    return `${typeLabel}: ${participantName} - ${jobTitle}`;
  }
  
  return `${typeLabel}: ${hostName} → ${participantName}`;
}

/**
 * Generate call description
 */
function generateCallDescription(
  callType: string,
  hostName: string,
  participantName: string,
  jobTitle?: string
): string {
  const typeLabel = CALL_TYPE_LABELS[callType] || 'Call';
  
  let desc = `${typeLabel} between ${hostName} (Recruiter) and ${participantName} (Candidate)`;
  if (jobTitle) {
    desc += ` regarding ${jobTitle} position`;
  }
  
  return desc;
}

// POST - Create a new video call room
export async function POST(request: NextRequest) {
  console.log('📹 [video/rooms POST] Request received');
  
  try {
    const { userId, error: authError } = await verifyAuthToken(request);
    
    console.log('📹 [video/rooms POST] Auth result:', { 
      hasUserId: !!userId, 
      userId: userId?.substring(0, 8) + '...',
      authError 
    });

    if (!userId) {
      console.log('❌ [video/rooms POST] Unauthorized - no userId');
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      participantUserId, 
      participantName,
      participantEmail,
      jobId, 
      applicationId, 
      interviewId,
      // Call type fields
      callType = 'recruiter_general', // recruiter_prescreen, recruiter_round_1, client_round_1, client_final, etc.
      callMode = 'video',   // video, phone, audio_only
      title,                // Optional custom title
      description,          // Optional custom description
      // Recording settings
      enableRecording = true,
      enableTranscription = true,
      // Additional context
      jobTitle,             // Job title if related to a position
    } = body;

    // Log received call type for debugging
    console.log('📹 [video/rooms POST] Call type received:', { 
      callType, 
      callMode,
      fromBody: body.callType,
    });

    // Validate call type - new RECRUITER & CLIENT types + legacy support
    const validCallTypes = [
      // New types
      'recruiter_prescreen', 'recruiter_round_1', 'recruiter_round_2', 'recruiter_round_3', 'recruiter_offer', 'recruiter_general',
      'client_round_1', 'client_round_2', 'client_final', 'client_general',
      // Legacy support
      'prescreen', 'round_1', 'round_2', 'round_3', 'final_interview', 'offer_call', 'general',
    ];
    if (!validCallTypes.includes(callType)) {
      console.warn('⚠️ [video/rooms POST] Invalid call type:', callType);
      return NextResponse.json({ error: 'Invalid call type' }, { status: 400 });
    }

    if (!participantUserId) {
      return NextResponse.json({ error: 'Participant user ID is required' }, { status: 400 });
    }

    // Get host (recruiter) details
    let hostName = 'Recruiter';
    let hostEmail = '';
    let agencyId: string | null = null;

    // Prefer agency_recruiters for recruiter identity (auth user_id → recruiter row)
    const { data: recruiterRow } = await supabaseAdmin
      .from('agency_recruiters')
      .select('first_name, last_name, email, agency_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (recruiterRow) {
      hostName = `${(recruiterRow as any).first_name || ''} ${(recruiterRow as any).last_name || ''}`.trim() || hostName;
      hostEmail = (recruiterRow as any).email || hostEmail;
      agencyId = (recruiterRow as any).agency_id || null;
    } else {
      // Then try user_profiles
      const { data: hostUserProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('full_name, first_name, last_name, email')
        .eq('user_id', userId)
        .maybeSingle();
      if (hostUserProfile) {
        hostName =
          (hostUserProfile as any).full_name ||
          `${(hostUserProfile as any).first_name || ''} ${(hostUserProfile as any).last_name || ''}`.trim() ||
          hostName;
        hostEmail = (hostUserProfile as any).email || hostEmail;
      }
    }

    // Get participant name if not provided
    let finalParticipantName = participantName || 'Candidate';
    let finalParticipantEmail = participantEmail || '';
    
    if (!participantName || !participantEmail) {
      const { data: participantProfile } = await supabaseAdmin
        .from('candidates')
        .select('first_name, last_name, email')
        .eq('id', participantUserId)
        .single();
      
      if (participantProfile) {
        if (!participantName) {
          finalParticipantName = `${participantProfile.first_name || ''} ${participantProfile.last_name || ''}`.trim() || 'Candidate';
        }
        if (!participantEmail) {
          finalParticipantEmail = participantProfile.email || '';
        }
      }
    }

    // Generate logical title and description
    const callTitle = title || generateCallTitle(callType, hostName, finalParticipantName, jobTitle);
    const callDescription = description || generateCallDescription(callType, hostName, finalParticipantName, jobTitle);
    
    console.log('📹 [video/rooms POST] Call info:', {
      callType,
      callTitle,
      hostName,
      participantName: finalParticipantName,
      agencyId,
    });

    // Create Daily.co room with meaningful name
    // e.g., "prescreen-john-dec19-x7k2" instead of "interview-lv4x2k-abc123"
    const roomName = generateMeaningfulRoomName({
      callType,
      participantName: finalParticipantName,
      hostName,
    });
    const dailyRoom = await createDailyRoom({
      name: roomName,
      privacy: 'private',
      properties: {
        exp: calculateRoomExpiration(3), // 3 hours
        max_participants: 10,
        enable_chat: true,
        enable_screenshare: true,
        enable_recording: enableRecording ? 'cloud' : undefined,
        enable_prejoin_ui: false,
        enable_knocking: false,
      },
    });

    const hostDisplayName = hostName ? `${hostName} — Recruiter` : 'Recruiter';
    const candidateDisplayName = finalParticipantName ? `${finalParticipantName} — Candidate` : 'Candidate';

    // Create host token (with owner privileges)
    const hostToken = await createMeetingToken({
      roomName: dailyRoom.name,
      userId: userId,
      userName: hostDisplayName,
      isOwner: true,
      enableRecording: enableRecording,
      enableScreenShare: true,
    });

    // Create participant token
    const participantToken = await createMeetingToken({
      roomName: dailyRoom.name,
      userId: participantUserId,
      userName: candidateDisplayName,
      isOwner: false,
      enableRecording: false, // Only host can control recording
      enableScreenShare: true,
    });

    // Save room to database with ALL columns populated
    let roomRecord: any = null;
    let roomError: any = null;

    // Full insert with ALL columns
    const fullInsert: Record<string, any> = {
      // Daily.co room info
      daily_room_name: dailyRoom.name,
      daily_room_url: dailyRoom.url,
      daily_room_token: hostToken,
      
      // Participants - IDs
      host_user_id: userId,
      participant_user_id: participantUserId,
      
      // Participants - Names & Email (for display/logging)
      host_name: hostName,
      participant_name: finalParticipantName,
      participant_email: finalParticipantEmail || null,
      
      // Interview context
      job_id: jobId || null,
      application_id: applicationId || null,
      interview_id: interviewId || null,
      
      // Agency context - IMPORTANT for multi-tenant
      agency_id: agencyId,
      
      // Call type info - from dropdown selection
      call_type: callType,
      call_mode: callMode,
      title: callTitle,
      description: callDescription,
      
      // Status
      status: 'created',
      
      // Recording settings
      enable_recording: enableRecording,
      enable_transcription: enableTranscription,
    };

    // Base insert (fallback if new columns don't exist)
    // IMPORTANT: Include call_type here so it's always saved!
    const baseInsert: Record<string, any> = {
        daily_room_name: dailyRoom.name,
        daily_room_url: dailyRoom.url,
        daily_room_token: hostToken,
        host_user_id: userId,
        participant_user_id: participantUserId,
        job_id: jobId || null,
        application_id: applicationId || null,
        interview_id: interviewId || null,
        status: 'created',
        enable_recording: enableRecording,
        enable_transcription: enableTranscription,
        // CALL TYPE - must be in base insert!
        call_type: callType,
    };

    // First attempt: insert with ALL columns
    {
      const res = await supabaseAdmin
        .from('video_call_rooms')
        .insert(fullInsert)
        .select()
        .single();
      roomRecord = res.data;
      roomError = res.error;
    }

    // Fallback: retry insert without new fields.
    // We do this when migrations aren't applied (missing columns), but also as a
    // defensive fallback when *any* insert error occurs (we want a DB row so
    // invitations/recordings/transcripts work reliably).
    if (roomError) {
      const msg = String((roomError as any)?.message || roomError);
      const looksLikeMissingColumn =
        msg.toLowerCase().includes('column') &&
        (msg.includes('call_type') || msg.includes('call_mode') || msg.includes('title'));

      console.warn('⚠️ [video/rooms POST] Insert with call meta failed', {
        looksLikeMissingColumn,
        message: msg,
      });

      const res2 = await supabaseAdmin
        .from('video_call_rooms')
        .insert(baseInsert)
      .select()
      .single();
      roomRecord = res2.data;
      roomError = res2.error;
    }

    if (roomError) {
      console.error('❌ [video/rooms POST] Failed to save room (even after fallback):', roomError);
      // Still return the Daily room info so the call can proceed,
      // BUT note: without a DB row we cannot create invitations/recordings reliably.
    } else {
      console.log('✅ [video/rooms POST] Saved room to DB:', { id: roomRecord?.id });
    }

    // Create invitation for participant - populate ALL columns
    const inviteToken = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    
    if (roomRecord) {
      // Some environments may not have newer invitation columns applied yet.
      // Try full insert first, then fall back to base columns if it fails.
      const invitationBase: Record<string, any> = {
        // Room reference
          room_id: roomRecord.id,

        // Recipient info
          invitee_user_id: participantUserId,
        invitee_email: finalParticipantEmail || null,

        // Invitation details
          invite_token: inviteToken,
          join_url: `${dailyRoom.url}?t=${participantToken}`,

        // Status
          status: 'pending',

        // Notification tracking
        notification_sent: true,
        notification_sent_at: now,
          notification_type: 'in_app',

        // Expiration
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      const invitationFull: Record<string, any> = {
        ...invitationBase,
        // Inviter info (the recruiter making the call)
        inviter_user_id: userId,
        inviter_name: hostName,

        // Call context
        call_type: callType,
        call_title: callTitle,
      };

      console.log('📨 [video/rooms POST] Creating invitation:', {
        room_id: roomRecord.id,
        invitee_user_id: participantUserId,
        invitee_email: finalParticipantEmail,
      });

      const resInvite1 = await supabaseAdmin.from('video_call_invitations').insert(invitationFull).select();
      if (resInvite1.error) {
        const msg = String((resInvite1.error as any)?.message || resInvite1.error);
        const code = (resInvite1.error as any)?.code;
        console.warn('⚠️ [video/rooms POST] Invitation insert (full) failed, retrying base', { 
          message: msg, 
          code,
          details: (resInvite1.error as any)?.details,
        });

        const resInvite2 = await supabaseAdmin.from('video_call_invitations').insert(invitationBase).select();
        if (resInvite2.error) {
          console.error('❌ [video/rooms POST] Failed to create invitation (even after fallback):', {
            message: String((resInvite2.error as any)?.message || resInvite2.error),
            code: (resInvite2.error as any)?.code,
            details: (resInvite2.error as any)?.details,
          });
        } else {
          console.log('✅ [video/rooms POST] Invitation created (fallback) for:', finalParticipantName, resInvite2.data);
        }
      } else {
        console.log('✅ [video/rooms POST] Invitation created for:', finalParticipantName, resInvite1.data);
      }

      // Create participant rows immediately (do NOT rely on Daily participant webhooks or /join being called).
      // This guarantees the DB has the right identities from the invite payload.
      try {
        const nowIso = now;
        const hostParticipant = {
          room_id: roomRecord.id,
          user_id: userId,
          email: hostEmail || null,
          name: hostName || 'Recruiter',
          role: 'host',
          status: 'invited',
          invited_at: nowIso,
          updated_at: nowIso,
        };
        const candidateParticipant = {
          room_id: roomRecord.id,
          user_id: participantUserId,
          email: finalParticipantEmail || null,
          name: finalParticipantName || 'Candidate',
          role: 'candidate',
          status: 'invited',
          invited_at: nowIso,
          join_url: `${dailyRoom.url}?t=${participantToken}`,
          daily_token: participantToken,
          updated_at: nowIso,
        };

        const up = await supabaseAdmin
          .from('video_call_participants')
          .upsert([hostParticipant, candidateParticipant], { onConflict: 'room_id,user_id' });
        if (up.error) {
          console.warn('[video/rooms POST] Participant upsert failed (non-fatal), attempting insert:', up.error.message);
          const ins = await supabaseAdmin.from('video_call_participants').insert([hostParticipant, candidateParticipant]);
          if (ins.error) console.warn('[video/rooms POST] Participant insert also failed (non-fatal):', ins.error.message);
        }
      } catch (e) {
        console.warn('[video/rooms POST] Failed to create participant rows (non-fatal):', e);
      }
    }

    // Check if invitation was created by querying back
    let invitationCreated = false;
    if (roomRecord?.id) {
      const { data: invCheck } = await supabaseAdmin
        .from('video_call_invitations')
        .select('id')
        .eq('room_id', roomRecord.id)
        .single();
      invitationCreated = !!invCheck;
      console.log('📨 [video/rooms POST] Invitation check:', { invitationCreated, invCheckId: invCheck?.id });
    }

    return NextResponse.json({
      success: true,
      room: {
        id: roomRecord?.id,
        name: dailyRoom.name,
        url: dailyRoom.url,
        hostToken,
        participantToken,
        inviteToken,
        // Include call info
        callType,
        callTypeLabel: CALL_TYPE_LABELS[callType],
        callMode,
        title: callTitle,
      },
      db: {
        saved: !!roomRecord?.id,
        invitationCreated,
        // Safe to return message only (no secrets)
        error: roomError ? String((roomError as any)?.message || roomError) : null,
      },
    });

  } catch (error) {
    console.error('Video room creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create video room' },
      { status: 500 }
    );
  }
}

// GET - Get user's active video rooms
export async function GET(request: NextRequest) {
  console.log('📹 [video/rooms GET] Request received');
  
  try {
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      console.log('❌ [video/rooms GET] Unauthorized - no userId');
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'ended', or null for all

    // Recruiter visibility:
    // - Normal users (candidates) can only see rooms where they are host/participant.
    // - Recruiters should also see agency-hosted rooms (host_user_id == agency_id) and, in practice,
    //   all rooms within their agency so recordings/transcripts work for client interviews too.
    let recruiterAgencyId: string | null = null;
    try {
      const { data: recruiterRow } = await supabaseAdmin
        .from('agency_recruiters')
        .select('agency_id')
        .eq('user_id', userId)
        .maybeSingle();
      recruiterAgencyId = (recruiterRow as any)?.agency_id || null;
    } catch {
      recruiterAgencyId = null;
    }

    const baseOr = `host_user_id.eq.${userId},participant_user_id.eq.${userId}`;
    const orFilter = recruiterAgencyId ? `${baseOr},agency_id.eq.${recruiterAgencyId}` : baseOr;

    // First try with jobs join - may fail if foreign key doesn't exist
    let query = supabaseAdmin
      .from('video_call_rooms')
      .select(`
        *,
        video_call_invitations(*)
      `)
      .or(orFilter)
      .order('created_at', { ascending: false });

    if (status === 'active') {
      query = query.in('status', ['created', 'waiting', 'active']);
    } else if (status === 'ended') {
      query = query.eq('status', 'ended');
    }

    const { data: rooms, error } = await query.limit(50);

    if (error) {
      console.error('Failed to fetch video rooms:', error);
      throw error;
    }

    // Enhance names for display when missing/unknown.
    // We do this at read-time so existing rows remain backward compatible.
    const safeRooms = rooms || [];

    // Fetch job data separately (since foreign key may not exist)
    const jobIds = Array.from(new Set(safeRooms.map((r: any) => r.job_id).filter(Boolean)));
    let jobsById = new Map<string, any>();
    
    if (jobIds.length > 0) {
      try {
        const { data: jobsData } = await supabaseAdmin
          .from('jobs')
          .select(`
            id,
            title,
            work_type,
            work_arrangement,
            agency_clients (
              id,
              companies (
                id,
                name
              ),
              agencies (
                id,
                name
              )
            )
          `)
          .in('id', jobIds);
        
        for (const job of jobsData || []) {
          jobsById.set(job.id, job);
        }
      } catch (e) {
        console.warn('[video/rooms GET] Failed to fetch jobs data:', e);
        // Continue without jobs data - not critical
      }
    }
    const hostIds = Array.from(new Set(safeRooms.map((r: any) => r.host_user_id).filter(Boolean)));
    const participantIds = Array.from(new Set(safeRooms.map((r: any) => r.participant_user_id).filter(Boolean)));

    // Fetch both agency_recruiters AND user_profiles for hosts (recruiters can be in either table)
    const [recruiterProfiles, hostProfiles, participantCandidates] = await Promise.all([
      hostIds.length
        ? supabaseAdmin
            .from('agency_recruiters')
            .select('user_id, first_name, last_name, avatar_url')
            .in('user_id', hostIds)
        : Promise.resolve({ data: [] as any[] }),
      hostIds.length
        ? supabaseAdmin
            .from('user_profiles')
            .select('user_id, full_name, first_name, last_name, avatar_url')
            .in('user_id', hostIds)
        : Promise.resolve({ data: [] as any[] }),
      participantIds.length
        ? supabaseAdmin
            .from('candidates')
            .select('id, first_name, last_name, avatar_url')
            .in('id', participantIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    // Build host name map - prefer agency_recruiters over user_profiles
    const hostNameById = new Map<string, string>();
    const hostAvatarById = new Map<string, string>();

    // First add user_profiles
    for (const p of (hostProfiles as any).data || []) {
      const name = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
      if (name) hostNameById.set(p.user_id, name);
      if (p.avatar_url) hostAvatarById.set(p.user_id, p.avatar_url);
    }

    // Then override with agency_recruiters (more accurate for recruiters)
    for (const r of (recruiterProfiles as any).data || []) {
      const name = `${r.first_name || ''} ${r.last_name || ''}`.trim();
      if (name) hostNameById.set(r.user_id, name);
      if (r.avatar_url) hostAvatarById.set(r.user_id, r.avatar_url);
    }

    const candidateNameById = new Map<string, string>();
    const candidateAvatarById = new Map<string, string>();
    for (const c of (participantCandidates as any).data || []) {
      const name = `${c.first_name || ''} ${c.last_name || ''}`.trim();
      if (name) candidateNameById.set(c.id, name);
      if (c.avatar_url) candidateAvatarById.set(c.id, c.avatar_url);
    }

    const enhancedRooms = safeRooms.map((r: any) => {
      const next = { ...r };

      // Enhance host (recruiter) info
      if (!next.host_name || next.host_name === 'Unknown') {
        const hn = hostNameById.get(next.host_user_id);
        if (hn) next.host_name = hn;
      }
      if (!next.host_avatar_url) {
        const ha = hostAvatarById.get(next.host_user_id);
        if (ha) next.host_avatar_url = ha;
      }

      // Enhance participant (candidate) info
      if (!next.participant_name || next.participant_name === 'Unknown') {
        const cn = candidateNameById.get(next.participant_user_id);
        if (cn) next.participant_name = cn;
      }
      if (!next.participant_avatar_url) {
        const ca = candidateAvatarById.get(next.participant_user_id);
        if (ca) next.participant_avatar_url = ca;
      }
      // Attach job data if available
      if (next.job_id && jobsById.has(next.job_id)) {
        next.jobs = jobsById.get(next.job_id);
      }
      return next;
    });

    return NextResponse.json({
      success: true,
      rooms: enhancedRooms,
    });

  } catch (error) {
    console.error('Failed to fetch video rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video rooms' },
      { status: 500 }
    );
  }
}

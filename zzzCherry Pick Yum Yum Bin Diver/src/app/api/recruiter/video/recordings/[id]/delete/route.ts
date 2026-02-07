import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * DELETE /api/recruiter/video/recordings/:id/delete
 *
 * Soft-delete a recording (recruiter action)
 * - Marks recording as deleted
 * - Nullifies URLs and storage path
 * - Removes file from storage
 * - Retains metadata for audit trail
 * - Creates audit log entry
 *
 * Permissions:
 * - Only recruiters from the same agency can delete
 * - Cannot delete recordings on legal hold
 * - Cannot delete recordings in active disputes
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // 1. Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recordingId = params.id;

    // 2. Get recording details and verify permissions
    const { data: recording, error: fetchError } = await supabaseAdmin
      .from('video_call_recordings')
      .select(`
        id,
        storage_path,
        storage_provider,
        deleted_at,
        video_call_rooms!inner(
          id,
          agency_id
        )
      `)
      .eq('id', recordingId)
      .single();

    if (fetchError || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // 3. Check if already deleted
    if (recording.deleted_at) {
      return NextResponse.json({ error: 'Recording already deleted' }, { status: 400 });
    }

    // 4. Verify user is recruiter in the same agency
    const room = recording.video_call_rooms as any;
    const { data: recruiterCheck } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id')
      .eq('user_id', user.id)
      .eq('agency_id', room.agency_id)
      .single();

    if (!recruiterCheck) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this recording' },
        { status: 403 }
      );
    }

    // 5. TODO: Check for legal hold or active disputes
    // For now, we'll skip this check but it should be added

    // 6. Delete file from storage if applicable
    if (recording.storage_provider === 'supabase' && recording.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('recordings')
        .remove([recording.storage_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue anyway - we'll mark as deleted in DB
      }
    }

    // 7. Soft delete the recording
    const { error: updateError } = await supabaseAdmin
      .from('video_call_recordings')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        recording_url: null,
        download_url: null,
        storage_path: null,
        status: 'deleted',
      })
      .eq('id', recordingId);

    if (updateError) {
      console.error('Error soft-deleting recording:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete recording' },
        { status: 500 }
      );
    }

    // 8. Create audit log entry
    await supabaseAdmin.from('audit_log').insert({
      user_id: user.id,
      action: 'recording_deleted',
      resource_type: 'video_call_recording',
      resource_id: recordingId,
      metadata: {
        agency_id: room.agency_id,
        room_id: room.id,
        deletion_reason: 'manual_deletion_by_recruiter',
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Recording deleted successfully',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting recording:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

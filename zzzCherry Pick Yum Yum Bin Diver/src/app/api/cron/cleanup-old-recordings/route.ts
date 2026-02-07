import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/cron/cleanup-old-recordings
 * 
 * Cron job to clean up old video recordings based on agency retention policies
 * 
 * Process:
 * 1. Find recordings older than agency's retention period
 * 2. Mark them for deletion (with 7-day grace period)
 * 3. Send notification to agency before deletion
 * 4. Delete recordings that are past grace period
 * 5. Clean up storage files
 * 
 * Run frequency: Daily at 2 AM
 * Vercel Cron: 0 2 * * *
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a valid cron request (check for Vercel cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const stats = {
      recordingsMarked: 0,
      recordingsDeleted: 0,
      notificationsSent: 0,
      bytesFreed: 0,
      errors: [] as string[],
    };

    // Step 1: Get all agencies with auto-delete enabled
    const { data: agencies, error: agenciesError } = await supabaseAdmin
      .from('agencies')
      .select('id, name, video_retention_days, auto_delete_recordings, tier')
      .eq('auto_delete_recordings', true);

    if (agenciesError) {
      console.error('Error fetching agencies:', agenciesError);
      return NextResponse.json({ 
        error: 'Failed to fetch agencies', 
        details: agenciesError.message 
      }, { status: 500 });
    }

    console.log(`🔍 Processing ${agencies.length} agencies with auto-delete enabled`);

    for (const agency of agencies) {
      const retentionDays = agency.video_retention_days || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Step 2: Find recordings for this agency that are older than retention period
      const { data: oldRecordings, error: recordingsError } = await supabaseAdmin
        .from('video_call_recordings')
        .select(`
          id,
          created_at,
          file_size_bytes,
          storage_path,
          marked_for_deletion,
          deletion_scheduled_date,
          video_call_rooms!inner(
            agency_id,
            application_id
          )
        `)
        .eq('video_call_rooms.agency_id', agency.id)
        .lt('created_at', cutoffDate.toISOString())
        .eq('marked_for_deletion', false)
        .eq('status', 'ready');

      if (recordingsError) {
        console.error(`Error fetching recordings for agency ${agency.id}:`, recordingsError);
        stats.errors.push(`Agency ${agency.name}: ${recordingsError.message}`);
        continue;
      }

      if (!oldRecordings || oldRecordings.length === 0) {
        continue;
      }

      console.log(`📁 Found ${oldRecordings.length} old recordings for ${agency.name}`);

      // Step 3: Mark recordings for deletion (7-day grace period)
      const gracePeriodDate = new Date();
      gracePeriodDate.setDate(gracePeriodDate.getDate() + 7);

      const recordingIds = oldRecordings.map(r => r.id);

      const { error: markError } = await supabaseAdmin
        .from('video_call_recordings')
        .update({
          marked_for_deletion: true,
          marked_for_deletion_at: new Date().toISOString(),
          deletion_scheduled_date: gracePeriodDate.toISOString().split('T')[0],
        })
        .in('id', recordingIds);

      if (markError) {
        console.error(`Error marking recordings for deletion:`, markError);
        stats.errors.push(`Mark deletion error: ${markError.message}`);
        continue;
      }

      stats.recordingsMarked += oldRecordings.length;

      // Step 4: Send notification to agency admin
      // Get agency admin
      const { data: adminRecruiters } = await supabaseAdmin
        .from('agency_recruiters')
        .select('user_id, email, first_name')
        .eq('agency_id', agency.id)
        .eq('role', 'admin')
        .limit(1);

      if (adminRecruiters && adminRecruiters.length > 0) {
        const admin = adminRecruiters[0];
        
        // Create notification
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: admin.user_id,
            type: 'recording_deletion_scheduled',
            title: 'Video Recordings Scheduled for Deletion',
            message: `${oldRecordings.length} video recording(s) from interviews older than ${retentionDays} days will be permanently deleted on ${gracePeriodDate.toLocaleDateString()}. Download any recordings you want to keep before this date.`,
            action_url: '/recruiter/interviews/recordings',
            action_label: 'View Recordings',
            is_urgent: true,
            metadata: {
              recordingCount: oldRecordings.length,
              deletionDate: gracePeriodDate.toISOString(),
              retentionDays,
            },
          });

        stats.notificationsSent++;

        // TODO: Send email notification as well
      }
    }

    // Step 5: Delete recordings that are past their grace period
    const { data: recordingsToDelete, error: deleteQueryError } = await supabaseAdmin
      .from('video_call_recordings')
      .select('id, storage_path, file_size_bytes, storage_provider')
      .eq('marked_for_deletion', true)
      .lt('deletion_scheduled_date', today.toISOString().split('T')[0]);

    if (deleteQueryError) {
      console.error('Error querying recordings to delete:', deleteQueryError);
      stats.errors.push(`Delete query error: ${deleteQueryError.message}`);
    } else if (recordingsToDelete && recordingsToDelete.length > 0) {
      console.log(`🗑️  Deleting ${recordingsToDelete.length} recordings past grace period`);

      for (const recording of recordingsToDelete) {
        try {
          // Delete from Supabase Storage if applicable
          if (recording.storage_provider === 'supabase' && recording.storage_path) {
            const { error: storageError } = await supabaseAdmin.storage
              .from('recordings')
              .remove([recording.storage_path]);

            if (storageError) {
              console.error(`Error deleting storage file ${recording.storage_path}:`, storageError);
            } else {
              stats.bytesFreed += Number(recording.file_size_bytes || 0);
            }
          }

          // Mark as deleted in database (soft delete - keep record)
          await supabaseAdmin
            .from('video_call_recordings')
            .update({
              deleted_at: new Date().toISOString(),
              recording_url: null,
              download_url: null,
              storage_path: null,
            })
            .eq('id', recording.id);

          stats.recordingsDeleted++;

        } catch (error) {
          console.error(`Error deleting recording ${recording.id}:`, error);
          stats.errors.push(`Recording ${recording.id}: ${error}`);
        }
      }
    }

    // Convert bytes to MB for readability
    const mbFreed = (stats.bytesFreed / (1024 * 1024)).toFixed(2);

    console.log('✅ Recording cleanup complete:', {
      ...stats,
      storageFreed: `${mbFreed} MB`,
    });

    return NextResponse.json({
      success: true,
      message: 'Recording cleanup completed',
      stats: {
        ...stats,
        storageFreed: `${mbFreed} MB`,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Recording cleanup cron error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

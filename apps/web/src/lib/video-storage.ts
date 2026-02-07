/**
 * Video Recording Storage Utilities
 * Handles downloading from Daily.co and uploading to Supabase Storage
 * for permanent recording storage (Daily URLs expire after 7 days)
 */

import { supabaseAdmin } from './supabase/admin';

// Video recordings now stored in candidate bucket under interviews/ folder
const VIDEO_BUCKET = 'candidate';
const VIDEO_FOLDER = 'interviews';

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Download recording from Daily.co and upload to Supabase Storage
 * Returns permanent URL
 */
export async function uploadRecordingToPermanentStorage(
  downloadUrl: string,
  roomId: string,
  recordingId: string
): Promise<UploadResult> {
  try {
    console.log('📥 [VideoStorage] Downloading recording from Daily...');

    // Download the recording from Daily
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const blob = await response.blob();

    // Determine file extension
    let extension = 'mp4';
    if (contentType.includes('webm')) extension = 'webm';
    if (contentType.includes('mp3')) extension = 'mp3';
    if (contentType.includes('wav')) extension = 'wav';

    // Generate storage path: interviews/recordings/{year}/{month}/{roomId}_{recordingId}.mp4
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const storagePath = `${VIDEO_FOLDER}/recordings/${year}/${month}/${roomId}_${recordingId}.${extension}`;

    console.log('📤 [VideoStorage] Uploading to Supabase Storage:', {
      storagePath,
      size: blob.size,
      contentType
    });

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .upload(storagePath, blob, {
        contentType,
        upsert: true, // Overwrite if exists
        cacheControl: '86400', // 24 hour cache
      });

    if (error) {
      console.error('❌ [VideoStorage] Upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(storagePath);

    console.log('✅ [VideoStorage] Recording uploaded successfully:', { publicUrl });

    return {
      success: true,
      publicUrl,
      storagePath,
    };

  } catch (error) {
    console.error('❌ [VideoStorage] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get a signed URL for a private recording
 * Use this if bucket is not public
 */
export async function getSignedRecordingUrl(
  storagePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a recording from storage
 */
export async function deleteRecording(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error('❌ [VideoStorage] Delete failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ [VideoStorage] Delete error:', error);
    return false;
  }
}

/**
 * Get recording file size
 */
export async function getRecordingSize(storagePath: string): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .list(storagePath.split('/').slice(0, -1).join('/'), {
        search: storagePath.split('/').pop(),
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0]?.metadata?.size || null;
  } catch (error) {
    return null;
  }
}

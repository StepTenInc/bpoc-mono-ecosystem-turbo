import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    const postId = formData.get('postId') as string | null;

    // Validation: File required
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validation: File type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type: ${file.type}. Allowed: MP4, WebM, MOV`
      }, { status: 400 });
    }

    // Validation: File size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 100MB`
      }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'mp4';
    const safeSlug = slug?.replace(/[^a-z0-9-]/gi, '-') || 'video';
    const fileName = `${safeSlug}-${Date.now()}.${ext}`;

    console.log(`📤 Uploading video: ${fileName} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    // Convert File to ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Upload to Supabase Storage (insights-images bucket - video folder)
    const { data, error } = await supabaseAdmin.storage
      .from('insights-images')
      .upload(`video/${fileName}`, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('insights-images')
      .getPublicUrl(`video/${fileName}`);

    console.log(`✅ Video uploaded: ${urlData.publicUrl}`);

    // Optionally update post record if postId provided
    if (postId) {
      const { error: updateError } = await supabaseAdmin
        .from('insights_posts')
        .update({
          video_url: urlData.publicUrl,
          hero_type: 'video'
        })
        .eq('id', postId);

      if (updateError) {
        console.error('⚠️ Post update warning:', updateError);
        // Don't fail - video is uploaded, just couldn't auto-update post
      }
    }

    return NextResponse.json({
      success: true,
      videoUrl: urlData.publicUrl,
      url: urlData.publicUrl,
      fileName,
      size: file.size,
      sizeFormatted: `${(file.size / 1024 / 1024).toFixed(1)}MB`
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({
      error: error.message || 'Upload failed'
    }, { status: 500 });
  }
}

// DELETE endpoint to remove old videos
export async function DELETE(req: NextRequest) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage
      .from('marketing')
      .remove([`articles/videos/${fileName}`]);

    if (error) {
      console.error('❌ Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`🗑️ Video deleted: ${fileName}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


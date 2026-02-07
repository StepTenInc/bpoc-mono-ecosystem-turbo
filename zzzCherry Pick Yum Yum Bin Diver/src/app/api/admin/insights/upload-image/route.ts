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
    const type = formData.get('type') as string; // 'body-image', 'hero', etc.

    // Validation: File required
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validation: File type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, WebP, GIF`
      }, { status: 400 });
    }

    // Validation: File size (10MB max for images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`
      }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const safeSlug = slug?.replace(/[^a-z0-9-]/gi, '-') || 'image';
    const typePrefix = type || 'body';
    const fileName = `${safeSlug}-${typePrefix}-${Date.now()}.${ext}`;

    console.log(`📤 Uploading image: ${fileName} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    // Convert File to ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Determine bucket and folder based on type
    const isSection = type === 'body-image' || type === 'section';
    const bucketName = isSection ? 'insights-images' : 'marketing';
    const folderPath = isSection ? 'section' : 'articles/images';

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(`${folderPath}/${fileName}`, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);

      // If bucket doesn't exist, try to create it
      if (error.message.includes('not found') || error.message.includes('bucket')) {
        console.log('🔧 Bucket may not exist, trying public bucket...');

        // Try uploading to the default 'public' bucket as fallback
        const { data: publicData, error: publicError } = await supabaseAdmin.storage
          .from('public')
          .upload(`insights/${fileName}`, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (publicError) {
          return NextResponse.json({ error: publicError.message }, { status: 500 });
        }

        const { data: urlData } = supabaseAdmin.storage
          .from('public')
          .getPublicUrl(`insights/${fileName}`);

        return NextResponse.json({
          success: true,
          imageUrl: urlData.publicUrl,
          fileName: `insights/${fileName}`,
          size: file.size,
          sizeFormatted: `${(file.size / 1024 / 1024).toFixed(1)}MB`
        });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(`${folderPath}/${fileName}`);

    console.log(`✅ Image uploaded: ${urlData.publicUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
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

// DELETE endpoint to remove images
export async function DELETE(req: NextRequest) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage
      .from('marketing')
      .remove([`articles/images/${fileName}`]);

    if (error) {
      console.error('❌ Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`🗑️ Image deleted: ${fileName}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



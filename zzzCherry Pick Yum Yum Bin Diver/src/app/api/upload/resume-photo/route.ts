import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const CANDIDATE_BUCKET = 'candidate';
const PROFILE_PHOTOS_FOLDER = 'profile_photos';

export async function POST(req: NextRequest) {
  try {
    const { dataUrl, fileName } = await req.json();
    if (!dataUrl || !fileName) {
      return NextResponse.json({ error: 'Missing dataUrl or fileName' }, { status: 400 });
    }

    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
      return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 });
    }

    const mimeMatch = /^data:(.+);base64$/.exec(parts[0]);
    const contentType = mimeMatch?.[1] || 'image/png';
    const base64 = parts[1];
    const buffer = Buffer.from(base64, 'base64');

    // Add folder path to filename
    const uploadPath = `${PROFILE_PHOTOS_FOLDER}/${fileName}`;

    const { error } = await supabaseAdmin.storage
      .from(CANDIDATE_BUCKET)
      .upload(uploadPath, buffer, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(CANDIDATE_BUCKET)
      .getPublicUrl(uploadPath);

    return NextResponse.json({ success: true, publicUrl, fileName: uploadPath });
  } catch (err) {
    console.error('Upload resume photo error', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}


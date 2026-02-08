import { createClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/onboarding/documents/upload
 * Upload documents to Supabase Storage
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const documentType = formData.get('documentType') as string;
        const candidateId = formData.get('candidateId') as string;

        if (!file || !documentType || !candidateId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, PDF allowed' }, { status: 400 });
        }

        // Generate file path in candidates bucket
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${documentType}.${fileExt}`;
        const filePath = `${candidateId}/onboarding/${fileName}`;

        // Upload to Supabase Storage (candidates bucket)
        const { data, error } = await supabase.storage
            .from('candidates')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('candidates')
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            documentUrl: publicUrl,
            filePath,
            message: 'File uploaded successfully'
        });

    } catch (error: any) {
        console.error('Document upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

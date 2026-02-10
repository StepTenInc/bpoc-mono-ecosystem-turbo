import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

// POST - Upload documents for onboarding
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const onboardingId = formData.get('onboarding_id') as string;

    if (!onboardingId) {
      return NextResponse.json({ error: 'Onboarding ID required' }, { status: 400 });
    }

    // Verify onboarding belongs to this candidate
    const { data: onboarding } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('id, candidate_id')
      .eq('id', onboardingId)
      .single();

    if (!onboarding || onboarding.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
    }

    const uploadedDocs: any[] = [];
    const documentTypes = [
      'government_id',
      'nbi_clearance',
      'sss_id',
      'philhealth',
      'pagibig',
      'tin',
      'diploma',
      'employment_cert',
    ];

    for (const docType of documentTypes) {
      const file = formData.get(docType) as File;
      if (!file) continue;

      // Upload to Supabase Storage
      const fileName = `${user.id}/${onboardingId}/${docType}_${Date.now()}_${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('onboarding-documents')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error(`Upload error for ${docType}:`, uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin
        .storage
        .from('onboarding-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { data: doc, error: docError } = await supabaseAdmin
        .from('onboarding_documents')
        .insert({
          onboarding_id: onboardingId,
          document_type: docType,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
        })
        .select()
        .single();

      if (!docError && doc) {
        uploadedDocs.push(doc);
      }
    }

    // Update onboarding status
    if (uploadedDocs.length > 0) {
      await supabaseAdmin
        .from('candidate_onboarding')
        .update({
          status: 'documents_submitted',
          documents_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', onboardingId);
    }

    // TODO: Trigger Google Vision processing for document verification
    // This would be a background job that:
    // 1. Downloads each document
    // 2. Sends to Google Vision API
    // 3. Extracts text and validates
    // 4. Updates verification_result in onboarding_documents

    return NextResponse.json({
      success: true,
      uploaded: uploadedDocs.length,
      documents: uploadedDocs,
      message: `${uploadedDocs.length} documents uploaded successfully`,
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Failed to upload documents' }, { status: 500 });
  }
}

// GET - Get document status for an onboarding
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const onboardingId = searchParams.get('onboarding_id');

    if (!onboardingId) {
      return NextResponse.json({ error: 'Onboarding ID required' }, { status: 400 });
    }

    // Verify access
    const { data: onboarding } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('id, candidate_id')
      .eq('id', onboardingId)
      .single();

    if (!onboarding || onboarding.candidate_id !== user.id) {
      return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
    }

    // Get documents
    const { data: documents, error } = await supabaseAdmin
      .from('onboarding_documents')
      .select('*')
      .eq('onboarding_id', onboardingId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      documents: (documents || []).map(doc => ({
        id: doc.id,
        type: doc.document_type,
        fileName: doc.file_name,
        fileUrl: doc.file_url,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        status: doc.status,
        verificationResult: doc.verification_result,
        verifiedAt: doc.verified_at,
        notes: doc.verification_notes,
        createdAt: doc.created_at,
      })),
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

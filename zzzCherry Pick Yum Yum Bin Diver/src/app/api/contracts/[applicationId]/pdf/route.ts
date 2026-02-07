import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateContractPDF, generatePdfHash } from '@/lib/pdf-generator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const userId = await verifyAuthToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch the contract data (reusing existing contract generation logic)
    const contractResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('//', '//').replace('supabase.co', 'supabase.co')}/api/contracts/${applicationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      }
    );

    if (!contractResponse.ok) {
      throw new Error('Failed to fetch contract data');
    }

    const { contract } = await contractResponse.json();

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get application details
    const { data: application } = await supabaseAdmin
      .from('job_applications')
      .select('candidate_id, job_offers!inner(id, status)')
      .eq('id', applicationId)
      .eq('job_offers.status', 'accepted')
      .single();

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const offer = Array.isArray(application.job_offers) 
      ? application.job_offers[0] 
      : application.job_offers;

    const candidateId = application.candidate_id;
    const offerId = offer.id;

    // Check if PDF already exists
    const { data: existingPdf } = await supabaseAdmin
      .from('contract_pdfs')
      .select('*')
      .eq('application_id', applicationId)
      .eq('is_signed', contract.signatures.candidate.signed)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If exists and is recent (< 5 minutes old), return existing URL
    if (existingPdf && new Date(existingPdf.created_at).getTime() > Date.now() - 5 * 60 * 1000) {
      const { data: { signedUrl } } = await supabaseAdmin.storage
        .from('candidate')
        .createSignedUrl(existingPdf.storage_path, 3600); // 1 hour expiry

      return NextResponse.json({
        success: true,
        pdfUrl: signedUrl,
        cached: true,
        pdfId: existingPdf.id
      });
    }

    // Generate PDF
    console.log('Generating PDF for application:', applicationId);
    const pdfBuffer = await generateContractPDF(contract);
    const pdfHash = generatePdfHash(pdfBuffer);
    const fileSize = pdfBuffer.length;

    // Determine version
    const { count } = await supabaseAdmin
      .from('contract_pdfs')
      .select('id', { count: 'exact', head: true })
      .eq('application_id', applicationId);

    const version = (count || 0) + 1;

    // Storage path: contracts/{candidateId}/{applicationId}_v{version}_{signed|unsigned}.pdf
    const signedStatus = contract.signatures.candidate.signed ? 'signed' : 'unsigned';
    const filename = `${applicationId}_v${version}_${signedStatus}.pdf`;
    const storagePath = `contracts/${candidateId}/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('candidate')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get signature details if signed
    let signatureId = null;
    let certificateId = null;
    let signedAt = null;

    if (contract.signatures.candidate.signed) {
      const { data: signature } = await supabaseAdmin
        .from('offer_signatures')
        .select('id, certificate_id, signed_at')
        .eq('offer_id', offerId)
        .eq('signatory_role', 'candidate')
        .order('signed_at', { ascending: false })
        .limit(1)
        .single();

      if (signature) {
        signatureId = signature.id;
        certificateId = signature.certificate_id;
        signedAt = signature.signed_at;
      }
    }

    // Save PDF metadata to database
    const { data: pdfRecord, error: dbError } = await supabaseAdmin
      .from('contract_pdfs')
      .insert({
        application_id: applicationId,
        offer_id: offerId,
        signature_id: signatureId,
        storage_path: storagePath,
        file_size_bytes: fileSize,
        document_version: version,
        is_signed: contract.signatures.candidate.signed,
        signed_at: signedAt,
        certificate_id: certificateId,
        document_hash: pdfHash,
        metadata: {
          generated_by: userId,
          contract_id: contract.contractId,
          employee_name: contract.employee.name,
          position: contract.position.title
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up uploaded file
      await supabaseAdmin.storage
        .from('candidate')
        .remove([storagePath]);
      throw new Error(`Failed to save PDF metadata: ${dbError.message}`);
    }

    // Generate signed URL (valid for 1 hour)
    const { data: { signedUrl }, error: urlError } = await supabaseAdmin.storage
      .from('candidate')
      .createSignedUrl(storagePath, 3600);

    if (urlError) {
      console.error('Signed URL error:', urlError);
      throw new Error('Failed to generate download URL');
    }

    return NextResponse.json({
      success: true,
      pdfUrl: signedUrl,
      pdfId: pdfRecord.id,
      version,
      fileSize,
      documentHash: pdfHash,
      isSigned: contract.signatures.candidate.signed,
      certificateId: certificateId || undefined
    });

  } catch (error: any) {
    console.error('Error generating contract PDF:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate PDF',
      details: error.stack
    }, { status: 500 });
  }
}

// GET endpoint to retrieve existing PDF or generate new one
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const userId = await verifyAuthToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the latest PDF for this application
    const { data: latestPdf, error: pdfError } = await supabaseAdmin
      .from('contract_pdfs')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pdfError || !latestPdf) {
      return NextResponse.json({ 
        error: 'No PDF found. Generate one first by calling POST.'
      }, { status: 404 });
    }

    // Generate signed URL
    const { data: { signedUrl }, error: urlError } = await supabaseAdmin.storage
      .from('candidate')
      .createSignedUrl(latestPdf.storage_path, 3600);

    if (urlError) {
      console.error('Signed URL error:', urlError);
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pdfUrl: signedUrl,
      pdfId: latestPdf.id,
      version: latestPdf.document_version,
      fileSize: latestPdf.file_size_bytes,
      isSigned: latestPdf.is_signed,
      certificateId: latestPdf.certificate_id,
      generatedAt: latestPdf.generated_at
    });

  } catch (error: any) {
    console.error('Error retrieving contract PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve PDF' 
    }, { status: 500 });
  }
}


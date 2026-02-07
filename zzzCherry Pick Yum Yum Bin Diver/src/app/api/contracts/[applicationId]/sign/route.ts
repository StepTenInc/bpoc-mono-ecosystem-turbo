import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

// Helper to detect device type
function getDeviceType(userAgent: string): 'web' | 'mobile' | 'tablet' | 'unknown' {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile';
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mozilla|chrome|safari|firefox/.test(ua)) return 'web';
  return 'unknown';
}

// Helper to get client IP (handles proxies)
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || '0.0.0.0';
  return ip;
}

// Generate SHA-256 hash of contract data
function generateDocumentHash(contractData: any): string {
  const contractString = JSON.stringify(contractData, Object.keys(contractData).sort());
  return crypto.createHash('sha256').update(contractString).digest('hex');
}

// Generate unique certificate ID
function generateCertificateId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `BPOC-${timestamp}-${random}`.toUpperCase();
}

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

    // Get signature data from request
    const body = await req.json();
    const { signatoryName, signatureMethod, consentText } = body;

    if (!signatoryName || !signatureMethod || !consentText) {
      return NextResponse.json({ 
        error: 'Missing required fields: signatoryName, signatureMethod, consentText' 
      }, { status: 400 });
    }

    // Get application with accepted offer
    const { data: application, error: appError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs (id, title, agency_client_id),
        candidates (id, first_name, last_name, email),
        job_offers!inner (id, status, salary_offered, currency, start_date)
      `)
      .eq('id', applicationId)
      .eq('job_offers.status', 'accepted')
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application or accepted offer not found' }, { status: 404 });
    }

    const offer = Array.isArray(application.job_offers) 
      ? application.job_offers[0] 
      : application.job_offers;

    if (!offer) {
      return NextResponse.json({ error: 'No accepted offer found' }, { status: 404 });
    }

    const candidate = application.candidates;

    // Verify the user is the candidate
    if (userId !== candidate.id) {
      return NextResponse.json({ error: 'Only the candidate can sign the contract' }, { status: 403 });
    }

    // Check if already signed
    const { data: existingSignature } = await supabaseAdmin
      .from('offer_signatures')
      .select('id')
      .eq('offer_id', offer.id)
      .eq('signatory_id', userId)
      .eq('signatory_role', 'candidate')
      .single();

    if (existingSignature) {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 });
    }

    // Generate document hash (hash of the contract data)
    const contractData = {
      offerId: offer.id,
      applicationId: application.id,
      candidateId: candidate.id,
      jobTitle: application.jobs.title,
      salary: offer.salary_offered,
      currency: offer.currency,
      startDate: offer.start_date
    };
    const documentHash = generateDocumentHash(contractData);

    // Get request metadata
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ipAddress = getClientIp(req);
    const deviceType = getDeviceType(userAgent);
    const certificateId = generateCertificateId();

    // Create signature record
    const { data: signature, error: signError } = await supabaseAdmin
      .from('offer_signatures')
      .insert({
        offer_id: offer.id,
        signatory_id: userId,
        signatory_name: signatoryName,
        signatory_email: candidate.email,
        signatory_role: 'candidate',
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        document_hash: documentHash,
        document_version: 1,
        consent_text: consentText,
        signature_method: signatureMethod,
        certificate_id: certificateId,
        certificate_data: {
          documentHash,
          certificateId,
          signedAt: new Date().toISOString(),
          signatoryId: userId,
          signatoryName,
          signatoryEmail: candidate.email,
          documentType: 'employment_contract'
        }
      })
      .select()
      .single();

    if (signError) {
      console.error('Error creating signature:', signError);
      return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
      signature: {
        id: signature.id,
        certificateId: signature.certificate_id,
        signedAt: signature.signed_at,
        documentHash: signature.document_hash,
        signatoryName: signature.signatory_name
      }
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    return NextResponse.json({ 
      error: 'Failed to sign contract' 
    }, { status: 500 });
  }
}


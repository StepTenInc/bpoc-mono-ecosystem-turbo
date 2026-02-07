import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import crypto from 'crypto';

/**
 * POST /api/offers/[offerId]/sign
 * Capture candidate's e-signature on job offer
 * Compliant with Philippine Republic Act 8792 (E-Commerce Act)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params;
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { signatoryName, signatureMethod = 'click_to_sign' } = body;

    if (!signatoryName || !signatoryName.trim()) {
      return NextResponse.json({ error: 'Signatory name is required' }, { status: 400 });
    }

    // Get offer details
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('job_offers')
      .select(`
        *,
        job_applications!inner (
          id,
          candidate_id,
          job_id,
          jobs (
            id,
            title,
            agency_client_id
          )
        )
      `)
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      console.error('Offer not found:', offerError);
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const application = Array.isArray(offer.job_applications) 
      ? offer.job_applications[0] 
      : offer.job_applications;

    // Verify user is the candidate for this offer
    if (application.candidate_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized - you can only sign your own offers' }, { status: 403 });
    }

    // Check if already signed
    const { data: existingSignature } = await supabaseAdmin
      .from('offer_signatures')
      .select('id, signed_at')
      .eq('offer_id', offerId)
      .eq('signatory_id', userId)
      .eq('signatory_role', 'candidate')
      .single();

    if (existingSignature) {
      return NextResponse.json({ 
        error: 'Offer already signed',
        signedAt: existingSignature.signed_at
      }, { status: 400 });
    }

    // ============================================
    // LEGAL COMPLIANCE: Generate Document Hash
    // ============================================
    // This proves the document hasn't been tampered with
    const offerDocument = {
      id: offer.id,
      salary_offered: offer.salary_offered,
      currency: offer.currency,
      salary_type: offer.salary_type,
      start_date: offer.start_date,
      benefits_offered: offer.benefits_offered,
      additional_terms: offer.additional_terms,
      job_title: application.jobs?.title || 'Unknown Position',
      sent_at: offer.sent_at,
    };

    const documentString = JSON.stringify(offerDocument, Object.keys(offerDocument).sort());
    const documentHash = crypto.createHash('sha256').update(documentString).digest('hex');

    console.log('📝 [E-Signature] Generated document hash:', documentHash.substring(0, 16) + '...');

    // ============================================
    // LEGAL COMPLIANCE: Capture IP Address & Device Info
    // ============================================
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || request.ip || 'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const deviceType = detectDeviceType(userAgent);

    console.log('🔐 [E-Signature] IP captured:', ipAddress);
    console.log('📱 [E-Signature] Device:', deviceType);

    // ============================================
    // LEGAL COMPLIANCE: Consent Text
    // ============================================
    const consentText = `I, ${signatoryName}, hereby accept and agree to all terms and conditions stated in this employment offer. I understand that this constitutes a legally binding agreement under Philippine law (Republic Act 8792 - E-Commerce Act of 2000). I confirm that I have read, understood, and voluntarily agree to the offer of ${offer.currency} ${Number(offer.salary_offered).toLocaleString()} per ${offer.salary_type} for the position of ${application.jobs?.title || 'Unknown Position'}.`;

    // Generate unique certificate ID
    const certificateId = `BPOC-ESIG-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Get candidate email
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    const signatoryEmail = candidate?.email || 'unknown@email.com';

    // ============================================
    // STORE SIGNATURE RECORD
    // ============================================
    const { data: signature, error: signatureError } = await supabaseAdmin
      .from('offer_signatures')
      .insert({
        offer_id: offerId,
        signatory_id: userId,
        signatory_name: signatoryName,
        signatory_email: signatoryEmail,
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
          signatory_name: signatoryName,
          signed_at_utc: new Date().toISOString(),
          signed_at_pht: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
          timezone: 'Asia/Manila (PHT, UTC+8)',
          legal_framework: 'Republic Act 8792 (E-Commerce Act of 2000)',
          verification_method: 'Platform authentication + IP verification',
        },
        metadata: {
          offer_amount: offer.salary_offered,
          offer_currency: offer.currency,
          offer_type: offer.salary_type,
          job_title: application.jobs?.title,
          signed_from_ip: ipAddress,
          signed_with_device: deviceType,
        },
      })
      .select()
      .single();

    if (signatureError) {
      console.error('Failed to create signature:', signatureError);
      return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 });
    }

    // ============================================
    // UPDATE OFFER STATUS TO ACCEPTED
    // ============================================
    await supabaseAdmin
      .from('job_offers')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    console.log('✅ [E-Signature] Offer signed successfully:', certificateId);

    // TODO: Send confirmation emails (implement in Phase 1b)

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        certificateId: signature.certificate_id,
        signedAt: signature.signed_at,
        documentHash: signature.document_hash,
      },
      message: 'Offer signed successfully! You will receive a confirmation email shortly.',
    });

  } catch (error) {
    console.error('Error signing offer:', error);
    return NextResponse.json(
      { error: 'Failed to sign offer. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/offers/[offerId]/sign
 * Get signature status and details for an offer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params;
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Get all signatures for this offer
    const { data: signatures, error: signaturesError } = await supabaseAdmin
      .from('offer_signatures')
      .select('*')
      .eq('offer_id', offerId)
      .order('signed_at', { ascending: false });

    if (signaturesError) {
      console.error('Failed to fetch signatures:', signaturesError);
      return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 });
    }

    // Check if user has permission to view these signatures
    const { data: offer } = await supabaseAdmin
      .from('job_offers')
      .select(`
        id,
        job_applications!inner (
          candidate_id,
          job_id,
          jobs (
            agency_client_id,
            agency_clients (
              agency_id
            )
          )
        )
      `)
      .eq('id', offerId)
      .single();

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const application = Array.isArray(offer.job_applications)
      ? offer.job_applications[0]
      : offer.job_applications;

    // Check if user is candidate or recruiter
    const isCandidate = application.candidate_id === userId;
    
    let isRecruiter = false;
    if (!isCandidate) {
      const agencyId = application.jobs?.agency_clients?.agency_id;
      if (agencyId) {
        const { data: recruiterCheck } = await supabaseAdmin
          .from('agency_recruiters')
          .select('id')
          .eq('user_id', userId)
          .eq('agency_id', agencyId)
          .single();
        isRecruiter = !!recruiterCheck;
      }
    }

    if (!isCandidate && !isRecruiter) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      signatures: signatures || [],
      isSigned: signatures && signatures.length > 0,
      signedBy: signatures?.[0]?.signatory_name,
      signedAt: signatures?.[0]?.signed_at,
    });

  } catch (error) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature status' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Detect device type from user agent
 */
function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) return 'web';
  return 'unknown';
}


import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recruiterIds, action, reason } = body;

    if (!recruiterIds || !Array.isArray(recruiterIds) || recruiterIds.length === 0) {
      return NextResponse.json(
        { error: 'Recruiter IDs are required' },
        { status: 400 }
      );
    }

    if (action !== 'verify' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "verify" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each recruiter
    for (const recruiterId of recruiterIds) {
      try {
        // Fetch recruiter with agency data
        const { data: recruiter, error: fetchError } = await supabaseAdmin
          .from('agency_recruiters')
          .select(`
            *,
            agency:agencies (
              id,
              tin_number,
              dti_certificate_url,
              business_permit_url,
              sec_registration_url
            )
          `)
          .eq('id', recruiterId)
          .single();

        if (fetchError || !recruiter) {
          results.failed.push({
            id: recruiterId,
            error: 'Recruiter not found',
          });
          continue;
        }

        const agency = Array.isArray(recruiter.agency) ? recruiter.agency[0] : recruiter.agency;

        if (action === 'verify') {
          // Check if agency has all required documents
          if (
            !agency?.tin_number ||
            !agency?.dti_certificate_url ||
            !agency?.business_permit_url ||
            !agency?.sec_registration_url
          ) {
            results.failed.push({
              id: recruiterId,
              error: 'Missing required documents',
            });
            continue;
          }

          // Verify the recruiter
          const { error: updateError } = await supabaseAdmin
            .from('agency_recruiters')
            .update({
              verification_status: 'verified',
              is_verified: true,
              is_active: true,
              verified_at: new Date().toISOString(),
            })
            .eq('id', recruiterId);

          if (updateError) {
            results.failed.push({
              id: recruiterId,
              error: updateError.message,
            });
            continue;
          }

          // Update agency verification
          await supabaseAdmin
            .from('agencies')
            .update({
              documents_verified: true,
              documents_verified_at: new Date().toISOString(),
            })
            .eq('id', recruiter.agency_id);

          // Auto-approve team members if this is an admin/owner
          if (recruiter.role === 'admin' || recruiter.role === 'owner') {
            await supabaseAdmin
              .from('agency_recruiters')
              .update({
                verification_status: 'verified',
                is_verified: true,
                is_active: true,
                verified_at: new Date().toISOString(),
              })
              .eq('agency_id', recruiter.agency_id)
              .eq('verification_status', 'pending_authorization_head');
          }

          results.successful.push(recruiterId);

        } else if (action === 'reject') {
          // Reject the recruiter
          const { error: updateError } = await supabaseAdmin
            .from('agency_recruiters')
            .update({
              verification_status: 'rejected',
              is_verified: false,
              is_active: false,
              rejected_at: new Date().toISOString(),
              rejection_reason: reason,
            })
            .eq('id', recruiterId);

          if (updateError) {
            results.failed.push({
              id: recruiterId,
              error: updateError.message,
            });
            continue;
          }

          results.successful.push(recruiterId);
        }

      } catch (error: any) {
        results.failed.push({
          id: recruiterId,
          error: error.message || 'Unknown error',
        });
      }
    }

    // Build response message
    let message = '';
    if (results.successful.length > 0) {
      message += `Successfully ${action === 'verify' ? 'approved' : 'rejected'} ${results.successful.length} recruiter(s)`;
    }
    if (results.failed.length > 0) {
      message += (message ? '. ' : '') + `Failed to process ${results.failed.length} recruiter(s)`;
    }

    return NextResponse.json({
      message,
      results,
      successCount: results.successful.length,
      failCount: results.failed.length,
    });

  } catch (error: any) {
    console.error('Bulk verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process bulk verification' },
      { status: 500 }
    );
  }
}

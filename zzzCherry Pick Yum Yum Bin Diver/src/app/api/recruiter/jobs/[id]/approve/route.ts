import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendJobApprovalEmail, sendEmail } from '@/lib/email';
import { logAdminAction } from '@/lib/admin-audit';

/**
 * POST /api/recruiter/jobs/[id]/approve
 * Approve a job posting (admin/manager only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const { notes } = await request.json();

    // Get current user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter role
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, role, agency_id, can_manage_applications')
      .eq('user_id', user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
    }

    // Check if recruiter has approval permissions (admin or manager role)
    if (recruiter.role !== 'admin' && recruiter.role !== 'manager') {
      return NextResponse.json({ 
        error: 'Only admins and managers can approve jobs' 
      }, { status: 403 });
    }

    // Get the job to verify it belongs to the agency
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*, agency_clients!inner(agency_id)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify job belongs to recruiter's agency
    if ((job.agency_clients as any).agency_id !== recruiter.agency_id) {
      return NextResponse.json({ 
        error: 'You can only approve jobs from your agency' 
      }, { status: 403 });
    }

    // Check if job is already approved
    if (job.approval_status === 'approved') {
      return NextResponse.json({ 
        error: 'Job is already approved' 
      }, { status: 400 });
    }

    // Approve the job
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        approval_status: 'approved',
        approved_by: recruiter.id,
        approved_at: new Date().toISOString(),
        status: 'active', // Automatically activate approved jobs
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving job:', updateError);
      return NextResponse.json({ 
        error: 'Failed to approve job', 
        details: updateError.message 
      }, { status: 500 });
    }

    // Send email notification to job creator
    try {
      // Get job creator's email
      const { data: creator } = await supabaseAdmin
        .from('agency_recruiters')
        .select('user_id')
        .eq('id', job.created_by)
        .single();

      if (creator) {
        const { data: creatorUser } = await supabaseAdmin.auth.admin.getUserById(creator.user_id);

        if (creatorUser?.user?.email) {
          const jobUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bpoc.io'}/recruiter/jobs/${jobId}`;

          await sendJobApprovalEmail(
            creatorUser.user.email,
            job.title,
            `${user.user_metadata?.first_name || 'Admin'} ${user.user_metadata?.last_name || ''}`.trim(),
            jobUrl
          );

          console.log('📧 Job approval email sent to:', creatorUser.user.email);
        }
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send job approval email:', emailError);
      // Don't fail the request if email fails
    }

    // Log audit trail
    const adminName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || 'Admin';
    await logAdminAction({
      adminId: user.id,
      adminName: adminName,
      adminEmail: user.email,
      action: 'job_approve',
      entityType: 'job',
      entityId: jobId,
      entityName: job.title,
    });

    console.log('✅ Job approved:', {
      jobId,
      approvedBy: recruiter.id,
      title: job.title,
    });

    return NextResponse.json({
      success: true,
      message: 'Job approved successfully',
      job: updatedJob,
    });

  } catch (error) {
    console.error('Job approval error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/recruiter/jobs/[id]/approve
 * Reject a job posting (admin/manager only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json({ 
        error: 'Rejection reason is required' 
      }, { status: 400 });
    }

    // Get current user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter role
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, role, agency_id')
      .eq('user_id', user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
    }

    // Check permissions
    if (recruiter.role !== 'admin' && recruiter.role !== 'manager') {
      return NextResponse.json({ 
        error: 'Only admins and managers can reject jobs' 
      }, { status: 403 });
    }

    // Get the job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*, agency_clients!inner(agency_id)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify agency ownership
    if ((job.agency_clients as any).agency_id !== recruiter.agency_id) {
      return NextResponse.json({ 
        error: 'You can only reject jobs from your agency' 
      }, { status: 403 });
    }

    // Reject the job
    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        approval_status: 'rejected',
        approved_by: recruiter.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
        status: 'draft', // Keep as draft
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting job:', updateError);
      return NextResponse.json({ 
        error: 'Failed to reject job', 
        details: updateError.message 
      }, { status: 500 });
    }

    // Send email notification to job creator with rejection reason
    try {
      const { data: creator } = await supabaseAdmin
        .from('agency_recruiters')
        .select('user_id')
        .eq('id', job.created_by)
        .single();

      if (creator) {
        const { data: creatorUser } = await supabaseAdmin.auth.admin.getUserById(creator.user_id);

        if (creatorUser?.user?.email) {
          const jobUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bpoc.io'}/recruiter/jobs/${jobId}`;

          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .header h1 { color: white; margin: 0; font-size: 28px; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .reason-box { background: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; }
                  .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>❌ Job Posting Needs Revision</h1>
                  </div>
                  <div class="content">
                    <p>Hello,</p>
                    <p>Your job posting "<strong>${job.title}</strong>" requires some changes before it can be approved.</p>
                    <div class="reason-box">
                      <p style="margin: 0;"><strong>Feedback:</strong></p>
                      <p style="margin: 10px 0 0 0;">${reason}</p>
                    </div>
                    <p>Please review the feedback and make the necessary updates. You can edit your job posting by clicking the button below.</p>
                    <p style="text-align: center;">
                      <a href="${jobUrl}" class="button">Edit Job Posting</a>
                    </p>
                  </div>
                  <div class="footer">
                    <p>© 2024 BPOC Platform. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `;

          await sendEmail({
            to: creatorUser.user.email,
            subject: `Job posting "${job.title}" needs revision`,
            html
          });

          console.log('📧 Job rejection email sent to:', creatorUser.user.email);
        }
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send job rejection email:', emailError);
      // Don't fail the request if email fails
    }

    // Log audit trail
    const adminName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email || 'Admin';
    await logAdminAction({
      adminId: user.id,
      adminName: adminName,
      adminEmail: user.email,
      action: 'job_reject',
      entityType: 'job',
      entityId: jobId,
      entityName: job.title,
      reason: reason,
    });

    console.log('❌ Job rejected:', {
      jobId,
      rejectedBy: recruiter.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Job rejected',
      job: updatedJob,
      reason,
    });

  } catch (error) {
    console.error('Job rejection error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

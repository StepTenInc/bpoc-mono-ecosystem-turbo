import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { webhookOfferAccepted, webhookPlacementCreated } from '@/lib/webhooks/events';

// POST /api/v1/offers/[id]/sign
// Records that an offer has been e-signed
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ offerId: string }> }
) {
    try {
        const { offerId } = await params;
        const body = await request.json();
        const { signatureUrl, ipAddress, userAgent } = body;

        if (!signatureUrl) {
            return NextResponse.json({ error: 'Missing signatureUrl' }, { status: 400 });
        }

        // 1. Get Offer
        const { data: offer, error: offerError } = await supabaseAdmin
            .from('job_offers')
            .select('*, application:job_applications(id, candidate_id, job_id)')
            .eq('id', offerId)
            .single();

        if (offerError || !offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        // 2. Update Offer Status
        const { error: updateError } = await supabaseAdmin
            .from('job_offers')
            .update({
                status: 'signed',
                // meta_data: { signatureUrl, signed_at: new Date().toISOString(), ipAddress } // If JSON field exists
            })
            .eq('id', offerId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
        }

        // 3. Update Application Status to 'hired'
        await supabaseAdmin
            .from('job_applications')
            .update({ status: 'hired' })
            .eq('id', offer.application_id);

        // 4. Create Default Onboarding Tasks
        const defaultTasks = [
            {
                application_id: offer.application_id,
                task_type: 'document_upload',
                title: 'Upload Government ID',
                description: 'Please upload a valid government-issued ID (Passport, Driver License, etc.)',
                is_required: true,
                status: 'pending'
            },
            {
                application_id: offer.application_id,
                task_type: 'form_fill',
                title: 'Bank Details',
                description: 'Provide your bank details for payroll',
                is_required: true,
                status: 'pending'
            },
            {
                application_id: offer.application_id,
                task_type: 'acknowledgment',
                title: 'Sign Handbook',
                description: 'Read and acknowledge the Employee Handbook',
                is_required: true,
                status: 'pending'
            }
        ];

        const { error: tasksError } = await supabaseAdmin
            .from('onboarding_tasks')
            .insert(defaultTasks);

        if (tasksError) {
            console.error('Failed to create onboarding tasks:', tasksError);
            // Don't fail the request, just log it.
        }

        // Trigger webhook for offer acceptance
        const application = Array.isArray(offer.application)
            ? offer.application[0]
            : offer.application;

        if (application?.job_id) {
            const { data: job } = await supabaseAdmin
                .from('jobs')
                .select('agency_client_id, agency_clients!inner(agency_id)')
                .eq('id', application.job_id)
                .single();

            const agencyClient = job?.agency_clients;
            const agencyId = Array.isArray(agencyClient)
                ? agencyClient[0]?.agency_id
                : agencyClient?.agency_id;

            if (agencyId) {
                const acceptedAt = new Date().toISOString();

                webhookOfferAccepted({
                    offerId: offerId,
                    applicationId: offer.application_id,
                    candidateId: application.candidate_id,
                    acceptedAt: acceptedAt,
                    agencyId: agencyId,
                }).catch(err => console.error('[Webhook] Offer accepted error:', err));

                // Trigger webhook for placement creation (hired status)
                webhookPlacementCreated({
                    placementId: offer.application_id, // Application ID serves as placement ID
                    applicationId: offer.application_id,
                    candidateId: application.candidate_id,
                    jobId: application.job_id,
                    startDate: offer.start_date || acceptedAt,
                    salary: offer.salary_offered,
                    agencyId: agencyId,
                }).catch(err => console.error('[Webhook] Placement created error:', err));
            }
        }

        return NextResponse.json({ success: true, message: 'Offer signed and onboarding started' });

    } catch (error) {
        console.error('Sign Offer Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

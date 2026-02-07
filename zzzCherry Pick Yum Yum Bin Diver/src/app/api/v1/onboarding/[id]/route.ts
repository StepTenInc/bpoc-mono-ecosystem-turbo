import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// PATCH /api/v1/onboarding/[id]
// Update task status (Submit, Approve, Reject)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: taskId } = await params;
        const body = await request.json();
        const { status, formData, attachments } = body;

        const updates: any = {};
        if (status) updates.status = status;
        if (formData) updates.form_data = formData;
        if (attachments) updates.attachments = attachments;

        if (status === 'submitted') {
            updates.submitted_at = new Date().toISOString();
        } else if (status === 'approved' || status === 'rejected') {
            updates.reviewed_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('onboarding_tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ task: data });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: taskId } = await params;

    const { error } = await supabaseAdmin
        .from('onboarding_tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

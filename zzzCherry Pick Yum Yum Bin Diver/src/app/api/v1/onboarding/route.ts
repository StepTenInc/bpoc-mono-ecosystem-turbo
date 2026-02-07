import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { transformToApi, transformFromApi } from '@/lib/api/transform';

// GET /api/v1/onboarding
// List tasks for an application
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
        return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('onboarding_tasks')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    return NextResponse.json(transformToApi({ tasks: data }));
}

// POST /api/v1/onboarding
// Create a new task (Recruiter/Admin)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const input = transformFromApi(body);
        const { application_id, type, title, description, due_date } = input;

        const { data, error } = await supabaseAdmin
            .from('onboarding_tasks')
            .insert({
                application_id,
                task_type: type,
                title,
                description,
                due_date,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(transformToApi({ task: data }), { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

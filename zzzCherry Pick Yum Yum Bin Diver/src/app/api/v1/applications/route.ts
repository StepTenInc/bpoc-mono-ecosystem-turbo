import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { transformToApi, transformFromApi } from '@/lib/api/transform';
import { webhookApplicationCreated } from '@/lib/webhooks/events';

// POST /api/v1/applications
// Public endpoint for submitting applications (e.g. from Shore Agents)
export async function POST(request: NextRequest) {
  try {
    // 1. Validate API Key (Access Control)
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized - API key required' }, { status: 401 });
    }

    // Validate API key against database
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('id, api_enabled')
      .eq('api_key', apiKey)
      .single();

    if (!agency || !agency.api_enabled) {
      return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 });
    }

    const body = await request.json();
    // Accept both camelCase and snake_case input
    const input = transformFromApi(body);
    const { job_id, candidate, source = 'api' } = input;

    if (!job_id || !candidate?.email) {
      return NextResponse.json({ error: 'Missing required fields: jobId, candidate.email' }, { status: 400 });
    }

    // 2. Check Job Exists
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, agency_client_id')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 3. Find or Create Candidate
    let candidateId = null;
    const { data: existingCandidate } = await supabaseAdmin
      .from('candidates')
      .select('id')
      .eq('email', candidate.email.toLowerCase())
      .single();

    if (existingCandidate) {
      candidateId = existingCandidate.id;
    } else {
      // Create new candidate via auth user (required for foreign key constraint)
      const tempPassword = `Temp${Math.random().toString(36).substring(2, 15)}!${Date.now()}`;

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: candidate.email.toLowerCase(),
        password: tempPassword,
        email_confirm: false, // They'll verify when they receive application notification
        user_metadata: {
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          source: 'api_application'
        }
      });

      if (authError || !authUser.user) {
        console.error('Create auth user error:', authError);
        return NextResponse.json({ error: 'Failed to create candidate auth user' }, { status: 500 });
      }

      // Create candidate record
      const { data: newCandidate, error: createError } = await supabaseAdmin
        .from('candidates')
        .insert({
          id: authUser.user.id,
          email: candidate.email.toLowerCase(),
          first_name: candidate.first_name,
          last_name: candidate.last_name,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Create candidate error:', createError);
        // Rollback: delete auth user if candidate creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json({ error: 'Failed to create candidate record' }, { status: 500 });
      }
      candidateId = newCandidate.id;
    }

    // 4. Create Application
    // Check if already applied
    const { data: existingApp } = await supabaseAdmin
      .from('job_applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('candidate_id', candidateId)
      .single();

    if (existingApp) {
      const response = {
        success: true,
        message: 'Already applied',
        application_id: existingApp.id
      };
      return NextResponse.json(transformToApi(response));
    }

    const { data: app, error: appError } = await supabaseAdmin
      .from('job_applications')
      .insert({
        job_id: job_id,
        candidate_id: candidateId,
        status: 'submitted', // Use correct enum value
        released_to_client: false
      })
      .select('id')
      .single();

    if (appError) {
      console.error('Create application error:', appError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    // Trigger webhook (async - won't block response)
    const { data: jobDetails } = await supabaseAdmin
      .from('jobs')
      .select(`
        title,
        agency_client:agency_clients!inner(
          agency_id
        )
      `)
      .eq('id', job_id)
      .single();

    if (jobDetails?.agency_client?.agency_id) {
      webhookApplicationCreated({
        applicationId: app.id,
        jobId: job_id,
        candidateId: candidateId,
        candidateName: candidate.first_name && candidate.last_name
          ? `${candidate.first_name} ${candidate.last_name}`
          : undefined,
        candidateEmail: candidate.email,
        jobTitle: jobDetails.title,
        agencyId: jobDetails.agency_client.agency_id,
      }).catch(err => console.error('[Webhook] Application created error:', err));
    }

    const response = {
      success: true,
      message: 'Application submitted successfully',
      application_id: app.id
    };
    return NextResponse.json(transformToApi(response), { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

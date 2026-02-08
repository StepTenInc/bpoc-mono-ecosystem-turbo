import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/recruiter/onboarding/templates
 * Get all onboarding task templates for the agency
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', auth.userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    // Get all templates for the agency
    const { data: templates, error } = await supabaseAdmin
      .from('onboarding_task_templates')
      .select('*')
      .eq('agency_id', recruiter.agency_id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch templates' 
      }, { status: 500 });
    }

    return NextResponse.json({ templates });

  } catch (error) {
    console.error('Error in onboarding templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter/onboarding/templates
 * Create a new onboarding task template
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id, role')
      .eq('user_id', auth.userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    // Only admins and managers can create templates
    if (recruiter.role !== 'admin' && recruiter.role !== 'manager') {
      return NextResponse.json({ 
        error: 'Only admins and managers can create templates' 
      }, { status: 403 });
    }

    const { name, description, tasks, agency_client_id, is_default } = await request.json();

    if (!name || !tasks || tasks.length === 0) {
      return NextResponse.json({ 
        error: 'Template name and tasks are required' 
      }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabaseAdmin
        .from('onboarding_task_templates')
        .update({ is_default: false })
        .eq('agency_id', recruiter.agency_id);
    }

    const { data: template, error } = await supabaseAdmin
      .from('onboarding_task_templates')
      .insert({
        agency_id: recruiter.agency_id,
        agency_client_id: agency_client_id || null,
        name,
        description,
        tasks,
        is_default: is_default || false,
        created_by: recruiter.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ 
        error: 'Failed to create template',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      template,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

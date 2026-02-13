import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';

// PATCH - Update onboarding record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = await params;
    const body = await request.json();

    // Verify user owns this onboarding record
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('id, candidate_id, completion_percent')
      .eq('id', id)
      .eq('candidate_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    // Allowed fields that candidate can update
    const allowedFields = [
      // Status fields
      'personal_info_status', 'gov_id_status', 'education_status', 'medical_status',
      'data_privacy_status', 'resume_status', 'signature_status', 'emergency_contact_status',
      // Data fields
      'first_name', 'middle_name', 'last_name', 'gender', 'civil_status', 'date_of_birth',
      'contact_no', 'address', 'sss', 'tin', 'philhealth_no', 'pagibig_no',
      'education_level', 'accepts_data_privacy', 'data_privacy_signed_at',
      'signature_date', 'emergency_contact_name', 'emergency_contact_relationship', 
      'emergency_contact_phone',
      // URL fields
      'sss_doc_url', 'tin_doc_url', 'philhealth_doc_url', 'pagibig_doc_url',
      'valid_id_url', 'education_doc_url', 'medical_cert_url', 'resume_url', 'signature_url',
    ];

    // Filter to only allowed fields and normalize status values
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        // Normalize status fields to lowercase
        if (key.endsWith('_status') && typeof value === 'string') {
          updateData[key] = value.toLowerCase();
        } else {
          updateData[key] = value;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Calculate new completion percentage
    const statusFields = [
      'personal_info_status', 'gov_id_status', 'education_status', 'medical_status',
      'data_privacy_status', 'resume_status', 'signature_status', 'emergency_contact_status'
    ];

    // Get current record to merge with updates
    const { data: currentRecord } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('*')
      .eq('id', id)
      .single();

    const mergedRecord = { ...currentRecord, ...updateData };
    
    let completedCount = 0;
    for (const field of statusFields) {
      const status = (mergedRecord[field] || '').toString().toLowerCase();
      if (status === 'approved' || status === 'submitted') {
        completedCount++;
      }
    }
    
    updateData.completion_percent = Math.round((completedCount / statusFields.length) * 100);
    updateData.is_complete = completedCount === statusFields.length;
    updateData.updated_at = new Date().toISOString();

    // Update the record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('candidate_onboarding')
      .update(updateData)
      .eq('id', id)
      .eq('candidate_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update onboarding' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      onboarding: updated,
      completionPercent: updated.completion_percent,
    });

  } catch (error: any) {
    console.error('[Onboarding Update API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}

// GET - Get specific onboarding record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('candidate_onboarding')
      .select('*')
      .eq('id', id)
      .eq('candidate_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    return NextResponse.json({ onboarding: data });

  } catch (error: any) {
    console.error('[Onboarding GET API] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
  }
}

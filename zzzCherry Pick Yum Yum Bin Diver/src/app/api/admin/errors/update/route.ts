/**
 * UPDATE ERROR STATUS API
 * 
 * Updates error status, adds resolution notes, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UpdateRequest {
  errorId: string;
  status?: string;
  resolution_notes?: string;
  severity?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { errorId, status, resolution_notes, severity }: UpdateRequest = await req.json();

    if (!errorId) {
      return NextResponse.json({ success: false, error: 'errorId required' }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    
    if (status) updates.status = status;
    if (resolution_notes) updates.resolution_notes = resolution_notes;
    if (severity) updates.severity = severity;
    
    // If marking as resolved, add timestamp
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('platform_errors')
      .update(updates)
      .eq('id', errorId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, error: data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


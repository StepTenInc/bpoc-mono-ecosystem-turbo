import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logError } from '@/lib/error-logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { stage, data, status } = await req.json();

    // Save draft to database
    const { data: draft, error } = await supabase
      .from('insights_pipeline_drafts')
      .upsert({
        id: data.draftId || undefined,
        stage,
        pipeline_data: data,
        status,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving draft:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      draftId: draft.id,
      message: 'Draft saved successfully',
    });

  } catch (error: any) {
    console.error('❌ Error in save-draft:', error);
    await logError(error, {
      endpoint: '/api/admin/insights/pipeline/save-draft',
      http_method: 'POST',
      external_service: 'supabase',
    });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get('id');

    if (draftId) {
      // Get specific draft
      const { data: draft, error } = await supabase
        .from('insights_pipeline_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, draft });
    } else {
      // Get all drafts
      const { data: drafts, error } = await supabase
        .from('insights_pipeline_drafts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, drafts });
    }

  } catch (error: any) {
    console.error('❌ Error in get drafts:', error);
    await logError(error, {
      endpoint: '/api/admin/insights/pipeline/save-draft',
      http_method: 'GET',
      external_service: 'supabase',
    });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


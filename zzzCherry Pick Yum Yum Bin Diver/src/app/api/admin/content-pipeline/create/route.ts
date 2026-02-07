/**
 * CREATE NEW PIPELINE
 * Starts a new AI content pipeline session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { briefType, briefTranscript, personalityProfile, selectedSilo, selectedSiloId, isSiloPage } = await req.json();

    console.log('🚀 Creating new content pipeline');

    // Resolve silo UUID if not provided — map short key (e.g. "companies") to actual DB silo
    let resolvedSiloId = selectedSiloId || null;
    if (!resolvedSiloId && selectedSilo) {
      const { data: siloResults } = await supabase
        .from('insights_silos')
        .select('id, slug, name')
        .or(`slug.ilike.%${selectedSilo}%,name.ilike.%${selectedSilo.replace(/ies$/, 'y').replace(/s$/, '')}%`)
        .limit(5);
      
      if (siloResults && siloResults.length > 0) {
        resolvedSiloId = siloResults[0].id;
        console.log(`📌 Resolved silo "${selectedSilo}" → ${resolvedSiloId} (${siloResults[0].slug})`);
      } else {
        console.log(`⚠️ Could not resolve silo for "${selectedSilo}"`);
      }
    }

    const { data: pipeline, error } = await supabase
      .from('content_pipelines')
      .insert({
        status: 'draft',
        current_stage: 1,
        brief_type: briefType || 'text',
        brief_transcript: briefTranscript || '',
        personality_profile: personalityProfile || null,
        selected_silo: selectedSilo || null,
        selected_silo_id: resolvedSiloId,
        meta_data: isSiloPage ? { isSiloPage: true } : null,
        ai_logs: [{
          stage: 'pipeline_created',
          timestamp: new Date().toISOString(),
          message: 'New pipeline session started',
        }],
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ Pipeline created:', pipeline.id);

    return NextResponse.json({
      success: true,
      pipelineId: pipeline.id,
      pipeline,
    });

  } catch (error: any) {
    console.error('❌ Create pipeline error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



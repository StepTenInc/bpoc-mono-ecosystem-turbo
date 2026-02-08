/**
 * AI CONTENT PIPELINE - ORCHESTRATOR
 * 
 * Runs the complete 8-stage pipeline or individual stages
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/error-logger';

interface PipelineRequest {
  mode: 'full' | 'resume';
  insightId?: string; // For resume mode
  articleTemplate?: any; // For full mode
  startStage?: number; // For resume mode
}

export async function POST(req: NextRequest) {
  try {
    const body: PipelineRequest = await req.json();
    const { mode, insightId, articleTemplate, startStage = 1 } = body;

    console.log('🚀 PIPELINE ORCHESTRATOR');
    console.log(`Mode: ${mode}`);

    const baseUrl = req.nextUrl.origin;
    let currentInsightId = insightId;
    const results: any = {
      mode,
      stages: [],
    };

    // FULL MODE: Run all stages
    if (mode === 'full' && articleTemplate) {

      // STAGE 2: Research
      console.log('\n📍 Running Stage 2: Research');
      const researchRes = await fetch(`${baseUrl}/api/admin/insights/pipeline/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: articleTemplate.title,
          focusKeyword: articleTemplate.focusKeyword,
          includeSerper: true,
          includeLaborLaw: true,
        }),
      });
      const research = await researchRes.json();
      results.stages.push({ stage: 2, name: 'research', success: research.success });

      // STAGE 3: Plan Generation
      console.log('\n📍 Running Stage 3: Plan Generation');
      const planRes = await fetch(`${baseUrl}/api/admin/insights/pipeline/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTemplate,
          research: research.research,
        }),
      });
      const plan = await planRes.json();
      currentInsightId = plan.insightId;
      results.stages.push({ stage: 3, name: 'plan', success: plan.success, insightId: currentInsightId });

      // 🚦 GATE #1: Plan needs user approval before continuing
      return NextResponse.json({
        success: true,
        gate: 1,
        message: 'Plan generated - awaiting user approval',
        insightId: currentInsightId,
        plan: plan.plan,
        nextStage: 4,
      });
    }

    // RESUME MODE: Continue from specific stage
    if (mode === 'resume' && currentInsightId) {

      if (startStage <= 4) {
        // STAGE 4: Article Writing
        console.log('\n📍 Running Stage 4: Article Writing');
        const writeRes = await fetch(`${baseUrl}/api/admin/insights/pipeline/write-article`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            insightId: currentInsightId,
            plan: articleTemplate, // Plan from gate #1
          }),
        });
        const write = await writeRes.json();
        results.stages.push({ stage: 4, name: 'writing', success: write.success });
      }

      if (startStage <= 5) {
        // STAGE 5: Humanization
        console.log('\n📍 Running Stage 5: Humanization');
        const humanizeRes = await fetch(`${baseUrl}/api/admin/insights/pipeline/humanize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ insightId: currentInsightId }),
        });
        const humanize = await humanizeRes.json();
        results.stages.push({
          stage: 5,
          name: 'humanization',
          success: humanize.success,
          score: humanize.humanization?.score
        });
      }

      if (startStage <= 6) {
        // STAGE 6: SEO + Images
        console.log('\n📍 Running Stage 6: SEO + Images');
        const seoRes = await fetch(`${baseUrl}/api/admin/insights/pipeline/seo-optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ insightId: currentInsightId }),
        });
        const seo = await seoRes.json();
        results.stages.push({
          stage: 6,
          name: 'seo',
          success: seo.success,
          images: seo.images?.length
        });
      }

      if (startStage <= 7) {
        // STAGE 7: Meta + Schema
        console.log('\n📍 Running Stage 7: Meta + Schema');
        const metaRes = await fetch(`${baseUrl}/api/admin/insights/pipeline/generate-meta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ insightId: currentInsightId }),
        });
        const meta = await metaRes.json();
        results.stages.push({ stage: 7, name: 'meta', success: meta.success });
      }

      if (startStage <= 8) {
        // STAGE 8: Media Generation (Video + Images)
        console.log('\n📍 Running Stage 8: Media Generation');
        const mediaRes = await fetch(`${baseUrl}/api/admin/insights/pipeline/generate-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article: articleTemplate.content, // Use latest content
            title: articleTemplate.title,
            keywords: articleTemplate.keywords?.main || [],
            pipelineId: currentInsightId, // Track in pipeline
            insightId: currentInsightId
          }),
        });
        const media = await mediaRes.json();
        results.stages.push({
          stage: 8,
          name: 'media',
          success: media.success,
          video: media.video ? true : false,
          images: media.images?.length
        });
      }

      if (startStage <= 9) {
        // STAGE 9: Smart Link Scanner
        console.log('\n📍 Running Stage 9: Smart Link Scanner');
        const linkRes = await fetch(`${baseUrl}/api/admin/insights/pipeline/scan-links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ insightId: currentInsightId }),
        });
        const links = await linkRes.json();
        results.stages.push({
          stage: 9,
          name: 'link_scanner',
          success: links.success,
          suggestions: links.suggestions?.length
        });
      }

      // 🚦 GATE #2: Final review before publish
      return NextResponse.json({
        success: true,
        gate: 2,
        message: 'Pipeline complete - awaiting final approval',
        insightId: currentInsightId,
        results,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid pipeline request',
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Pipeline orchestrator error:', error);
    await logError(error, {
      endpoint: '/api/admin/insights/pipeline/run',
      http_method: 'POST',
    });
    return NextResponse.json({
      error: error.message || 'Pipeline failed'
    }, { status: 500 });
  }
}


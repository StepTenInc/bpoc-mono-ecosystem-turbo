/**
 * AI CONTENT PIPELINE - IMPROVE BRIEF
 *
 * Takes the admin's brief and:
 * - Fixes grammar and spelling errors (preserving the original idea)
 * - Provides optional suggestions to enhance the brief
 *
 * IMPORTANT: Never replace the admin's core idea - only fix errors and offer suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logError } from '@/lib/error-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { brief } = await req.json();

    if (!brief || brief.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Brief is too short to improve'
      }, { status: 400 });
    }

    console.log('✨ Improving brief with AI...');
    console.log('Original:', brief);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert editor for BPOC (BPO Career), a website helping Filipino BPO workers.

Your job is to REVIEW and LIGHTLY IMPROVE the admin's article brief by:
1. Fixing spelling and grammar errors ONLY
2. Keeping the admin's ORIGINAL IDEA and INTENT completely intact
3. Providing OPTIONAL suggestions as separate items (not replacing the brief)

CRITICAL RULES:
- DO NOT change the topic or core idea
- DO NOT rewrite the entire brief
- DO NOT add new topics the admin didn't mention
- ONLY fix grammar, spelling, punctuation, and sentence structure
- Suggestions should be OPTIONAL enhancements, shown separately

Return JSON with this structure:
{
  "cleanedBrief": "The admin's original brief with ONLY grammar/spelling fixes applied. Keep it as close to the original as possible.",
  "corrections": [
    {
      "original": "the exact text with error",
      "suggested": "the corrected text",
      "type": "spelling|grammar|punctuation",
      "explanation": "Why this was corrected"
    }
  ],
  "suggestions": [
    {
      "title": "Short title for the suggestion",
      "description": "Optional enhancement idea the admin can choose to add",
      "example": "Example of how to incorporate this"
    }
  ],
  "summary": "Brief summary: X grammar fixes applied, Y optional suggestions available"
}

Example:
- Original: "i want to write about bpo salary in philippines and how to negociate better pay"
- cleanedBrief: "I want to write about BPO salary in the Philippines and how to negotiate better pay."
- corrections: [{"original": "negociate", "suggested": "negotiate", "type": "spelling"}]
- suggestions: [{"title": "Add specific companies", "description": "Consider mentioning salary ranges at specific companies", "example": "...at companies like Concentrix, Accenture, and TaskUs"}]`
        },
        {
          role: 'user',
          content: `Please review and fix grammar/spelling in this brief (keep the original idea intact):\n\n"${brief}"`
        }
      ],
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    console.log('✅ Brief reviewed!');
    console.log('Cleaned:', result.cleanedBrief);
    console.log('Corrections:', result.corrections?.length || 0);
    console.log('Suggestions:', result.suggestions?.length || 0);

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error: any) {
    console.error('❌ Improve brief error:', error);
    await logError(error, {
      endpoint: '/api/admin/insights/pipeline/fix-brief',
      http_method: 'POST',
      external_service: 'openai',
    });
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to improve brief'
    }, { status: 500 });
  }
}


/**
 * AI CONTENT PIPELINE - Improve Topic
 * Uses GPT-4o to enhance article topic for better SEO
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ success: false, error: 'Missing topic' }, { status: 400 });
    }

    console.log('✨ Improving topic:', topic);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [{
        role: 'system',
        content: `You are an SEO expert for Philippine BPO industry content. 
Improve the given article topic to be:
- More specific and targeted
- SEO-friendly with natural keywords
- Compelling for Filipino BPO workers
- Clear about what the reader will learn

Return ONLY the improved topic title (no explanations, no quotes).
Keep it under 70 characters for SEO.`
      }, {
        role: 'user',
        content: `Improve this article topic: "${topic}"`
      }],
    });

    const improvedTopic = response.choices[0]?.message?.content?.trim();
    
    if (!improvedTopic) {
      throw new Error('No response from AI');
    }

    console.log('✅ Improved topic:', improvedTopic);

    return NextResponse.json({
      success: true,
      improvedTopic,
      original: topic,
    });

  } catch (error: any) {
    console.error('❌ Improve topic error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to improve topic' 
    }, { status: 500 });
  }
}



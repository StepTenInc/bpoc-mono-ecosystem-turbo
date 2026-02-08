/**
 * HR Assistant API - Search Knowledge Base
 * 
 * GET /api/hr-assistant/search?q=regularization&role=candidate
 * 
 * Query params:
 * - q: search query
 * - role: candidate | recruiter | admin
 * - limit: number of results (default 10)
 * 
 * Response:
 * {
 *   "results": [...],
 *   "count": 10
 * }
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

/**
 * GET /api/hr-assistant/search
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const role = searchParams.get('role') || 'candidate';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate input
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    if (!['candidate', 'recruiter', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // Search knowledge base
    const { data, error } = await supabase.rpc('search_hr_knowledge', {
      query_embedding: JSON.stringify(embedding),
      user_role: role,
      match_threshold: 0.7,
      match_count: limit
    });

    if (error) {
      throw error;
    }

    // Format results
    const results = (data || []).map((result: any) => ({
      id: result.id,
      section: result.document_section,
      article: result.article_number,
      content: result.content,
      topics: result.topics,
      similarity: Math.round(result.similarity * 100)
    }));

    return NextResponse.json({
      results,
      count: results.length
    });

  } catch (error) {
    console.error('[HR Assistant Search] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


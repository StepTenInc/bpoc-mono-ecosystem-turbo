/**
 * HR Assistant API - Get Article Content
 * 
 * GET /api/hr-assistant/article/295?role=candidate
 * 
 * Response:
 * {
 *   "article": "295",
 *   "chunks": [...],
 *   "topics": [...]
 * }
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/hr-assistant/article/[articleNumber]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { articleNumber: string } }
) {
  try {
    const articleNumber = params.articleNumber;
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') || 'candidate';

    if (!['candidate', 'recruiter', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get article content
    const { data, error } = await supabase.rpc('get_hr_related_content', {
      source_article_number: articleNumber,
      user_role: role,
      match_count: 20
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Collect all topics
    const allTopics = new Set<string>();
    data.forEach((chunk: any) => {
      chunk.topics.forEach((topic: string) => allTopics.add(topic));
    });

    // Format chunks
    const chunks = data.map((chunk: any) => ({
      id: chunk.id,
      content: chunk.content,
      section: chunk.document_section,
      topics: chunk.topics
    }));

    return NextResponse.json({
      article: articleNumber,
      chunks,
      topics: Array.from(allTopics),
      count: chunks.length
    });

  } catch (error) {
    console.error('[HR Assistant Article] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { updateAllKnowledgeEmbeddings, addKnowledge } from '@/lib/embeddings';

// ============================================
// EMBEDDINGS MANAGEMENT API
// Admin-only endpoint for managing embeddings
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_all_embeddings': {
        // Update embeddings for all knowledge entries
        const result = await updateAllKnowledgeEmbeddings();
        return NextResponse.json({
          success: true,
          message: `Updated ${result.updated} embeddings, ${result.failed} failed`,
          ...result,
        });
      }

      case 'add_knowledge': {
        // Add new knowledge entry with embedding
        const { title, content, category, source } = body;
        
        if (!title || !content || !category) {
          return NextResponse.json(
            { error: 'title, content, and category are required' },
            { status: 400 }
          );
        }

        const success = await addKnowledge(
          title,
          content,
          category,
          source || 'manual'
        );

        return NextResponse.json({
          success,
          message: success ? 'Knowledge added with embedding' : 'Failed to add knowledge',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: update_all_embeddings, add_knowledge' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Embeddings API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'chat-embeddings',
    actions: ['update_all_embeddings', 'add_knowledge'],
  });
}


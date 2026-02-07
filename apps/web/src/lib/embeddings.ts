import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================
// OPENAI EMBEDDINGS UTILITY
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI text-embedding-3-small produces 1536 dimensions
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
  });
  
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map(t => t.trim()),
  });
  
  return response.data.map(d => d.embedding);
}

/**
 * Search knowledge base using vector similarity
 */
export async function searchKnowledgeVector(
  query: string,
  limit: number = 5,
  category?: string
): Promise<Array<{
  id: string;
  title: string;
  content: string;
  category: string;
  similarity: number;
}>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Use Supabase RPC for vector similarity search
    // This uses pgvector's cosine distance operator
    let rpcQuery = supabaseAdmin.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: limit,
    });

    const { data, error } = await rpcQuery;

    if (error) {
      console.error('Knowledge vector search error:', error);
      // Fallback to keyword search if vector search fails
      return fallbackKeywordSearch(query, limit, category);
    }

    // Filter by category if specified
    let results = data || [];
    if (category) {
      results = results.filter((r: any) => r.category === category);
    }

    return results.map((r: any) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      similarity: r.similarity,
    }));
  } catch (error) {
    console.error('Vector search failed, using fallback:', error);
    return fallbackKeywordSearch(query, limit, category);
  }
}

/**
 * Fallback keyword search when vector search fails
 */
async function fallbackKeywordSearch(
  query: string,
  limit: number,
  category?: string
): Promise<Array<{
  id: string;
  title: string;
  content: string;
  category: string;
  similarity: number;
}>> {
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2);
  
  let dbQuery = supabaseAdmin
    .from('chat_agent_knowledge')
    .select('id, title, content, category')
    .eq('is_active', true);
  
  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }
  
  const { data: knowledge } = await dbQuery.limit(20);

  if (!knowledge) return [];

  // Score by keyword matches
  const scored = knowledge.map(k => {
    let score = 0;
    const contentLower = (k.title + ' ' + k.content).toLowerCase();
    keywords.forEach(kw => {
      if (contentLower.includes(kw)) score += 0.1;
    });
    return { ...k, similarity: Math.min(score, 1) };
  });

  return scored
    .filter(k => k.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Search user's conversation memory
 */
export async function searchMemoryVector(
  userId: string,
  query: string,
  limit: number = 3
): Promise<Array<{
  id: string;
  content: string;
  content_type: string;
  similarity: number;
}>> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    const { data, error } = await supabaseAdmin.rpc('match_user_memory', {
      query_embedding: queryEmbedding,
      user_id_filter: userId,
      match_threshold: 0.6,
      match_count: limit,
    });

    if (error) {
      console.error('Memory vector search error:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      content: r.content,
      content_type: r.content_type,
      similarity: r.similarity,
    }));
  } catch (error) {
    console.error('Memory search failed:', error);
    return [];
  }
}

/**
 * Store a new memory with embedding
 */
export async function storeMemory(
  userId: string,
  conversationId: string,
  content: string,
  contentType: 'conversation' | 'summary' | 'preference' | 'feedback' = 'conversation'
): Promise<boolean> {
  try {
    const embedding = await generateEmbedding(content);
    
    const { error } = await supabaseAdmin
      .from('chat_agent_memory')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        content,
        content_type: contentType,
        embedding: JSON.stringify(embedding), // Supabase expects JSON string for vector
      });

    if (error) {
      console.error('Store memory error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to store memory:', error);
    return false;
  }
}

/**
 * Add new knowledge to the knowledge base
 */
export async function addKnowledge(
  title: string,
  content: string,
  category: string,
  source: 'manual' | 'docs' | 'faq' | 'learned' | 'conversation' = 'manual',
  confidenceScore: number = 1.0
): Promise<boolean> {
  try {
    const embedding = await generateEmbedding(`${title} ${content}`);
    
    const { error } = await supabaseAdmin
      .from('chat_agent_knowledge')
      .insert({
        title,
        content,
        category,
        source,
        confidence_score: confidenceScore,
        embedding: JSON.stringify(embedding),
        is_approved: source === 'manual' || source === 'docs' || source === 'faq',
      });

    if (error) {
      console.error('Add knowledge error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to add knowledge:', error);
    return false;
  }
}

/**
 * Update embeddings for all knowledge entries that don't have them
 */
export async function updateAllKnowledgeEmbeddings(): Promise<{
  updated: number;
  failed: number;
}> {
  // Fetch all knowledge without embeddings
  const { data: knowledge, error } = await supabaseAdmin
    .from('chat_agent_knowledge')
    .select('id, title, content')
    .is('embedding', null);

  if (error || !knowledge) {
    console.error('Failed to fetch knowledge:', error);
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;

  for (const k of knowledge) {
    try {
      const embedding = await generateEmbedding(`${k.title} ${k.content}`);
      
      const { error: updateError } = await supabaseAdmin
        .from('chat_agent_knowledge')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', k.id);

      if (updateError) {
        failed++;
      } else {
        updated++;
      }
      
      // Rate limiting - 100ms delay between API calls
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      failed++;
    }
  }

  return { updated, failed };
}


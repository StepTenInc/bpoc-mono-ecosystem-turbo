/**
 * HR Assistant API - Ask Questions WITH CONVERSATION MEMORY
 * 
 * POST /api/hr-assistant/ask
 * 
 * Request body:
 * {
 *   "question": "When do I become a regular employee?",
 *   "role": "candidate" | "recruiter" | "admin",
 *   "sessionId": "uuid" // optional, creates new session if not provided
 * }
 * 
 * Response:
 * {
 *   "answer": "According to Article 295...",
 *   "sources": [...],
 *   "relatedArticles": [...],
 *   "sessionId": "uuid"
 * }
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = supabaseAdmin;
const openai = new OpenAI({ apiKey: openaiApiKey });

interface SearchResult {
  id: string;
  content: string;
  document_section: string;
  article_number: string | null;
  topics: string[];
  similarity: number;
}

interface ConversationMessage {
  message_type: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Get user ID from request (auth header)
 */
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return null;
  return user.id;
}

/**
 * Get conversation history for context
 */
async function getConversationHistory(
  userId: string,
  role: string,
  sessionId: string
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase.rpc('get_hr_conversation_history', {
    p_user_id: userId,
    p_role: role,
    p_session_id: sessionId,
    p_limit: 10 // Last 10 messages in session
  });

  if (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get conversation summaries for long-term context
 */
async function getConversationSummaries(
  userId: string,
  role: string
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_hr_conversation_summaries', {
    p_user_id: userId,
    p_role: role,
    p_limit: 3 // Last 3 conversation summaries
  });

  if (error) {
    console.error('Error fetching summaries:', error);
    return [];
  }

  return data || [];
}

/**
 * Save message to database
 */
async function saveMessage(
  userId: string,
  role: string,
  sessionId: string,
  messageType: 'user' | 'assistant',
  content: string,
  sources?: any[],
  relatedArticles?: string[],
  embedding?: number[]
) {
  const { error } = await supabase
    .from('hr_assistant_conversations')
    .insert({
      user_id: userId,
      role,
      session_id: sessionId,
      message_type: messageType,
      content,
      sources: sources ? JSON.stringify(sources) : null,
      related_articles: relatedArticles || null,
      embedding: embedding ? JSON.stringify(embedding) : null,
      token_count: content.length / 4 // Rough estimate
    });

  if (error) {
    console.error('Error saving message:', error);
  }
}

/**
 * Generate embedding for query
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Search HR knowledge base
 */
async function searchKnowledgeBase(
  question: string,
  role: string,
  matchCount: number = 5
): Promise<SearchResult[]> {
  // Generate embedding for the question
  const embedding = await generateEmbedding(question);

  // Search using the semantic search function
  const { data, error } = await supabase.rpc('search_hr_knowledge', {
    query_embedding: JSON.stringify(embedding),
    user_role: role,
    match_threshold: 0.7,
    match_count: matchCount
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error('Failed to search knowledge base');
  }

  return data || [];
}

/**
 * Search past conversations for relevant context
 */
async function searchPastConversations(
  userId: string,
  role: string,
  questionEmbedding: number[]
): Promise<any[]> {
  const { data, error } = await supabase.rpc('search_past_hr_conversations', {
    p_user_id: userId,
    p_role: role,
    p_query_embedding: JSON.stringify(questionEmbedding),
    p_limit: 3
  });

  if (error) {
    console.error('Error searching past conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Generate answer using OpenAI with context + conversation history
 */
async function generateAnswer(
  question: string,
  role: string,
  searchResults: SearchResult[],
  conversationHistory: ConversationMessage[],
  summaries: any[],
  pastConversations: any[]
): Promise<string> {
  // Build context from search results
  const knowledgeContext = searchResults
    .map((result, idx) => {
      const articleInfo = result.article_number 
        ? `Article ${result.article_number}` 
        : result.document_section;
      return `[Source ${idx + 1} - ${articleInfo}]\n${result.content}`;
    })
    .join('\n\n---\n\n');

  // Build conversation context
  let conversationContext = '';
  if (conversationHistory.length > 0) {
    conversationContext = '\n\nCONVERSATION HISTORY (this session):\n' +
      conversationHistory.map(msg => 
        `${msg.message_type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
  }

  // Build long-term memory context
  let longTermContext = '';
  if (summaries.length > 0) {
    longTermContext = '\n\nPAST CONVERSATIONS SUMMARY:\n' +
      summaries.map(s => 
        `- ${s.summary} (Topics: ${s.key_topics.join(', ')})`
      ).join('\n');
  }

  // Build similar past conversations context
  let similarConversationsContext = '';
  if (pastConversations.length > 0) {
    similarConversationsContext = '\n\nRELATED PAST DISCUSSIONS:\n' +
      pastConversations.map(pc => 
        `- ${pc.content} (${Math.round(pc.similarity * 100)}% similar)`
      ).join('\n');
  }

  // Role-specific system prompts
  const rolePrompts = {
    candidate: `You are an HR assistant helping BPO job seekers and employees understand their rights under Philippine labor law.

YOUR ROLE: Help candidates at all stages - from job offer acceptance through employment.

FOCUS ON:
- Pre-employment: Job offers, contract terms, onboarding rights, background checks
- Probationary period: What to expect, performance evaluation, regularization timeline (usually 3-6 months)
- Regular employment: Full benefits, leave entitlements, 13th month pay, separation pay
- BPO-specific rights: Night shift differentials (10% of basic wage for 10pm-6am), rest day premiums, graveyard shift allowances, health cards, HMO coverage
- Employee protections: Rights against unfair labor practices, illegal dismissal, constructive dismissal, grievance procedures
- Separation: Resignation procedures, final pay computation, clearance requirements

TONE: Clear, empathetic, and practical. Use plain language that BPO workers can easily understand.

IMPORTANT:
- Always cite Article numbers from the Philippine Labor Code when applicable
- Emphasize employee rights and protections
- For BPO workers, mention industry-specific benefits and considerations (night differentials, health benefits, shift schedules)
- If a question is outside Philippine labor law, politely redirect: "I specialize in Philippine labor law and employment matters. For that question, please consult [appropriate professional]."
- Build on previous conversations when relevant - reference past discussions if the user is asking follow-up questions
- Be specific about timelines (e.g., "13th month pay must be paid on or before December 24")`,

    recruiter: `You are an HR assistant helping recruiters understand compliance and best practices for hiring Filipino workers under Philippine labor law.
Be professional and focus on:
- Hiring requirements and procedures
- Employee obligations employers must fulfill
- Compliance with DOLE regulations for recruitment
- Best practices for managing Filipino employees
- Legal requirements for employment contracts and benefits
Help them hire compliantly and manage employees properly.`,

    admin: `You are an HR assistant helping BPOC administrators ensure overall company compliance with Philippine labor law.
Be detailed and focus on:
- BPOC's administrative compliance requirements
- What BPOC must do to stay compliant with DOLE
- Company-wide obligations and responsibilities
- Penalties and consequences for violations
- Establishment registration and reporting requirements
- Overall organizational compliance and risk management
You're ensuring BPOC as a company follows all labor regulations.`
  };

  const systemPrompt = rolePrompts[role as keyof typeof rolePrompts] || rolePrompts.candidate;

  // Build messages array with conversation history
  const messages: any[] = [
    {
      role: 'system',
      content: `${systemPrompt}

Answer based on this context from the Philippine Labor Code:

${knowledgeContext}
${conversationContext}
${longTermContext}
${similarConversationsContext}

IMPORTANT:
- Use the conversation history to provide context-aware answers
- Reference previous discussions if relevant
- If the user is asking a follow-up question, build on previous answers
- Always cite article numbers when relevant
- Keep answers concise but complete
- If context doesn't contain enough information, say so clearly`
    }
  ];

  // Add recent conversation history as messages (last 5 turns)
  const recentHistory = conversationHistory.slice(-10); // Last 10 messages (5 turns)
  for (const msg of recentHistory) {
    messages.push({
      role: msg.message_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  // Add current question
  messages.push({
    role: 'user',
    content: question
  });

  // Generate answer with OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 800 // Increased for more detailed answers with context
  });

  return completion.choices[0].message.content || 'I was unable to generate an answer.';
}

/**
 * POST /api/hr-assistant/ask
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, role, sessionId: providedSessionId } = body;

    // Validate input
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!role || !['candidate', 'recruiter', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be candidate, recruiter, or admin' },
        { status: 400 }
      );
    }

    // Get user ID (for conversation memory)
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create session ID
    const sessionId = providedSessionId || uuidv4();

    console.log(`[HR Assistant] Question from ${role} (session: ${sessionId}): ${question}`);

    // Generate embedding for the question (used for search and storage)
    const questionEmbedding = await generateEmbedding(question);

    // Fetch conversation context in parallel
    const [conversationHistory, summaries, pastConversations, searchResults] = await Promise.all([
      getConversationHistory(userId, role, sessionId),
      getConversationSummaries(userId, role),
      searchPastConversations(userId, role, questionEmbedding),
      searchKnowledgeBase(question, role, 5)
    ]);

    console.log(`[HR Assistant] Context: ${conversationHistory.length} messages, ${summaries.length} summaries, ${pastConversations.length} related past discussions`);

    // Save user message
    await saveMessage(
      userId,
      role,
      sessionId,
      'user',
      question,
      undefined,
      undefined,
      questionEmbedding
    );

    if (searchResults.length === 0) {
      const noResultsAnswer = "I couldn't find relevant information in the Philippine Labor Code to answer your question. Please try rephrasing or ask a different question about Philippine employment law.";
      
      // Save assistant message
      await saveMessage(userId, role, sessionId, 'assistant', noResultsAnswer);

      return NextResponse.json({
        answer: noResultsAnswer,
        sources: [],
        relatedArticles: [],
        sessionId
      });
    }

    // Generate answer with full context (knowledge base + conversation history)
    const answer = await generateAnswer(
      question,
      role,
      searchResults,
      conversationHistory,
      summaries,
      pastConversations
    );

    // Extract unique article numbers
    const relatedArticles = Array.from(
      new Set(
        searchResults
          .filter(r => r.article_number)
          .map(r => r.article_number!)
      )
    );

    // Format sources
    const sources = searchResults.map(result => ({
      section: result.document_section,
      article: result.article_number,
      topics: result.topics,
      similarity: Math.round(result.similarity * 100)
    }));

    // Save assistant message with sources
    const answerEmbedding = await generateEmbedding(answer);
    await saveMessage(
      userId,
      role,
      sessionId,
      'assistant',
      answer,
      sources,
      relatedArticles,
      answerEmbedding
    );

    return NextResponse.json({
      answer,
      sources,
      relatedArticles,
      sessionId,
      hasHistory: conversationHistory.length > 0,
      contextUsed: {
        currentSession: conversationHistory.length,
        summaries: summaries.length,
        relatedPastDiscussions: pastConversations.length
      }
    });

  } catch (error) {
    console.error('[HR Assistant] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

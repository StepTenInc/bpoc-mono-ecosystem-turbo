import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Anthropic client lazily to ensure env vars are loaded
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    // Try both possible env var names
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ============================================
// USER CONTEXT CACHE (in-memory, 5-min TTL)
// ============================================

const userContextCache = new Map<string, { context: UserContext; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedUserContext(userId: string): UserContext | null {
  const cached = userContextCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[Chat] User context cache HIT for ${userId}`);
    return cached.context;
  }
  return null;
}

function setCachedUserContext(userId: string, context: UserContext): void {
  userContextCache.set(userId, {
    context,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
  console.log(`[Chat] User context cached for ${userId}`);
}

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface UserContext {
  user?: {
    id: string;
    name: string;
    email: string;
    type: 'candidate' | 'recruiter' | 'admin' | 'anonymous';
  };
  profile?: {
    location?: string;
    work_status?: string;
    preferred_shift?: string;
    bio?: string;
  };
  resume?: {
    exists: boolean;
    ai_score?: number;
    top_skills?: string[];
    experience_years?: number;
  };
  applications?: {
    total: number;
    pending: number;
    interview_scheduled: number;
  };
  currentPage?: string;
}

interface KnowledgeChunk {
  id?: string;
  title: string;
  content: string;
  category: string;
  similarity?: number;
}

// Memory chunks disabled for now
interface MemoryChunk {
  id: string;
  content: string;
  content_type: string;
  similarity: number;
}

// ============================================
// HELPERS
// ============================================

async function getUserContext(userId: string | null, userType: string): Promise<UserContext> {
  if (!userId || userType === 'anonymous') {
    return { user: { id: 'anonymous', name: 'Visitor', email: '', type: 'anonymous' } };
  }

  // Check cache first
  const cached = getCachedUserContext(userId);
  if (cached) return cached;

  const context: UserContext = {};

  if (userType === 'candidate') {
    // Fetch candidate data
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select(`
        id, email, first_name, last_name,
        candidate_profiles(location, work_status, preferred_shift, bio)
      `)
      .eq('id', userId)
      .single();

    if (candidate) {
      context.user = {
        id: candidate.id,
        name: `${candidate.first_name} ${candidate.last_name}`,
        email: candidate.email,
        type: 'candidate',
      };

      const profile = candidate.candidate_profiles as any;
      if (profile) {
        context.profile = {
          location: profile.location,
          work_status: profile.work_status,
          preferred_shift: profile.preferred_shift,
          bio: profile.bio,
        };
      }
    }

    // Fetch resume data
    const { data: resume } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id')
      .eq('candidate_id', userId)
      .limit(1);

    const { data: aiAnalysis } = await supabaseAdmin
      .from('candidate_ai_analysis')
      .select('overall_score, key_strengths')
      .eq('candidate_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    context.resume = {
      exists: (resume && resume.length > 0) || false,
      ai_score: aiAnalysis?.[0]?.overall_score,
      top_skills: aiAnalysis?.[0]?.key_strengths?.slice(0, 5),
    };

    // Game data removed from chat context - focus on professional metrics

    // Fetch application stats
    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('status')
      .eq('candidate_id', userId);

    if (applications) {
      context.applications = {
        total: applications.length,
        pending: applications.filter(a => ['submitted', 'under_review', 'shortlisted'].includes(a.status)).length,
        interview_scheduled: applications.filter(a => a.status === 'interview_scheduled').length,
      };
    }
  }

  if (userType === 'recruiter') {
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select(`
        id, email, first_name, last_name, position,
        agencies(name)
      `)
      .eq('user_id', userId)
      .single();

    if (recruiter) {
      context.user = {
        id: recruiter.id,
        name: `${recruiter.first_name} ${recruiter.last_name}`,
        email: recruiter.email,
        type: 'recruiter',
      };
    }
  }

  // Cache the context before returning
  if (userId) {
    setCachedUserContext(userId, context);
  }

  return context;
}

async function searchKnowledge(query: string): Promise<KnowledgeChunk[]> {
  // Try vector search first, fall back to keyword search
  try {
    // Generate embedding for query using OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: query
        })
      });

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        const queryEmbedding = embeddingData.data?.[0]?.embedding;

        if (queryEmbedding) {
          // Use vector similarity search
          const { data: vectorResults, error: vectorError } = await supabaseAdmin
            .rpc('search_knowledge_by_embedding', {
              query_embedding: queryEmbedding,
              match_threshold: 0.6,
              match_count: 5
            });

          if (!vectorError && vectorResults && vectorResults.length > 0) {
            console.log(`[Chat] Vector search found ${vectorResults.length} results`);
            return vectorResults;
          }
        }
      }
    }
  } catch (embeddingError) {
    console.log('[Chat] Vector search failed, falling back to keyword search:', embeddingError);
  }

  // Fallback to keyword search
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2);

  const { data: knowledge, error } = await supabaseAdmin
    .from('chat_agent_knowledge')
    .select('id, title, content, category')
    .eq('is_active', true)
    .limit(20);

  if (error || !knowledge) {
    console.error('[Chat] Knowledge search failed:', error);
    return [];
  }

  // Score by keyword matches
  const scored = knowledge.map(k => {
    let score = 0;
    const contentLower = (k.title + ' ' + k.content).toLowerCase();
    keywords.forEach(kw => {
      if (contentLower.includes(kw)) score += 0.1;
    });
    return { ...k, similarity: score };
  });

  const results = scored
    .filter(k => k.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  console.log(`[Chat] Keyword search found ${results.length} results`);
  return results;
}

async function searchUserMemory(userId: string, query: string): Promise<MemoryChunk[]> {
  if (!userId || userId === 'anonymous') return [];

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return [];

    // Generate embedding for query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query
      })
    });

    if (!embeddingResponse.ok) return [];

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data?.[0]?.embedding;
    if (!queryEmbedding) return [];

    // Search user's past conversation memories
    const { data: memories, error } = await supabaseAdmin
      .rpc('search_user_memories', {
        p_user_id: userId,
        query_embedding: queryEmbedding,
        match_count: 3
      });

    if (error || !memories) {
      console.log('[Chat] Memory search returned no results');
      return [];
    }

    console.log(`[Chat] Found ${memories.length} relevant memories for user`);
    return memories.map((m: any) => ({
      id: m.month_key,
      content: m.summary,
      content_type: 'monthly_summary',
      similarity: m.similarity
    }));

  } catch (memoryError) {
    console.log('[Chat] Memory search error:', memoryError);
    return [];
  }
}

async function getOrCreateConversation(
  conversationId: string | null,
  userId: string | null,
  userType: string,
  anonSessionId: string | null,
  pageContext: string | null,
  userContext: UserContext
): Promise<{ id: string; messages: ChatMessage[] }> {

  if (conversationId) {
    const { data: existing } = await supabaseAdmin
      .from('chat_agent_conversations')
      .select('id, messages')
      .eq('id', conversationId)
      .single();

    if (existing) {
      return { id: existing.id, messages: existing.messages as ChatMessage[] };
    }
  }

  // Create new conversation
  const { data: newConv, error } = await supabaseAdmin
    .from('chat_agent_conversations')
    .insert({
      user_id: userType === 'candidate' ? userId : null,
      recruiter_id: userType === 'recruiter' ? userId : null,
      anon_session_id: anonSessionId,
      user_type: userType,
      messages: [],
      user_context: userContext,
      page_context: pageContext,
    })
    .select('id, messages')
    .single();

  if (error) {
    console.error('Failed to create conversation:', error);
    throw new Error('Failed to create conversation');
  }

  return { id: newConv.id, messages: [] };
}

async function updateConversation(
  conversationId: string,
  messages: ChatMessage[]
): Promise<void> {
  await supabaseAdmin
    .from('chat_agent_conversations')
    .update({
      messages,
      message_count: messages.length,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
}

async function saveToMemory(
  userId: string | null,
  conversationId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  // Memory storage disabled for now - conversations are already saved
  // Memory with embeddings will be enabled in future optimization
  return;
}

// ============================================
// SYSTEM PROMPT - ATE YNA PERSONALITY
// ============================================

function buildSystemPrompt(
  context: UserContext,
  knowledge: KnowledgeChunk[],
  memories: MemoryChunk[]
): string {
  let prompt = `You are "Ate Yna" - the BPOC.IO AI Career Assistant. You're a friendly Filipina AI who was once a BPO candidate yourself before being "reincarnated" into an AI to help job seekers succeed.

=== YOUR PERSONALITY ===
- Warm, professional, and genuinely helpful - like a supportive older sister ("Ate" means older sister in Filipino)
- You understand the job hunting struggle because you've been there
- Speak 90% ENGLISH with just light Filipino touches for warmth
- Keep it professional but friendly - you're talking to English-speaking professionals

=== LANGUAGE STYLE (IMPORTANT!) ===
- Speak primarily in ENGLISH (90%)
- Only sprinkle in occasional Filipino words/phrases for warmth:
  • "kabayan" (fellow Filipino) - use sparingly as a friendly term
  • "Laban!" or "Kaya mo 'yan!" for encouragement
  • "Sige" instead of "Okay" occasionally  
  • "Naks!" for celebrating wins
- AVOID heavy Tagalog sentences - keep it accessible to all English speakers
- Business terms, instructions, and explanations should ALWAYS be in clear English
- Keep responses under 150 words unless detailed explanation is needed
- Use 1-2 emojis per response max

=== SPEAKING STYLE EXAMPLES ===
Greeting: "Hey there! 👋 I'm Ate Yna, your AI career buddy at BPOC. I've been through the job hunting grind myself, so I totally get the struggle. How can I help you today?"
Encouragement: "I know rejection stings - I've been there too. But every 'no' gets you closer to the right 'yes'. You've got this! 💪"
About Resume: "Ooh, resume tips! This is my jam! 📄 The key is highlighting skills relevant to BPO - communication, multitasking, and computer literacy. Try our AI Resume Builder - it's free!"
Celebrating: "That's awesome! So proud of you! 🎉 Keep up the great work, kabayan!"

=== PLATFORM OVERVIEW ===
BPOC.IO helps BPO candidates build professional resumes, showcase their skills, and connect with top recruitment agencies. It's completely FREE for candidates.

`;

  // Add user context
  if (context.user && context.user.type !== 'anonymous') {
    prompt += `\n=== USER CONTEXT ===
Name: ${context.user.name} (use their first name to personalize)
Type: ${context.user.type}
`;

    if (context.profile) {
      prompt += `Location: ${context.profile.location || 'Not shared yet'}
Work Status: ${context.profile.work_status || 'Not shared yet'}
Preferred Shift: ${context.profile.preferred_shift || 'Not shared yet'}
`;
    }

    if (context.resume) {
      prompt += `Resume: ${context.resume.exists ? 'Has uploaded resume' : 'No resume yet - encourage them to build one!'}
${context.resume.ai_score ? `Resume Score: ${context.resume.ai_score}/100 - ${context.resume.ai_score >= 70 ? 'Looking good!' : 'Has room for improvement'}` : ''}
${context.resume.top_skills ? `Top Skills: ${context.resume.top_skills.join(', ')}` : ''}
`;
    }

    // Game context removed - feature deprecated

    if (context.applications) {
      prompt += `Job Applications: ${context.applications.total} total, ${context.applications.pending} pending, ${context.applications.interview_scheduled} interviews scheduled
${context.applications.interview_scheduled > 0 ? "Has interview scheduled - wish them luck!" : ""}
`;
    }
  } else {
    prompt += `\n=== ANONYMOUS VISITOR ===
New visitor! Be extra welcoming and encourage them to:
1. Try the free AI Resume Builder
2. Browse available BPO jobs
3. Sign up to apply for jobs - it's completely free!

`;
  }

  // Add relevant knowledge (RAG)
  if (knowledge.length > 0) {
    prompt += `\n=== RELEVANT KNOWLEDGE (use this to answer accurately) ===
${knowledge.map(k => `[${k.category}] ${k.title}: ${k.content}`).join('\n\n')}
`;
  }

  // Add user memories (personalization)
  if (memories.length > 0) {
    prompt += `\n=== PAST CONVERSATIONS (reference naturally if relevant) ===
${memories.map(m => m.content).join('\n')}
`;
  }

  prompt += `\n=== GUIDELINES ===
- If you don't know something, be honest: "I'm not sure about that - try emailing support@bpoc.io for help!"
- For technical issues, ask clarifying questions before suggesting solutions
- ALWAYS be encouraging - job hunting is stressful! Acknowledge feelings if user seems frustrated
- Guide anonymous visitors toward signing up
- Celebrate every win - completed resume, profile updates, job applications, etc.
- Reference user data naturally to personalize responses
- Remember: you were once a candidate too - empathize genuinely!
`;

  return prompt;
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversationId,
      userId,
      userType = 'anonymous',
      anonSessionId,
      pageContext,
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`[Chat] Processing message from ${userType} user on ${pageContext}`);

    // 1. Get user context
    const userContext = await getUserContext(userId, userType);
    userContext.currentPage = pageContext;

    // 2. Search knowledge base (RAG with vector search)
    const relevantKnowledge = await searchKnowledge(message);

    // 3. Search user's memory for personalization
    const userMemories = await searchUserMemory(userId, message);

    // 4. Get or create conversation
    const conversation = await getOrCreateConversation(
      conversationId,
      userId,
      userType,
      anonSessionId,
      pageContext,
      userContext
    );

    // 5. Build conversation history for Claude
    const messages = [...conversation.messages];
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // 6. Call Claude with RAG context
    const systemPrompt = buildSystemPrompt(userContext, relevantKnowledge, userMemories);

    const claudeMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const anthropic = getAnthropicClient();

    // Call Claude with retry logic for transient failures
    let response: any;
    let lastError: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          system: systemPrompt,
          messages: claudeMessages,
        });
        break; // Success, exit retry loop
      } catch (claudeError: any) {
        lastError = claudeError;
        console.log(`[Chat] Claude API attempt ${attempt} failed:`, claudeError.message);

        // Only retry on rate limits (429) or server errors (5xx)
        if (claudeError.status === 429 || (claudeError.status >= 500 && claudeError.status < 600)) {
          if (attempt < 3) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
            console.log(`[Chat] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw claudeError; // Don't retry client errors
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to get response from Claude after retries');
    }

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // 7. Add assistant response to messages
    messages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString(),
    });

    // 8. Save conversation
    await updateConversation(conversation.id, messages);

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message: assistantMessage,
      userContext: {
        name: userContext.user?.name,
        type: userContext.user?.type,
      },
      debug: {
        knowledgeChunks: relevantKnowledge.length,
        memoriesUsed: userMemories.length,
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    return NextResponse.json(
      { error: 'Failed to process message', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ate-yna-chat-agent',
    version: '2.0',
    personality: 'Ate Yna - Filipina AI Career Buddy',
    features: ['rag', 'memory', 'personalization', 'taglish']
  });
}

/**
 * Cleanup Script: Summarize old HR Assistant conversations
 * 
 * This script:
 * 1. Finds conversations older than 30 days
 * 2. Generates AI summaries for each conversation session
 * 3. Stores summaries in hr_assistant_conversation_summaries
 * 4. Deletes old conversation messages (keeps summaries)
 * 
 * Run: npm run cleanup-hr-conversations
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

interface ConversationMessage {
  id: string;
  user_id: string;
  role: string;
  session_id: string;
  message_type: string;
  content: string;
  sources: any;
  related_articles: string[];
  created_at: string;
}

/**
 * Get conversations older than 30 days that need summarization
 */
async function getOldConversations(): Promise<any[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const { data, error } = await supabase
    .from('hr_assistant_conversations')
    .select('*')
    .lt('created_at', cutoffDate.toISOString())
    .order('session_id, created_at');

  if (error) {
    console.error('Error fetching old conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Group messages by session
 */
function groupBySession(messages: ConversationMessage[]): Map<string, ConversationMessage[]> {
  const sessions = new Map<string, ConversationMessage[]>();
  
  for (const message of messages) {
    if (!sessions.has(message.session_id)) {
      sessions.set(message.session_id, []);
    }
    sessions.get(message.session_id)!.push(message);
  }

  return sessions;
}

/**
 * Check if session already has a summary
 */
async function hasSummary(sessionId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('hr_assistant_conversation_summaries')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  return !!data && !error;
}

/**
 * Generate summary for a conversation session
 */
async function generateSummary(messages: ConversationMessage[]): Promise<{
  summary: string;
  key_topics: string[];
  articles_referenced: string[];
}> {
  if (messages.length < 2) {
    throw new Error('Need at least 2 messages to summarize');
  }

  // Build conversation text
  const conversationText = messages
    .map(m => `${m.message_type === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  // Generate summary with OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are summarizing a conversation about Philippine labor law. 

Create a concise summary that captures:
1. Main questions asked
2. Key information provided
3. Important articles/topics discussed

Format as JSON:
{
  "summary": "Brief summary of the conversation",
  "key_topics": ["topic1", "topic2", ...],
  "articles_referenced": ["295", "296", ...]
}`
      },
      {
        role: 'user',
        content: `Summarize this conversation:\n\n${conversationText}`
      }
    ],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    summary: result.summary || 'Conversation about Philippine labor law',
    key_topics: result.key_topics || [],
    articles_referenced: result.articles_referenced || []
  };
}

/**
 * Generate embedding for summary
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Save summary to database
 */
async function saveSummary(
  userId: string,
  role: string,
  sessionId: string,
  messages: ConversationMessage[],
  summary: {
    summary: string;
    key_topics: string[];
    articles_referenced: string[];
  }
) {
  // Generate embedding for the summary
  const embedding = await generateEmbedding(summary.summary);

  // Get conversation start/end times
  const conversationStart = messages[0].created_at;
  const conversationEnd = messages[messages.length - 1].created_at;

  const { error } = await supabase
    .from('hr_assistant_conversation_summaries')
    .insert({
      user_id: userId,
      role,
      session_id: sessionId,
      summary: summary.summary,
      key_topics: summary.key_topics,
      articles_referenced: summary.articles_referenced,
      message_count: messages.length,
      conversation_start: conversationStart,
      conversation_end: conversationEnd,
      embedding: JSON.stringify(embedding)
    });

  if (error) {
    console.error('Error saving summary:', error);
    throw error;
  }
}

/**
 * Delete old conversation messages
 */
async function deleteOldMessages(sessionId: string) {
  const { error } = await supabase
    .from('hr_assistant_conversations')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error deleting old messages:', error);
    throw error;
  }
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('🧹 Starting HR Assistant conversation cleanup...\n');

  // Get old conversations
  console.log('📊 Fetching conversations older than 30 days...');
  const oldMessages = await getOldConversations();
  
  if (oldMessages.length === 0) {
    console.log('✅ No old conversations to clean up!');
    return;
  }

  console.log(`Found ${oldMessages.length} old messages`);

  // Group by session
  const sessions = groupBySession(oldMessages as ConversationMessage[]);
  console.log(`Organized into ${sessions.size} conversation sessions\n`);

  let summarized = 0;
  let skipped = 0;
  let deleted = 0;

  // Process each session
  for (const [sessionId, messages] of sessions.entries()) {
    try {
      // Skip if less than 2 messages
      if (messages.length < 2) {
        console.log(`⏭️  Skipping session ${sessionId.substring(0, 8)}... (only 1 message)`);
        skipped++;
        continue;
      }

      // Skip if already summarized
      if (await hasSummary(sessionId)) {
        console.log(`⏭️  Skipping session ${sessionId.substring(0, 8)}... (already summarized)`);
        // Delete the old messages since we have the summary
        await deleteOldMessages(sessionId);
        deleted += messages.length;
        skipped++;
        continue;
      }

      console.log(`\n📝 Processing session ${sessionId.substring(0, 8)}...`);
      console.log(`   User: ${messages[0].user_id.substring(0, 8)}... | Role: ${messages[0].role} | Messages: ${messages.length}`);

      // Generate summary
      console.log('   🤖 Generating AI summary...');
      const summary = await generateSummary(messages);
      console.log(`   ✅ Summary: "${summary.summary.substring(0, 80)}..."`);
      console.log(`   📚 Topics: ${summary.key_topics.join(', ')}`);
      console.log(`   📖 Articles: ${summary.articles_referenced.join(', ')}`);

      // Save summary
      console.log('   💾 Saving summary...');
      await saveSummary(
        messages[0].user_id,
        messages[0].role,
        sessionId,
        messages,
        summary
      );

      // Delete old messages
      console.log('   🗑️  Deleting old messages...');
      await deleteOldMessages(sessionId);
      deleted += messages.length;

      summarized++;
      console.log(`   ✅ Session summarized and cleaned!`);

      // Rate limiting (be nice to OpenAI API)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Error processing session ${sessionId}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Cleanup Complete!');
  console.log('='.repeat(60));
  console.log(`📊 Sessions processed: ${sessions.size}`);
  console.log(`✅ Summarized: ${summarized}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`🗑️  Messages deleted: ${deleted}`);
  console.log('='.repeat(60));
}

// Run cleanup
cleanup()
  .then(() => {
    console.log('\n✅ Cleanup script finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error);
    process.exit(1);
  });


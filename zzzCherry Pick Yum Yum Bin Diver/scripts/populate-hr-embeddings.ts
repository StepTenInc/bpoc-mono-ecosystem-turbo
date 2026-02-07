/**
 * Philippine Labor Code Embeddings Generator
 * 
 * This script:
 * 1. Reads the Philippine Labor Code MD file
 * 2. Chunks it intelligently by articles/sections
 * 3. Generates OpenAI embeddings
 * 4. Tags content by role relevance (admin, recruiter, candidate)
 * 5. Extracts topics, keywords, and example questions
 * 6. Inserts everything into hr_embeddings_kb table
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

interface ChunkMetadata {
  content: string;
  book: string | null;
  title: string | null;
  articleNumber: string | null;
  section: string;
  topics: string[];
  keywords: string[];
  roleRelevance: string[];
  questionExamples: string[];
  importanceScore: number;
}

// Role relevance patterns - determines who needs to know what
const ROLE_PATTERNS = {
  candidate: [
    'employment', 'termination', 'resignation', 'probationary', 'regular employment',
    'wages', 'overtime', 'benefits', '13th month', 'leave', 'holiday',
    'working hours', 'rest day', 'maternity', 'paternity', 'sick leave',
    'rights', 'employee', 'worker', 'separation pay', 'retirement',
    'discrimination', 'harassment', 'safety', 'health'
  ],
  recruiter: [
    'hiring', 'recruitment', 'employment contract', 'probationary period',
    'job posting', 'labor standards', 'working conditions', 'employment status',
    'reporting requirements', 'employer obligations', 'payroll', 'compensation',
    'termination grounds', 'dismissal', 'regularization', 'contractual',
    'compliance', 'inspection', 'registration'
  ],
  admin: [
    'compliance', 'penalties', 'enforcement', 'inspection', 'registration',
    'reporting', 'documentation', 'liability', 'administrative', 'legal',
    'violations', 'sanctions', 'authorities', 'DOLE', 'labor standards',
    'establishment', 'employer registration', 'recordkeeping'
  ]
};

// Topic extraction patterns
const TOPIC_KEYWORDS = {
  regularization: ['regular employment', 'regularization', 'probationary', 'six months', 'status'],
  termination: ['termination', 'dismissal', 'separation', 'just cause', 'authorized cause', 'redundancy'],
  wages: ['wage', 'salary', 'compensation', 'minimum wage', 'payment'],
  benefits: ['13th month', 'sss', 'philhealth', 'pag-ibig', 'benefits', 'allowance'],
  leave: ['leave', 'vacation', 'sick', 'maternity', 'paternity', 'parental'],
  working_hours: ['working hours', 'eight hours', 'overtime', 'night shift', 'rest day'],
  contract: ['contract', 'employment contract', 'agreement', 'terms and conditions'],
  rights: ['rights', 'protection', 'security of tenure', 'due process'],
  obligations: ['obligation', 'duty', 'requirement', 'must', 'shall'],
  violations: ['violation', 'penalty', 'sanction', 'illegal', 'prohibited']
};

/**
 * Parse the Philippine Labor Code markdown file
 */
function parseDocument(filePath: string): ChunkMetadata[] {
  console.log('📖 Reading Philippine Labor Code document...');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const chunks: ChunkMetadata[] = [];
  let currentBook: string | null = null;
  let currentTitle: string | null = null;
  let currentArticle: string | null = null;
  let currentSection: string = '';
  let currentContent: string[] = [];
  let chunkIndex = 0;

  function processCurrentChunk() {
    if (currentContent.length === 0) return;

    const text = currentContent.join('\n').trim();
    if (text.length < 50) {
      currentContent = [];
      return; // Skip very short chunks
    }

    // Extract metadata
    const topics = extractTopics(text);
    const keywords = extractKeywords(text);
    const roleRelevance = determineRoleRelevance(text);
    const questionExamples = generateQuestionExamples(text, currentArticle, currentTitle);
    const importanceScore = calculateImportance(text, topics);

    chunks.push({
      content: text,
      book: currentBook,
      title: currentTitle,
      articleNumber: currentArticle,
      section: currentSection || 'General Provisions',
      topics,
      keywords,
      roleRelevance,
      questionExamples,
      importanceScore
    });

    currentContent = [];
  }

  console.log('🔍 Parsing document structure...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip page markers and metadata
    if (line.startsWith('<!--') || line === '---' || line === '') {
      continue;
    }

    // Detect Book
    if (line.match(/^(BOOK|Book)\s+([IVX]+)/i)) {
      processCurrentChunk();
      currentBook = line;
      currentSection = line;
      console.log(`  📚 Found: ${line}`);
    }
    // Detect Title/Chapter
    else if (line.match(/^(TITLE|Title|CHAPTER|Chapter)\s+([IVX]+|\d+)/i)) {
      processCurrentChunk();
      currentTitle = line;
      currentSection = `${currentBook || ''} - ${line}`.trim();
      console.log(`    📑 Found: ${line}`);
    }
    // Detect Article
    else if (line.match(/^(Article|ARTICLE|Art\.)\s*(\d+)/i)) {
      processCurrentChunk();
      const match = line.match(/(\d+)/);
      currentArticle = match ? match[1] : null;
      currentSection = line;
      currentContent.push(line);
      console.log(`      📄 Found: ${line}`);
    }
    // Regular content
    else if (line.length > 0) {
      currentContent.push(line);

      // Chunk by size (max ~1000 characters per chunk)
      const currentSize = currentContent.join('\n').length;
      if (currentSize > 1000 && line.endsWith('.')) {
        processCurrentChunk();
      }
    }
  }

  // Process final chunk
  processCurrentChunk();

  console.log(`✅ Parsed ${chunks.length} chunks from document`);
  return chunks;
}

/**
 * Extract topics from text
 */
function extractTopics(text: string): string[] {
  const textLower = text.toLowerCase();
  const topics = new Set<string>();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(keyword => textLower.includes(keyword.toLowerCase()))) {
      topics.add(topic);
    }
  }

  return Array.from(topics);
}

/**
 * Extract keywords for hybrid search
 */
function extractKeywords(text: string): string[] {
  const textLower = text.toLowerCase();
  const keywords = new Set<string>();

  // Extract important terms
  const importantTerms = [
    'employment', 'termination', 'wage', 'salary', 'benefits',
    'leave', 'overtime', 'holiday', 'probationary', 'regular',
    'contract', 'resignation', 'dismissal', 'separation pay',
    '13th month', 'maternity', 'paternity', 'sss', 'philhealth',
    'pag-ibig', 'retirement', 'working hours', 'rest day',
    'night shift', 'overtime pay', 'minimum wage', 'compensation',
    'security of tenure', 'just cause', 'authorized cause',
    'redundancy', 'retrenchment', 'regularization', 'compliance'
  ];

  importantTerms.forEach(term => {
    if (textLower.includes(term.toLowerCase())) {
      keywords.add(term);
    }
  });

  // Extract article numbers mentioned
  const articleMatches = text.matchAll(/Article\s+(\d+)/gi);
  for (const match of articleMatches) {
    keywords.add(`article_${match[1]}`);
  }

  return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
}

/**
 * Determine which roles this content is relevant for
 */
function determineRoleRelevance(text: string): string[] {
  const textLower = text.toLowerCase();
  const relevantRoles = new Set<string>();

  for (const [role, patterns] of Object.entries(ROLE_PATTERNS)) {
    const matchCount = patterns.filter(pattern => 
      textLower.includes(pattern.toLowerCase())
    ).length;

    if (matchCount > 0) {
      relevantRoles.add(role);
    }
  }

  // If no specific matches, make it available to all
  if (relevantRoles.size === 0) {
    return ['admin', 'recruiter', 'candidate'];
  }

  return Array.from(relevantRoles);
}

/**
 * Generate example questions this chunk can answer
 */
function generateQuestionExamples(text: string, article: string | null, title: string | null): string[] {
  const textLower = text.toLowerCase();
  const questions: string[] = [];

  // Regularization questions
  if (textLower.includes('probationary') || textLower.includes('regular')) {
    questions.push('When do I become a regular employee?');
    questions.push('What is the probationary period?');
  }

  // Termination questions
  if (textLower.includes('termination') || textLower.includes('dismissal')) {
    questions.push('What are valid grounds for termination?');
    questions.push('What is separation pay?');
  }

  // Wages and benefits
  if (textLower.includes('wage') || textLower.includes('13th month')) {
    questions.push('What is the minimum wage?');
    questions.push('When should I receive my 13th month pay?');
  }

  // Leave questions
  if (textLower.includes('leave') || textLower.includes('maternity') || textLower.includes('sick')) {
    questions.push('What leave benefits am I entitled to?');
    questions.push('How many leave days do I get?');
  }

  // Working hours
  if (textLower.includes('working hours') || textLower.includes('overtime')) {
    questions.push('What are normal working hours?');
    questions.push('How is overtime calculated?');
  }

  // Contract and resignation
  if (textLower.includes('contract') || textLower.includes('resign')) {
    questions.push('Can I resign after accepting a job offer?');
    questions.push('What happens if I back out of a contract?');
  }

  return questions.slice(0, 5); // Limit to 5 questions
}

/**
 * Calculate importance score (0.0 to 1.0)
 */
function calculateImportance(text: string, topics: string[]): number {
  let score = 0.5; // Base score

  // High-importance topics
  const highImportanceTopics = ['regularization', 'termination', 'wages', 'benefits', 'rights'];
  const highImportanceCount = topics.filter(t => highImportanceTopics.includes(t)).length;
  score += highImportanceCount * 0.1;

  // Frequently asked about terms
  const commonTerms = ['regular', 'probationary', 'termination', 'resign', '13th month', 'leave'];
  const textLower = text.toLowerCase();
  const commonTermCount = commonTerms.filter(term => textLower.includes(term)).length;
  score += commonTermCount * 0.05;

  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw error;
  }
}

/**
 * Insert chunk into database
 */
async function insertChunk(chunk: ChunkMetadata, embedding: number[], chunkIndex: number) {
  const { error } = await supabase
    .from('hr_embeddings_kb')
    .insert({
      content: chunk.content,
      embedding: JSON.stringify(embedding),
      document_source: 'Philippine_Labor_Code_2026',
      document_section: chunk.section,
      book: chunk.book,
      title: chunk.title,
      article_number: chunk.articleNumber,
      chunk_index: chunkIndex,
      chunk_size: chunk.content.length,
      topics: chunk.topics,
      role_relevance: chunk.roleRelevance,
      importance_score: chunk.importanceScore,
      keywords: chunk.keywords,
      question_examples: chunk.questionExamples,
      is_active: true,
      version: '2026'
    });

  if (error) {
    console.error('❌ Error inserting chunk:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Philippine Labor Code Embeddings Generator Starting...\n');

  // Check environment variables
  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('   - OPENAI_API_KEY');
    process.exit(1);
  }

  // Parse document
  const docPath = path.join(__dirname, '../Docs/HR/Philippine_Labor_Code 2026.md');
  if (!fs.existsSync(docPath)) {
    console.error(`❌ Document not found: ${docPath}`);
    process.exit(1);
  }

  const chunks = parseDocument(docPath);
  console.log(`\n📊 Total chunks to process: ${chunks.length}\n`);

  // Check if table already has data
  const { count } = await supabase
    .from('hr_embeddings_kb')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log(`⚠️  Table already contains ${count} records.`);
    console.log('   Delete existing records? (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🗑️  Deleting existing records...');
    await supabase.from('hr_embeddings_kb').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Process chunks in batches
  const batchSize = 10;
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    console.log(`   Chunks ${i + 1} to ${Math.min(i + batchSize, chunks.length)} of ${chunks.length}`);

    // Generate embeddings for batch (with rate limiting)
    const promises = batch.map(async (chunk, idx) => {
      try {
        const globalIndex = i + idx;
        console.log(`   ${globalIndex + 1}/${chunks.length} - ${chunk.section.substring(0, 50)}...`);
        
        const embedding = await generateEmbedding(chunk.content);
        await insertChunk(chunk, embedding, globalIndex);
        
        processed++;
        return true;
      } catch (error) {
        console.error(`   ❌ Failed chunk ${i + idx + 1}:`, error);
        failed++;
        return false;
      }
    });

    await Promise.all(promises);

    // Rate limiting: wait between batches
    if (i + batchSize < chunks.length) {
      console.log('   ⏳ Waiting 2 seconds (rate limiting)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ PROCESSING COMPLETE!');
  console.log('='.repeat(60));
  console.log(`📊 Total chunks: ${chunks.length}`);
  console.log(`✅ Successfully processed: ${processed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success rate: ${((processed / chunks.length) * 100).toFixed(1)}%`);
  console.log('\n🎉 Philippine Labor Code embeddings are ready!');
  console.log('🔍 You can now search the knowledge base using semantic search.\n');

  // Show some stats
  const { data: stats } = await supabase
    .from('hr_embeddings_kb')
    .select('role_relevance, topics');

  if (stats) {
    const roleStats = {
      admin: 0,
      recruiter: 0,
      candidate: 0
    };

    const topicStats: Record<string, number> = {};

    stats.forEach(row => {
      (row.role_relevance as string[]).forEach(role => {
        if (role in roleStats) roleStats[role as keyof typeof roleStats]++;
      });
      
      (row.topics as string[]).forEach(topic => {
        topicStats[topic] = (topicStats[topic] || 0) + 1;
      });
    });

    console.log('\n📊 Role Distribution:');
    console.log(`   Admin: ${roleStats.admin} chunks`);
    console.log(`   Recruiter: ${roleStats.recruiter} chunks`);
    console.log(`   Candidate: ${roleStats.candidate} chunks`);

    console.log('\n📊 Top Topics:');
    const sortedTopics = Object.entries(topicStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    sortedTopics.forEach(([topic, count]) => {
      console.log(`   ${topic}: ${count} chunks`);
    });
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});


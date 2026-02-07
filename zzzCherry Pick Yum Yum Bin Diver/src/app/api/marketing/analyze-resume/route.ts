import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Server-side resume analysis for marketing funnel
// Handles: File Upload → CloudConvert → GPT OCR → Basic Analysis → Return Score

// CORS headers for the marketing route
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const CLOUDCONVERT_API = 'https://api.cloudconvert.com/v2';
const CLOUDCONVERT_TIMEOUT_MS = 30000; // 30 second timeout for API calls
const MAX_RETRIES = 2;

// Helper: Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = CLOUDCONVERT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

interface AnalysisResult {
  // Overall score (for backward compatibility)
  score: number;
  overallScore: number;
  
  // Breakdown scores
  scores: {
    ats: number;
    content: number;
    format: number;
    skills: number;
  };
  
  // Score reasoning
  scoreReasons: {
    ats: string;
    content: string;
    format: string;
    skills: string;
  };
  
  // Ranking
  ranking: {
    position: number;
    total: number;
    percentile: number;
  };
  
  // Quick wins
  quickWins: Array<{
    improvement: string;
    keywords?: string[];
    points: number;
    explanation: string;
  }>;
  
  // Existing fields
  grade: string;
  summary: string;
  highlights: string[];
  improvements: string[];
  extractedName: string | null;
  extractedEmail: string | null;
  extractedTitle: string | null;
  skillsFound: string[];
  experienceYears: number | null;
}

// Convert file to JPEG using CloudConvert
async function convertToJPEG(fileBuffer: Buffer, fileName: string, fileType: string): Promise<string[]> {
  const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY;

  if (!cloudConvertApiKey) {
    console.error('❌ CLOUDCONVERT_API_KEY is not configured!');
    throw new Error('CloudConvert API key not configured');
  }

  console.log('🔑 CloudConvert API Key present:', cloudConvertApiKey ? 'YES' : 'NO');

  // Determine input format
  let inputFormat = 'pdf';
  if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
    inputFormat = 'docx';
  } else if (fileType.includes('msword') || fileName.endsWith('.doc')) {
    inputFormat = 'doc';
  } else if (fileType.includes('image')) {
    // For images, return base64 directly
    return [`data:${fileType};base64,${fileBuffer.toString('base64')}`];
  }

  console.log(`📤 Converting ${fileName} (${inputFormat}) to JPEG...`);

  // Create CloudConvert job with timeout and retry
  let jobResponse: Response | null = null;
  let lastError: Error | null = null;

  for (let retry = 0; retry <= MAX_RETRIES; retry++) {
    try {
      jobResponse = await fetchWithTimeout(`${CLOUDCONVERT_API}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: {
            'upload-file': {
              operation: 'import/upload'
            },
            'convert-to-jpg': {
              operation: 'convert',
              input: 'upload-file',
              output_format: 'jpg',
              all_pages: true,
              pixel_density: 150,
              quality: 85
            },
            'export-result': {
              operation: 'export/url',
              input: 'convert-to-jpg'
            }
          }
        })
      });
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`CloudConvert job creation attempt ${retry + 1} failed:`, lastError.message);
      if (retry < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
      }
    }
  }

  if (!jobResponse) {
    const errorMessage = lastError?.message || 'Unknown error';
    if (errorMessage.includes('timed out')) {
      throw new Error('Document conversion service is taking too long. Please try uploading an image (JPG/PNG) instead.');
    }
    throw new Error(`Document conversion service unavailable. Please try uploading an image (JPG/PNG) instead.`);
  }

  if (!jobResponse.ok) {
    const errorText = await jobResponse.text();
    console.error('❌ CloudConvert error:', {
      status: jobResponse.status,
      statusText: jobResponse.statusText,
      body: errorText
    });
    if (jobResponse.status === 401 || jobResponse.status === 403) {
      throw new Error('Document conversion service unavailable. Please try uploading an image (JPG/PNG) instead.');
    }
    if (jobResponse.status === 402) {
      throw new Error('Document conversion quota exceeded. Please try uploading an image (JPG/PNG) instead.');
    }
    if (jobResponse.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    throw new Error(`Document conversion failed (${jobResponse.status}). Please try uploading an image (JPG/PNG) instead.`);
  }

  const job = await jobResponse.json();
  const uploadTask = job.data.tasks.find((t: { name: string }) => t.name === 'upload-file');

  if (!uploadTask?.result?.form) {
    throw new Error('No upload URL received from CloudConvert');
  }

  // Upload the file with timeout
  const formData = new FormData();
  Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
    formData.append(key, value as string);
  });
  formData.append('file', new Blob([fileBuffer]), fileName);

  let uploadResponse: Response;
  try {
    uploadResponse = await fetchWithTimeout(uploadTask.result.form.url, {
      method: 'POST',
      body: formData
    }, 60000); // 60 second timeout for file upload
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('timed out')) {
      throw new Error('File upload timed out. Please try with a smaller file or upload an image instead.');
    }
    throw new Error(`File upload failed: ${errorMessage}`);
  }

  if (!uploadResponse.ok) {
    throw new Error(`File upload failed: ${uploadResponse.statusText}`);
  }

  // Poll for completion with timeout
  const jobId = job.data.id;
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const statusResponse = await fetchWithTimeout(`${CLOUDCONVERT_API}/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${cloudConvertApiKey}` }
      }, 10000); // 10 second timeout for status check

      if (!statusResponse.ok) {
        console.warn(`Status check returned ${statusResponse.status}, retrying...`);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      if (status === 'finished') {
        const exportTask = statusData.data.tasks.find((t: { name: string }) => t.name === 'export-result');
        if (exportTask?.result?.files) {
          console.log(`✅ CloudConvert finished: ${exportTask.result.files.length} file(s)`);
          return exportTask.result.files.map((f: { url: string }) => f.url);
        }
        throw new Error('No output files from CloudConvert');
      }

      if (status === 'error') {
        const errorMessage = statusData.data.message || 'Unknown conversion error';
        console.error('❌ CloudConvert processing error:', errorMessage);
        throw new Error(`Document conversion failed: ${errorMessage}`);
      }

      // Log progress for waiting/processing states
      if (attempts % 5 === 0) {
        console.log(`⏳ CloudConvert status: ${status} (attempt ${attempts}/${maxAttempts})`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Document conversion failed')) {
        throw error;
      }
      console.warn(`Status check attempt ${attempts} failed:`, error instanceof Error ? error.message : error);
    }

    attempts++;
  }

  throw new Error('Document conversion timed out. Please try uploading an image (JPG/PNG) instead.');
}

// Extract text using GPT Vision
async function extractTextWithGPT(imageUrls: string[]): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY is not configured!');
    throw new Error('OpenAI API key not configured');
  }

  console.log(`🤖 Extracting text from ${imageUrls.length} image(s)...`);
  console.log('🔑 OpenAI API Key present:', openaiApiKey ? 'YES' : 'NO');

  const imageContent = imageUrls.map(url => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'high' as const }
  }));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert resume OCR specialist. Extract ALL text from the resume image(s) with maximum accuracy.

CRITICAL REQUIREMENTS:
- Preserve exact structure, formatting, and layout
- Extract ALL sections: contact info, professional summary, work experience (with dates, titles, companies), education, certifications, skills, achievements
- Maintain bullet points and hierarchies
- Capture all dates, numbers, and metrics exactly as shown
- Include any headers, section titles, and formatting indicators
- Extract contact details (email, phone, LinkedIn, location) completely

Return the full extracted text preserving the original document structure.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text from this resume image:' },
            ...imageContent
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ GPT Vision API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody
    });
    throw new Error(`GPT Vision failed: ${response.statusText}`);
  }

  const data = await response.json();
  const extractedContent = data.choices[0]?.message?.content || '';

  console.log('✅ GPT Vision response received:', {
    hasChoices: !!data.choices,
    choicesLength: data.choices?.length,
    hasContent: !!extractedContent,
    contentLength: extractedContent.length,
    contentPreview: extractedContent.substring(0, 100)
  });

  return extractedContent;
}

// Analyze resume with GPT
async function analyzeResume(extractedText: string): Promise<AnalysisResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY is not configured!');
    throw new Error('OpenAI API key not configured');
  }

  console.log('📊 Analyzing resume content...');
  console.log('📝 Text to analyze (length):', extractedText.length);
  console.log('📝 Text preview:', extractedText.substring(0, 150));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert career advisor and ATS (Applicant Tracking System) specialist with deep knowledge of resume best practices across all industries, with particular expertise in BPO, customer service, tech, and professional services.

Analyze this resume comprehensively and provide ACTIONABLE, HIGH-VALUE feedback that will genuinely help the candidate land their next role.

SCORING SYSTEM - Calculate 4 separate scores (0-100):

1. **ATS Compatibility (30% weight)**:
   - Parsing-friendly format (no tables, columns, graphics)
   - Clear section headers recognized by ATS
   - Proper use of standard keywords
   - Machine-readable formatting
   - Standard fonts and structure

2. **Content Quality (30% weight)**:
   - Quantifiable achievements with metrics
   - Strong action verbs (Led, Drove, Increased, etc.)
   - Impact-focused descriptions showing value
   - Specific examples with context
   - Clear career narrative

3. **Formatting (20% weight)**:
   - Visual presentation and readability
   - Consistent formatting throughout
   - Professional design choices
   - Proper spacing and hierarchy
   - Clean, organized layout

4. **Skills Match (20% weight)**:
   - Relevant BPO/customer service skills present
   - In-demand technical and soft skills
   - Industry-specific keywords
   - Certifications and specialized knowledge
   - Skills aligned with target roles

**Overall Score**: Weighted average of the 4 scores above.

KEY HIGHLIGHTS - Focus on:
- Strongest quantifiable achievements with metrics
- Most marketable skills for current job market
- Evidence of career growth and leadership
- Industry-specific expertise or certifications
- Clear demonstration of impact and value

IMPROVEMENTS - Be SPECIFIC and ACTIONABLE:
- Exact changes needed (e.g., "Add metrics to 'Managed customer accounts' → 'Managed 50+ enterprise customer accounts, improving retention by 25%'")
- Missing keywords for ATS optimization
- Formatting issues that hurt readability or ATS parsing
- Weak action verbs to strengthen (e.g., "Responsible for" → "Led", "Helped" → "Drove")
- Gaps in storytelling or career narrative

QUICK WINS - Identify 2-3 easy improvements that will boost score:
- Each quick win should be actionable within 5-10 minutes
- Show point value improvement (e.g., +8 points)
- Provide specific keywords or changes to make
- Focus on highest ROI improvements

SKILLS EXTRACTION:
- Identify ALL technical skills, soft skills, tools, platforms, languages, certifications
- Prioritize in-demand skills for BPO/customer service/professional roles

Respond in JSON format:
{
  "scores": {
    "ats": number (0-100),
    "content": number (0-100),
    "format": number (0-100),
    "skills": number (0-100)
  },
  "scoreReasons": {
    "ats": "1-2 sentences explaining why this score",
    "content": "1-2 sentences explaining why this score",
    "format": "1-2 sentences explaining why this score",
    "skills": "1-2 sentences explaining why this score"
  },
  "quickWins": [
    {
      "improvement": "Short title (e.g., 'Add BPO Keywords')",
      "keywords": ["keyword1", "keyword2"],
      "points": number (estimated point gain, e.g., 8),
      "explanation": "Why this matters and what to do"
    }
  ],
  "summary": "2-3 sentences: overall assessment highlighting biggest strengths and 1-2 priority improvements",
  "highlights": [
    "Specific achievement or strength with context",
    "Another concrete strength with evidence",
    "Third strength focusing on unique value"
  ],
  "improvements": [
    "SPECIFIC, ACTIONABLE improvement #1",
    "SPECIFIC improvement #2 with example of what to change",
    "SPECIFIC improvement #3 with clear next step"
  ],
  "extractedName": "string or null",
  "extractedEmail": "string or null",
  "extractedTitle": "current job title or most recent role, or null",
  "skillsFound": ["List ALL skills found: technical, soft, tools, languages, certifications"],
  "experienceYears": number or null (best estimate based on work history)
}`
        },
        {
          role: 'user',
          content: `Analyze this resume:\n\n${extractedText}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Analysis API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody
    });
    throw new Error(`Resume analysis failed: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';

  console.log('✅ Analysis response received:', {
    hasChoices: !!data.choices,
    hasContent: !!content,
    contentLength: content.length,
    contentPreview: content.substring(0, 200)
  });

  try {
    const parsed = JSON.parse(content);
    
    // Calculate overall score from breakdown (weighted average)
    const scores = parsed.scores || { ats: 65, content: 65, format: 65, skills: 65 };
    const overallScore = Math.round(
      scores.ats * 0.30 +
      scores.content * 0.30 +
      scores.format * 0.20 +
      scores.skills * 0.20
    );

    // Generate REAL ranking based on actual database data
    let ranking = {
      position: 1,
      total: 1,
      percentile: 100
    };

    try {
      // Count total resumes analyzed (from anonymous_sessions where analysis exists)
      const { count: totalResumes } = await supabaseAdmin
        .from('anonymous_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('channel', 'marketing-resume-analyzer')
        .not('payload->analysis', 'is', null);

      // Count how many resumes scored LOWER than this one
      const { data: allScores } = await supabaseAdmin
        .from('anonymous_sessions')
        .select('payload')
        .eq('channel', 'marketing-resume-analyzer')
        .not('payload->analysis', 'is', null);

      if (allScores && allScores.length > 0) {
        // Extract scores from all resumes
        const scores = allScores
          .map(s => s.payload?.analysis?.overallScore || s.payload?.analysis?.score)
          .filter(score => typeof score === 'number');

        // Calculate how many scored higher
        const betterScores = scores.filter(s => s > overallScore).length;
        const position = betterScores + 1;
        const total = Math.max(totalResumes || scores.length, 1);
        const percentile = Math.floor(((total - position) / total) * 100);

        ranking = {
          position,
          total,
          percentile: Math.max(0, Math.min(100, percentile))
        };
      }
    } catch (rankingError) {
      console.error('Failed to calculate ranking:', rankingError);
      // Fallback to basic ranking if query fails
      ranking = {
        position: 1,
        total: 1,
        percentile: 100
      };
    }
    
    console.log('✅ Parsed analysis JSON:', {
      overallScore,
      atsScore: scores.ats,
      contentScore: scores.content,
      formatScore: scores.format,
      skillsScore: scores.skills,
      ranking: ranking.position,
      quickWinsCount: parsed.quickWins?.length || 0,
      summaryLength: parsed.summary?.length,
      highlightsCount: parsed.highlights?.length,
      improvementsCount: parsed.improvements?.length,
      hasName: !!parsed.extractedName,
      hasEmail: !!parsed.extractedEmail
    });

    return {
      score: overallScore, // For backward compatibility
      overallScore,
      scores: {
        ats: Math.min(100, Math.max(0, scores.ats)),
        content: Math.min(100, Math.max(0, scores.content)),
        format: Math.min(100, Math.max(0, scores.format)),
        skills: Math.min(100, Math.max(0, scores.skills))
      },
      scoreReasons: parsed.scoreReasons || {
        ats: 'ATS analysis complete.',
        content: 'Content analysis complete.',
        format: 'Format analysis complete.',
        skills: 'Skills analysis complete.'
      },
      ranking,
      quickWins: parsed.quickWins || [],
      grade: getGrade(overallScore),
      summary: parsed.summary || 'Resume analysis complete.',
      highlights: parsed.highlights || [],
      improvements: parsed.improvements || [],
      extractedName: parsed.extractedName || null,
      extractedEmail: parsed.extractedEmail || null,
      extractedTitle: parsed.extractedTitle || null,
      skillsFound: parsed.skillsFound || [],
      experienceYears: parsed.experienceYears || null
    };
  } catch (parseError) {
    console.error('❌ Failed to parse analysis JSON:', {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      content: content,
      contentPreview: content.substring(0, 500)
    });
    
    // Fallback response with new structure
    const fallbackScore = 65;
    const fallbackScores = { ats: 65, content: 65, format: 65, skills: 65 };

    // Get real total count for fallback
    let fallbackRanking = { position: 1, total: 1, percentile: 50 };
    try {
      const { count } = await supabaseAdmin
        .from('anonymous_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('channel', 'marketing-resume-analyzer')
        .not('payload->analysis', 'is', null);

      if (count && count > 0) {
        fallbackRanking = {
          position: Math.floor(count / 2),
          total: count,
          percentile: 50
        };
      }
    } catch (e) {
      console.error('Failed to get fallback ranking:', e);
    }

    return {
      score: fallbackScore,
      overallScore: fallbackScore,
      scores: fallbackScores,
      scoreReasons: {
        ats: 'Unable to fully analyze ATS compatibility. Sign up for detailed insights.',
        content: 'Unable to fully analyze content quality. Sign up for detailed insights.',
        format: 'Unable to fully analyze formatting. Sign up for detailed insights.',
        skills: 'Unable to fully analyze skills match. Sign up for detailed insights.'
      },
      ranking: fallbackRanking,
      quickWins: [
        {
          improvement: 'Sign up for personalized recommendations',
          points: 15,
          explanation: 'Get AI-powered suggestions tailored to your resume and target roles.'
        }
      ],
      grade: 'C',
      summary: 'Resume processed successfully. Sign up for comprehensive analysis.',
      highlights: ['Resume uploaded successfully'],
      improvements: ['Sign up for detailed analysis'],
      extractedName: null,
      extractedEmail: null,
      extractedTitle: null,
      skillsFound: [],
      experienceYears: null
    };
  }
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const anonSessionId = formData.get('anon_session_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.some(t => file.type.includes(t.split('/')[1]))) {
      return NextResponse.json({ error: 'Invalid file type. Please upload PDF, DOC, DOCX, or image.' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
    }

    console.log(`📁 Processing: ${file.name} (${(file.size / 1024).toFixed(1)}KB) Type: ${file.type}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Convert to JPEG (or fallback for images)
    let imageUrls: string[];
    try {
      console.log('🔄 Step 1: Converting to JPEG...');
      imageUrls = await convertToJPEG(buffer, file.name, file.type);
      console.log(`✅ Converted to ${imageUrls.length} image(s)`);
      console.log('📸 Image URLs preview:', imageUrls.map(url => url.substring(0, 50) + '...'));
    } catch (convertError) {
      console.error('⚠️ CloudConvert failed:', convertError);
      console.error('CloudConvert error details:', {
        message: convertError instanceof Error ? convertError.message : String(convertError),
        fileType: file.type,
        fileName: file.name
      });
      // If it's an image, use it directly as base64
      if (file.type.includes('image')) {
        imageUrls = [`data:${file.type};base64,${buffer.toString('base64')}`];
        console.log('✅ Using image directly as base64 (CloudConvert skipped)');
      } else {
        // For PDFs/docs that can't be converted, throw user-friendly error
        throw new Error('Unable to process this document format. Please try uploading a JPG or PNG image of your resume instead.');
      }
    }

    // Step 2: Extract text with GPT Vision
    console.log('🔄 Step 2: Extracting text with GPT Vision...');
    const extractedText = await extractTextWithGPT(imageUrls);
    console.log(`✅ Extracted ${extractedText.length} characters`);

    if (extractedText.length === 0) {
      console.error('❌ CRITICAL: GPT Vision returned EMPTY text!');
      throw new Error('Failed to extract text from resume. The image may be blank or unreadable.');
    }

    console.log('📄 Extracted text preview (first 200 chars):', extractedText.substring(0, 200));

    // Step 3: Analyze resume
    console.log('🔄 Step 3: Analyzing resume content...');
    const analysis = await analyzeResume(extractedText);
    console.log(`✅ Analysis complete: Score ${analysis.score}`);
    console.log('📊 Analysis details:', {
      score: analysis.score,
      grade: analysis.grade,
      highlightsCount: analysis.highlights.length,
      improvementsCount: analysis.improvements.length,
      extractedEmail: analysis.extractedEmail,
      extractedName: analysis.extractedName
    });

    // Save to anonymous_sessions if session ID provided
    if (anonSessionId) {
      try {
        await supabaseAdmin
          .from('anonymous_sessions')
          .upsert({
            anon_session_id: anonSessionId,
            channel: 'marketing-resume-analyzer',
            email: analysis.extractedEmail || null, // Email extracted from resume (optional)
            payload: {
              fileName: file.name,
              fileSize: file.size,
              analysis: analysis,
              extractedText: extractedText.substring(0, 5000), // Truncate for storage
              processedAt: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'anon_session_id' });
        
        console.log(`💾 Saved to anonymous_sessions: ${anonSessionId}`);
      } catch (saveError) {
        console.error('Failed to save anonymous session:', saveError);
        // Don't fail the request if save fails
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysis,
      message: 'Resume analyzed successfully!'
    });

  } catch (error) {
    console.error('❌ Resume analysis error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      errorObject: error
    });

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Analysis failed',
      success: false
    }, { status: 500 });
  }
}


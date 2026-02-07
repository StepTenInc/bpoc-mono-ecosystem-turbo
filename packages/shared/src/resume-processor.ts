// Resume PDF Processing with pdf-parse
// Extracts text from PDF files and structures resume data

import * as pdf from 'pdf-parse';
import { AIService } from './ai';

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    isCurrent: boolean;
  }>;
  education: Array<{
    school: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: number;
    description?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  certifications: string[];
  projects: Array<{
    name: string;
    description: string;
  }>;
  achievements: string[];
  bestJobTitle: string;
  originalFileName: string;
  processedAt: string;
  rawText?: string;
}

/**
 * Extract text from PDF buffer using pdf-parse
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Invalid PDF buffer');
    }

    console.log('[PDF] Extracting text from PDF, size:', pdfBuffer.length, 'bytes');

    const data = await pdf(pdfBuffer);

    if (!data || !data.text) {
      throw new Error('No text extracted from PDF');
    }

    console.log('[PDF] Successfully extracted', data.text.length, 'characters');
    console.log('[PDF] Pages:', data.numpages);

    return data.text;
  } catch (error) {
    console.error('[PDF] Error extracting text:', error);
    throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse resume text into structured data
 * Uses basic pattern matching for common resume sections
 */
export function parseResumeText(text: string, fileName: string, candidateInfo?: { name?: string; email?: string; phone?: string }): ResumeData {
  console.log('[Parser] Parsing resume text, length:', text.length);

  // Initialize with candidate info if provided
  const resumeData: ResumeData = {
    name: candidateInfo?.name || '',
    email: candidateInfo?.email || '',
    phone: candidateInfo?.phone || '',
    summary: '',
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: []
    },
    certifications: [],
    projects: [],
    achievements: [],
    bestJobTitle: '',
    originalFileName: fileName,
    processedAt: new Date().toISOString(),
    rawText: text
  };

  // Extract email if not provided
  if (!resumeData.email) {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      resumeData.email = emailMatch[0];
      console.log('[Parser] Extracted email:', resumeData.email);
    }
  }

  // Extract phone if not provided
  if (!resumeData.phone) {
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      resumeData.phone = phoneMatch[0];
      console.log('[Parser] Extracted phone:', resumeData.phone);
    }
  }

  // Extract name if not provided (usually in first few lines)
  if (!resumeData.name) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      // First non-empty line is often the name
      resumeData.name = lines[0].trim();
      console.log('[Parser] Extracted name:', resumeData.name);
    }
  }

  // Extract skills - look for common skill keywords
  const skillSection = text.match(/(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)[:\s]+((?:.|\n)*?)(?:\n\n|EXPERIENCE|EDUCATION|$)/i);
  if (skillSection) {
    const skillText = skillSection[1];
    const skills = skillText.split(/[,\n•·-]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 50);

    // Categorize skills (simple heuristic)
    skills.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      if (/software|programming|code|development|technical|system|database|api|framework/.test(lowerSkill)) {
        resumeData.skills.technical.push(skill);
      } else if (/communication|leadership|team|manage|problem|creative|analytical/.test(lowerSkill)) {
        resumeData.skills.soft.push(skill);
      } else if (/english|tagalog|spanish|mandarin|japanese|korean/.test(lowerSkill)) {
        resumeData.skills.languages.push(skill);
      } else {
        resumeData.skills.technical.push(skill); // Default to technical
      }
    });

    console.log('[Parser] Extracted skills:', {
      technical: resumeData.skills.technical.length,
      soft: resumeData.skills.soft.length,
      languages: resumeData.skills.languages.length
    });
  }

  // Extract work experience
  const experienceSection = text.match(/(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY)[:\s]+((?:.|\n)*?)(?:\n\n|EDUCATION|SKILLS|$)/i);
  if (experienceSection) {
    const expText = experienceSection[1];
    // Simple pattern: Company name, position, dates
    const jobBlocks = expText.split(/\n(?=[A-Z])/);

    jobBlocks.forEach(block => {
      const lines = block.split('\n').filter(l => l.trim());
      if (lines.length >= 2) {
        const company = lines[0].trim();
        const positionLine = lines[1].trim();

        resumeData.experience.push({
          company: company,
          position: positionLine,
          startDate: '',
          endDate: '',
          description: lines.slice(2).join(' ').substring(0, 200),
          isCurrent: false
        });
      }
    });

    console.log('[Parser] Extracted', resumeData.experience.length, 'work experiences');
  }

  // Extract education
  const educationSection = text.match(/(?:EDUCATION)[:\s]+((?:.|\n)*?)(?:\n\n|SKILLS|EXPERIENCE|$)/i);
  if (educationSection) {
    const eduText = educationSection[1];
    const eduBlocks = eduText.split(/\n(?=[A-Z])/);

    eduBlocks.forEach(block => {
      const lines = block.split('\n').filter(l => l.trim());
      if (lines.length >= 1) {
        const school = lines[0].trim();
        const yearMatch = block.match(/\b(19|20)\d{2}\b/);

        resumeData.education.push({
          school: school,
          degree: lines[1]?.trim() || '',
          fieldOfStudy: '',
          graduationYear: yearMatch ? parseInt(yearMatch[0]) : 0,
          description: lines.slice(2).join(' ').substring(0, 100)
        });
      }
    });

    console.log('[Parser] Extracted', resumeData.education.length, 'education entries');
  }

  // Determine best job title from experience
  if (resumeData.experience.length > 0) {
    resumeData.bestJobTitle = resumeData.experience[0].position;
  }

  // Extract summary/objective if present
  const summarySection = text.match(/(?:SUMMARY|OBJECTIVE|PROFILE)[:\s]+((?:.|\n)*?)(?:\n\n|EXPERIENCE|SKILLS|EDUCATION|$)/i);
  if (summarySection) {
    resumeData.summary = summarySection[1].trim().substring(0, 500);
    console.log('[Parser] Extracted summary');
  }

  return resumeData;
}

/**
 * Process PDF resume: Extract text and parse into structured data
 * Optionally uses AI for enhanced analysis
 */
export async function processPdfResume(
  pdfBuffer: Buffer,
  fileName: string,
  candidateInfo?: { name?: string; email?: string; phone?: string },
  useAI: boolean = false
): Promise<ResumeData> {
  try {
    console.log('[Resume Processor] Starting PDF resume processing');
    console.log('[Resume Processor] File:', fileName, 'Size:', pdfBuffer.length, 'bytes', 'AI:', useAI);

    // Step 1: Extract text from PDF
    const extractedText = await extractPdfText(pdfBuffer);

    // Step 2: Parse text into structured data
    const resumeData = parseResumeText(extractedText, fileName, candidateInfo);

    // Step 3: Optionally enhance with AI analysis
    if (useAI && extractedText.length > 50) {
      console.log('[Resume Processor] Enhancing with AI analysis...');

      try {
        const aiResult = await AIService.analyzeResume(extractedText);

        if (aiResult.success && aiResult.data) {
          // Add AI insights to summary if we don't have one
          if (!resumeData.summary && aiResult.data.summary) {
            resumeData.summary = aiResult.data.summary;
          }

          // Store AI analysis in a separate field (optional)
          (resumeData as any).aiAnalysis = {
            overallScore: aiResult.data.overallScore,
            strengths: aiResult.data.strengths,
            improvements: aiResult.data.improvements,
            recommendations: aiResult.data.recommendations
          };

          console.log('[Resume Processor] AI analysis complete, score:', aiResult.data.overallScore);
        }
      } catch (aiError) {
        console.warn('[Resume Processor] AI analysis failed, continuing without it:', aiError);
        // Continue without AI - not critical
      }
    }

    console.log('[Resume Processor] Resume processing complete');
    console.log('[Resume Processor] Extracted:', {
      name: !!resumeData.name,
      email: !!resumeData.email,
      phone: !!resumeData.phone,
      experience: resumeData.experience.length,
      education: resumeData.education.length,
      skills: Object.values(resumeData.skills).reduce((sum, arr) => sum + arr.length, 0)
    });

    return resumeData;

  } catch (error) {
    console.error('[Resume Processor] Error processing resume:', error);
    throw error;
  }
}

/**
 * Fallback processor when PDF extraction fails
 * Returns basic structure with candidate info
 */
export function createFallbackResumeData(
  fileName: string,
  candidateInfo?: { name?: string; email?: string; phone?: string }
): ResumeData {
  console.log('[Resume Processor] Using fallback resume data');

  return {
    name: candidateInfo?.name || '',
    email: candidateInfo?.email || '',
    phone: candidateInfo?.phone || '',
    summary: '',
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: []
    },
    certifications: [],
    projects: [],
    achievements: [],
    bestJobTitle: '',
    originalFileName: fileName,
    processedAt: new Date().toISOString()
  };
}

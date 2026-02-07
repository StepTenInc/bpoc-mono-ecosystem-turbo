import { NextRequest, NextResponse } from 'next/server';
import { getCandidateById } from '@/lib/db/candidates';
import { processPdfResume, createFallbackResumeData } from '@/lib/resume-processor';

/**
 * POST /api/candidates/resume/process
 * Process an uploaded resume file and extract data
 * Uses pdf-parse for text extraction and optional AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file, useAI } = await request.json();

    if (!file || !file.data) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Verify candidate exists
    const candidate = await getCandidateById(userId, true);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    console.log('📄 Processing resume for candidate:', userId);
    console.log('📄 File info:', { name: file.name, type: file.type, size: file.size });
    console.log('📄 AI analysis:', useAI ? 'enabled' : 'disabled');

    // Extract base64 data (remove data URL prefix if present)
    let base64Data = file.data;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    // Convert base64 to Buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Candidate info for fallback
    const candidateInfo = {
      name: candidate.full_name || `${candidate.first_name} ${candidate.last_name}`,
      email: candidate.email,
      phone: candidate.phone || ''
    };

    let resumeData;

    // Process PDF resume with text extraction
    try {
      resumeData = await processPdfResume(
        fileBuffer,
        file.name,
        candidateInfo,
        useAI === true // Enable AI analysis if requested
      );

      console.log('✅ Resume processing successful');
      console.log('📊 Extracted data:', {
        hasName: !!resumeData.name,
        hasEmail: !!resumeData.email,
        experienceCount: resumeData.experience.length,
        educationCount: resumeData.education.length,
        skillsCount: Object.values(resumeData.skills).reduce((sum, arr) => sum + arr.length, 0)
      });

    } catch (pdfError) {
      console.error('⚠️ PDF extraction failed, using fallback:', pdfError);

      // Use fallback if PDF extraction fails
      resumeData = createFallbackResumeData(file.name, candidateInfo);
    }

    // Return the processed resume data
    return NextResponse.json({
      success: true,
      message: 'Resume processed successfully',
      resumeData: resumeData,
      improvedResume: resumeData,
      extractedText: resumeData.rawText ? resumeData.rawText.substring(0, 500) : undefined, // First 500 chars for preview
      aiAnalysis: (resumeData as any).aiAnalysis || null
    });

  } catch (error) {
    console.error('❌ Error processing resume:', error);
    return NextResponse.json(
      { error: 'Failed to process resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


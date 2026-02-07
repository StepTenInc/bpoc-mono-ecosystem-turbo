import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';

// Claude AI to help generate job details
async function generateJobDetails(basicInfo: { title: string; description: string }) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Based on this job title and description, generate a complete job posting.

Job Title: ${basicInfo.title}
Brief Description: ${basicInfo.description}

Please respond with a JSON object containing:
{
  "description": "A professional, detailed job description (2-3 paragraphs)",
  "requirements": ["requirement 1", "requirement 2", ...] (5-8 items),
  "responsibilities": ["responsibility 1", "responsibility 2", ...] (5-8 items),
  "benefits": ["benefit 1", "benefit 2", ...] (4-6 items),
  "skills": ["skill 1", "skill 2", ...] (5-8 relevant skills),
  "experience_level": "entry_level" | "mid_level" | "senior_level",
  "suggested_salary_min": number (in PHP),
  "suggested_salary_max": number (in PHP)
}

Only respond with valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Parse JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return null;
  } catch (error) {
    console.error('Claude AI error:', error);
    return null;
  }
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      useAI = true,
      agency_client_id,
      salary_min,
      salary_max,
      work_arrangement,
      work_type,
      shift,
      experience_level,
      requirements,
      responsibilities,
      benefits,
      skills,
      location
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      );
    }

    // Default agency_client_id if not provided (ShoreAgents default)
    const clientId = agency_client_id || 'c0000000-0000-0000-0000-000000000001';

    let jobData: Record<string, unknown> = {
      title,
      slug: generateSlug(title),
      agency_client_id: clientId,
      status: 'active',
      currency: 'PHP',
      salary_type: 'monthly',
    };

    // Use Claude AI to generate details if requested
    if (useAI && description) {
      console.log('🤖 Generating job details with Claude AI...');
      const aiDetails = await generateJobDetails({ title, description });
      
      if (aiDetails) {
        console.log('✅ AI generated job details');
        jobData = {
          ...jobData,
          description: aiDetails.description || description,
          requirements: aiDetails.requirements || [],
          responsibilities: aiDetails.responsibilities || [],
          benefits: aiDetails.benefits || [],
          experience_level: aiDetails.experience_level || 'mid_level',
          salary_min: aiDetails.suggested_salary_min || salary_min,
          salary_max: aiDetails.suggested_salary_max || salary_max,
        };

        // Store skills separately
        if (aiDetails.skills && Array.isArray(aiDetails.skills)) {
          jobData._skills = aiDetails.skills;
        }
      } else {
        // Fallback to provided data
        jobData.description = description;
      }
    } else {
      // Use provided data directly
      jobData = {
        ...jobData,
        description: description || '',
        requirements: requirements || [],
        responsibilities: responsibilities || [],
        benefits: benefits || [],
        salary_min,
        salary_max,
        work_arrangement,
        work_type,
        shift,
        experience_level,
      };
    }

    // Add optional fields
    if (location) jobData.industry = location; // Using industry field for location for now
    if (work_arrangement) jobData.work_arrangement = work_arrangement;
    if (work_type) jobData.work_type = work_type;
    if (shift) jobData.shift = shift;

    // Extract skills before inserting job
    const skillsToAdd = jobData._skills as string[] || skills || [];
    delete jobData._skills;

    // Insert job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError.message },
        { status: 500 }
      );
    }

    // Insert job skills
    if (skillsToAdd.length > 0 && job) {
      const skillRecords = skillsToAdd.map((skill: string) => ({
        job_id: job.id,
        name: skill,
      }));

      await supabaseAdmin.from('job_skills').insert(skillRecords);
    }

    console.log('✅ Job created:', job.id);

    return NextResponse.json({
      success: true,
      job,
      message: 'Job created successfully'
    });

  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create job' },
      { status: 500 }
    );
  }
}


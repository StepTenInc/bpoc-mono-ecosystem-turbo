import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const { title, briefDescription } = await request.json();

    if (!title || !briefDescription) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not set, using fallback');
      return NextResponse.json({ 
        success: true, 
        generated: generateFallback(title, briefDescription) 
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are a professional HR copywriter. Generate a complete job listing based on the following:

Job Title: ${title}
Brief Description: ${briefDescription}

Generate the following in JSON format:
{
  "description": "A compelling 2-3 paragraph job description",
  "requirements": ["Array of 5-7 job requirements"],
  "responsibilities": ["Array of 5-7 key responsibilities"],
  "benefits": ["Array of 4-5 benefits"],
  "skills": ["Array of 6-8 relevant skills"]
}

Make it professional, engaging, and suitable for remote work positions. Focus on virtual assistant, customer service, or admin support roles common in BPO/outsourcing.

Respond ONLY with the JSON object, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse JSON from response
    let generated;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generated = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return fallback
      generated = {
        description: `We are looking for a talented ${title} to join our team. ${briefDescription}`,
        requirements: [
          'Excellent communication skills',
          'Strong attention to detail',
          'Ability to work independently',
          'Reliable internet connection',
          'Proficiency in relevant software',
        ],
        responsibilities: [
          'Handle daily tasks efficiently',
          'Communicate with team members',
          'Meet deadlines consistently',
          'Maintain quality standards',
          'Report progress regularly',
        ],
        benefits: [
          'Competitive salary',
          'Remote work flexibility',
          'Professional development opportunities',
          'Supportive team environment',
        ],
        skills: [
          'Communication',
          'Time Management',
          'Organization',
          'Problem Solving',
          'Adaptability',
        ],
      };
    }

    return NextResponse.json({ success: true, generated });

  } catch (error) {
    console.error('Generate job error:', error);
    // Return fallback instead of error
    const { title, briefDescription } = await request.clone().json().catch(() => ({ title: 'Position', briefDescription: '' }));
    return NextResponse.json({ 
      success: true, 
      generated: generateFallback(title || 'Position', briefDescription || '') 
    });
  }
}

function generateFallback(title: string, briefDescription: string) {
  return {
    description: `We are seeking a dedicated ${title} to join our growing team. ${briefDescription}\n\nThis is an exciting opportunity to work with a dynamic team in a fast-paced environment. The ideal candidate will be self-motivated, detail-oriented, and passionate about delivering excellent results.\n\nYou will have the opportunity to grow your career while working remotely with flexible hours.`,
    requirements: [
      'Excellent written and verbal communication skills in English',
      'Strong attention to detail and organizational abilities',
      'Ability to work independently with minimal supervision',
      'Reliable internet connection and dedicated workspace',
      'Proficiency in Microsoft Office or Google Workspace',
      'Previous experience in a similar role preferred',
      'Ability to manage multiple tasks and meet deadlines',
    ],
    responsibilities: [
      'Handle day-to-day administrative tasks efficiently',
      'Communicate professionally with team members and clients',
      'Maintain accurate records and documentation',
      'Meet deadlines and quality standards consistently',
      'Provide regular progress updates to management',
      'Collaborate with team members across different time zones',
      'Identify and suggest process improvements',
    ],
    benefits: [
      'Competitive salary package',
      'Work from home flexibility',
      'Health insurance coverage',
      'Paid time off and holidays',
      'Professional development opportunities',
    ],
    skills: [
      'Communication',
      'Time Management',
      'Organization',
      'Problem Solving',
      'Microsoft Office',
      'Customer Service',
      'Attention to Detail',
      'Adaptability',
    ],
  };
}


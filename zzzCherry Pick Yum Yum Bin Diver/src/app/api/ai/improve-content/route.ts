import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

/**
 * AI Content Improvement API
 * Takes resume section content and improves it with Claude
 */
export async function POST(request: NextRequest) {
  try {
    const { section, content, context } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }
    
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
    }
    
    const anthropic = new Anthropic({ apiKey });
    
    // Build prompt based on section type
    let prompt = '';
    
    switch (section) {
      case 'summary':
        prompt = `Improve this professional summary for a BPO (Business Process Outsourcing) professional. 

CONTEXT: This resume is for BPO industry roles (Customer Service, Sales, Tech Support, Virtual Assistant, etc.)

REQUIREMENTS:
- Highlight English communication skills
- Emphasize client-facing or customer service experience
- Mention remote work capability if applicable
- Include quantifiable achievements (e.g., "95% customer satisfaction", "50+ calls daily")
- Use BPO-relevant terms (call handling, customer retention, sales targets, SLA compliance)
- Keep it concise (2-3 sentences)
- Use strong action verbs

CRITICAL RULES - DO NOT VIOLATE:
- DO NOT invent or fabricate experience, skills, certifications, or achievements that are not in the original
- DO NOT add specific numbers/metrics unless they already exist in the original text
- DO NOT claim job titles, companies, or years of experience not mentioned in the original
- ONLY enhance the wording, structure, and presentation of what's already there
- DO NOT use corporate executive language or C-suite terms. Focus on practical BPO skills.

Original summary:
${content}

Respond with ONLY the improved summary text tailored for BPO industry, no explanations.`;
        break;
        
      case 'experience':
        // Handle both JSON string and object
        let experienceData = content;
        if (typeof content === 'string') {
          try {
            experienceData = JSON.parse(content);
          } catch {
            // If not JSON, treat as text
            experienceData = content;
          }
        }
        
        if (Array.isArray(experienceData)) {
          prompt = `Improve these work experience entries for a BPO professional. 

CONTEXT: BPO industry (Customer Service, Sales, Tech Support, Virtual Assistant, Admin, etc.)

For each entry:
- Add BPO-relevant metrics (call volume, customer satisfaction %, sales quota %, average handling time, first call resolution rate, typing WPM, etc.)
- Use BPO-specific achievements (e.g., "Handled 60+ customer calls daily with 96% satisfaction rating", "Achieved 115% of monthly sales quota", "Reduced average response time from 24h to 4h")
- Highlight tools/systems used (Zendesk, Salesforce, Slack, CRM, ticketing systems, etc.)
- Emphasize client-facing skills and results
- Use strong action verbs (Resolved, Achieved, Exceeded, Improved, Supported, Assisted)
- Keep the same JSON structure

CRITICAL RULES - DO NOT VIOLATE:
- DO NOT invent or fabricate companies, job titles, or achievements not in the original
- DO NOT add specific metrics/numbers unless they already exist in the original
- Only enhance wording and structure of existing content
- You may suggest WHERE metrics could go (e.g., "Handled [X]+ calls daily") but do NOT fill in made-up numbers

Original experience array:
${JSON.stringify(experienceData, null, 2)}

Respond with ONLY a valid JSON array of improved experience objects in the same format, no explanations.`;
        } else {
          prompt = `Improve this work experience description for a BPO role.

CONTEXT: BPO industry (focus on measurable customer service/sales/support achievements)

ENHANCE WITH:
- Specific metrics (call volume, satisfaction %, sales numbers, response time, accuracy rate)
- BPO tools used (Zendesk, Salesforce, Slack, CRM systems, etc.)
- Quantifiable results
- Strong action verbs

CRITICAL: DO NOT invent achievements, metrics, or tools not mentioned in the original. Only enhance wording and structure.

Original:
${content}

Respond with ONLY the improved text for BPO industry, no explanations.`;
        }
        break;
        
      case 'skills':
        // Handle both JSON string and object
        let skillsData = content;
        if (typeof content === 'string') {
          try {
            skillsData = JSON.parse(content);
          } catch {
            // If not JSON, treat as text
            skillsData = content;
          }
        }
        
        if (typeof skillsData === 'object' && skillsData !== null) {
          prompt = `Organize and improve this skills object for a BPO professional.

CONTEXT: BPO industry skills (Customer Service, Sales, Tech Support, Virtual Assistant, etc.)

REQUIREMENTS:
- Group into technical, soft, and languages categories
- Technical: BPO tools (Zendesk, Salesforce, Freshdesk, Slack, MS Office, Google Workspace, CRM systems, ticketing systems, chat platforms, etc.)
- Soft: Communication, customer service, problem-solving, patience, empathy, adaptability, time management, multitasking
- Languages: English (required), plus any other languages
- Remove redundancies
- DO NOT add skills the candidate doesn't already have - only reorganize and improve wording of existing skills
- Keep the same structure

Original skills:
${JSON.stringify(skillsData, null, 2)}

Respond with ONLY a valid JSON object in the format: {"technical": [...], "soft": [...], "languages": [...]}, no explanations.`;
        } else {
          prompt = `Organize and improve this skills list for a BPO professional.

CONTEXT: BPO industry (Customer Service, Sales, Tech Support, Virtual Assistant)

ENHANCE WITH:
- BPO-relevant technical tools (Zendesk, Salesforce, CRM, MS Office, Google Workspace, etc.)
- Key soft skills (Communication, customer service, problem-solving, empathy, patience)
- English language proficiency
- Group into categories
- Remove redundancies

DO NOT add skills the candidate doesn't actually have. Only enhance organization and wording.

Original skills:
${content}

Respond with ONLY the improved skills for BPO industry, no explanations.`;
        }
        break;
        
      case 'education':
        // Handle both JSON string and object
        let educationData = content;
        if (typeof content === 'string') {
          try {
            educationData = JSON.parse(content);
          } catch {
            // If not JSON, treat as text
            educationData = content;
          }
        }
        
        if (Array.isArray(educationData)) {
          prompt = `Improve these education entries for a ${context || 'professional'}. For each entry:
- Make descriptions more professional
- Ensure all fields are complete
- Keep the same structure

Original education array:
${JSON.stringify(educationData, null, 2)}

Respond with ONLY a valid JSON array of improved education objects in the same format, no explanations.`;
        } else {
          prompt = `Improve this education description. Make it more professional and complete.

Original:
${content}

Respond with ONLY the improved text, no explanations.`;
        }
        break;
        
      default:
        prompt = `Improve this resume content for a ${context || 'professional'}. Make it more impactful, professional, and quantifiable where possible.

Original:
${content}

Respond with ONLY the improved text, no explanations.`;
    }
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });
    
    let improved = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : content;
    
    // Try to parse JSON for structured data (experience, skills, education)
    if (section === 'experience' || section === 'skills' || section === 'education') {
      try {
        // Extract JSON from response if it's wrapped in markdown or text
        const jsonMatch = improved.match(/\[[\s\S]*\]/) || improved.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          improved = JSON.parse(jsonMatch[0]);
        } else {
          // Try parsing the whole response
          improved = JSON.parse(improved);
        }
      } catch {
        // If parsing fails, return as-is (might be text format)
        console.warn(`Could not parse ${section} as JSON, returning as text`);
      }
    }
    
    return NextResponse.json({
      success: true,
      improved,
      original: content
    });
    
  } catch (error) {
    console.error('AI improve error:', error);
    return NextResponse.json(
      { error: 'Failed to improve content' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
const serperApiKey = process.env.SERPER_API_KEY || '';
const anthropic = new Anthropic({ apiKey });

// Search Google using Serper API
async function searchGoogle(query: string, num: number = 5): Promise<any[]> {
  if (!serperApiKey) return [];
  
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: num,
        gl: 'ph', // Philippines
        hl: 'en'
      })
    });
    
    const data = await response.json();
    return data.organic || [];
  } catch (error) {
    console.error('Serper search error:', error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: 'AI Service not configured' }, { status: 503 });
  }

  try {
    const { content, type } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Step 1: AI generates search queries
    const prompt = `
      You are an expert SEO researcher specializing in link building and authority building.
      
      Analyze this article content and generate SEARCH QUERIES to find:
      
      ARTICLE CONTENT:
      """
      ${content.substring(0, 3000)}
      """
      
      TASK 1 - OUTBOUND LINK QUERIES:
      Generate 5 Google search queries to find authoritative .edu, .gov, .org sources to cite.
      Each query should target specific data, statistics, or official information.
      
      TASK 2 - BACKLINK OPPORTUNITY QUERIES:
      Generate 5 Google search queries to find blogs, forums, or sites that might link back.
      Target: career blogs, HR sites, industry publications, forums where you could guest post or get mentioned.
      
      OUTPUT FORMAT:
      Return ONLY valid JSON:
      {
        "outboundQueries": [
          { "query": "site:.gov.ph BPO employment statistics", "type": "gov", "intent": "Government employment data" },
          { "query": "site:.edu.ph call center career research", "type": "edu", "intent": "Academic research on BPO" }
        ],
        "backlinkQueries": [
          { "query": "Philippines career blog write for us", "type": "guest_post", "intent": "Guest posting opportunities" },
          { "query": "BPO jobs forum Philippines", "type": "forum", "intent": "Forums to engage in" }
        ]
      }
      
      IMPORTANT for BPO/Philippines:
      - Use site:.gov.ph for government sources (PSA, DOLE, DTI)
      - Use site:.edu.ph for universities
      - Use site:.org for industry associations (IBPAP, CCAP)
      - Include queries for career blogs, HR publications, job forums
      
      Return ONLY JSON. No markdown.
    `;

    const aiResponse = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const textResponse = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';
    
    let queries;
    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : textResponse;
      queries = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Parse error:', e);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Step 2: If Serper API is available, actually search Google!
    const outbound: any[] = [];
    const backlinks: any[] = [];

    if (serperApiKey) {
      // Search for outbound link sources
      for (const q of (queries.outboundQueries || []).slice(0, 3)) {
        const results = await searchGoogle(q.query, 3);
        for (const result of results) {
          // Determine type from URL
          let type = 'authority';
          if (result.link?.includes('.edu')) type = 'edu';
          else if (result.link?.includes('.gov')) type = 'gov';
          else if (result.link?.includes('.org')) type = 'org';
          
          outbound.push({
            domain: new URL(result.link).hostname,
            title: result.title,
            url: result.link,
            snippet: result.snippet,
            type,
            reason: q.intent
          });
        }
      }

      // Search for backlink opportunities
      for (const q of (queries.backlinkQueries || []).slice(0, 3)) {
        const results = await searchGoogle(q.query, 3);
        for (const result of results) {
          backlinks.push({
            siteName: result.title,
            url: result.link,
            domain: new URL(result.link).hostname,
            snippet: result.snippet,
            siteType: q.type,
            outreachAngle: q.intent
          });
        }
      }

      return NextResponse.json({
        outbound: outbound.slice(0, 8),
        backlinks: backlinks.slice(0, 8),
        powered_by: 'serper'
      });
    } else {
      // Fallback: Return just the queries for manual search
      return NextResponse.json({
        outbound: (queries.outboundQueries || []).map((q: any) => ({
          domain: q.intent,
          type: q.type,
          reason: q.intent,
          searchQuery: q.query
        })),
        backlinks: (queries.backlinkQueries || []).map((q: any) => ({
          siteName: q.intent,
          siteType: q.type,
          reason: q.intent,
          outreachAngle: q.intent,
          searchQuery: q.query
        })),
        powered_by: 'manual'
      });
    }

  } catch (error) {
    console.error('Research API Error:', error);
    return NextResponse.json({ error: 'Failed to research' }, { status: 500 });
  }
}


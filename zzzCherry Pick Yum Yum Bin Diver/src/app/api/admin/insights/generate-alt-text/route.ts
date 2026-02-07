import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate SEO-optimized alt text for an image using GPT-4
 */
export async function POST(req: NextRequest) {
  console.log('🖼️ [ALT-TEXT] ========== REQUEST RECEIVED ==========');

  try {
    const body = await req.json();
    const { sectionContent, imageUrl, articleTitle, sectionNumber } = body;

    console.log('🖼️ [ALT-TEXT] Request data:', {
      articleTitle,
      sectionNumber,
      hasContent: !!sectionContent,
      contentLength: sectionContent?.length || 0,
    });

    const apiKey = process.env.OPENAI_API_KEY;
    console.log('🖼️ [ALT-TEXT] API Key exists:', !!apiKey);
    console.log('🖼️ [ALT-TEXT] API Key length:', apiKey?.length || 0);

    if (!apiKey) {
      console.error('❌ [ALT-TEXT] OpenAI API key not configured');
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    console.log(`🖼️ [ALT-TEXT] Generating alt text for section ${sectionNumber} using GPT-4`);

    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an SEO expert. Create a concise image alt text (80-125 characters) that:
- Describes the image accurately
- Includes relevant keywords
- Is accessible for screen readers
- Does NOT start with "Image of"

Output ONLY the alt text. No quotes, no explanation.`
        },
        {
          role: 'user',
          content: `Create alt text for an image in article "${articleTitle || 'BPO Career Article'}".

Section ${sectionNumber || 1} content:
${sectionContent?.substring(0, 500) || 'Filipino BPO professionals working in modern call center'}

The image shows Filipino BPO professionals in a call center. Generate one alt text (80-125 chars).`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    };

    console.log('🖼️ [ALT-TEXT] Sending request to OpenAI GPT-4...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('🖼️ [ALT-TEXT] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ALT-TEXT] OpenAI API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `OpenAI API error: ${response.status} - ${errorText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('🖼️ [ALT-TEXT] Response data:', JSON.stringify(data, null, 2));

    const altText = data.choices?.[0]?.message?.content?.trim() || '';

    if (!altText) {
      console.error('❌ [ALT-TEXT] No alt text in response');
      return NextResponse.json(
        { success: false, error: 'No alt text generated' },
        { status: 500 }
      );
    }

    // Clean up the alt text (remove quotes if present)
    const cleanedAltText = altText.replace(/^["']|["']$/g, '').trim();

    console.log(`✅ [ALT-TEXT] Generated: ${cleanedAltText}`);

    return NextResponse.json({
      success: true,
      altText: cleanedAltText,
    });

  } catch (error: any) {
    console.error('❌ [ALT-TEXT] Exception:', error.message);
    console.error('❌ [ALT-TEXT] Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate alt text' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/get-api-key
 * Returns API keys for client-side processing
 * 
 * Security Note: These keys are safe to expose to client for file processing
 * - OpenAI: Used for OCR (no sensitive operations)
 * - CloudConvert: Used for document conversion (no sensitive operations)
 */
export async function GET(request: NextRequest) {
  try {
    // Get API keys from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY;

    // Check if keys exist
    if (!openaiApiKey || !cloudConvertApiKey) {
      console.warn('⚠️ Missing API keys:', {
        hasOpenAI: !!openaiApiKey,
        hasCloudConvert: !!cloudConvertApiKey
      });

      return NextResponse.json({
        success: false,
        error: 'API keys not configured on server',
        details: {
          openai: !!openaiApiKey,
          cloudconvert: !!cloudConvertApiKey
        }
      }, { status: 503 });
    }

    console.log('✅ API keys retrieved successfully');

    return NextResponse.json({
      success: true,
      openaiApiKey: openaiApiKey,
      cloudConvertApiKey: cloudConvertApiKey,
    });

  } catch (error) {
    console.error('❌ Error fetching API keys:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve API keys',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

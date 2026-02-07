import { NextRequest, NextResponse } from 'next/server';
import { VeoService } from '@/lib/veo-service';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation

/**
 * POST /api/veo/generate
 * Generate a video using Veo 3.1
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, resolution = '1080p', aspectRatio = '16:9' } = body;

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Get API key from environment
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Google Generative AI API key not configured' },
                { status: 500 }
            );
        }

        // Initialize Veo service
        const veoService = new VeoService(apiKey);

        // Generate video
        const result = await veoService.generateVideo({
            prompt,
            resolution,
            aspectRatio,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        // Calculate estimated cost (assuming 8-second video)
        const estimatedCost = veoService.calculateCost(8, false);

        return NextResponse.json({
            success: true,
            message: 'Video generation initiated',
            estimatedCost,
            ...result,
        });
    } catch (error) {
        console.error('Veo API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate video',
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/veo/generate
 * Get API status and information
 */
export async function GET() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    return NextResponse.json({
        status: 'ready',
        apiConfigured: !!apiKey,
        supportedResolutions: ['1080p', '4k'],
        supportedAspectRatios: ['16:9', '9:16', '1:1'],
        pricing: {
            standard: '$0.40/second',
            fast: '$0.15/second',
        },
    });
}

/**
 * Google Veo 3.1 Video Generation Service
 *
 * Uses the Google Generative AI API to generate videos with Veo 3.1
 * Single API key: GOOGLE_GENERATIVE_AI_API_KEY
 */

import { createLogger } from './debug-logger';

const logger = createLogger('VEO');

// Agent identification for logging
const AGENT_NAME = 'GOOGLE_VEO_3.1';

export interface VeoGenerateOptions {
  prompt: string;
  duration?: 4 | 6 | 8; // Veo supports 4, 6, or 8 seconds
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p' | '4k';
}

export interface VeoGenerateResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  generationTime?: number;
  estimatedCost?: number;
}

interface VeoOperation {
  name: string;
  done: boolean;
  error?: {
    code: number;
    message: string;
  };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: {
          uri?: string;
        };
      }>;
    };
  };
}

export class VeoService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'veo-3.1-generate-preview';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Generative AI API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Generate a video using Google Veo 3.1
   */
  async generateVideo(options: VeoGenerateOptions): Promise<VeoGenerateResult> {
    const startTime = Date.now();
    const { prompt, duration = 8, aspectRatio = '16:9' } = options;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎬 [VIDEO GENERATION] Agent: ${AGENT_NAME}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📋 Config: ${duration}s, ${aspectRatio}, ${options.resolution || '1080p'}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 150)}...`);
    console.log(`⏱️  Started at: ${new Date().toISOString()}`);

    logger.start(`Generating video with Veo 3.1 (${duration}s, ${aspectRatio})`);
    logger.info('Prompt:', prompt.substring(0, 200) + '...');

    try {
      // Step 1: Start the long-running video generation operation
      const operationName = await this.startGeneration(prompt, duration, aspectRatio);

      if (!operationName) {
        return {
          success: false,
          error: 'Failed to start video generation'
        };
      }

      logger.info('Operation started:', operationName);

      // Step 2: Poll for completion
      const result = await this.pollOperation(operationName);

      if (!result.success) {
        return result;
      }

      // Step 3: Download the video and convert to base64 data URL
      if (result.videoUrl) {
        logger.info('Downloading video from Google...');
        const dataUrl = await this.downloadAndConvert(result.videoUrl);

        if (dataUrl) {
          const generationTime = (Date.now() - startTime) / 1000;
          const estimatedCost = this.estimateCost(duration, options.resolution || '1080p');

          console.log(`\n✅ [VIDEO GENERATION] Agent: ${AGENT_NAME} - SUCCESS`);
          console.log(`   ⏱️  Generation time: ${generationTime.toFixed(1)}s`);
          console.log(`   💰 Estimated cost: $${estimatedCost.toFixed(2)}`);
          console.log(`${'='.repeat(60)}\n`);

          logger.complete('Video generated successfully', {
            generationTime: `${generationTime.toFixed(1)}s`,
            estimatedCost: `$${estimatedCost.toFixed(2)}`
          });

          return {
            success: true,
            videoUrl: dataUrl,
            generationTime,
            estimatedCost
          };
        }
      }

      console.log(`\n❌ [VIDEO GENERATION] Agent: ${AGENT_NAME} - FAILED`);
      console.log(`   Reason: Failed to download generated video`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        success: false,
        error: 'Failed to download generated video'
      };

    } catch (error: any) {
      console.log(`\n❌ [VIDEO GENERATION] Agent: ${AGENT_NAME} - ERROR`);
      console.log(`   Error: ${error.message}`);
      console.log(`${'='.repeat(60)}\n`);

      logger.error('Video generation failed:', error.message);
      return {
        success: false,
        error: error.message || 'Unknown error during video generation'
      };
    }
  }

  /**
   * Start the video generation operation
   */
  private async startGeneration(
    prompt: string,
    duration: number,
    aspectRatio: string
  ): Promise<string | null> {
    const url = `${this.baseUrl}/models/${this.model}:predictLongRunning`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          aspectRatio,
          sampleCount: 1,
          durationSeconds: duration
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`API error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    return data.name || null;
  }

  /**
   * Poll the operation until it completes
   */
  private async pollOperation(operationName: string): Promise<VeoGenerateResult> {
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const url = `${this.baseUrl}/${operationName}`;

      const response = await fetch(url, {
        headers: {
          'x-goog-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Poll error (${response.status}):`, errorText);
        return { success: false, error: `Poll failed: ${response.status}` };
      }

      const operation: VeoOperation = await response.json();

      if (operation.done) {
        if (operation.error) {
          return {
            success: false,
            error: operation.error.message
          };
        }

        const videoUri = operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

        if (videoUri) {
          return {
            success: true,
            videoUrl: videoUri
          };
        }

        return {
          success: false,
          error: 'No video URL in response'
        };
      }

      logger.debug(`Polling... (attempt ${attempt + 1}/${maxAttempts})`);
      await this.sleep(pollInterval);
    }

    return {
      success: false,
      error: 'Video generation timed out'
    };
  }

  /**
   * Download video from Google and convert to base64 data URL
   * This is necessary because Google's video URLs require authentication
   */
  private async downloadAndConvert(videoUrl: string): Promise<string | null> {
    try {
      // Google's video URLs require the API key
      const separator = videoUrl.includes('?') ? '&' : '?';
      const authenticatedUrl = `${videoUrl}${separator}key=${this.apiKey}`;

      const response = await fetch(authenticatedUrl);

      if (!response.ok) {
        logger.error('Failed to download video:', response.status);
        return null;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      return `data:video/mp4;base64,${base64}`;
    } catch (error: any) {
      logger.error('Download error:', error.message);
      return null;
    }
  }

  /**
   * Estimate the cost of video generation
   */
  private estimateCost(duration: number, resolution: string): number {
    const costPerSecond: Record<string, number> = {
      '720p': 0.10,
      '1080p': 0.15,
      '4k': 0.40
    };
    return duration * (costPerSecond[resolution] || 0.15);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a VeoService instance using the environment API key
 */
export function createVeoService(): VeoService | null {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GOOGLE_GENERATIVE_AI_API_KEY not configured');
    return null;
  }

  return new VeoService(apiKey);
}

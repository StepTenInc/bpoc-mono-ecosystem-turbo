/**
 * Google Imagen 4 Image Generation Service
 *
 * Uses the Google Generative AI API to generate images with Imagen 4
 * Single API key: GOOGLE_GENERATIVE_AI_API_KEY
 */

import { createLogger } from './debug-logger';

const logger = createLogger('IMAGEN');

// Agent identification for logging
const AGENT_NAME = 'GOOGLE_IMAGEN_4';

export interface ImagenGenerateOptions {
  prompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  numberOfImages?: 1 | 2 | 3 | 4;
  safetyFilterLevel?: 'block_none' | 'block_few' | 'block_some' | 'block_most';
  personGeneration?: 'allow_adult' | 'allow_all' | 'dont_allow';
}

export interface ImagenGenerateResult {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
  generationTime?: number;
}

interface ImagenOperation {
  name: string;
  done: boolean;
  error?: {
    code: number;
    message: string;
  };
  response?: {
    generateImageResponse?: {
      generatedImages?: Array<{
        image?: {
          imageBytes?: string;
        };
        mimeType?: string;
      }>;
    };
    // Alternative response format
    predictions?: Array<{
      bytesBase64Encoded?: string;
      mimeType?: string;
    }>;
  };
}

export class ImagenService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'imagen-4.0-generate-001';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Generative AI API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Generate an image using Google Imagen 3
   */
  async generateImage(options: ImagenGenerateOptions): Promise<ImagenGenerateResult> {
    const startTime = Date.now();
    const {
      prompt,
      aspectRatio = '16:9',
      numberOfImages = 1,
      safetyFilterLevel = 'block_few',
      personGeneration = 'allow_adult'
    } = options;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎨 [IMAGE GENERATION] Agent: ${AGENT_NAME}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📋 Config: ${aspectRatio}, ${numberOfImages} image(s)`);
    console.log(`📝 Prompt: ${prompt.substring(0, 150)}...`);
    console.log(`⏱️  Started at: ${new Date().toISOString()}`);

    logger.start(`Generating image with Imagen 4 (${aspectRatio})`);
    logger.info('Prompt:', prompt.substring(0, 200) + '...');

    try {
      // Try the direct predict endpoint first (faster for images)
      const result = await this.directGenerate(prompt, aspectRatio, numberOfImages, safetyFilterLevel, personGeneration);

      if (result.success) {
        const generationTime = (Date.now() - startTime) / 1000;

        console.log(`\n✅ [IMAGE GENERATION] Agent: ${AGENT_NAME} - SUCCESS`);
        console.log(`   ⏱️  Generation time: ${generationTime.toFixed(1)}s`);
        console.log(`${'='.repeat(60)}\n`);

        logger.complete('Image generated successfully', {
          generationTime: `${generationTime.toFixed(1)}s`
        });

        return {
          ...result,
          generationTime
        };
      }

      // If direct fails, try long-running operation
      console.log('🔄 Direct generation failed, trying long-running operation...');
      const operationResult = await this.longRunningGenerate(prompt, aspectRatio, numberOfImages, safetyFilterLevel, personGeneration);

      if (operationResult.success) {
        const generationTime = (Date.now() - startTime) / 1000;

        console.log(`\n✅ [IMAGE GENERATION] Agent: ${AGENT_NAME} - SUCCESS (via long-running)`);
        console.log(`   ⏱️  Generation time: ${generationTime.toFixed(1)}s`);
        console.log(`${'='.repeat(60)}\n`);

        return {
          ...operationResult,
          generationTime
        };
      }

      console.log(`\n❌ [IMAGE GENERATION] Agent: ${AGENT_NAME} - FAILED`);
      console.log(`   Reason: ${operationResult.error || 'Unknown error'}`);
      console.log(`${'='.repeat(60)}\n`);

      return operationResult;

    } catch (error: any) {
      console.log(`\n❌ [IMAGE GENERATION] Agent: ${AGENT_NAME} - ERROR`);
      console.log(`   Error: ${error.message}`);
      console.log(`${'='.repeat(60)}\n`);

      logger.error('Image generation failed:', error.message);
      return {
        success: false,
        error: error.message || 'Unknown error during image generation'
      };
    }
  }

  /**
   * Direct image generation (synchronous)
   */
  private async directGenerate(
    prompt: string,
    aspectRatio: string,
    numberOfImages: number,
    safetyFilterLevel: string,
    personGeneration: string
  ): Promise<ImagenGenerateResult> {
    // Try multiple endpoint and request format combinations
    const attempts = [
      // Format 1: Imagen 4 :predict endpoint (primary)
      {
        url: `${this.baseUrl}/models/imagen-4.0-generate-001:predict`,
        body: {
          instances: [{ prompt }],
          parameters: {
            sampleCount: numberOfImages,
            aspectRatio,
            safetyFilterLevel,
            personGeneration
          }
        }
      },
      // Format 2: Imagen 4 Fast as fallback
      {
        url: `${this.baseUrl}/models/imagen-4.0-fast-generate-001:predict`,
        body: {
          instances: [{ prompt }],
          parameters: {
            sampleCount: numberOfImages,
            aspectRatio,
            safetyFilterLevel,
            personGeneration
          }
        }
      },
      // Format 3: Imagen 4 with :generate endpoint
      {
        url: `${this.baseUrl}/models/imagen-4.0-generate-001:generate`,
        body: {
          prompt: prompt,
          config: {
            numberOfImages,
            aspectRatio,
            personGeneration,
            safetyFilterLevel,
          }
        }
      },
      // Format 4: Fallback to Imagen 3 if Imagen 4 not available
      {
        url: `${this.baseUrl}/models/imagen-3.0-generate-001:predict`,
        body: {
          instances: [{ prompt }],
          parameters: {
            sampleCount: numberOfImages,
            aspectRatio,
            safetyFilterLevel,
            personGeneration
          }
        }
      },
    ];

    for (const attempt of attempts) {
      logger.info(`Trying endpoint: ${attempt.url}`);
      console.log(`🎨 [IMAGEN] Trying: ${attempt.url}`);

      try {
        const response = await fetch(attempt.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey
          },
          body: JSON.stringify(attempt.body)
        });

        console.log(`🎨 [IMAGEN] Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ [IMAGEN] Error: ${errorText.substring(0, 300)}`);
          continue; // Try next endpoint
        }

        const data = await response.json();
        console.log(`🎨 [IMAGEN] Response keys:`, Object.keys(data));

        // Try to extract image from various response formats
        const imageData = this.extractImageFromResponse(data);
        if (imageData) {
          return imageData;
        }
      } catch (error: any) {
        console.log(`❌ [IMAGEN] Exception: ${error.message}`);
        continue; // Try next endpoint
      }
    }

    return {
      success: false,
      error: 'All direct endpoints failed. Your API key may not have access to Imagen 4. Check Google AI Studio for available models.'
    };
  }

  /**
   * Long-running image generation (asynchronous with polling)
   */
  private async longRunningGenerate(
    prompt: string,
    aspectRatio: string,
    numberOfImages: number,
    safetyFilterLevel: string,
    personGeneration: string
  ): Promise<ImagenGenerateResult> {
    // Try both request formats for long-running operation
    const attempts = [
      {
        url: `${this.baseUrl}/models/imagen-4.0-generate-001:predictLongRunning`,
        body: {
          instances: [{ prompt }],
          parameters: {
            sampleCount: numberOfImages,
            aspectRatio,
            safetyFilterLevel,
            personGeneration
          }
        }
      },
      {
        url: `${this.baseUrl}/models/imagen-4.0-fast-generate-001:predictLongRunning`,
        body: {
          instances: [{ prompt }],
          parameters: {
            sampleCount: numberOfImages,
            aspectRatio,
            safetyFilterLevel,
            personGeneration
          }
        }
      },
      {
        url: `${this.baseUrl}/models/${this.model}:predictLongRunning`,
        body: {
          instances: [{ prompt }],
          parameters: {
            sampleCount: numberOfImages,
            aspectRatio,
            safetyFilterLevel,
            personGeneration
          }
        }
      }
    ];

    for (const attempt of attempts) {
      console.log(`🎨 [IMAGEN] Trying long-running: ${attempt.url}`);

      try {
        const response = await fetch(attempt.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey
          },
          body: JSON.stringify(attempt.body)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ [IMAGEN] Long-running error (${response.status}): ${errorText.substring(0, 200)}`);
          continue; // Try next endpoint
        }

        const data = await response.json();
        const operationName = data.name;

        if (!operationName) {
          console.log('❌ [IMAGEN] No operation name returned');
          continue;
        }

        logger.info('Operation started:', operationName);
        console.log(`✅ [IMAGEN] Operation started: ${operationName}`);

        // Poll for completion
        return await this.pollOperation(operationName);

      } catch (error: any) {
        console.log(`❌ [IMAGEN] Long-running exception: ${error.message}`);
        continue;
      }
    }

    return {
      success: false,
      error: 'Long-running generation failed'
    };
  }

  /**
   * Poll the operation until it completes
   */
  private async pollOperation(operationName: string): Promise<ImagenGenerateResult> {
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
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

      const operation: ImagenOperation = await response.json();

      if (operation.done) {
        if (operation.error) {
          return {
            success: false,
            error: operation.error.message
          };
        }

        // Extract image from operation response
        const imageData = this.extractImageFromResponse(operation.response || {});
        if (imageData) {
          return imageData;
        }

        return {
          success: false,
          error: 'No image data in response'
        };
      }

      logger.debug(`Polling... (attempt ${attempt + 1}/${maxAttempts})`);
      await this.sleep(pollInterval);
    }

    return {
      success: false,
      error: 'Image generation timed out'
    };
  }

  /**
   * Extract image data from various response formats
   */
  private extractImageFromResponse(data: any): ImagenGenerateResult | null {
    // Format 1: generateImageResponse.generatedImages
    if (data.generateImageResponse?.generatedImages?.[0]) {
      const img = data.generateImageResponse.generatedImages[0];
      if (img.image?.imageBytes) {
        return {
          success: true,
          imageBase64: img.image.imageBytes,
          mimeType: img.mimeType || 'image/png'
        };
      }
    }

    // Format 2: predictions array
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      return {
        success: true,
        imageBase64: data.predictions[0].bytesBase64Encoded,
        mimeType: data.predictions[0].mimeType || 'image/png'
      };
    }

    // Format 3: generatedImages array (direct)
    if (data.generatedImages?.[0]?.bytesBase64Encoded) {
      return {
        success: true,
        imageBase64: data.generatedImages[0].bytesBase64Encoded,
        mimeType: data.generatedImages[0].mimeType || 'image/png'
      };
    }

    // Format 4: images array
    if (data.images?.[0]) {
      const img = data.images[0];
      if (img.bytesBase64Encoded || img.b64_json || img.base64) {
        return {
          success: true,
          imageBase64: img.bytesBase64Encoded || img.b64_json || img.base64,
          mimeType: img.mimeType || 'image/png'
        };
      }
    }

    // Format 5: Gemini generateContent response with inline_data
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return {
            success: true,
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png'
          };
        }
        // Alternative format
        if (part.inline_data?.data) {
          return {
            success: true,
            imageBase64: part.inline_data.data,
            mimeType: part.inline_data.mimeType || 'image/png'
          };
        }
      }
    }

    console.log('🔍 [IMAGEN] Could not extract image from response:', JSON.stringify(data).substring(0, 500));
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create an ImagenService instance using the environment API key
 */
export function createImagenService(): ImagenService | null {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GOOGLE_GENERATIVE_AI_API_KEY not configured');
    return null;
  }

  return new ImagenService(apiKey);
}

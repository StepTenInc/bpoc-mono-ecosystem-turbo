/**
 * AI CONTENT PIPELINE - STAGE 8 (REBUILT)
 * Media Generation (Video + Images)
 * 
 * VIDEO: Google Veo (via VeoService)
 * IMAGES: Google Imagen 3
 * 
 * FEATURES:
 * - Hero video (16:9, 5-10s)
 * - Section images (3-5 per article)
 * - Consistent Filipino/BPO aesthetic
 * - SEO alt text with keywords
 * - Supabase storage integration
 * - Style selection (cinematic/people-focused/location)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from '@/lib/error-logger';
import { VeoService } from '@/lib/veo-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const gemini = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY!
);

// ============================================
// TYPES
// ============================================

interface MediaGenerationRequest {
  article: string;
  title: string;
  keywords: string[];
  category: string;
  style?: 'cinematic' | 'people-focused' | 'location' | 'abstract';
  pipelineId?: string;
}

interface VideoResult {
  url: string;
  provider: 'google-veo';
  duration: number;
  prompt: string;
  taskId?: string;
}

interface ImageResult {
  url: string;
  provider: 'google-imagen' | 'openai-dalle';
  alt: string;
  prompt: string;
  section?: string;
}

// ============================================
// MAIN ROUTE HANDLER
// ============================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const {
      article,
      title,
      keywords,
      category = 'BPO & Outsourcing',
      style = 'people-focused',
      pipelineId,
    }: MediaGenerationRequest = await req.json();

    console.log('🎬 STAGE 8: Media Generation');
    console.log(`📊 Article: "${title}"`);
    console.log(`🎨 Style: ${style}`);

    // ============================================
    // STEP 1: Generate Video Prompt
    // ============================================
    console.log('\n📝 Step 1: Generating video prompt...');
    const videoPrompt = await generateVideoPrompt(title, keywords, category, style);
    console.log(`✅ Video prompt: ${videoPrompt.substring(0, 100)}...`);

    // ============================================
    // STEP 2: Generate Hero Video with Google Veo
    // ============================================
    console.log('\n🎥 Step 2: Generating hero video...');
    console.log(`${'='.repeat(60)}`);
    console.log('🎬 [VIDEO GENERATION] Agent: GOOGLE_VEO_3.1');
    console.log(`${'='.repeat(60)}`);

    let videoResult: VideoResult | null = null;

    try {
      videoResult = await generateVideoWithGoogleVeo(videoPrompt);
      console.log('✅ [VIDEO] Agent: GOOGLE_VEO_3.1 - SUCCESS!');
    } catch (error: any) {
      console.log('❌ [VIDEO] Agent: GOOGLE_VEO_3.1 - FAILED:', error.message);
      console.log('   Skipping video generation for this article.');
    }

    // ============================================
    // STEP 3: Generate Image Prompts (3-5 sections)
    // ============================================
    console.log('\n📝 Step 3: Generating image prompts...');
    const imagePrompts = await generateImagePrompts(article, title, keywords, style);
    console.log(`✅ Generated ${imagePrompts.length} image prompts`);

    // ============================================
    // STEP 4: Generate Images with Google Imagen
    // ============================================
    console.log('\n🖼️  Step 4: Generating images...');
    console.log(`${'='.repeat(60)}`);
    console.log('🎨 [IMAGE GENERATION] Agent: GOOGLE_IMAGEN_3');
    console.log(`${'='.repeat(60)}`);

    const imageResults: ImageResult[] = [];

    for (let i = 0; i < imagePrompts.length; i++) {
      const imagePrompt = imagePrompts[i];
      console.log(`\n📸 [IMAGE ${i + 1}/${imagePrompts.length}] Section: "${imagePrompt.section}"`);

      try {
        const imageResult = await generateImageWithImagen(
          imagePrompt.prompt,
          imagePrompt.alt,
          imagePrompt.section
        );
        imageResults.push(imageResult);
        console.log(`   ✅ Agent: GOOGLE_IMAGEN_3 - SUCCESS!`);
      } catch (error: any) {
        console.log(`   ❌ Agent: GOOGLE_IMAGEN_3 - FAILED:`, error.message);
        console.log(`   ⚠️ Skipping this image`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ [IMAGE GENERATION] Complete: ${imageResults.length}/${imagePrompts.length} images generated`);
    console.log(`${'='.repeat(60)}`);

    // ============================================
    // STEP 5: Upload to Supabase Storage
    // ============================================
    console.log('\n☁️  Step 5: Uploading to Supabase storage...');
    
    let uploadedVideoUrl: string | null = null;
    if (videoResult) {
      uploadedVideoUrl = await uploadVideoToSupabase(videoResult, title);
      console.log(`✅ Video uploaded: ${uploadedVideoUrl}`);
    }

    const uploadedImageUrls: string[] = [];
    for (const image of imageResults) {
      const uploadedUrl = await uploadImageToSupabase(image, title);
      uploadedImageUrls.push(uploadedUrl);
    }
    console.log(`✅ Uploaded ${uploadedImageUrls.length} images`);

    // ============================================
    // STEP 6: Save to Database
    // ============================================
    if (pipelineId) {
      console.log('\n💾 Step 6: Saving media metadata...');
      await supabase
        .from('content_pipelines')
        .update({
          media_generation: {
            video: videoResult ? {
              url: uploadedVideoUrl,
              provider: videoResult.provider,
              duration: videoResult.duration,
              prompt: videoResult.prompt,
            } : null,
            images: imageResults.map((img, i) => ({
              url: uploadedImageUrls[i],
              provider: img.provider,
              alt: img.alt,
              section: img.section,
              prompt: img.prompt,
            })),
            generatedAt: new Date().toISOString(),
          },
          current_stage: 8,
          last_updated: new Date().toISOString(),
        })
        .eq('id', pipelineId);

      console.log('✅ Media metadata saved');
    }

    // ============================================
    // DONE!
    // ============================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ STAGE 8 COMPLETE in ${duration}s`);

    return NextResponse.json({
      success: true,
      video: videoResult ? {
        url: uploadedVideoUrl,
        provider: videoResult.provider,
        duration: videoResult.duration,
      } : null,
      images: imageResults.map((img, i) => ({
        url: uploadedImageUrls[i],
        provider: img.provider,
        alt: img.alt,
        section: img.section,
      })),
      processingTime: parseFloat(duration),
    });

  } catch (error: any) {
    console.error('❌ Media generation error:', error);
    await logError(error, {
      endpoint: '/api/admin/insights/pipeline/generate-media',
      http_method: 'POST',
      external_service: 'media_generation',
    });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// VIDEO GENERATION FUNCTIONS
// ============================================

/**
 * Generate video prompt using GPT-4o
 */
async function generateVideoPrompt(
  title: string,
  keywords: string[],
  category: string,
  style: string
): Promise<string> {
  const styleGuides = {
    cinematic: 'Cinematic, dramatic lighting, smooth camera movements, professional cinematography',
    'people-focused': 'Filipino professionals in modern office, diverse team, natural interactions, warm lighting',
    location: 'Philippines locations, Manila skyline, BPO offices, modern workspace, city views',
    abstract: 'Abstract concepts, data visualization, digital transformation, futuristic tech',
  };

  const prompt = `Generate a 5-10 second video prompt for an article hero video.

Article: "${title}"
Category: ${category}
Keywords: ${keywords.join(', ')}
Style: ${style} (${styleGuides[style as keyof typeof styleGuides]})

Requirements:
- Filipino representation (if people-focused)
- Modern, professional BPO aesthetic
- No text or logos
- Smooth motion, cinematic quality
- 16:9 aspect ratio

Return ONLY the video prompt (1-2 sentences, descriptive, cinematic).`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
  });

  return response.choices[0].message.content || '';
}

/**
 * Generate video with Google Veo 3.1
 * Uses GOOGLE_GENERATIVE_AI_API_KEY for authentication
 */
async function generateVideoWithGoogleVeo(prompt: string): Promise<VideoResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
  }

  console.log('🎬 [GOOGLE_VEO_3.1] Starting video generation...');
  console.log('🎬 [GOOGLE_VEO_3.1] Prompt:', prompt.substring(0, 150) + '...');

  const veo = new VeoService(apiKey);
  const result = await veo.generateVideo({
    prompt,
    duration: 8,
    aspectRatio: '16:9',
    resolution: '1080p'
  });

  if (!result.success || !result.videoUrl) {
    throw new Error(result.error || 'Veo video generation failed');
  }

  console.log(`✅ [GOOGLE_VEO_3.1] Video generated in ${result.generationTime?.toFixed(1)}s`);
  console.log(`💰 [GOOGLE_VEO_3.1] Estimated cost: $${result.estimatedCost?.toFixed(2)}`);

  return {
    url: result.videoUrl,
    provider: 'google-veo',
    duration: 8,
    prompt,
  };
}

// ============================================
// IMAGE GENERATION FUNCTIONS
// ============================================

/**
 * Generate image prompts for article sections
 */
async function generateImagePrompts(
  article: string,
  title: string,
  keywords: string[],
  style: string
): Promise<Array<{ prompt: string; alt: string; section: string }>> {
  // Extract H2 headings as sections
  const h2Matches = article.match(/^##\s+(.+)$/gm) || [];
  const sections = h2Matches.map(h => h.replace(/^##\s+/, '')).slice(0, 5);

  const prompt = `Generate image prompts for article sections.

Article: "${title}"
Keywords: ${keywords.join(', ')}
Style: ${style}

Sections:
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

For each section, generate:
1. Image prompt (2-3 sentences, descriptive, Filipino representation if people-focused)
2. SEO alt text (include primary keyword: "${keywords[0]}")

Requirements:
- Modern, professional aesthetic
- Filipino professionals (if people-focused)
- No text overlays
- Photorealistic quality
- 16:9 aspect ratio

Return JSON array:
[
  {
    "section": "Section name",
    "prompt": "Detailed image generation prompt",
    "alt": "SEO-optimized alt text with keyword"
  }
]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are an image prompt engineer. Return valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result.images || [];
}

/**
 * Generate image with Google Imagen 3
 * Uses GOOGLE_GENERATIVE_AI_API_KEY for authentication
 */
async function generateImageWithImagen(
  prompt: string,
  alt: string,
  section: string
): Promise<ImageResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
  }

  console.log('🎨 [GOOGLE_IMAGEN_3] Starting image generation...');
  console.log('🎨 [GOOGLE_IMAGEN_3] Prompt:', prompt.substring(0, 100) + '...');

  // Use Imagen 3 via Generative Language API
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generate`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
        personGeneration: "allow_adult",
        safetyFilterLevel: "block_few",
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Imagen 3 uses generatedImages array
  if (data.generatedImages && data.generatedImages.length > 0) {
    const imageData = data.generatedImages[0];
    console.log('✅ [GOOGLE_IMAGEN_3] Image generated successfully!');
    return {
      url: `data:${imageData.mimeType || 'image/png'};base64,${imageData.bytesBase64Encoded}`,
      provider: 'google-imagen',
      alt,
      prompt,
      section,
    };
  }

  throw new Error('No image data returned from Imagen');
}

/**
 * Generate image with OpenAI DALL-E 3
 */
async function generateImageWithDALLE(
  prompt: string,
  alt: string,
  section: string
): Promise<ImageResult> {
  console.log('🎨 [OPENAI_DALLE_3] Starting image generation...');
  console.log('🎨 [OPENAI_DALLE_3] Prompt:', prompt.substring(0, 100) + '...');

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024', // 16:9 aspect ratio
    quality: 'hd',
    style: 'natural',
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('No image URL returned from DALL-E');
  }

  console.log('✅ [OPENAI_DALLE_3] Image generated successfully!');

  return {
    url: imageUrl,
    provider: 'openai-dalle',
    alt,
    prompt,
    section,
  };
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Upload video to Supabase storage
 */
async function uploadVideoToSupabase(video: VideoResult, articleTitle: string): Promise<string> {
  const slug = articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `videos/${slug}-hero-${Date.now()}.mp4`;

  // Download video from provider URL
  const videoResponse = await fetch(video.url);
  const videoBlob = await videoResponse.blob();

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from('insights')
    .upload(filename, videoBlob, {
      contentType: 'video/mp4',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('insights')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

/**
 * Upload image to Supabase storage
 */
async function uploadImageToSupabase(image: ImageResult, articleTitle: string): Promise<string> {
  const slug = articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sectionSlug = image.section?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'image';
  const filename = `images/${slug}-${sectionSlug}-${Date.now()}.png`;

  // Convert data URL or fetch from URL
  let imageBlob: Blob;
  
  if (image.url.startsWith('data:')) {
    // Base64 data URL
    const base64Data = image.url.split(',')[1];
    const binaryData = Buffer.from(base64Data, 'base64');
    imageBlob = new Blob([binaryData], { type: 'image/png' });
  } else {
    // External URL
    const imageResponse = await fetch(image.url);
    imageBlob = await imageResponse.blob();
  }

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from('insights')
    .upload(filename, imageBlob, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('insights')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

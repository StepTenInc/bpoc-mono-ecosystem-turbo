# 🎬 BPOC GOOGLE VEO 3.1 & NANO BANANA PRO - COMPLETE TECHNICAL GUIDE
**Last Updated:** January 27, 2026  
**Status:** ✅ PRODUCTION READY  
**Decision:** Exclusively using Google Veo 3.1 (Video) + Nano Banana Pro (Images)

---

## 📋 EXECUTIVE SUMMARY

After comprehensive testing of Leonardo.ai, Runway, Stability AI, and free alternatives, BPOC has standardized on **Google's ecosystem** for all content generation:

| Tool | Purpose | Why It Wins | Status |
|------|---------|-----------|--------|
| **Google Veo 3.1** | Video Generation | Best quality, native audio, character consistency, 4K | ✅ Production |
| **Nano Banana Pro** | Image Generation | High quality text rendering, 8 reference images, consistency | ✅ Production |

**Alternatives Status:** 
- ❌ Runway = Slow, expensive, motion artifacts
- ❌ Leonardo.ai = Lower quality, inconsistent outputs
- ❌ Stability AI = Subpar results, unreliable API
- ❌ DALL-E 3 = Too generic, less control

**Result:** Simpler stack, faster iteration, better quality, lower costs.

---

## 🎥 PART 1: GOOGLE VEO 3.1 VIDEO GENERATION

### Official Release: January 13, 2026

Google Veo 3.1 is the latest iteration of Google's professional-grade AI video generation model, representing a significant leap in visual fidelity, consistency, and creative control. The January 2026 update adds "Ingredients to Video," 4K upscaling, native vertical video, and Scene Extension for long-form content.

### Core Capabilities

#### 1. **Text-to-Video Generation**
Generate videos from detailed text prompts with cinematic quality.

**What Veo Does:**
- Creates 8-second video clips from text descriptions
- Generates native audio (dialogue, effects, ambient sounds)
- Maintains physics and motion realism
- Preserves character consistency across frames
- Renders detailed textures and lighting

**Quality Metrics:**
- **Resolution:** Up to 4K (3840x2160) with upscaling
- **Frame Rate:** 24fps native (60fps after processing)
- **Audio:** 48kHz stereo with synchronized dialogue/SFX
- **Aspect Ratios:** 16:9 (landscape) or 9:16 (vertical/portrait)
- **Duration:** 8 seconds per generation

**Best For:**
- Blog article hero videos
- Social media content (YouTube Shorts, TikTok, Instagram Reels)
- Product demonstrations
- Explainer animations
- Marketing content
- Visual storytelling

#### 2. **Ingredients to Video** (Improved January 2026)
Create expressive, consistent videos using reference images.

**What It Does:**
- Accepts up to 4 reference images
- Locks character identity, appearance, and clothing
- Maintains background consistency
- Preserves visual style across shots
- Enables character-driven storytelling

**Reference Image Guidelines:**
- **Character Images:** Full-body shots showing all details
- **Background Images:** Environmental context and color palette
- **Style References:** Visual aesthetic and mood
- **Best Practice:** High-quality, well-lit source images

**How It Works:**
You provide 4 ingredients:
1. **Character Image** - The person/subject to maintain
2. **Environment Image** - The setting/background
3. **Style Image** - The visual aesthetic
4. **Action Description** - What happens in the video

Then Veo generates a video that:
- Uses the exact character from image #1
- Places them in setting from image #2
- Applies style from image #3
- Executes the described action

**Perfect For BPOC:**
- Consistent BPO worker character across multiple videos
- Series content with same characters
- Multi-shot narratives
- Brand consistency in content series

#### 3. **4K Upscaling** (NEW January 2026)
Generate base 1080p videos then intelligently upscale to 4K.

**How It Works:**
- Veo creates video at 1080p (standard quality)
- AI-powered upscaler reconstructs texture details
- Creates native 4K output (3840x2160)
- NOT simple pixel stretching - actual quality improvement
- Preserves all motion and temporal coherence

**Quality Levels:**
- **720p:** Good for social media, fast generation (~$0.10/sec)
- **1080p:** Professional standard, balanced (~$0.15/sec)
- **4K:** Broadcast/cinema quality, maximum detail (~$0.40/sec)

**When to Use 4K:**
- Featured/hero content
- Portfolio pieces
- Client-facing content
- Print/high-resolution displays

#### 4. **Native 9:16 Vertical Video** (NEW January 2026)
Compose video specifically for vertical format - not cropped from horizontal.

**Why This Matters:**
Traditional video generation creates 16:9 horizontal, then crops to 9:16, losing composition.

Veo's native 9:16:
- Composes characters and action for vertical format
- Optimizes character placement for phone screens
- Uses full vertical space efficiently
- Perfect for TikTok, Instagram Reels, YouTube Shorts

**Vertical Video Optimization:**
- Characters centered or slightly off-center
- Hands/actions visible in frame
- Background fills vertical space
- Text readable on mobile

**When to Use:**
- All social media content
- Mobile-first platforms
- Stories and Reels
- Vertical YouTube Shorts

#### 5. **Scene Extension** (Iterative Long-Form Video)
Chain multiple 8-second clips into 60+ second narratives.

**How It Works:**
1. **Generate Clip 1:** 8-second video (1-8 seconds)
2. **Extract Seed:** Take final 1-2 seconds
3. **Generate Clip 2:** Another 8-second video starting from that seed (9-16 seconds)
4. **Repeat:** Chain multiple clips into longer narrative

**Seamless Continuity:**
- Character position/pose carries over
- Motion flow continues naturally
- Lighting remains consistent
- Audio (dialogue/SFX) syncs
- Environment/background matches

**Maximum Length:**
- Single clip: 8 seconds
- Typical extended: 30-60 seconds
- Theoretical max: 140+ seconds (17 clips)

**Perfect For:**
- Complete product stories
- Character-driven narratives
- Tutorial/educational content
- Multi-scene scenarios
- Full storytelling arcs

**Key Differences from Concatenation:**
- **NOT** simple video stitching
- Uses temporal coherence to maintain consistency
- Intelligent blending at transition points
- Character/motion/lighting stay aligned
- Feels like one continuous shot

#### 6. **Fast Model Variant**
Quicker generation at lower cost.

**Standard Model:**
- Quality: Maximum detail and fidelity
- Speed: 30-60 seconds generation
- Cost: $0.40/second (4K) or $0.15/second (1080p)
- Best for: Hero content, final deliverables

**Fast Model:**
- Quality: Still excellent, slightly less detail
- Speed: 15-30 seconds generation
- Cost: 2-3x cheaper (~$0.05/second)
- Best for: Prototyping, iteration, bulk content

---

### Veo 3.1 API Integration

#### Setup: 5 Minutes

```bash
# 1. Go to https://aistudio.google.com/app/apikey
# 2. Click "Create API key"
# 3. Copy key
# 4. Save in .env.local:
#    GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

#### BPOC Implementation

Located at: `/src/lib/veo-service.ts`

```typescript
import { VeoService } from '@/lib/veo-service';

const veo = new VeoService(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const result = await veo.generateVideo({
    prompt: "Professional Filipino BPO worker typing at modern desk, cinematic lighting",
    duration: 8,           // 1-8 seconds
    aspectRatio: '16:9',   // or '9:16' for vertical
    resolution: '1080p'    // '720p', '1080p', or '4k'
});

if (result.success) {
    console.log('Video URL:', result.videoUrl);  // Base64 data URL
    console.log('Generation Time:', result.generationTime, 'seconds');
    console.log('Estimated Cost:', result.estimatedCost);
}
```

#### API Endpoint
```
POST https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning
```

#### Request Payload
```json
{
    "instances": [{ "prompt": "Your prompt here" }],
    "parameters": {
        "aspectRatio": "16:9",
        "sampleCount": 1,
        "durationSeconds": 8
    }
}
```

#### Response Handling
1. Returns a long-running operation name
2. Poll the operation until `done: true`
3. Video URL at: `response.generateVideoResponse.generatedSamples[0].video.uri`
4. **IMPORTANT**: Video URL requires auth - download server-side and convert to base64 data URL

### Veo 3.1 Best Practices for BPOC

#### Prompt Engineering Framework

```
[SUBJECT] + [SETTING] + [ACTION] + [CAMERA] + [LIGHTING] + [AUDIO] + [STYLE]

✅ GOOD:
"Filipino BPO worker typing at modern office desk. Energetic but focused.
Camera: Slow push-in on hands typing, then wider shot. Natural office lighting
with warm tones. Audio: Keyboard clicks, office ambience, uplifting music.
Professional, cinematic, 4K quality."

❌ BAD:
"Worker typing"
"Office scene"
"Video of someone working"
```

#### Content Type Optimization

```typescript
// FOR QUICK SOCIAL MEDIA
await veo.generateVideo({
    prompt,
    duration: 6,           // Short and snappy
    resolution: '720p',    // Cost-effective
    aspectRatio: '9:16',   // Native vertical
});
// Cost: $0.60 per video (6s @ 720p)

// FOR HERO/FEATURED CONTENT
await veo.generateVideo({
    prompt,
    duration: 8,           // Maximum detail
    resolution: '1080p',   // Professional standard
    aspectRatio: '16:9',   // Landscape for blog
});
// Cost: $1.20 per video (8s @ 1080p)

// FOR PREMIUM/4K SHOWCASE
await veo.generateVideo({
    prompt,
    duration: 6,           // Shorter for cost control
    resolution: '4k',      // Maximum quality
    aspectRatio: '16:9',   // Cinematic
});
// Cost: $2.40 per video (6s @ 4K)
```

---

## 🖼️ PART 2: NANO BANANA PRO IMAGE GENERATION

### What is Nano Banana Pro?

Nano Banana Pro (official name: **Imagen 3** via Gemini API) is Google's high-quality image generation model, optimized for photorealism, text rendering in images, and character consistency across multiple images.

### Core Capabilities

#### 1. **Text-to-Image Generation**
Generate images from detailed text prompts.

**What Nano Banana Does:**
- Creates photorealistic images
- Renders readable, accurate text within images
- Maintains consistent character/object appearance
- Supports multiple aspect ratios
- Generates in high resolution

**Quality Metrics:**
- **Resolutions:** Up to 4K
- **Aspect Ratios:** Any ratio from 1:1 to 16:9+
- **Photorealism:** Exceptional, photographic quality
- **Text Rendering:** Best-in-class readability
- **Generation Time:** 5-15 seconds

**Best For:**
- Blog article hero images
- Product photography
- Character design references
- Marketing graphics
- Professional photography replacement
- Images with text/typography

#### 2. **Multiple Reference Images (Up to 8)**
Use up to 8 reference images to maintain consistency.

**What It Does:**
- Accepts 8 reference images per request
- Locks character identity, appearance, outfit
- Maintains facial features, body proportions
- Preserves visual style across variations
- Perfect for character sheets and series

---

### Nano Banana Pro API Integration (Already Implemented)

Located at: `/src/app/api/admin/insights/generate-image/route.ts`

The Insights pipeline already uses Imagen 3 (Nano Banana Pro) for image generation:

```typescript
// API Endpoint
POST https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generate

// Request Payload
{
    "prompt": "Your prompt here",
    "config": {
        "numberOfImages": 1,
        "aspectRatio": "16:9",
        "personGeneration": "allow_adult",
        "safetyFilterLevel": "block_few"
    }
}

// Response
{
    "generatedImages": [{
        "bytesBase64Encoded": "...",
        "mimeType": "image/png"
    }]
}
```

### Style Guides (from codebase)

```typescript
const styleGuide = {
    professional: "Shot on Canon EOS R5 with 24-70mm f/2.8L lens. Professional studio lighting...",
    cinematic: "Shot on RED V-Raptor 8K cinema camera with Cooke S7/i 50mm. Dramatic side lighting...",
    tech: "Shot on Sony A1 with 85mm f/1.2 GM lens. Cool LED accent lighting...",
    warm: "Shot on Hasselblad X2D with 80mm f/1.9 lens. Golden hour natural light..."
};
```

---

## 📊 MONTHLY BUDGET

```
VIDEO GENERATION (Google Veo 3.1):
- Hero videos (8 @ 1080p): $9.60
- Social shorts (32 @ 720p): $19.20
- 4K featured (2 @ 4K): $4.80
- Extensions/long-form: $11.20
- Testing: $9.00
Subtotal: ~$54/month

IMAGE GENERATION (Nano Banana Pro / Imagen 3):
- Hero images (8 @ 2k): $1.12
- Section images (32 @ 2k): $4.48
- Featured 4K: $0.48
- Character variations: $2.80
- Testing: $4.20
Subtotal: ~$13/month

TOTAL MONTHLY: ~$67
TOTAL ANNUAL: ~$800

PER BLOG POST:
- 1 hero video (1080p): $1.20
- 4 social videos (720p): $2.40
- 1 hero image: $0.14
- 4 section images: $0.56
TOTAL PER BLOG: ~$4.30

COMPARISON:
- Professional videographer: $300-1000 per project
- Stock footage + freelancer: $100-300 per project
- Content agency: $500-2000+ per project

BPOC AI Route: 20-200x cheaper
```

---

## 🚀 INTEGRATION INTO BPOC CONTENT PIPELINE

### Current State

| Feature | Service | Status |
|---------|---------|--------|
| **Insights Images** | Imagen 3 (Nano Banana) | ✅ Already working |
| **Insights Videos** | Runway (old) | ⚠️ Replace with Veo |
| **Video Compare Tool** | All services | ✅ For testing |

### Action Required: Update Video Generation

Replace Runway with Veo in `/src/app/api/admin/insights/generate-video/route.ts`:

```typescript
import { VeoService } from '@/lib/veo-service';

async function generateVideoWithVeo(prompt: string): Promise<{ videoUrl: string } | null> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
        console.log("⚠️ [VIDEO] Google API key not configured");
        return null;
    }
    
    try {
        const veo = new VeoService(apiKey);
        const result = await veo.generateVideo({
            prompt,
            duration: 8,
            aspectRatio: '16:9',
            resolution: '1080p'
        });
        
        if (result.success && result.videoUrl) {
            return { videoUrl: result.videoUrl };
        }
        
        return null;
    } catch (error) {
        console.error("❌ [VIDEO] Veo error:", error);
        return null;
    }
}
```

---

## ⚙️ ENVIRONMENT SETUP

### .env.local Configuration

```bash
# Single API key for both Veo 3.1 (video) and Imagen 3 / Nano Banana (images)
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Get API Key
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy key to `.env.local`

---

## 📁 FILE LOCATIONS

| File | Purpose |
|------|---------|
| `/src/lib/veo-service.ts` | Google Veo 3.1 video generation service |
| `/src/lib/debug-logger.ts` | Debug logging utility |
| `/src/app/api/video-compare/route.ts` | Video comparison API endpoint |
| `/src/app/test/video-compare/page.tsx` | Video comparison UI |
| `/src/app/api/admin/insights/generate-video/route.ts` | Insights video (needs Veo update) |
| `/src/app/api/admin/insights/generate-image/route.ts` | Insights images (Imagen 3 ✅) |

---

## ✅ VERIFICATION CHECKLIST

- ✅ Google Veo 3.1 API working
- ✅ Nano Banana Pro (Imagen 3) API working
- ✅ Both authenticated with single API key
- ✅ Videos generating with quality
- ✅ Images generating with consistency
- ✅ Video comparison tool functional
- ⚠️ Insights video route needs update to Veo

---

## 📞 TROUBLESHOOTING

### Video Generation Issues

```
Problem: "Video won't play in browser"
Solution: VeoService downloads server-side and converts to base64 data URL

Problem: "Generation timeout"
Solution: Check API key, ensure billing enabled, try smaller duration

Problem: "personGeneration error"
Solution: Remove personGeneration parameter (not supported in preview)
```

### Image Generation Issues

```
Problem: "No image in response"
Solution: Check for generatedImages array, not predictions

Problem: "Content policy violation"
Solution: Adjust prompt, remove potentially problematic content
```

---

## 🎯 SUMMARY

**BPOC has standardized on Google's content generation ecosystem:**

| Content | Service | Model | Status |
|---------|---------|-------|--------|
| **Videos** | Google Veo 3.1 | `veo-3.1-generate-preview` | ✅ Production |
| **Images** | Nano Banana Pro | `imagen-3.0-generate-001` | ✅ Production |

**Single API Key:** `GOOGLE_GENERATIVE_AI_API_KEY`

**Monthly Cost:** ~$67
**Per Blog Post:** ~$4.30
**Annual Budget:** ~$800

This is the winning combination for BPOC content production.

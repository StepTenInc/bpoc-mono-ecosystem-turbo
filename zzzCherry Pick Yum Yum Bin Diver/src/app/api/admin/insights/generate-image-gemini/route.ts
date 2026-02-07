import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client for storage uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = "insights-images";

/**
 * Get access token from service account credentials
 */
async function getAccessToken(serviceAccountKey: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  // Create JWT header and payload
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: serviceAccountKey.client_email,
    sub: serviceAccountKey.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  // Base64URL encode
  const base64url = (obj: any) => {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  const headerEncoded = base64url(header);
  const payloadEncoded = base64url(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Sign with private key using Web Crypto API
  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(serviceAccountKey.private_key, "base64");
  const signatureEncoded = signature
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${signatureInput}.${signatureEncoded}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Generate image using Google Vertex AI Imagen 3
 */
async function generateWithVertexAI(
  prompt: string,
  projectId: string,
  region: string,
  accessToken: string
): Promise<Buffer | null> {
  try {
    console.log("🎨 [IMAGEN3] Generating image with Vertex AI Imagen 3...");
    console.log("🎨 [IMAGEN3] Project:", projectId);
    console.log("🎨 [IMAGEN3] Region:", region);
    console.log("🎨 [IMAGEN3] Prompt preview:", prompt.substring(0, 200));

    // Vertex AI endpoint for Imagen 3
    const endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
          safetyFilterLevel: "block_few",
          personGeneration: "allow_adult",
        },
      }),
    });

    console.log("🎨 [IMAGEN3] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [IMAGEN3] Vertex AI error:", response.status, errorText);

      // Parse error for better message
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          console.error("❌ [IMAGEN3] Error message:", errorJson.error.message);
        }
      } catch (e) {
        // Ignore parse error
      }

      return null;
    }

    const data = await response.json();
    console.log("🎨 [IMAGEN3] Response received, predictions:", data.predictions?.length || 0);

    // Extract image from predictions
    if (data.predictions && data.predictions[0]) {
      const prediction = data.predictions[0];

      // Imagen 3 returns base64 encoded image in bytesBase64Encoded field
      if (prediction.bytesBase64Encoded) {
        console.log("✅ [IMAGEN3] Image generated successfully!");
        return Buffer.from(prediction.bytesBase64Encoded, "base64");
      }

      // Alternative field name
      if (prediction.image?.bytesBase64Encoded) {
        console.log("✅ [IMAGEN3] Image generated successfully (nested)!");
        return Buffer.from(prediction.image.bytesBase64Encoded, "base64");
      }
    }

    console.error("❌ [IMAGEN3] No image in response");
    console.log("Response structure:", JSON.stringify(data, null, 2).substring(0, 1000));
    return null;

  } catch (error: any) {
    console.error("❌ [IMAGEN3] Error:", error.message);
    console.error("❌ [IMAGEN3] Stack:", error.stack);
    return null;
  }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToSupabase(
  imageBuffer: Buffer,
  slug: string,
  title: string
): Promise<string | null> {
  const timestamp = Date.now();
  const safeSlug = (slug || title || "image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);

  const fileName = `section/${safeSlug}-imagen3-${timestamp}.png`;

  console.log("📤 [IMAGEN3] Uploading to Supabase:", fileName);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(fileName, imageBuffer, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) {
    console.error("❌ [IMAGEN3] Supabase upload error:", uploadError);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  console.log("✅ [IMAGEN3] Uploaded to Supabase:", urlData.publicUrl);
  return urlData.publicUrl;
}

export async function POST(req: NextRequest) {
  console.log("🎨 [IMAGEN3] ========== IMAGE GENERATION REQUEST ==========");

  try {
    const body = await req.json();
    const { prompt, title, slug } = body;

    console.log("🎨 [IMAGEN3] Request:", { title, slug, hasPrompt: !!prompt });

    // Get GCP configuration
    const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    const region = process.env.GCP_REGION || process.env.GOOGLE_CLOUD_REGION || "us-central1";

    // Get service account credentials
    const serviceAccountKeyJson = process.env.GCP_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    console.log("🎨 [IMAGEN3] Project ID configured:", !!projectId);
    console.log("🎨 [IMAGEN3] Region:", region);
    console.log("🎨 [IMAGEN3] Service account configured:", !!serviceAccountKeyJson);

    if (!projectId) {
      return NextResponse.json(
        {
          error: "GCP Project ID not configured. Set GCP_PROJECT_ID in your environment.",
          setup: "Google Imagen 3 requires Vertex AI. Please set: GCP_PROJECT_ID, GCP_SERVICE_ACCOUNT_KEY"
        },
        { status: 503 }
      );
    }

    if (!serviceAccountKeyJson) {
      return NextResponse.json(
        {
          error: "GCP Service Account not configured. Set GCP_SERVICE_ACCOUNT_KEY in your environment.",
          setup: "Provide the full JSON content of your service account key file as GCP_SERVICE_ACCOUNT_KEY"
        },
        { status: 503 }
      );
    }

    // Parse service account key
    let serviceAccountKey;
    try {
      serviceAccountKey = JSON.parse(serviceAccountKeyJson);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid GCP_SERVICE_ACCOUNT_KEY format. Must be valid JSON." },
        { status: 500 }
      );
    }

    // Get access token
    console.log("🎨 [IMAGEN3] Getting access token...");
    let accessToken: string;
    try {
      accessToken = await getAccessToken(serviceAccountKey);
      console.log("✅ [IMAGEN3] Access token obtained");
    } catch (error: any) {
      console.error("❌ [IMAGEN3] Failed to get access token:", error.message);
      return NextResponse.json(
        { error: `Authentication failed: ${error.message}` },
        { status: 401 }
      );
    }

    // Build the prompt
    const basePrompt = prompt || `Professional photo for: ${title}`;
    const enhancedPrompt = `${basePrompt}, professional corporate photography, modern office, natural lighting, high quality, photorealistic`;

    console.log("🎨 [IMAGEN3] Final prompt length:", enhancedPrompt.length);

    // Generate with Vertex AI Imagen 3
    const imageBuffer = await generateWithVertexAI(enhancedPrompt, projectId, region, accessToken);

    if (!imageBuffer) {
      return NextResponse.json(
        {
          error: "Google Imagen 3 generation failed. Please check your Vertex AI configuration and ensure Imagen API is enabled.",
          suggestion: "Make sure Vertex AI API is enabled in your GCP project and your service account has the 'Vertex AI User' role."
        },
        { status: 500 }
      );
    }

    // Upload to Supabase
    const permanentUrl = await uploadToSupabase(imageBuffer, slug, title);

    if (!permanentUrl) {
      return NextResponse.json(
        { error: "Failed to upload image to storage." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: permanentUrl,
      permanent: true,
      generatedWith: "google-imagen-3",
    });

  } catch (error: any) {
    console.error("❌ [IMAGEN3] Main handler error:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);

    return NextResponse.json(
      { error: error.message || "Image generation failed" },
      { status: 500 }
    );
  }
}

"use client";

import { useState } from "react";

interface GenerationResult {
  provider: string;
  model: string;
  status: "idle" | "loading" | "success" | "error";
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
  duration?: number;
}

export default function TestImageGenPage() {
  // Image generation state — Google Imagen only
  const [prompt, setPrompt] = useState(
    "A professional Filipino woman working at a modern BPO call center, wearing a headset, smiling while helping a customer, clean modern office background with computers and plants, natural lighting, corporate photography style"
  );
  const [imageResult, setImageResult] = useState<GenerationResult>({
    provider: "Google", model: "Imagen 3", status: "idle",
  });

  // Video generation state — Google Veo only
  const [videoPrompt, setVideoPrompt] = useState(
    "Professional BPO career video showing Filipino agents in a modern call center, wide shot of open office with agents working, cinematic quality, smooth camera movement"
  );
  const [videoResult, setVideoResult] = useState<GenerationResult>({
    provider: "Google", model: "Veo 3.1", status: "idle",
  });

  // Nano banana test state
  const [bananaResult, setBananaResult] = useState<GenerationResult>({
    provider: "Google", model: "Imagen 3", status: "idle",
  });

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingBanana, setIsGeneratingBanana] = useState(false);

  const generateImage = async () => {
    setIsGeneratingImage(true);
    setImageResult((prev) => ({ ...prev, status: "loading", imageUrl: undefined, error: undefined }));
    const startTime = Date.now();

    try {
      const response = await fetch("/api/admin/insights/generate-image-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, title: "Test Generation", slug: "test-gen" }),
      });
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && data.imageUrl) {
        setImageResult((prev) => ({ ...prev, status: "success", imageUrl: data.imageUrl, duration }));
      } else {
        setImageResult((prev) => ({ ...prev, status: "error", error: data.error || "Generation failed", duration }));
      }
    } catch (error: any) {
      setImageResult((prev) => ({ ...prev, status: "error", error: error.message || "Network error", duration: Date.now() - startTime }));
    }
    setIsGeneratingImage(false);
  };

  const generateVideo = async () => {
    setIsGeneratingVideo(true);
    setVideoResult((prev) => ({ ...prev, status: "loading", videoUrl: undefined, error: undefined }));
    const startTime = Date.now();

    try {
      const response = await fetch("/api/admin/insights/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: videoPrompt, title: "Test Video Generation", slug: "test-video-gen" }),
      });
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && data.videoUrl) {
        setVideoResult((prev) => ({ ...prev, status: "success", videoUrl: data.videoUrl, duration }));
      } else {
        setVideoResult((prev) => ({ ...prev, status: "error", error: data.error || data.message || "Video generation failed", duration }));
      }
    } catch (error: any) {
      setVideoResult((prev) => ({ ...prev, status: "error", error: error.message || "Network error", duration: Date.now() - startTime }));
    }
    setIsGeneratingVideo(false);
  };

  const generateBananaImage = async () => {
    const bananaPrompt = "A tiny nano-sized banana next to a coin for scale, macro photography, studio lighting, white background, photorealistic, extreme close-up, shallow depth of field";
    setIsGeneratingBanana(true);
    setBananaResult((prev) => ({ ...prev, status: "loading", imageUrl: undefined, error: undefined }));
    const startTime = Date.now();

    try {
      const response = await fetch("/api/admin/insights/generate-image-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: bananaPrompt, title: "Nano Banana Test", slug: "nano-banana-test" }),
      });
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && data.imageUrl) {
        setBananaResult((prev) => ({ ...prev, status: "success", imageUrl: data.imageUrl, duration }));
      } else {
        setBananaResult((prev) => ({ ...prev, status: "error", error: data.error || "Generation failed", duration }));
      }
    } catch (error: any) {
      setBananaResult((prev) => ({ ...prev, status: "error", error: error.message || "Network error", duration: Date.now() - startTime }));
    }
    setIsGeneratingBanana(false);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "";
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
  };

  const renderResultCard = (
    result: GenerationResult,
    type: "image" | "video" | "banana",
    onRegenerate: () => void
  ) => {
    const colors = { border: "border-blue-600", bg: "bg-blue-950/30", text: "text-blue-300", accent: "bg-blue-600" };
    const isLoading = result.status === "loading";

    return (
      <div className={`bg-gray-900 ${colors.border} border rounded-xl overflow-hidden max-w-2xl mx-auto`}>
        <div className={`p-4 border-b ${colors.border} flex items-center justify-between ${colors.bg}`}>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>{result.provider}</h3>
            <span className="text-xs text-gray-400">{result.model}</span>
            {result.duration && (
              <span className="text-xs text-gray-500 ml-2">({formatDuration(result.duration)})</span>
            )}
          </div>
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className={`px-3 py-1.5 text-sm ${colors.accent} hover:opacity-80 disabled:opacity-50 rounded-lg transition-colors`}
          >
            {isLoading ? "..." : "Regenerate"}
          </button>
        </div>

        <div className="aspect-video bg-gray-950 relative">
          {result.status === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <div className="text-4xl mb-2">{type === "video" ? "🎬" : type === "banana" ? "🍌" : "🖼️"}</div>
                <div className="text-sm">Click to generate</div>
              </div>
            </div>
          )}
          {isLoading && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${colors.bg}`}>
              <div className={`w-10 h-10 border-3 ${colors.border} border-t-transparent rounded-full animate-spin mb-3`} />
              <span className={`${colors.text} text-sm`}>
                {type === "video" ? "Generating video..." : type === "banana" ? "Growing banana..." : "Generating image..."}
              </span>
              {type === "video" && <span className="text-gray-500 text-xs mt-1">This may take 2-4 minutes</span>}
            </div>
          )}
          {result.status === "success" && result.imageUrl && (
            <img src={result.imageUrl} alt={`${result.provider} output`} className="w-full h-full object-cover" />
          )}
          {result.status === "success" && result.videoUrl && (
            <video src={result.videoUrl} controls autoPlay loop muted className="w-full h-full object-cover" />
          )}
          {result.status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="text-red-500 text-3xl mb-2">!</div>
              <span className="text-red-400 text-sm text-center">{result.error}</span>
            </div>
          )}
        </div>

        {result.status === "success" && (result.imageUrl || result.videoUrl) && (
          <div className={`p-3 border-t ${colors.border} flex gap-2`}>
            <a
              href={result.imageUrl || result.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 px-3 py-2 text-sm text-center ${colors.accent} hover:opacity-80 rounded-lg transition-colors`}
            >
              Open Full Size
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Media Generation Test Lab</h1>
        <p className="text-gray-400 mb-2">
          Test Google Imagen (images) and Google Veo (video) generation
        </p>
        <div className="flex gap-4 mb-8 flex-wrap">
          <span className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Google Imagen 3
          </span>
          <span className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Google Veo 3.1
          </span>
        </div>

        {/* ==================== IMAGE GENERATION SECTION ==================== */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-blue-400">🖼️</span> Image Generation (Google Imagen 3)
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Image Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-28 bg-gray-900 border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your prompt..."
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">{prompt.length} characters</span>
              <button
                onClick={generateImage}
                disabled={isGeneratingImage || !prompt.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {isGeneratingImage ? "Generating..." : "Generate Image"}
              </button>
            </div>
          </div>

          {renderResultCard(imageResult, "image", generateImage)}
        </section>

        {/* ==================== VIDEO GENERATION SECTION ==================== */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-purple-400">🎬</span> Video Generation (Google Veo 3.1)
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Video Prompt</label>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              className="w-full h-28 bg-gray-900 border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your video prompt..."
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">{videoPrompt.length} characters</span>
              <button
                onClick={generateVideo}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {isGeneratingVideo ? "Generating Video..." : "Generate Video"}
              </button>
            </div>
          </div>

          {renderResultCard(videoResult, "video", generateVideo)}
        </section>

        {/* ==================== NANO BANANA TEST SECTION ==================== */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-yellow-400">🍌</span> Nano Banana Test
          </h2>
          <p className="text-gray-400 mb-4">
            A fun test to see how Google Imagen handles creative prompts
          </p>

          <div className="mb-6 p-4 bg-yellow-950/20 border border-yellow-700/30 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-yellow-200/80 font-mono">
                  &quot;A tiny nano-sized banana next to a coin for scale, macro photography, studio lighting, white background, photorealistic&quot;
                </p>
              </div>
              <button
                onClick={generateBananaImage}
                disabled={isGeneratingBanana}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                {isGeneratingBanana ? "Generating..." : "Generate Banana 🍌"}
              </button>
            </div>
          </div>

          {renderResultCard(bananaResult, "banana", generateBananaImage)}
        </section>

        {/* API Info Section */}
        <section className="mt-12 p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <h3 className="font-semibold mb-4">Active API Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Google Imagen 3
              </h4>
              <ul className="space-y-1 text-gray-400">
                <li>• <strong>Image:</strong> Imagen 3.0 (16:9)</li>
                <li>• <strong>Env:</strong> GOOGLE_GENERATIVE_AI_API_KEY</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Google Veo 3.1
              </h4>
              <ul className="space-y-1 text-gray-400">
                <li>• <strong>Video:</strong> Veo 3.1 (8s, 1080p, 16:9)</li>
                <li>• <strong>Env:</strong> GOOGLE_GENERATIVE_AI_API_KEY</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import {
  CheckCircle,
  Loader2,
  Upload,
  Sparkles,
  Video,
  Image as ImageIcon,
  RefreshCw,
  X,
} from 'lucide-react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { StageProps, splitContentIntoSections } from '../types';

interface UploadedImages {
  hero?: string;
  section1?: string;
  section2?: string;
  section3?: string;
}

interface MediaStageProps extends StageProps {
  heroType: 'image' | 'video';
  setHeroType: (type: 'image' | 'video') => void;
  heroSource: 'generate' | 'upload' | null;
  setHeroSource: (source: 'generate' | 'upload' | null) => void;
  sectionSource: 'generate' | 'upload' | null;
  setSectionSource: (source: 'generate' | 'upload' | null) => void;
  uploadedImages: UploadedImages;
  setUploadedImages: (images: UploadedImages | ((prev: UploadedImages) => UploadedImages)) => void;
  onContinue?: () => void;
  onBack?: () => void;
}

export default function MediaStage({
  state,
  updateState,
  loading,
  setLoading,
  toast,
  savePipelineProgress,
  heroType,
  setHeroType,
  heroSource,
  setHeroSource,
  sectionSource,
  setSectionSource,
  uploadedImages,
  setUploadedImages,
  onContinue,
  onBack,
}: MediaStageProps) {
  const [generatingHero, setGeneratingHero] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<number | null>(null);
  const [generatingAllSections, setGeneratingAllSections] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);

  const finalContent = state.seoArticle || state.humanizedArticle || state.article || '';
  const sections =
    state.contentSections.length === 3 ? state.contentSections : splitContentIntoSections(finalContent);

  // ========== HERO VIDEO GENERATION (Google Veo) ==========
  const handleGenerateHeroVideo = async () => {
    setGeneratingHero(true);
    try {
      const res = await fetch('/api/admin/insights/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${state.plan?.title || state.selectedIdea?.title} - Professional BPO career article`,
          title: state.plan?.title || state.selectedIdea?.title || 'Hero Video',
          slug: state.meta?.canonicalSlug || 'hero-video',
          brief: state.transcript,
          content: state.seoArticle || state.humanizedArticle || state.article,
        }),
      });

      const result = await res.json();
      if (result.success && result.videoUrl) {
        setUploadedImages((prev: UploadedImages) => ({ ...prev, hero: result.videoUrl }));
        updateState({ videoUrl: result.videoUrl, heroType: 'video' });

        if (state.pipelineId) {
          await savePipelineProgress(state.pipelineId, 8, {
            videoUrl: result.videoUrl,
            heroType: 'video',
            heroSource: 'generate',
          });
        }

        toast({ title: '🎬 Hero video generated!', description: 'Created with Google Veo' });
      } else {
        toast({ title: 'Generation failed', description: result.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingHero(false);
    }
  };

  // ========== HERO IMAGE GENERATION (Imagen 4) ==========
  const handleGenerateHeroImage = async () => {
    setGeneratingHero(true);
    try {
      const res = await fetch('/api/admin/insights/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: state.plan?.title || state.selectedIdea?.title || 'Hero Image',
          slug: state.meta?.canonicalSlug || 'hero',
          brief: state.transcript,
          content: state.seoArticle || state.humanizedArticle || state.article,
        }),
      });

      const result = await res.json();
      if (result.success && result.imageUrl) {
        setUploadedImages((prev: UploadedImages) => ({ ...prev, hero: result.imageUrl }));
        updateState({ heroType: 'image' });

        const currentImages = state.images || [];
        const newImages = [{ url: result.imageUrl, position: 'hero', alt: result.metadata?.altText || 'Hero image' }, ...currentImages.filter((i: any) => i.position !== 'hero')];
        updateState({ images: newImages });

        if (state.pipelineId) {
          await savePipelineProgress(state.pipelineId, 8, {
            heroUrl: result.imageUrl,
            heroType: 'image',
            heroSource: 'generate',
            images: newImages,
          });
        }

        toast({ title: '🖼️ Hero image generated!', description: 'Created with Imagen 4' });
      } else {
        toast({ title: 'Generation failed', description: result.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingHero(false);
    }
  };

  // ========== HERO UPLOAD ==========
  const handleUploadHero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', heroType === 'video' ? 'video' : 'image');

      const res = await fetch('/api/admin/upload-media', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success && result.url) {
        setUploadedImages((prev: UploadedImages) => ({ ...prev, hero: result.url }));
        if (heroType === 'video') {
          updateState({ videoUrl: result.url });
        }
        toast({ title: 'Upload successful!', description: `Hero ${heroType} uploaded` });
      } else {
        toast({ title: 'Upload failed', description: result.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingHero(false);
    }
  };

  // ========== SECTION IMAGE GENERATION (Imagen 4 with GPT prompt) ==========
  const handleGenerateSectionImage = async (sectionIndex: number) => {
    setGeneratingSection(sectionIndex);
    try {
      const section = sections[sectionIndex];
      const firstLine = section.split('\n')[0].replace(/^#+\s*/, '');

      const res = await fetch('/api/admin/insights/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${firstLine} - Professional BPO career article illustration`,
          slug: state.meta?.canonicalSlug || 'section',
          title: `Section ${sectionIndex + 1}: ${firstLine}`,
          sectionContent: section, // Full section content for GPT prompt optimization
        }),
      });

      const result = await res.json();
      if (result.success && result.imageUrl) {
        const sectionKey = `section${sectionIndex + 1}` as keyof UploadedImages;
        setUploadedImages((prev: UploadedImages) => ({ ...prev, [sectionKey]: result.imageUrl }));

        // Update images array
        const currentImages = state.images || [];
        const newImages = [...currentImages.filter((i: any) => i.position !== `section${sectionIndex + 1}`)];
        newImages.push({
          url: result.imageUrl,
          position: `section${sectionIndex + 1}`,
          alt: result.metadata?.altText || `Section ${sectionIndex + 1}`,
        });
        updateState({ images: newImages });

        if (state.pipelineId) {
          await savePipelineProgress(state.pipelineId, 8, { images: newImages });
        }

        toast({ title: `🖼️ Section ${sectionIndex + 1} image generated!` });
      } else {
        toast({ title: 'Generation failed', description: result.error?.substring(0, 100) || 'Unknown error', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Network error', variant: 'destructive' });
    } finally {
      setGeneratingSection(null);
    }
  };

  // ========== GENERATE ALL SECTION IMAGES ==========
  const handleGenerateAllSections = async () => {
    setGeneratingAllSections(true);
    for (let i = 0; i < 3; i++) {
      if (!uploadedImages[`section${i + 1}` as keyof UploadedImages]) {
        await handleGenerateSectionImage(i);
      }
    }
    setGeneratingAllSections(false);
  };

  // ========== SECTION IMAGE UPLOAD ==========
  const handleUploadSectionImage = async (e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSection(sectionIndex);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const res = await fetch('/api/admin/upload-media', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success && result.url) {
        const sectionKey = `section${sectionIndex + 1}` as keyof UploadedImages;
        setUploadedImages((prev: UploadedImages) => ({ ...prev, [sectionKey]: result.url }));
        toast({ title: 'Upload successful!', description: `Section ${sectionIndex + 1} image uploaded` });
      } else {
        toast({ title: 'Upload failed', description: result.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingSection(null);
    }
  };

  // ========== REMOVE MEDIA ==========
  const removeHero = () => {
    setUploadedImages((prev: UploadedImages) => ({ ...prev, hero: undefined }));
    updateState({ videoUrl: null });
    setHeroSource(null);
  };

  const removeSection = (index: number) => {
    const sectionKey = `section${index + 1}` as keyof UploadedImages;
    setUploadedImages((prev: UploadedImages) => ({ ...prev, [sectionKey]: undefined }));
    const filtered = (state.images || []).filter((i: any) => i.position !== `section${index + 1}`);
    updateState({ images: filtered });
  };

  // ========== MEDIA COUNTS ==========
  const heroReady = !!uploadedImages.hero;
  const sectionCount = [uploadedImages.section1, uploadedImages.section2, uploadedImages.section3].filter(Boolean).length;
  const allMediaReady = heroReady && sectionCount === 3;

  return (
    <Card className="bg-violet-500/10 border-violet-500/20">
      <CardHeader>
        <CardTitle className="text-violet-400 flex items-center gap-2">
          <ImageIcon className="w-6 h-6" /> Stage 8: Media Generation
        </CardTitle>
        <p className="text-gray-400 text-sm mt-1">
          Generate or upload your hero video/image and section images. AI creates content-aware visuals based on each section.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ============ HERO MEDIA ============ */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            {heroType === 'video' ? <Video className="w-5 h-5 text-purple-400" /> : <ImageIcon className="w-5 h-5 text-cyan-400" />}
            Hero {heroType === 'video' ? 'Video' : 'Image'}
            {heroReady && <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />}
          </h3>

          {/* Hero Type Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={heroType === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setHeroType('video'); setHeroSource(null); }}
              className={heroType === 'video' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/20 text-gray-400'}
            >
              <Video className="w-4 h-4 mr-1" /> Video
            </Button>
            <Button
              variant={heroType === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setHeroType('image'); setHeroSource(null); }}
              className={heroType === 'image' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-white/20 text-gray-400'}
            >
              <ImageIcon className="w-4 h-4 mr-1" /> Image
            </Button>
          </div>

          {/* Hero Preview */}
          {uploadedImages.hero && (
            <div className="mb-4 relative rounded-lg overflow-hidden border border-white/20">
              {heroType === 'video' ? (
                <video src={uploadedImages.hero} controls className="w-full h-64 object-cover" />
              ) : (
                <img src={uploadedImages.hero} alt="Hero" className="w-full h-64 object-cover" />
              )}
              <button
                onClick={removeHero}
                className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 rounded-full p-1 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Hero Actions */}
          <div className="flex gap-3">
            <Button
              onClick={heroType === 'video' ? handleGenerateHeroVideo : handleGenerateHeroImage}
              disabled={generatingHero || uploadingHero}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {generatingHero ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : uploadedImages.hero ? (
                <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate with {heroType === 'video' ? 'Veo' : 'Imagen 4'}</>
              )}
            </Button>

            <label className="flex-1">
              <Button
                disabled={uploadingHero || generatingHero}
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => document.getElementById('hero-upload')?.click()}
              >
                {uploadingHero ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload {heroType === 'video' ? 'Video' : 'Image'}</>
                )}
              </Button>
              <input
                id="hero-upload"
                type="file"
                accept={heroType === 'video' ? 'video/*' : 'image/*'}
                onChange={handleUploadHero}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* ============ SECTION IMAGES ============ */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              Section Images ({sectionCount}/3)
            </h3>
            <Button
              onClick={handleGenerateAllSections}
              disabled={generatingAllSections || generatingSection !== null || sectionCount === 3}
              size="sm"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              {generatingAllSections ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating All...</>
              ) : (
                <><Sparkles className="w-3 h-3 mr-1" /> Generate All Missing</>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {sections.map((section, index) => {
              const firstLine = section.split('\n')[0].replace(/^#+\s*/, '').trim();
              const sectionKey = `section${index + 1}` as keyof UploadedImages;
              const hasImage = !!uploadedImages[sectionKey];

              return (
                <div key={index} className="bg-black/20 rounded-lg p-4 border border-white/5">
                  {/* Section Title */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">Section {index + 1}</span>
                      {hasImage && <CheckCircle className="w-3 h-3 text-green-400" />}
                    </div>
                    <p className="text-sm text-gray-300 truncate max-w-[60%]">{firstLine || 'Untitled section'}</p>
                  </div>

                  {/* Section Image Preview */}
                  {hasImage && (
                    <div className="mb-3 relative rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={uploadedImages[sectionKey]}
                        alt={`Section ${index + 1}`}
                        className="w-full h-40 object-cover"
                      />
                      <button
                        onClick={() => removeSection(index)}
                        className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 rounded-full p-1 transition"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}

                  {/* Section Image Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerateSectionImage(index)}
                      disabled={generatingSection === index || uploadingSection === index || generatingAllSections}
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    >
                      {generatingSection === index ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
                      ) : hasImage ? (
                        <><RefreshCw className="w-3 h-3 mr-1" /> Regenerate</>
                      ) : (
                        <><Sparkles className="w-3 h-3 mr-1" /> Generate</>
                      )}
                    </Button>

                    <label className="flex-1">
                      <Button
                        disabled={uploadingSection === index || generatingSection === index}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => document.getElementById(`section-${index + 1}-upload`)?.click()}
                      >
                        {uploadingSection === index ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="w-3 h-3 mr-1" /> Upload</>
                        )}
                      </Button>
                      <input
                        id={`section-${index + 1}-upload`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadSectionImage(e, index)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============ MEDIA SUMMARY ============ */}
        <div className={`rounded-xl p-4 border ${allMediaReady ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
          <div className="flex items-center gap-3">
            {allMediaReady ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <p className={`font-semibold text-sm ${allMediaReady ? 'text-green-400' : 'text-amber-400'}`}>
                {allMediaReady ? 'All media ready! Proceed to Publish →' : 'Media in progress...'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Hero: {heroReady ? `✅ ${heroType}` : '⏳ pending'} | 
                Sections: {sectionCount}/3 {sectionCount === 3 ? '✅' : '⏳'}
              </p>
            </div>
          </div>
        </div>

        {/* ============ NAVIGATION ============ */}
        <div className="flex gap-3">
          {onBack && (
            <Button onClick={onBack} variant="outline" className="border-white/20 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Meta
            </Button>
          )}
          {onContinue && (
            <Button 
              onClick={onContinue} 
              className={`flex-1 h-12 ${allMediaReady ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              <ArrowRight className="w-5 h-5 mr-2" /> 
              {allMediaReady ? 'Continue to Publish' : 'Skip to Publish (media incomplete)'}
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  );
}

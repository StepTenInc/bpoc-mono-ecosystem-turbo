'use client';

import { useState } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Textarea } from '@/components/shared/ui/textarea';
import { Input } from '@/components/shared/ui/input';
import {
  CheckCircle,
  Loader2,
  Upload,
  Sparkles,
  Video,
  Eye,
  Calendar,
  Clock,
  Share2,
  X,
  Save,
  Wand2,
} from 'lucide-react';
import { StageProps, splitContentIntoSections } from '../types';

interface UploadedImages {
  hero?: string;
  section1?: string;
  section2?: string;
  section3?: string;
}

interface PublishStageProps extends StageProps {
  publishArticle: (isDraft: boolean) => Promise<void>;
  uploadedImages: UploadedImages;
  setUploadedImages: (images: UploadedImages) => void;
  heroType: 'image' | 'video';
  setHeroType: (type: 'image' | 'video') => void;
  heroSource: 'generate' | 'upload' | null;
  setHeroSource: (source: 'generate' | 'upload' | null) => void;
  sectionSource: 'generate' | 'upload' | null;
  setSectionSource: (source: 'generate' | 'upload' | null) => void;
}

export default function PublishStage({
  state,
  updateState,
  loading,
  setLoading,
  toast,
  publishArticle,
  uploadedImages,
  setUploadedImages,
  heroType,
  setHeroType,
  heroSource,
  setHeroSource,
  sectionSource,
  setSectionSource,
  savePipelineProgress,
}: PublishStageProps) {
  const [generatingHero, setGeneratingHero] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<number | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [sectionAltTexts, setSectionAltTexts] = useState<Record<number, string>>({});
  const [generatingAltText, setGeneratingAltText] = useState<number | null>(null);
  const [savingAltText, setSavingAltText] = useState<number | null>(null);
  const [savedAltTexts, setSavedAltTexts] = useState<Record<number, boolean>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const finalContent = state.seoArticle || state.humanizedArticle || state.article || '';
  const sections =
    state.contentSections.length === 3 ? state.contentSections : splitContentIntoSections(finalContent);

  // Check if any generation is in progress to prevent duplicate requests
  const isAnyGenerating = generatingHero || generatingSection !== null;

  // Update content section
  const updateSection = (index: number, content: string) => {
    const newSections = [...sections];
    newSections[index] = content;
    updateState({ contentSections: newSections });
  };

  // Update alt text locally (no auto-save) and reset saved state
  const updateAltTextLocal = (index: number, altText: string) => {
    setSectionAltTexts(prev => ({ ...prev, [index]: altText }));
    // Reset saved state when text changes
    setSavedAltTexts(prev => ({ ...prev, [index]: false }));
  };

  // Generate alt text with AI
  const generateAltTextWithAI = async (index: number) => {
    setGeneratingAltText(index);
    try {
      const section = sections[index];
      const imageUrl = uploadedImages[`section${index + 1}` as keyof UploadedImages];
      const title = state.plan?.title || state.selectedIdea?.title || '';

      const res = await fetch('/api/admin/insights/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionContent: section,
          imageUrl,
          articleTitle: title,
          sectionNumber: index + 1,
        }),
      });

      const result = await res.json();
      if (result.success && result.altText) {
        setSectionAltTexts(prev => ({ ...prev, [index]: result.altText }));
        setSavedAltTexts(prev => ({ ...prev, [index]: false })); // Reset saved state
        toast({ title: 'Alt text generated!', description: 'Review and save when ready' });
      } else {
        toast({ title: 'Generation failed', description: result.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingAltText(null);
    }
  };

  // Save alt text and image to database
  const saveAltTextToDatabase = async (index: number) => {
    const altText = sectionAltTexts[index];
    if (!altText) return;

    const imageUrl = uploadedImages[`section${index + 1}` as keyof UploadedImages];

    setSavingAltText(index);
    try {
      const res = await fetch('/api/admin/insights/save-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId: state.pipelineId,
          insightId: state.insightId,
          sectionNumber: index + 1,
          altText,
          imageUrl,
        }),
      });

      const result = await res.json();
      if (result.success) {
        // Update local state
        const currentImages = state.images || [];
        const newImages = [...currentImages];
        const sectionKey = `section${index + 1}` as keyof UploadedImages;
        const sectionImageUrl = uploadedImages[sectionKey];

        if (newImages[index]) {
          newImages[index] = { ...newImages[index], alt: altText };
        } else if (sectionImageUrl) {
          newImages[index] = { url: sectionImageUrl, position: `section${index + 1}`, alt: altText };
        }

        updateState({ images: newImages });
        setSavedAltTexts(prev => ({ ...prev, [index]: true })); // Mark as saved
        toast({ title: 'Saved!', description: `Section ${index + 1} image & alt text saved` });
      } else {
        toast({ title: 'Save failed', description: result.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingAltText(null);
    }
  };

  // Handle hero video generation with Google Veo
  const handleGenerateHeroVideo = async () => {
    setGeneratingHero(true);
    try {
      const prompt = `${state.plan?.title || state.selectedIdea?.title} - Professional BPO career article hero video`;

      const res = await fetch('/api/admin/insights/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: state.plan?.title || state.selectedIdea?.title || 'Hero Video',
          slug: state.meta?.canonicalSlug || 'hero-video',
          brief: state.transcript,
          content: state.seoArticle || state.humanizedArticle || state.article,
        }),
      });

      const result = await res.json();
      if (result.success && result.videoUrl) {
        setUploadedImages({ ...uploadedImages, hero: result.videoUrl });
        updateState({ videoUrl: result.videoUrl });

        // Save to pipeline so it persists on reload
        if (state.pipelineId) {
          await savePipelineProgress(state.pipelineId, 8, {
            videoUrl: result.videoUrl,
            heroType: 'video',
          });
        }

        // Also save directly to insights_posts table so it appears on live site
        if (state.insightId) {
          try {
            await fetch('/api/admin/insights/save-hero-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                insightId: state.insightId,
                videoUrl: result.videoUrl,
                heroType: 'video',
              }),
            });
            console.log('✅ Hero video saved to insights_posts');
          } catch (saveErr) {
            console.error('Failed to save hero video to database:', saveErr);
          }
        }

        toast({ title: 'Video generated!', description: 'Hero video created and saved' });
      } else {
        toast({ title: 'Generation failed', description: result.error || 'Unknown error', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingHero(false);
    }
  };

  // Handle hero video upload
  const handleUploadHeroVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'video');

      const res = await fetch('/api/admin/insights/upload-video', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success && result.url) {
        setUploadedImages({ ...uploadedImages, hero: result.url });
        updateState({ videoUrl: result.url });

        // Also save directly to insights_posts table so it appears on live site
        if (state.insightId) {
          try {
            await fetch('/api/admin/insights/save-hero-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                insightId: state.insightId,
                videoUrl: result.url,
                heroType: 'video',
              }),
            });
            console.log('✅ Hero video saved to insights_posts');
          } catch (saveErr) {
            console.error('Failed to save hero video to database:', saveErr);
          }
        }

        toast({ title: 'Upload successful!', description: 'Video uploaded and saved' });
      } else {
        toast({ title: 'Upload failed', description: result.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingHero(false);
    }
  };

  // Handle individual section image generation with Google Imagen
  const handleGenerateSectionImage = async (sectionIndex: number) => {
    setGeneratingSection(sectionIndex);
    try {
      const section = sections[sectionIndex];
      const firstLine = section.split('\n')[0].replace(/^#+\s*/, '');
      const prompt = `${firstLine} - Professional BPO career article illustration`;

      // Use Google Imagen for all sections
      const res = await fetch('/api/admin/insights/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          slug: state.meta?.canonicalSlug || 'section',
          title: `Section ${sectionIndex + 1}`,
          sectionContent: section, // Send full section content for GPT optimization
        }),
      });

      const result = await res.json();
      if (result.success && result.imageUrl) {
        const sectionKey = `section${sectionIndex + 1}` as keyof UploadedImages;
        setUploadedImages({ ...uploadedImages, [sectionKey]: result.imageUrl });

        // Save to pipeline so it persists on reload
        if (state.pipelineId) {
          const currentImages = state.images || [];
          const newImages = [...currentImages];
          newImages[sectionIndex] = { url: result.imageUrl, position: `section${sectionIndex + 1}`, alt: `Section ${sectionIndex + 1}` };

          await savePipelineProgress(state.pipelineId, 8, {
            images: newImages,
          });
          updateState({ images: newImages });
        }

        // Also save directly to insights_posts table so it appears on live site
        if (state.insightId) {
          try {
            await fetch('/api/admin/insights/save-alt-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pipelineId: state.pipelineId,
                insightId: state.insightId,
                sectionNumber: sectionIndex + 1,
                altText: `Section ${sectionIndex + 1} image`, // Default alt text
                imageUrl: result.imageUrl,
              }),
            });
            console.log(`✅ Image saved to insights_posts for section ${sectionIndex + 1}`);
          } catch (saveErr) {
            console.error('Failed to save image to database:', saveErr);
          }
        }

        toast({ title: 'Image generated!', description: `Section ${sectionIndex + 1} image created and saved` });
      } else {
        const errorMsg = result.error || (typeof result === 'object' ? JSON.stringify(result) : 'Unknown error');
        console.error('Image generation error:', errorMsg);
        toast({
          title: 'Generation failed',
          description: typeof errorMsg === 'string' ? errorMsg.substring(0, 100) : 'Image generation failed',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Image generation exception:', err);
      toast({ title: 'Error', description: err.message || 'Network error', variant: 'destructive' });
    } finally {
      setGeneratingSection(null);
    }
  };

  // Handle section image upload
  const handleUploadSectionImage = async (e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSection(sectionIndex);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'section');

      const res = await fetch('/api/admin/insights/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success && result.url) {
        const sectionKey = `section${sectionIndex + 1}` as keyof UploadedImages;
        setUploadedImages({ ...uploadedImages, [sectionKey]: result.url });

        // Also save directly to insights_posts table so it appears on live site
        if (state.insightId) {
          try {
            await fetch('/api/admin/insights/save-alt-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pipelineId: state.pipelineId,
                insightId: state.insightId,
                sectionNumber: sectionIndex + 1,
                altText: `Section ${sectionIndex + 1} image`, // Default alt text
                imageUrl: result.url,
              }),
            });
            console.log(`✅ Image saved to insights_posts for section ${sectionIndex + 1}`);
          } catch (saveErr) {
            console.error('Failed to save image to database:', saveErr);
          }
        }

        toast({ title: 'Upload successful!', description: `Section ${sectionIndex + 1} image uploaded and saved` });
      } else {
        toast({ title: 'Upload failed', description: result.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingSection(null);
    }
  };

  // Markdown Components for preview
  const MarkdownComponents: any = {
    h1: ({ node, ...props }: any) => (
      <h1 className="text-3xl font-extrabold text-white mt-8 mb-4 tracking-tight" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <div className="mt-10 mb-6 group">
        <h2
          className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2 relative"
          {...props}
        >
          <span className="absolute -left-4 top-1 w-1 h-6 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {props.children}
          </span>
        </h2>
      </div>
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-lg font-bold text-cyan-400 mt-6 mb-3 tracking-wide" {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p className="text-gray-300 leading-relaxed mb-4 text-sm" {...props} />
    ),
    ul: ({ node, ...props }: any) => (
      <ul className="space-y-3 my-4 p-4 rounded-xl border border-white/10 bg-white/5" {...props} />
    ),
    li: ({ node, ...props }: any) => (
      <li className="flex items-start gap-2 text-gray-300 text-sm">
        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 shrink-0" />
        <span className="flex-1">{props.children}</span>
      </li>
    ),
    strong: ({ node, ...props }: any) => <strong className="text-white font-bold" {...props} />,
  };

  return (
    <Card className="bg-emerald-500/10 border-emerald-500/20">
      <CardHeader>
        <CardTitle className="text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-6 h-6" /> Stage 8: Finalize & Publish
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hero Video Section */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Hero Video
          </h3>

          {/* Hero Video Preview */}
          {uploadedImages.hero && (
            <div className="mb-4 rounded-lg overflow-hidden border border-white/20">
              <video
                src={uploadedImages.hero}
                controls
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Hero Video Actions */}
          <div className="flex gap-3">
            {!uploadedImages.hero ? (
              <>
                <Button
                  onClick={handleGenerateHeroVideo}
                  disabled={isAnyGenerating || uploadingHero}
                  className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingHero ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate with Veo
                </Button>

                <Button
                  disabled={uploadingHero || isAnyGenerating}
                  variant="outline"
                  className="flex-1 h-10 border-white/20 text-gray-300 hover:bg-white/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => document.getElementById('hero-upload')?.click()}
                >
                  {uploadingHero ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Video
                </Button>
                <input
                  id="hero-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleUploadHeroVideo}
                  className="hidden"
                />
              </>
            ) : (
              <>
                <Button
                  onClick={handleGenerateHeroVideo}
                  disabled={isAnyGenerating || uploadingHero}
                  className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingHero ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Regenerate with Veo
                </Button>

                <Button
                  onClick={async () => {
                    setUploadingHero(true);
                    try {
                      if (state.pipelineId) {
                        await savePipelineProgress(state.pipelineId, 8, {
                          videoUrl: uploadedImages.hero,
                          heroType: 'video',
                        });
                        toast({
                          title: 'Video saved!',
                          description: 'Hero video saved to database successfully'
                        });
                      }
                    } catch (err: any) {
                      toast({
                        title: 'Save failed',
                        description: err.message,
                        variant: 'destructive'
                      });
                    } finally {
                      setUploadingHero(false);
                    }
                  }}
                  disabled={uploadingHero}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {uploadingHero ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Video
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-bold mb-3">Section {index + 1}</h3>

              {/* Section Content */}
              <Textarea
                value={section}
                onChange={(e) => updateSection(index, e.target.value)}
                className="min-h-[200px] bg-black/30 border-white/10 text-white mb-4 font-mono text-sm"
                placeholder={`Section ${index + 1} content...`}
              />

              {/* Section Image Preview */}
              {uploadedImages[`section${index + 1}` as keyof UploadedImages] && (
                <div className="mb-4 space-y-3">
                  {/* Image with Eye Button Overlay */}
                  <div className="relative rounded-lg overflow-hidden border border-white/20 group">
                    <img
                      src={uploadedImages[`section${index + 1}` as keyof UploadedImages]}
                      alt={sectionAltTexts[index] || state.images?.[index]?.alt || `Section ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    {/* Eye Button Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                      <button
                        onClick={() => setFullscreenImage(uploadedImages[`section${index + 1}` as keyof UploadedImages] || null)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-3 border border-white/30"
                        title="View full size"
                      >
                        <Eye className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Alt Text Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-medium">
                      Alt Text (SEO)
                    </label>
                    <Input
                      value={sectionAltTexts[index] ?? ''}
                      onChange={(e) => updateAltTextLocal(index, e.target.value)}
                      placeholder={`Describe this image for SEO...`}
                      className="bg-black/30 border-white/10 text-white text-sm placeholder:text-gray-500"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {(sectionAltTexts[index] || '').length}/125 characters recommended
                      </p>
                      <div className="flex gap-2">
                        {/* Generate with AI Button */}
                        <Button
                          onClick={() => generateAltTextWithAI(index)}
                          disabled={generatingAltText === index}
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-gray-300 hover:bg-white/5 hover:text-white text-xs h-8"
                        >
                          {generatingAltText === index ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3 mr-1" />
                          )}
                          Generate with AI
                        </Button>
                        {/* Save Button */}
                        <Button
                          onClick={() => saveAltTextToDatabase(index)}
                          disabled={!sectionAltTexts[index] || savingAltText === index || savedAltTexts[index]}
                          size="sm"
                          className={`text-xs h-8 ${savedAltTexts[index]
                            ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-600 disabled:opacity-50'
                            }`}
                        >
                          {savingAltText === index ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : savedAltTexts[index] ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <Save className="w-3 h-3 mr-1" />
                          )}
                          {savedAltTexts[index] ? 'Saved' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Image Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleGenerateSectionImage(index)}
                  disabled={isAnyGenerating || uploadingSection === index}
                  className="flex-1 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingSection === index ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate with Imagen
                </Button>

                <Button
                  disabled={uploadingSection === index || isAnyGenerating}
                  variant="outline"
                  className="flex-1 h-10 border-white/20 text-gray-300 hover:bg-white/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => document.getElementById(`section-${index + 1}-upload`)?.click()}
                >
                  {uploadingSection === index ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Image
                </Button>
                <input
                  id={`section-${index + 1}-upload`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadSectionImage(e, index)}
                  className="hidden"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Preview Toggle */}
        <Button
          onClick={() => setShowPreview(!showPreview)}
          variant="outline"
          className="w-full h-10 border-white/20 text-gray-300 hover:bg-white/5 hover:text-white"
        >
          <Eye className="w-4 h-4 mr-2" />
          {showPreview ? 'Hide' : 'Show'} Article Preview
        </Button>

        {/* Article Preview */}
        {showPreview && (
          <div className="bg-[#0B0B0D] rounded-xl overflow-hidden shadow-xl border border-white/10">
            {/* Hero Section */}
            <div className="relative">
              <div className="relative w-full h-72 overflow-hidden">
                {heroType === 'video' && uploadedImages.hero ? (
                  <video
                    src={uploadedImages.hero}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover object-center"
                  />
                ) : uploadedImages.hero ? (
                  <img
                    src={uploadedImages.hero}
                    alt="Hero"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-purple-600 opacity-30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/70 to-[#0B0B0D]/40" />
              </div>

              <div className="relative z-10 px-6 pb-6 -mt-24">
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-4">
                  <span className="border border-cyan-500/30 text-cyan-400 bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
                    {state.selectedSilo || 'BPO Career'}
                  </span>
                  <span className="text-gray-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{' '}
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-gray-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{' '}
                    {Math.ceil(finalContent.split(/\s+/).length / 200)} min read
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight mb-3">
                  {state.plan?.title || state.selectedIdea?.title}
                </h1>

                <p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-2xl">
                  {state.meta?.metaDescription || state.plan?.metaDescription || ''}
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 shadow-lg shadow-purple-500/30">
                    <Image
                      src="/Chat Agent/Ate Yna.png"
                      alt="Ate Yna"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      By <span className="text-cyan-400">Ate Yna</span>
                    </p>
                    <p className="text-gray-400 text-xs">BPO Career Expert</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="px-6 pb-8">
              {sections.map((section, index) => (
                <div key={index}>
                  {uploadedImages[`section${index + 1}` as keyof UploadedImages] && (
                    <figure className="my-6 rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={uploadedImages[`section${index + 1}` as keyof UploadedImages]}
                        alt={`Section ${index + 1}`}
                        className="w-full h-auto object-cover"
                      />
                    </figure>
                  )}
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {section}
                  </ReactMarkdown>
                </div>
              ))}

              {/* Share Section */}
              <div className="mt-10 pt-6 border-t border-white/10">
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share this insight
                </h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-white/10 text-gray-400 text-xs">
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/10 text-gray-400 text-xs">
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/10 text-gray-400 text-xs">
                    Facebook
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publish Actions */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
          <Button
            onClick={async () => {
              setIsPublishing(true);
              try {
                await publishArticle(false);
                setIsPublished(true);
              } catch (err) {
                // Error handled by parent
              } finally {
                setIsPublishing(false);
              }
            }}
            disabled={loading || isPublishing || isPublished}
            className={`flex-1 h-12 text-white font-semibold transition-all duration-300 ${isPublished
              ? 'bg-emerald-600 cursor-default'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
              }`}
          >
            {isPublishing || loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span className="animate-pulse">Publishing...</span>
              </>
            ) : isPublished ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Published!
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Publish Article
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            title="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={fullscreenImage}
            alt="Full size preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Card>
  );
}

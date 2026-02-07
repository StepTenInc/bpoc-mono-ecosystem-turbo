'use client';

/**
 * AI CONTENT PIPELINE - COMPLETE 8-STAGE WIZARD
 *
 * Stage 1: Voice Brief → Whisper → AI Fix → Confirm
 * Stage 2: Research → Serper.ai + HR KB
 * Stage 3: Plan → Claude generates structure → Approve
 * Stage 4: Write → Claude + Ate Ina personality
 * Stage 5: Humanize → Grok (pass AI detectors)
 * Stage 6: SEO → Gemini (internal links, keywords)
 * Stage 7: Meta → GPT-4o-mini + Gemini Images
 * Stage 8: Publish → Preview + Save/Publish
 *
 * REFACTORED: Each stage is now a separate component
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import {
  Mic, Search, FileText, Pencil, Bot, Sparkles,
  CheckCircle, Image as ImageIcon, ArrowLeft, ArrowRight, X, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import types and stage components
import { PipelineState, initialPipelineState, STAGES, splitContentIntoSections } from './types';
import BriefStage from './components/BriefStage';
import ResearchStage from './components/ResearchStage';
import PlanStage from './components/PlanStage';
import WriteStage from './components/WriteStage';
import HumanizeStage from './components/HumanizeStage';
import SeoStage from './components/SeoStage';
import MetaStage from './components/MetaStage';
import PublishStage from './components/PublishStage';

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

// Sleek initial page loader - contained within main content area with BPOC styling
function PipelineLoader({ message = "Initializing pipeline..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* BPOC Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Content - centered in main area */}
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6">
        {/* Logo/Icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-red-500/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-400" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-300" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-xl font-semibold text-white mb-2">AI Content Pipeline</h2>
        <p className="text-gray-400 text-sm mb-8">{message}</p>

        {/* Minimal progress bar */}
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// Inline stage transition loader
function StageLoader({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-orange-400" />
        </div>
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-orange-500/30 animate-ping" style={{ animationDuration: '2s' }} />
      </div>
      <p className="text-white font-medium mb-2">{message}</p>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function CreateInsightPage() {
  // Core state
  const [stage, setStage] = useState(1);
  const [state, setState] = useState<PipelineState>(initialPipelineState);
  const [loading, setLoading] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Stage 1 state
  const [ideas, setIdeas] = useState<any[]>([]);
  const [typedBrief, setTypedBrief] = useState('');

  // Stage 7 state (Meta)
  const [heroType, setHeroType] = useState<'image' | 'video'>('video');
  const [heroSource, setHeroSource] = useState<'generate' | 'upload' | null>(null);
  const [sectionSource, setSectionSource] = useState<'generate' | 'upload' | null>(null);
  const [heroComplete, setHeroComplete] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ hero?: string; section1?: string; section2?: string; section3?: string }>({});
  const [uploading, setUploading] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Modal states
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Check if silo is pre-selected from silo visualization (locked mode)
  const siloFromUrl = searchParams.get('siloId');
  const siloNameFromUrl = searchParams.get('siloName');
  const siloSlugFromUrl = searchParams.get('silo');
  const isPillarFromUrl = searchParams.get('pillar') === 'true';
  // Lock silo if coming from visualization with siloId OR if creating a pillar post
  const isSiloLocked = Boolean(siloFromUrl && (siloNameFromUrl || siloSlugFromUrl || isPillarFromUrl));

  const update = (updates: Partial<PipelineState>) => setState(prev => ({ ...prev, ...updates }));

  // Stage icons with BPOC brand styling (red/orange theme)
  const stageIcons = [
    { num: 1, icon: Mic, label: 'Brief', color: 'from-red-500 to-orange-500' },
    { num: 2, icon: Search, label: 'Research', color: 'from-red-500 to-orange-500' },
    { num: 3, icon: FileText, label: 'Plan', color: 'from-red-500 to-orange-500' },
    { num: 4, icon: Pencil, label: 'Write', color: 'from-red-500 to-orange-500' },
    { num: 5, icon: Bot, label: 'Humanize', color: 'from-red-500 to-orange-500' },
    { num: 6, icon: Sparkles, label: 'SEO', color: 'from-red-500 to-orange-500' },
    { num: 7, icon: ImageIcon, label: 'Meta', color: 'from-red-500 to-orange-500' },
    { num: 8, icon: CheckCircle, label: 'Publish', color: 'from-red-500 to-orange-500' },
  ];

  // Initial load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Set silo from URL params (coming from silo visualization)
  useEffect(() => {
    if (siloFromUrl && !state.pipelineId) {
      // Need to fetch silos to get the slug from the name
      const fetchAndSetSilo = async () => {
        try {
          const res = await fetch('/api/silos');
          const data = await res.json();
          if (data.silos) {
            const matchingSilo = data.silos.find((s: any) => s.id === siloFromUrl);
            if (matchingSilo) {
              const updates: Partial<PipelineState> = {
                selectedSilo: matchingSilo.slug,
                selectedSiloId: matchingSilo.id,
              };

              // If pillar=true, also set isPillar
              if (isPillarFromUrl) {
                updates.isPillar = true;
              }

              update(updates);

              toast({
                title: isPillarFromUrl ? `Creating Pillar Post` : `Silo pre-selected`,
                description: isPillarFromUrl
                  ? `Creating pillar post for "${matchingSilo.name}" silo`
                  : `Creating article for "${matchingSilo.name}"`,
              });
            }
          }
        } catch (error) {
          console.error('Error fetching silos:', error);
        }
      };
      fetchAndSetSilo();
    }
  }, [siloFromUrl, siloNameFromUrl, siloSlugFromUrl, isPillarFromUrl]);

  // ========== AUTO-RESUME: Check URL param for resume ==========
  useEffect(() => {
    const resumeId = searchParams.get('resume');

    if (resumeId && !state.pipelineId) {
      const loadAndResume = async () => {
        setLoadingDrafts(true);
        try {
          console.log('[RESUME] Loading pipeline:', resumeId);
          const res = await fetch(`/api/admin/content-pipeline/get?id=${resumeId}`);
          const result = await res.json();
          if (result.success && result.pipeline) {
            console.log('[RESUME] Pipeline loaded, resuming...');
            await resumePipeline(result.pipeline);
          } else {
            console.log('[RESUME] Pipeline not found');
            toast({ title: 'Error', description: 'Pipeline not found', variant: 'destructive' });
            setLoadingDrafts(false);
          }
        } catch (err) {
          console.error('[RESUME] Error loading pipeline:', err);
          setLoadingDrafts(false);
        }
      };
      loadAndResume();
    } else {
      // No resume parameter - start fresh
      setLoadingDrafts(false);
    }
  }, [searchParams]);

  // ========== RESUME PIPELINE ==========
  const resumePipeline = async (pipeline: any) => {
    const targetStage = pipeline.current_stage || 1;

    let articleData: any = null;
    if (pipeline.insight_id) {
      try {
        const res = await fetch(`/api/admin/insights/pipeline/get-draft?id=${pipeline.insight_id}`);
        const result = await res.json();
        if (result.success && result.draft) {
          articleData = result.draft;
        }
      } catch (err) {
        console.error('Failed to load article data:', err);
      }
    }

    update({
      pipelineId: pipeline.id,
      insightId: pipeline.insight_id,

      // Stage 1
      transcript: pipeline.brief_transcript || '',
      briefConfirmed: !!pipeline.brief_transcript,
      selectedSilo: pipeline.selected_silo || articleData?.silo_topic || '',
      selectedSiloId: pipeline.selected_silo_id || articleData?.silo_id || null,

      // Stage 2
      selectedIdea: pipeline.selected_idea || (articleData ? { title: articleData.title } : null),
      researchData: articleData?.serper_research || {
        serperResults: pipeline.serper_results,
        laborArticles: pipeline.hr_kb_results,
        research: { synthesis: pipeline.research_synthesis }
      },

      // Stage 3
      plan: pipeline.article_plan || articleData?.generation_metadata?.plan,
      planApproved: pipeline.plan_approved || false,

      // Stage 4 - Prioritize pipeline data
      article: pipeline.raw_article || articleData?.content || '',
      wordCount: pipeline.word_count || (pipeline.raw_article?.split(/\s+/).length || 0),

      // Stage 5 - Prioritize pipeline data
      humanizedArticle: pipeline.humanized_article || articleData?.content || '',
      humanScore: pipeline.human_score || articleData?.humanization_score || 0,

      // Stage 6 - Prioritize pipeline data
      seoArticle: pipeline.seo_article || articleData?.content || '',
      seoStats: pipeline.seo_stats || {},

      // Stage 7
      meta: pipeline.meta_data || (articleData?.generation_metadata ? {
        metaTitle: articleData.title,
        metaDescription: articleData.meta_description,
      } : null),
      images: pipeline.generated_images || [],

      // Stage 8
      contentSections: [
        pipeline.content_section1 || articleData?.content_part1 || '',
        pipeline.content_section2 || articleData?.content_part2 || '',
        pipeline.content_section3 || articleData?.content_part3 || ''
      ].filter(Boolean),
      heroType: pipeline.hero_type || articleData?.hero_type || 'image',
      videoUrl: pipeline.video_url || articleData?.video_url || null,
    });

    const hType = articleData?.hero_type || pipeline.hero_type;
    if (hType) setHeroType(hType as 'image' | 'video');
    if (pipeline.hero_source) setHeroSource(pipeline.hero_source);
    if (pipeline.section_source) setSectionSource(pipeline.section_source);

    const restoredUploads: any = {};
    // Check for video URL from both pipeline and articleData
    const videoUrl = pipeline.video_url || articleData?.video_url;
    const heroTypeVal = pipeline.hero_type || articleData?.hero_type;

    if (heroTypeVal === 'video' && videoUrl) {
      restoredUploads.hero = videoUrl;
    } else if (articleData?.hero_url) {
      restoredUploads.hero = articleData.hero_url;
    }
    if (articleData?.content_image0) restoredUploads.section1 = articleData.content_image0;
    if (articleData?.content_image1) restoredUploads.section2 = articleData.content_image1;
    if (articleData?.content_image2) restoredUploads.section3 = articleData.content_image2;
    setUploadedImages(restoredUploads);

    const imagesArray: any[] = [];
    if (restoredUploads.hero && hType !== 'video') {
      imagesArray.push({ url: restoredUploads.hero, position: 'hero', alt: 'Hero' });
    }
    if (restoredUploads.section1) imagesArray.push({ url: restoredUploads.section1, position: 'section1', alt: 'Section 1' });
    if (restoredUploads.section2) imagesArray.push({ url: restoredUploads.section2, position: 'section2', alt: 'Section 2' });
    if (restoredUploads.section3) imagesArray.push({ url: restoredUploads.section3, position: 'section3', alt: 'Section 3' });
    if (imagesArray.length > 0) {
      update({ images: imagesArray });
    }

    if (restoredUploads.hero) setHeroComplete(true);

    // Set stage and hide loader AFTER all state is ready
    setStage(targetStage);

    // Small delay to ensure React has processed all state updates
    await new Promise(resolve => setTimeout(resolve, 100));

    setLoadingDrafts(false);

    toast({
      title: 'Pipeline loaded!',
      description: `Resuming from Stage ${targetStage}`
    });
  };

  // ========== HELPER: SAVE TO CONTENT_PIPELINES ==========
  const savePipelineProgress = async (pipelineId: string, stageNum: number, data: Record<string, any>, aiLog?: any) => {
    try {
      const res = await fetch('/api/admin/content-pipeline/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId, stage: stageNum, data, aiLog })
      });
      const result = await res.json();
      if (!result.success) {
        console.error('Failed to save pipeline progress:', result.error);
      }
      return result.success;
    } catch (err) {
      console.error('Error saving pipeline:', err);
      return false;
    }
  };

  // ========== HELPER: SAVE TO INSIGHTS_POSTS ==========
  const saveProgress = async (insightId: string, updates: Record<string, any>, pipelineStage: string) => {
    try {
      const res = await fetch('/api/admin/insights/pipeline/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, updates, pipelineStage })
      });
      const result = await res.json();
      return result;
    } catch (err) {
      console.error('Error saving progress:', err);
      return { success: false };
    }
  };

  // ========== HELPER: SAVE UPLOADED MEDIA ==========
  const saveUploadedMedia = async (uploadedData: { hero?: string; section1?: string; section2?: string; section3?: string }, isVideo?: boolean) => {
    if (!state.insightId) return;

    const updates: Record<string, any> = {
      hero_type: heroType || 'image',
    };

    if (isVideo && uploadedData.hero) {
      updates.video_url = uploadedData.hero;
    } else if (uploadedData.hero) {
      updates.hero_url = uploadedData.hero;
    }

    if (uploadedData.section1) updates.content_image0 = uploadedData.section1;
    if (uploadedData.section2) updates.content_image1 = uploadedData.section2;
    if (uploadedData.section3) updates.content_image2 = uploadedData.section3;

    await saveProgress(state.insightId, updates, stage === 8 ? 'meta' : 'writing');

    if (state.pipelineId) {
      await savePipelineProgress(state.pipelineId, 8, {
        heroType: heroType || 'image',
        heroSource,
        sectionSource,
      });
    }
  };

  // ========== CREATE DRAFT FROM SELECTED IDEA ==========
  // This is called when user clicks "Next Stage" from stage 1
  const createDraftFromSelectedIdea = async (): Promise<boolean> => {
    const idea = state.selectedIdea;
    if (!idea) {
      toast({ title: 'Error', description: 'Please select an idea first', variant: 'destructive' });
      return false;
    }

    // If we already have a pipeline and insight, just proceed
    if (state.pipelineId && state.insightId) {
      return true;
    }

    console.log('[CREATE] Starting article creation for:', idea.title);
    setLoading(true);
    try {
      // Step 1: Create pipeline first
      console.log('[CREATE] Step 1: Creating pipeline...');
      const pipelineRes = await fetch('/api/admin/content-pipeline/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefType: state.transcript ? 'voice' : 'text',
          briefTranscript: state.transcript || '',
          selectedSilo: state.selectedSilo,
          selectedSiloId: state.selectedSiloId,
        })
      });

      const pipelineResult = await pipelineRes.json();
      console.log('[CREATE] Pipeline response:', pipelineResult);

      if (!pipelineResult.success) {
        throw new Error(pipelineResult.error || 'Failed to create pipeline');
      }

      console.log('[CREATE] Pipeline created:', pipelineResult.pipelineId);

      // Step 2: Create draft and link it to pipeline (silo data is read from pipeline)
      console.log('[CREATE] Step 2: Creating draft...');
      const draftRes = await fetch('/api/admin/insights/pipeline/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          brief: state.transcript,
          pipelineId: pipelineResult.pipelineId, // Pipeline is source of truth for silo
        })
      });

      const draftResult = await draftRes.json();
      console.log('[CREATE] Draft response:', draftResult);

      if (draftResult.success) {
        // Step 3: Update pipeline with selected idea
        console.log('[CREATE] Step 3: Updating pipeline with idea...');
        await fetch('/api/admin/content-pipeline/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pipelineId: pipelineResult.pipelineId,
            stage: 1,
            data: { selectedIdea: idea },
            aiLog: { action: 'idea_selected', ideaTitle: idea.title }
          })
        });

        console.log('[CREATE] All steps complete!');
        update({
          insightId: draftResult.insightId,
          pipelineId: pipelineResult.pipelineId,
        });
        toast({
          title: 'Pipeline started!',
          description: `Article and pipeline created. ID: ${pipelineResult.pipelineId.slice(0, 8)}...`
        });
        return true;
      } else {
        console.error('[CREATE] Draft creation failed:', draftResult.error);
        toast({ title: 'Error', description: draftResult.error || 'Failed to create draft', variant: 'destructive' });
        return false;
      }
    } catch (err: any) {
      console.error('[CREATE] Error:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
    finally {
      console.log('[CREATE] Process complete, loading=false');
      setLoading(false);
    }
  };

  // Legacy function for backward compatibility (not used anymore)
  const selectIdeaAndCreateDraft = async (idea: any) => {
    update({ selectedIdea: idea });
  };

  // ========== GENERATE META (Passed to MetaStage) ==========
  const generateMeta = async () => {
    setLoading(true);

    const needAIHero = heroSource === 'generate' && heroType === 'image';
    const needAIVideo = heroSource === 'generate' && heroType === 'video';
    const needAISections = sectionSource === 'generate';

    try {
      const res = await fetch('/api/admin/insights/pipeline/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: state.seoArticle || state.humanizedArticle || state.article,
          title: state.plan?.title || state.selectedIdea?.title,
          keywords: state.selectedIdea?.keywords,
          heroType,
          generateHero: needAIHero || needAIVideo,
          generateSections: needAISections,
          uploadedHeroUrl: uploadedImages.hero,
          uploadedSectionUrls: [uploadedImages.section1, uploadedImages.section2, uploadedImages.section3].filter(Boolean),
          originalBrief: state.transcript,
          selectedIdea: state.selectedIdea,
          research: state.researchData,
          plan: state.plan,
        })
      });

      const result = await res.json();

      if (result.success) {
        const finalImages: any[] = [];
        let finalVideoUrl: string | null = null;

        if (heroType === 'video') {
          if (result.videoUrl) {
            finalVideoUrl = result.videoUrl;
          } else if (uploadedImages.hero) {
            finalVideoUrl = uploadedImages.hero;
          }
        }

        if (heroType === 'image') {
          const heroUrl = needAIHero && result.images?.find((i: any) => i.position === 'hero')?.url
            ? result.images.find((i: any) => i.position === 'hero').url
            : uploadedImages.hero;
          if (heroUrl) finalImages.push({ url: heroUrl, position: 'hero', alt: 'Hero image' });
        }

        const sectionPositions = ['section1', 'section2', 'section3'];
        for (let i = 0; i < 3; i++) {
          const pos = sectionPositions[i];
          const uploadedKey = pos as keyof typeof uploadedImages;
          let sectionUrl = uploadedImages[uploadedKey];

          if (needAISections && result.images) {
            const aiSection = result.images.find((img: any) => img.position === pos);
            if (aiSection?.url) sectionUrl = aiSection.url;
          }

          if (sectionUrl) finalImages.push({ url: sectionUrl, position: pos, alt: `Section ${i + 1}` });
        }

        update({
          meta: result.meta,
          images: finalImages,
          heroType,
          videoUrl: finalVideoUrl,
        });

        if (state.pipelineId) {
          await savePipelineProgress(state.pipelineId, 8, {
            heroType: heroType || 'image',
            metaData: result.meta,
            imagePrompts: result.imagePrompts,
            generatedImages: finalImages,
            videoUrl: finalVideoUrl,
            heroSource,
            sectionSource,
            markComplete: true,
          }, { action: 'meta_generated', model: 'gpt-4o-mini', imagesCount: finalImages.length });
        }

        if (state.insightId) {
          const isVideoHero = heroType === 'video';
          const heroImg = finalImages.find(i => i.position === 'hero');
          const sect1 = finalImages.find(i => i.position === 'section1');
          const sect2 = finalImages.find(i => i.position === 'section2');
          const sect3 = finalImages.find(i => i.position === 'section3');

          await saveProgress(state.insightId, {
            meta_description: result.meta?.metaDescription,
            hero_type: heroType || 'image',
            hero_url: isVideoHero ? null : heroImg?.url || null,
            video_url: isVideoHero ? finalVideoUrl : null,
            content_image0: sect1?.url || null,
            content_image1: sect2?.url || null,
            content_image2: sect3?.url || null,
            generation_metadata: {
              metaTitle: result.meta?.metaTitle,
              metaDescription: result.meta?.metaDescription,
              schema: result.meta?.schema,
              heroType: heroType || 'image',
              videoUrl: finalVideoUrl,
            },
          }, 'ready');
        }

        toast({ title: 'Meta ready!', description: heroType === 'video' && finalVideoUrl ? 'Video generated!' : `${finalImages.length} images` });
      } else {
        toast({ title: 'Error', description: result.error || 'Meta generation failed', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    finally { setLoading(false); }
  };

  // ========== PUBLISH ARTICLE ==========
  const publishArticle = async (isDraft: boolean) => {
    setLoading(true);
    console.log('📤 [PUBLISH] Starting publish...', { isDraft, pipelineId: state.pipelineId });

    try {
      const finalContent = state.seoArticle || state.humanizedArticle || state.article;

      if (!finalContent) {
        toast({ title: 'Error', description: 'No content to publish', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const sections = state.contentSections.length === 3
        ? state.contentSections
        : splitContentIntoSections(finalContent);

      // Build section images array with alt texts for SEO
      const sectionImagesWithAlt = state.images?.map((img, index) => ({
        url: img.url,
        alt: img.alt || `${state.plan?.title || state.selectedIdea?.title} - Section ${index + 1}`,
        position: img.position || `section${index + 1}`,
      })) || [];

      // Get uploaded section URLs
      const uploadedSectionUrls = [
        uploadedImages.section1,
        uploadedImages.section2,
        uploadedImages.section3,
      ].filter(Boolean);

      if (state.pipelineId) {
        console.log('📤 [PUBLISH] Using pipeline publish endpoint');
        console.log('📤 [PUBLISH] uploadedImages:', uploadedImages);
        console.log('📤 [PUBLISH] sectionImagesWithAlt:', sectionImagesWithAlt);
        console.log('📤 [PUBLISH] uploadedSectionUrls:', uploadedSectionUrls);

        // Merge uploadedImages URLs with sectionImagesWithAlt for complete data
        const mergedSectionImages = [0, 1, 2].map((index) => {
          const sectionKey = `section${index + 1}` as 'section1' | 'section2' | 'section3';
          const uploadedUrl = uploadedImages[sectionKey];
          const stateImage = sectionImagesWithAlt[index];

          return {
            url: uploadedUrl || stateImage?.url || null,
            alt: stateImage?.alt || `${state.plan?.title || state.selectedIdea?.title} - Section ${index + 1}`,
            position: `section${index + 1}`,
          };
        }).filter(img => img.url); // Only include images that have URLs

        console.log('📤 [PUBLISH] mergedSectionImages:', mergedSectionImages);

        const res = await fetch('/api/admin/content-pipeline/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pipelineId: state.pipelineId,
            isDraft,
            sectionImages: mergedSectionImages,
            uploadedSectionUrls, // Also pass direct URLs as backup
            contentSections: sections, // Pass the 3 content sections
            coverImageAlt: `${state.plan?.title || state.selectedIdea?.title} - Featured image`,
            isPillar: state.isPillar,
            heroUrl: uploadedImages.hero, // Pass video URL
          })
        });

        console.log('📤 [PUBLISH] Response status:', res.status);
        const result = await res.json();
        console.log('📤 [PUBLISH] Result:', result);

        if (result.success) {
          toast({
            title: isDraft ? 'Saved as draft!' : (state.isPillar ? 'Pillar Post Published!' : 'Article Published!'),
            description: isDraft ? 'You can continue editing later' : `Published: ${result.article?.title || 'Article'}`,
          });
          // Small delay to show toast before redirect
          // For pillar posts, redirect to silo page; for regular articles, redirect to article page
          const redirectUrl = isDraft
            ? '/admin/insights'
            : (state.isPillar && state.selectedSilo
                ? `/insights/${state.selectedSilo}`
                : `/insights/${state.selectedSilo}/${result.article?.slug}`);
          setTimeout(() => {
            router.push(redirectUrl);
          }, 500);
        } else {
          console.error('❌ [PUBLISH] Error:', result.error);
          toast({ title: 'Publish Error', description: result.error || 'Failed to publish', variant: 'destructive' });
        }
      } else {
        console.log('📤 [PUBLISH] Using legacy publish endpoint');
        const res = await fetch('/api/admin/insights/pipeline/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: state.plan?.title || state.selectedIdea?.title,
            content: finalContent,
            contentSections: sections,
            slug: state.meta?.canonicalSlug,
            silo: state.selectedSilo,
            siloId: state.selectedSiloId,
            isPillar: state.isPillar,
            keywords: state.selectedIdea?.keywords,
            meta: state.meta,
            images: state.images,
            sectionImages: sectionImagesWithAlt,
            coverImageAlt: `${state.plan?.title || state.selectedIdea?.title} - Featured image`,
            uploadedHeroUrl: uploadedImages.hero,
            uploadedSectionUrls,
            heroType: heroType || 'image',
            heroSource,
            sectionSource,
            isDraft,
            draftId: state.draftId,
          })
        });

        console.log('📤 [PUBLISH] Response status:', res.status);
        const result = await res.json();
        console.log('📤 [PUBLISH] Result:', result);

        if (result.success) {
          toast({
            title: isDraft ? 'Saved as draft!' : (state.isPillar ? 'Pillar Post Published!' : 'Article Published!'),
            description: isDraft ? 'You can continue editing later' : `Published: ${result.article?.title || 'Article'}`,
          });
          // For pillar posts, redirect to silo page; for regular articles, redirect to article page
          const redirectUrl = isDraft
            ? '/admin/insights'
            : (state.isPillar && state.selectedSilo
                ? `/insights/${state.selectedSilo}`
                : `/insights/${state.selectedSilo}/${result.article?.slug}`);
          setTimeout(() => {
            router.push(redirectUrl);
          }, 500);
        } else {
          console.error('❌ [PUBLISH] Error:', result.error);
          toast({ title: 'Publish Error', description: result.error || 'Failed to publish', variant: 'destructive' });
        }
      }
    } catch (err: any) {
      console.error('❌ [PUBLISH] Exception:', err);
      toast({ title: 'Error', description: err.message || 'An unexpected error occurred', variant: 'destructive' });
    }
    finally { setLoading(false); }
  };

  // ========== EDIT ARTICLE HANDLER ==========
  const handleEditArticle = (content: string, type: string) => {
    setEditContent(content);
    setShowEdit(type);
  };

  const saveEditedContent = async () => {
    if (!showEdit) return;

    const updateField = showEdit === 'article' ? 'article'
      : showEdit === 'humanized' ? 'humanizedArticle'
        : showEdit === 'seo' ? 'seoArticle' : '';

    if (updateField) {
      update({ [updateField]: editContent });

      if (state.insightId) {
        await saveProgress(state.insightId, { content: editContent }, showEdit);
      }

      toast({ title: 'Saved!', description: 'Article updated' });
    }

    setShowEdit(null);
    setEditContent('');
  };

  // ========== START NEW PIPELINE ==========
  const startNewPipeline = async () => {
    if (state.pipelineId) {
      try {
        await fetch('/api/admin/content-pipeline/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pipelineId: state.pipelineId,
            stage: stage,
            data: { markAbandoned: true }
          })
        });
      } catch (err) {
        console.error('Failed to mark pipeline as abandoned:', err);
      }
    }

    setState(initialPipelineState);
    setStage(1);
    setHeroType('video');
    setHeroSource(null);
    setSectionSource(null);
    setHeroComplete(false);
    setUploadedImages({});
    setIdeas([]);
    setTypedBrief('');

    toast({ title: 'Starting fresh pipeline', description: 'All stages reset' });
  };

  // ========== COMMON STAGE PROPS ==========
  const stageProps = {
    state,
    updateState: update,
    loading,
    setLoading,
    toast,
    savePipelineProgress,
    saveProgress,
  };

  // Show initial loader
  if (initialLoading) {
    return <PipelineLoader message="Initializing pipeline..." />;
  }

  // Show loader while loading drafts
  if (loadingDrafts) {
    return <PipelineLoader message="Loading your progress..." />;
  }

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      {/* BPOC Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Content Pipeline</h1>
              <p className="text-gray-400 text-sm">Create SEO-optimized BPO articles</p>
            </div>
          </div>
          <div className="flex gap-2">
            {state.pipelineId && (
              <Button
                onClick={startNewPipeline}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
              >
                <X className="w-4 h-4 mr-1" /> New
              </Button>
            )}
            <Button
              onClick={() => {
                if (!state.pipelineId) {
                  router.push('/admin/insights');
                } else {
                  setShowExitDialog(true);
                }
              }}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-white"
              disabled={loading}
            >
              Exit
            </Button>
          </div>
        </motion.div>

        {/* Progress Bar - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          {/* Stage indicators */}
          <div className="flex items-center justify-between mb-3">
            {stageIcons.map((s, i) => {
              const Icon = s.icon;
              const isActive = stage === s.num;
              const isComplete = stage > s.num;

              return (
                <div key={s.num} className="flex items-center flex-1">
                  <button
                    onClick={() => isComplete && setStage(s.num)}
                    disabled={!isComplete}
                    className={`relative group flex flex-col items-center transition-all duration-300 ${
                      isComplete ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {/* Icon container */}
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                      ${isActive
                        ? `bg-gradient-to-br ${s.color} shadow-lg`
                        : isComplete
                          ? 'bg-green-500/20 border border-green-500/50'
                          : 'bg-white/5 border border-white/10'
                      }
                      ${isComplete && !isActive ? 'group-hover:scale-110 group-hover:border-green-400' : ''}
                    `}>
                      {isComplete && !isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </div>

                    {/* Label */}
                    <span className={`
                      text-xs mt-2 font-medium transition-colors duration-300 hidden md:block
                      ${isActive ? 'text-white' : isComplete ? 'text-green-400' : 'text-gray-600'}
                    `}>
                      {s.label}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
                      />
                    )}
                  </button>

                  {/* Connector line */}
                  {i < stageIcons.length - 1 && (
                    <div className="flex-1 h-[2px] mx-2 mt-[-20px]">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-gradient-to-r from-green-500/50 to-green-500/30' : 'bg-white/5'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage number indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-gray-500">Stage</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-white font-mono font-bold">
              {stage}
            </span>
            <span className="text-gray-500">of 8</span>
          </div>
        </motion.div>

        {/* Stage Components with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {stage === 1 && (
              <BriefStage
                {...stageProps}
                ideas={ideas}
                setIdeas={setIdeas}
                onSelectIdea={selectIdeaAndCreateDraft}
                setStage={setStage}
                siloLocked={isSiloLocked}
              />
            )}

            {stage === 2 && (
              <ResearchStage
                {...stageProps}
                setStage={setStage}
              />
            )}

            {stage === 3 && (
              <PlanStage
                {...stageProps}
                setStage={setStage}
              />
            )}

            {stage === 4 && (
              <WriteStage
                {...stageProps}
                setStage={setStage}
                onEditArticle={handleEditArticle}
              />
            )}

            {stage === 5 && (
              <HumanizeStage
                {...stageProps}
                setStage={setStage}
                onEditArticle={handleEditArticle}
              />
            )}

            {stage === 6 && (
              <SeoStage
                {...stageProps}
                setStage={setStage}
                onEditArticle={handleEditArticle}
              />
            )}

            {stage === 7 && (
              <MetaStage
                {...stageProps}
                setStage={setStage}
              />
            )}

            {stage === 8 && (
              <PublishStage
                {...stageProps}
                publishArticle={publishArticle}
                uploadedImages={uploadedImages}
                setUploadedImages={setUploadedImages}
                heroType={heroType}
                setHeroType={setHeroType}
                heroSource={heroSource}
                setHeroSource={setHeroSource}
                sectionSource={sectionSource}
                setSectionSource={setSectionSource}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between pt-8 mt-8 border-t border-white/5"
        >
          <Button
            onClick={() => stage > 1 && setStage(stage - 1)}
            disabled={stage === 1}
            variant="outline"
            className="border-white/10 hover:border-white/20 hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          <div className="flex gap-2">
            {stage < 8 && (
              <Button
                onClick={async () => {
                  setNavigating(true);
                  try {
                    // Stage 1: Create draft before proceeding
                    if (stage === 1) {
                      const success = await createDraftFromSelectedIdea();
                      if (!success) {
                        setNavigating(false);
                        return;
                      }
                    }

                    // Stage 3: Save plan approval
                    if (stage === 3 && state.planApproved && state.pipelineId) {
                      await savePipelineProgress(state.pipelineId, 3, {
                        articlePlan: state.plan,
                        planApproved: true,
                      }, { action: 'plan_approved' });

                      if (state.insightId) {
                        await saveProgress(state.insightId, { pipeline_stage: 'plan_approved' }, 'plan_approved');
                      }
                    }
                    setStage(stage + 1);
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to save data', variant: 'destructive' });
                  } finally {
                    setNavigating(false);
                  }
                }}
                disabled={
                  navigating ||
                  loading ||
                  (stage === 1 && !state.selectedIdea) ||
                  (stage === 2 && !state.researchData) ||
                  (stage === 3 && (!state.plan || !state.planApproved)) ||
                  (stage === 4 && !state.article) ||
                  (stage === 5 && !state.humanizedArticle) ||
                  (stage === 6 && !state.seoArticle) ||
                  (stage === 7 && !state.meta)
                }
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border-0 shadow-lg shadow-red-500/20"
              >
                {navigating || (stage === 1 && loading) ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {stage === 1 ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePreview && state.images && state.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowImagePreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImagePreview(false)}
                className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={state.images[previewImageIndex]?.url}
                alt={state.images[previewImageIndex]?.alt || 'Preview'}
                className="w-full rounded-2xl shadow-2xl"
              />
              <div className="flex justify-center gap-2 mt-6">
                {state.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewImageIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === previewImageIndex ? 'bg-red-500 w-6' : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowEdit(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">
                  Edit {showEdit === 'article' ? 'Article' : showEdit === 'humanized' ? 'Humanized Article' : 'SEO Article'}
                </h2>
                <button onClick={() => setShowEdit(null)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 p-5 overflow-y-auto">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[500px] bg-white/5 border border-white/10 rounded-xl p-5 text-white text-sm font-mono resize-none focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-white/5">
                <Button variant="outline" onClick={() => setShowEdit(null)} className="border-white/10">
                  Cancel
                </Button>
                <Button onClick={saveEditedContent} className="bg-green-600 hover:bg-green-700 border-0">
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-slate-900/90 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-500/10"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
                  <Save className="w-8 h-8 text-red-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Saving Progress</h3>
                <p className="text-gray-400">
                  Your pipeline will be automatically saved to drafts.
                </p>
              </div>

              {/* Action */}
              <ExitCountdownButton
                onComplete={async () => {
                  try {
                    setLoading(true);

                    // Save to pipeline
                    await savePipelineProgress(state.pipelineId!, stage, {
                      // Stage 1
                      transcript: state.transcript,
                      selectedSilo: state.selectedSilo,

                      // Stage 2
                      selectedIdea: state.selectedIdea,

                      // Stage 3
                      plan: state.plan,
                      planApproved: state.planApproved,

                      // Stage 4
                      article: state.article,
                      wordCount: state.wordCount,

                      // Stage 5
                      humanizedArticle: state.humanizedArticle,
                      humanScore: state.humanScore,

                      // Stage 6
                      seoArticle: state.seoArticle,
                      seoStats: state.seoStats,

                      // Stage 7
                      meta: state.meta,
                      images: state.images,

                      // Stage 8
                      heroType: state.heroType,
                      heroSource,
                      sectionSource,
                      videoUrl: state.videoUrl,
                      contentSections: state.contentSections,
                    });

                    // Save to insights_posts if exists
                    if (state.insightId) {
                      // Map stage number to proper stage name
                      const stageNames: Record<number, string> = {
                        1: 'brief_input',
                        2: 'research',
                        3: 'plan_review',
                        4: 'writing',
                        5: 'humanizing',
                        6: 'seo',
                        7: 'meta',
                        8: 'ready'
                      };

                      await saveProgress(state.insightId, {
                        content: state.seoArticle || state.humanizedArticle || state.article,
                        pipeline_stage: stageNames[stage] || 'draft',
                      }, stageNames[stage] || 'draft');
                    }

                    toast({ title: 'Draft saved!', description: 'Your progress has been saved' });
                    router.push('/admin/insights');
                  } catch (err: any) {
                    toast({ title: 'Error saving draft', description: err.message, variant: 'destructive' });
                    setShowExitDialog(false);
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Countdown button component
function ExitCountdownButton({ onComplete }: { onComplete: () => Promise<void> }) {
  const [countdown, setCountdown] = useState(3);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!isExecuting) {
      setIsExecuting(true);
      onComplete();
    }
  }, [countdown, isExecuting, onComplete]);

  const handleClick = () => {
    if (!isExecuting) {
      setIsExecuting(true);
      onComplete();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isExecuting}
      className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 text-base font-semibold shadow-lg shadow-red-500/20"
    >
      {isExecuting ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          Saving & Exiting...
        </>
      ) : (
        <>OK {countdown > 0 && `(${countdown})`}</>
      )}
    </Button>
  );
}

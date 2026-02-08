/**
 * useContentPipeline Hook
 * Easy interface for the content_pipelines table
 */

import { useState, useCallback } from 'react';

interface PipelineData {
  id: string;
  status: string;
  currentStage: number;
  briefType?: string;
  briefTranscript?: string;
  personalityProfile?: any;
  selectedSilo?: string;
  generatedIdeas?: any[];
  selectedIdea?: any;
  serperResults?: any;
  hrKbResults?: any;
  researchSynthesis?: any;
  articlePlan?: any;
  planApproved?: boolean;
  rawArticle?: string;
  wordCount?: number;
  humanizedArticle?: string;
  humanScore?: number;
  seoArticle?: string;
  seoStats?: any;
  heroType?: 'image' | 'video';
  metaData?: any;
  imagePrompts?: any[];
  generatedImages?: any[];
  contentSections?: string[];
  aiLogs?: any[];
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  insightId?: string;
}

interface UsePipelineReturn {
  pipelineId: string | null;
  pipeline: PipelineData | null;
  loading: boolean;
  error: string | null;
  createPipeline: (data?: Partial<PipelineData>) => Promise<string | null>;
  updatePipeline: (stage: number, data: any, aiLog?: any) => Promise<boolean>;
  loadPipeline: (id: string) => Promise<PipelineData | null>;
  publishPipeline: (isDraft?: boolean) => Promise<{ success: boolean; slug?: string; error?: string }>;
  deletePipeline: () => Promise<boolean>;
}

export function useContentPipeline(): UsePipelineReturn {
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new pipeline
  const createPipeline = useCallback(async (data?: Partial<PipelineData>): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/content-pipeline/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefType: data?.briefType,
          briefTranscript: data?.briefTranscript,
          personalityProfile: data?.personalityProfile,
          selectedSilo: data?.selectedSilo,
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        setPipelineId(result.pipelineId);
        setPipeline(transformPipeline(result.pipeline));
        return result.pipelineId;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update pipeline at any stage
  const updatePipeline = useCallback(async (stage: number, data: any, aiLog?: any): Promise<boolean> => {
    if (!pipelineId) {
      setError('No active pipeline');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/content-pipeline/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId,
          stage,
          data,
          aiLog,
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        setPipeline(transformPipeline(result.pipeline));
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  // Load an existing pipeline
  const loadPipeline = useCallback(async (id: string): Promise<PipelineData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/content-pipeline/get?id=${id}`);
      const result = await res.json();
      
      if (result.success) {
        setPipelineId(id);
        const transformed = transformPipeline(result.pipeline);
        setPipeline(transformed);
        return transformed;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Publish pipeline to insights_posts
  const publishPipeline = useCallback(async (isDraft = false): Promise<{ success: boolean; slug?: string; error?: string }> => {
    if (!pipelineId) {
      return { success: false, error: 'No active pipeline' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/content-pipeline/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId, isDraft }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        setPipeline(prev => prev ? { ...prev, status: 'published', insightId: result.article.id } : null);
        return { success: true, slug: result.article.slug };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  // Delete pipeline
  const deletePipeline = useCallback(async (): Promise<boolean> => {
    if (!pipelineId) {
      setError('No active pipeline');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/content-pipeline/delete?id=${pipelineId}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      
      if (result.success) {
        setPipelineId(null);
        setPipeline(null);
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  return {
    pipelineId,
    pipeline,
    loading,
    error,
    createPipeline,
    updatePipeline,
    loadPipeline,
    publishPipeline,
    deletePipeline,
  };
}

// Transform database columns to camelCase
function transformPipeline(dbPipeline: any): PipelineData {
  return {
    id: dbPipeline.id,
    status: dbPipeline.status,
    currentStage: dbPipeline.current_stage,
    briefType: dbPipeline.brief_type,
    briefTranscript: dbPipeline.brief_transcript,
    personalityProfile: dbPipeline.personality_profile,
    selectedSilo: dbPipeline.selected_silo,
    generatedIdeas: dbPipeline.generated_ideas,
    selectedIdea: dbPipeline.selected_idea,
    serperResults: dbPipeline.serper_results,
    hrKbResults: dbPipeline.hr_kb_results,
    researchSynthesis: dbPipeline.research_synthesis,
    articlePlan: dbPipeline.article_plan,
    planApproved: dbPipeline.plan_approved,
    rawArticle: dbPipeline.raw_article,
    wordCount: dbPipeline.word_count,
    humanizedArticle: dbPipeline.humanized_article,
    humanScore: dbPipeline.human_score,
    seoArticle: dbPipeline.seo_article,
    seoStats: dbPipeline.seo_stats,
    heroType: dbPipeline.hero_type,
    metaData: dbPipeline.meta_data,
    imagePrompts: dbPipeline.image_prompts,
    generatedImages: dbPipeline.generated_images,
    contentSections: [
      dbPipeline.content_section1,
      dbPipeline.content_section2,
      dbPipeline.content_section3,
    ].filter(Boolean),
    aiLogs: dbPipeline.ai_logs,
    createdAt: dbPipeline.created_at,
    updatedAt: dbPipeline.updated_at,
    completedAt: dbPipeline.completed_at,
    insightId: dbPipeline.insight_id,
  };
}

// Helper to list all pipelines
export async function listPipelines(status?: string): Promise<PipelineData[]> {
  const url = status 
    ? `/api/admin/content-pipeline/list?status=${status}`
    : '/api/admin/content-pipeline/list';
    
  const res = await fetch(url);
  const result = await res.json();
  
  if (result.success) {
    return result.pipelines;
  }
  return [];
}



/**
 * useInsightEditor Hook
 * For editing published articles with database sync
 */

import { useState, useCallback } from 'react';

interface UpdateResult {
  success: boolean;
  article?: any;
  error?: string;
}

interface UseInsightEditorReturn {
  saving: boolean;
  error: string | null;
  updateInsight: (id: string, updates: Record<string, any>, seoUpdates?: Record<string, any>) => Promise<UpdateResult>;
  updateContent: (id: string, contentParts: { part1?: string; part2?: string; part3?: string }) => Promise<UpdateResult>;
  updateMeta: (id: string, meta: { title?: string; description?: string; metaTitle?: string; metaDescription?: string }) => Promise<UpdateResult>;
  updateImages: (id: string, images: { hero?: string; image0?: string; image1?: string; image2?: string }) => Promise<UpdateResult>;
  publishInsight: (id: string, publish: boolean) => Promise<UpdateResult>;
}

export function useInsightEditor(): UseInsightEditorReturn {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generic update function
  const updateInsight = useCallback(async (
    id: string, 
    updates: Record<string, any>, 
    seoUpdates?: Record<string, any>
  ): Promise<UpdateResult> => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/insights/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates, seoUpdates }),
      });

      const result = await res.json();

      if (result.success) {
        return { success: true, article: result.article };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  // Update content parts
  const updateContent = useCallback(async (
    id: string, 
    contentParts: { part1?: string; part2?: string; part3?: string }
  ): Promise<UpdateResult> => {
    const updates: Record<string, any> = {};
    if (contentParts.part1 !== undefined) updates.content_part1 = contentParts.part1;
    if (contentParts.part2 !== undefined) updates.content_part2 = contentParts.part2;
    if (contentParts.part3 !== undefined) updates.content_part3 = contentParts.part3;
    
    return updateInsight(id, updates);
  }, [updateInsight]);

  // Update meta information
  const updateMeta = useCallback(async (
    id: string, 
    meta: { title?: string; description?: string; metaTitle?: string; metaDescription?: string }
  ): Promise<UpdateResult> => {
    const updates: Record<string, any> = {};
    const seoUpdates: Record<string, any> = {};

    if (meta.title) updates.title = meta.title;
    if (meta.description) updates.description = meta.description;
    if (meta.metaDescription) updates.meta_description = meta.metaDescription;
    if (meta.metaTitle) seoUpdates.meta_title = meta.metaTitle;
    if (meta.metaDescription) seoUpdates.meta_description = meta.metaDescription;

    return updateInsight(id, updates, Object.keys(seoUpdates).length > 0 ? seoUpdates : undefined);
  }, [updateInsight]);

  // Update images
  const updateImages = useCallback(async (
    id: string, 
    images: { hero?: string; image0?: string; image1?: string; image2?: string }
  ): Promise<UpdateResult> => {
    const updates: Record<string, any> = {};
    if (images.hero !== undefined) updates.hero_url = images.hero;
    if (images.image0 !== undefined) updates.content_image0 = images.image0;
    if (images.image1 !== undefined) updates.content_image1 = images.image1;
    if (images.image2 !== undefined) updates.content_image2 = images.image2;

    return updateInsight(id, updates);
  }, [updateInsight]);

  // Publish/Unpublish
  const publishInsight = useCallback(async (id: string, publish: boolean): Promise<UpdateResult> => {
    return updateInsight(id, {
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
      pipeline_stage: publish ? 'published' : 'draft',
    });
  }, [updateInsight]);

  return {
    saving,
    error,
    updateInsight,
    updateContent,
    updateMeta,
    updateImages,
    publishInsight,
  };
}



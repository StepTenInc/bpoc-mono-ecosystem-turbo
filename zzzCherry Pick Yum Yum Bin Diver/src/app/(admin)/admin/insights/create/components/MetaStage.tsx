'use client';

import { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import {
  Tag,
  Loader2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { StageProps } from '../types';

interface MetaStageProps extends StageProps {
  setStage: (stage: number) => void;
}

export default function MetaStage({
  state,
  updateState: update,
  loading,
  setLoading,
  toast,
  savePipelineProgress,
  saveProgress,
  setStage,
}: MetaStageProps) {
  const [metaProgress, setMetaProgress] = useState(0);
  const [metaStatus, setMetaStatus] = useState('');
  const [metaValidation, setMetaValidation] = useState<any>(null);
  const [metaIsSiloPage, setMetaIsSiloPage] = useState(false);
  const [metaSchemaTypes, setMetaSchemaTypes] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [previousMeta, setPreviousMeta] = useState<any>(null);
  const [newMeta, setNewMeta] = useState<any>(null);

  const generateMeta = async (isRedo = false) => {
    // If redo, save current meta for comparison
    if (isRedo && state.meta) {
      setPreviousMeta(state.meta);
      setNewMeta(null);
    }

    setMetaProgress(10);
    setMetaStatus('Generating meta tags...');
    setLoading(true);
    setIsComparing(false);

    try {
      // Combine all keywords from plan (main + cluster + semantic)
      const planKeywords = state.plan?.keywords;
      const allKeywords = planKeywords
        ? [
            planKeywords.main,
            ...(planKeywords.cluster || []),
            ...(planKeywords.semantic || []),
          ].filter(Boolean)
        : state.selectedIdea?.keywords || [];

      const res = await fetch('/api/admin/insights/pipeline/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: state.seoArticle || state.humanizedArticle || state.article,
          title: state.plan?.title || state.plan?.structure?.title || state.selectedIdea?.title,
          keywords: allKeywords,
          originalBrief: state.transcript,
          plan: state.plan,
          pipelineId: state.pipelineId,
        }),
      });

      setMetaProgress(80);
      setMetaStatus('Finalizing...');

      const result = await res.json();

      if (result.success) {
        setMetaProgress(100);
        setMetaStatus('Done!');

        // Store validation & schema info
        if (result.validation) setMetaValidation(result.validation);
        if (result.isSiloPage) setMetaIsSiloPage(true);
        if (result.schema) {
          setMetaSchemaTypes(Object.keys(result.schema).filter(k => result.schema[k]));
        }

        // If redo, show comparison instead of directly updating
        if (isRedo && previousMeta) {
          setNewMeta(result.meta);
          setIsComparing(true);
        } else {
          // First time - directly update state
          update({ meta: result.meta });

          // Save to pipeline
          if (state.pipelineId) {
            savePipelineProgress(
              state.pipelineId,
              7,
              { metaData: result.meta },
              { action: 'meta_generated' }
            ).catch(err => console.error('Pipeline save error:', err));
          }

          // Save to insights_posts
          if (state.insightId) {
            saveProgress(
              state.insightId,
              {
                meta_description: result.meta?.metaDescription,
                title: result.meta?.metaTitle,
              },
              'meta_ready'
            ).catch(err => console.error('Save error:', err));
          }
        }

        toast({ title: isRedo ? 'New meta tags generated!' : 'Meta tags generated!', description: 'Ready to publish' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setMetaProgress(0);
      setMetaStatus('');
    }
  };

  const useNewMeta = () => {
    if (newMeta) {
      update({ meta: newMeta });

      if (state.pipelineId) {
        savePipelineProgress(
          state.pipelineId,
          7,
          { metaData: newMeta },
          { action: 'meta_generated' }
        ).catch(err => console.error('Pipeline save error:', err));
      }

      if (state.insightId) {
        saveProgress(
          state.insightId,
          {
            meta_description: newMeta?.metaDescription,
            title: newMeta?.metaTitle,
          },
          'meta_ready'
        ).catch(err => console.error('Save error:', err));
      }

      toast({ title: 'New meta tags selected!' });
    }
    setIsComparing(false);
    setPreviousMeta(null);
    setNewMeta(null);
  };

  const keepOriginalMeta = () => {
    setIsComparing(false);
    setPreviousMeta(null);
    setNewMeta(null);
    toast({ title: 'Kept original meta tags' });
  };

  // Comparison View
  if (isComparing && previousMeta && newMeta) {
    return (
      <Card className="bg-indigo-500/10 border-indigo-500/20">
        <CardHeader>
          <CardTitle className="text-indigo-400 flex items-center gap-2">
            <Tag className="w-6 h-6" /> Stage 7: Compare Meta Tags
          </CardTitle>
          <CardDescription>Choose which meta version to keep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <Button onClick={keepOriginalMeta} variant="outline" className="border-gray-500 hover:bg-gray-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Keep Original
            </Button>
            <Button onClick={useNewMeta} className="bg-indigo-600 hover:bg-indigo-700">
              Use New Meta <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <span className="text-gray-400 text-sm font-semibold">Original</span>
              <div className="bg-white/5 rounded-lg border border-gray-600 p-3 space-y-3">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Meta Title</p>
                  <p className="text-gray-300 text-sm">{previousMeta.metaTitle || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Meta Description</p>
                  <p className="text-gray-300 text-xs">{previousMeta.metaDescription || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Focus Keyword</p>
                  <p className="text-gray-300 text-xs">{previousMeta.focusKeyword || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Slug</p>
                  <p className="text-gray-300 text-xs">{previousMeta.canonicalSlug || '-'}</p>
                </div>
              </div>
            </div>

            {/* New */}
            <div className="space-y-2">
              <span className="text-indigo-400 text-sm font-semibold">New Meta</span>
              <div className="bg-indigo-500/5 rounded-lg border border-indigo-500/30 p-3 space-y-3">
                <div>
                  <p className="text-indigo-400 text-xs mb-1">Meta Title</p>
                  <p className="text-gray-300 text-sm">{newMeta.metaTitle || '-'}</p>
                </div>
                <div>
                  <p className="text-indigo-400 text-xs mb-1">Meta Description</p>
                  <p className="text-gray-300 text-xs">{newMeta.metaDescription || '-'}</p>
                </div>
                <div>
                  <p className="text-indigo-400 text-xs mb-1">Focus Keyword</p>
                  <p className="text-gray-300 text-xs">{newMeta.focusKeyword || '-'}</p>
                </div>
                <div>
                  <p className="text-indigo-400 text-xs mb-1">Slug</p>
                  <p className="text-gray-300 text-xs">{newMeta.canonicalSlug || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-indigo-500/10 border-indigo-500/20">
      <CardHeader>
        <CardTitle className="text-indigo-400 flex items-center gap-2">
          <Tag className="w-6 h-6" /> Stage 7: Meta Tags
        </CardTitle>
        <CardDescription>
          Generate SEO meta tags and schema markup (media will be generated when you publish)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!state.meta ? (
          (loading && metaProgress > 0) || metaStatus ? (
            // Loading state
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-indigo-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{metaStatus}</span>
                  <span className="text-indigo-400 font-bold text-sm">{metaProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${metaProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-center mt-3 gap-2">
                  <Tag className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <span className="text-gray-400 text-xs">Generating meta tags, schema markup &amp; SEO directives...</span>
                </div>
                <div className="flex items-center justify-center mt-2 gap-2 text-yellow-400/80 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Please don&apos;t close this window.</span>
                </div>
              </div>
            </div>
          ) : (
            // Generate button
            <Button
              onClick={() => generateMeta(false)}
              disabled={loading}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg"
            >
              <Tag className="w-5 h-5 mr-2" /> Generate Meta Tags
            </Button>
          )
        ) : (
          // Show loading state when redoing
          (loading && metaProgress > 0) ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-indigo-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{metaStatus}</span>
                  <span className="text-indigo-400 font-bold text-sm">{metaProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${metaProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-center mt-3 gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-gray-400 text-xs">Regenerating meta tags...</span>
                </div>
                <div className="flex items-center justify-center mt-2 gap-2 text-yellow-400/80 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Please don&apos;t close this window.</span>
                </div>
              </div>
            </div>
          ) : (
          // Meta Complete - Show editable fields
          <div className="space-y-4">
            {/* Meta Complete Header */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-green-400 font-semibold">Meta Tags Generated</p>
                <p className="text-gray-400 text-xs">Ready for publishing</p>
              </div>
              <Button
                onClick={() => generateMeta(true)}
                variant="outline"
                disabled={loading}
                size="sm"
                className="h-8"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Redo
              </Button>
            </div>

            {/* Editable Meta Fields */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-4">
              {/* Focus Keyword */}
              <div>
                <p className="text-indigo-400 text-xs font-semibold mb-1">🎯 Focus Keyword</p>
                <Input
                  value={state.meta.focusKeyword || ''}
                  onChange={(e) => update({ meta: { ...state.meta, focusKeyword: e.target.value } })}
                  className="bg-gray-800 border-gray-700 text-white font-medium"
                  placeholder="Primary keyword"
                />
              </div>

              {/* Secondary / Semantic Keywords */}
              {state.meta.secondaryKeywords && state.meta.secondaryKeywords.length > 0 && (
                <div>
                  <p className="text-indigo-400 text-xs font-semibold mb-1.5">🔗 Secondary / Semantic Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {state.meta.secondaryKeywords.map((kw: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 text-xs rounded-full border border-indigo-500/25">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-indigo-400 text-xs font-semibold">
                    📰 Meta Title ({state.meta.metaTitle?.length || 0}/60 chars)
                  </p>
                  <span className={`text-[10px] ${
                    (state.meta.metaTitle?.length || 0) >= 50 && (state.meta.metaTitle?.length || 0) <= 60
                      ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(state.meta.metaTitle?.length || 0) >= 50 && (state.meta.metaTitle?.length || 0) <= 60 ? '✓ Good length' : '⚠ Aim for 50-60'}
                  </span>
                </div>
                <Input
                  value={state.meta.metaTitle || ''}
                  onChange={(e) => update({ meta: { ...state.meta, metaTitle: e.target.value } })}
                  onBlur={async () => {
                    if (state.insightId) {
                      await saveProgress(state.insightId, { title: state.meta.metaTitle }, 'meta');
                    }
                  }}
                  className="bg-gray-800 border-gray-700 text-white"
                  maxLength={60}
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-indigo-400 text-xs font-semibold">
                    📝 Meta Description ({state.meta.metaDescription?.length || 0}/160 chars)
                  </p>
                  <span className={`text-[10px] ${
                    (state.meta.metaDescription?.length || 0) >= 150 && (state.meta.metaDescription?.length || 0) <= 160
                      ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(state.meta.metaDescription?.length || 0) >= 150 && (state.meta.metaDescription?.length || 0) <= 160 ? '✓ Good length' : '⚠ Aim for 150-160'}
                  </span>
                </div>
                <Textarea
                  value={state.meta.metaDescription || ''}
                  onChange={(e) => update({ meta: { ...state.meta, metaDescription: e.target.value } })}
                  onBlur={async () => {
                    if (state.insightId) {
                      await saveProgress(state.insightId, { meta_description: state.meta.metaDescription }, 'meta');
                    }
                  }}
                  className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                  maxLength={160}
                />
              </div>

              {/* Canonical URL */}
              <div>
                <p className="text-indigo-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
                  🔗 Canonical URL
                  {metaIsSiloPage && (
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded-full border border-purple-500/30 font-bold">
                      SILO PAGE
                    </span>
                  )}
                </p>
                <div className={`px-3 py-2 rounded text-sm font-mono ${
                  metaIsSiloPage
                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
                    : 'bg-gray-800 border border-gray-700 text-gray-300'
                }`}>
                  {state.meta.canonicalUrl || `https://bpoc.io/insights/${state.meta.canonicalSlug || '...'}`}
                </div>
              </div>

              {/* Canonical Slug */}
              <div>
                <p className="text-indigo-400 text-xs font-semibold mb-1">📎 Canonical Slug</p>
                <Input
                  value={state.meta.canonicalSlug || ''}
                  onChange={(e) => update({ meta: { ...state.meta, canonicalSlug: e.target.value } })}
                  className="bg-gray-800 border-gray-700 text-white font-mono"
                  placeholder="url-friendly-slug"
                />
              </div>

              {/* OG Image Suggestion */}
              <div>
                <p className="text-indigo-400 text-xs font-semibold mb-1">🖼️ OG Image</p>
                <p className="text-gray-400 text-xs">
                  {state.meta.ogImage
                    ? <span className="text-green-400">{state.meta.ogImage}</span>
                    : 'Will be generated at publish time (hero image → OG image)'}
                </p>
              </div>

              {/* Schema Types Generated */}
              {metaSchemaTypes.length > 0 && (
                <div>
                  <p className="text-indigo-400 text-xs font-semibold mb-1.5">📄 Schema.org Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {metaSchemaTypes.map((type, i) => (
                      <span key={i} className="px-2 py-0.5 bg-green-500/15 text-green-300 text-[10px] rounded-full border border-green-500/25 capitalize">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Warnings */}
              {metaValidation?.warnings && metaValidation.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2.5">
                  <p className="text-yellow-400 text-xs font-semibold mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Validation Warnings ({metaValidation.warnings.length})
                  </p>
                  <div className="space-y-1">
                    {metaValidation.warnings.map((warning: string, i: number) => (
                      <p key={i} className="text-yellow-400/80 text-[10px] flex items-start gap-1">
                        <span className="flex-shrink-0">•</span> {warning}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() => setStage(8)}
              disabled={loading}
              className="w-full h-12 bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="w-5 h-5 mr-2" /> Continue to Publish
            </Button>
          </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

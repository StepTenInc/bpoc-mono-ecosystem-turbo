'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Sparkles, Loader2, RefreshCw, Edit3, ArrowRight, ArrowLeft, AlertTriangle, TrendingUp, Link2, Search, FileText } from 'lucide-react';
import { StageProps, splitContentIntoSections } from '../types';

interface SeoStageProps extends StageProps {
  setStage: (stage: number) => void;
  onEditArticle: (content: string, type: string) => void;
}

export default function SeoStage({
  state,
  updateState,
  loading,
  setLoading,
  toast,
  savePipelineProgress,
  saveProgress,
  setStage,
  onEditArticle
}: SeoStageProps) {
  const [seoProgress, setSeoProgress] = useState(0);
  const [seoStatus, setSeoStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [seoMetadata, setSeoMetadata] = useState<any>(null);
  const [seoChanges, setSeoChanges] = useState<any>(null);
  const [seoSummary, setSeoSummary] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);
  const [previousSeo, setPreviousSeo] = useState<{ content: string; stats: any } | null>(null);
  const [newSeo, setNewSeo] = useState<{ content: string; stats: any } | null>(null);

  const seoOptimize = async (isRedo = false) => {
    // If redo, save current SEO article for comparison
    if (isRedo && state.seoArticle) {
      setPreviousSeo({ content: state.seoArticle, stats: state.seoStats });
      setNewSeo(null);
    }

    setSeoProgress(5);
    setSeoStatus('Starting SEO optimization...');
    setLoading(true);
    setIsComparing(false);

    // Start elapsed timer
    setElapsed(0);
    setTimerActive(true);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const progressSteps = [
      { progress: 15, status: 'Finding existing articles...' },
      { progress: 30, status: 'Generating internal links...' },
      { progress: 45, status: 'Adding outbound authority links...' },
      { progress: 60, status: 'Optimizing keyword placement...' },
      { progress: 75, status: 'Checking keyword density...' },
      { progress: 85, status: 'Verifying heading structure...' },
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setSeoProgress(progressSteps[currentStep].progress);
        setSeoStatus(progressSteps[currentStep].status);
        currentStep++;
      }
    }, 1200);

    try {
      const res = await fetch('/api/admin/insights/pipeline/seo-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: state.humanizedArticle || state.article,
          title: state.plan?.title || state.selectedIdea?.title,
          keywords: state.selectedIdea?.keywords,
          research: state.researchData,
          originalBrief: state.transcript,
          selectedIdea: state.selectedIdea,
          plan: state.plan,
        })
      });

      clearInterval(progressInterval);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      setSeoProgress(95);
      setSeoStatus('Finalizing SEO...');

      const result = await res.json();

      // Store full metadata and changes for detailed results display
      if (result.metadata) {
        setSeoMetadata(result.metadata);
      }
      if (result.changes) {
        setSeoChanges(result.changes);
      }
      if (result.summary) {
        setSeoSummary(result.summary);
      }

      if (result.success) {
        setSeoProgress(100);
        setSeoStatus('SEO optimized!');
        await new Promise(resolve => setTimeout(resolve, 400));

        // If redo, show comparison instead of directly updating
        if (isRedo && previousSeo) {
          setNewSeo({ content: result.optimizedArticle, stats: result.seoStats });
          setIsComparing(true);
        } else {
          // First time - directly update state
          const sections = splitContentIntoSections(result.optimizedArticle);
          updateState({
            seoArticle: result.optimizedArticle,
            seoStats: result.seoStats,
            contentSections: sections,
          });

          if (state.pipelineId) {
            savePipelineProgress(state.pipelineId, 7, {
              seoArticle: result.optimizedArticle,
              seoStats: result.seoStats,
              contentSections: sections,
            }, { action: 'seo_optimized', model: 'claude-sonnet-4', internalLinks: result.seoStats?.internalLinksCount })
              .catch(err => console.error('Pipeline save error:', err));
          }

          if (state.insightId) {
            saveProgress(state.insightId, {
              content: result.optimizedArticle,
              content_part1: sections[0],
              content_part2: sections[1],
              content_part3: sections[2],
            }, 'seo')
              .catch(err => console.error('Save error:', err));
          }
        }

        toast({
          title: isRedo ? 'New SEO version generated!' : 'SEO optimized!',
          description: `${result.seoStats?.internalLinksCount || 0} internal + ${result.seoStats?.outboundLinksCount || 0} outbound links`
        });
      } else {
        toast({ title: 'Error', description: result.error || 'SEO optimization failed', variant: 'destructive' });
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setSeoProgress(0);
      setSeoStatus('');
    }
  };

  const useNewSeo = () => {
    if (newSeo) {
      const sections = splitContentIntoSections(newSeo.content);
      updateState({
        seoArticle: newSeo.content,
        seoStats: newSeo.stats,
        contentSections: sections,
      });

      if (state.pipelineId) {
        savePipelineProgress(state.pipelineId, 7, {
          seoArticle: newSeo.content,
          seoStats: newSeo.stats,
          contentSections: sections,
        }, { action: 'seo_optimized', model: 'claude-sonnet-4', internalLinks: newSeo.stats?.internalLinksCount })
          .catch(err => console.error('Pipeline save error:', err));
      }

      toast({ title: 'New SEO version selected!' });
    }
    setIsComparing(false);
    setPreviousSeo(null);
    setNewSeo(null);
  };

  const keepOriginalSeo = () => {
    setIsComparing(false);
    setPreviousSeo(null);
    setNewSeo(null);
    toast({ title: 'Kept original SEO version' });
  };

  // Comparison View
  if (isComparing && previousSeo && newSeo) {
    return (
      <Card className="bg-pink-500/10 border-pink-500/20">
        <CardHeader>
          <CardTitle className="text-pink-400 flex items-center gap-2">
            <Sparkles className="w-6 h-6" /> Stage 6: Compare SEO Versions
          </CardTitle>
          <CardDescription>Choose which SEO optimized version to keep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <Button onClick={keepOriginalSeo} variant="outline" className="border-gray-500 hover:bg-gray-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Keep Original
            </Button>
            <Button onClick={useNewSeo} className="bg-pink-600 hover:bg-pink-700">
              Use New Version <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-semibold">Original</span>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                    {previousSeo.stats?.internalLinksCount || 0} internal
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                    {previousSeo.stats?.outboundLinksCount || 0} outbound
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg border border-gray-600 p-3 max-h-[400px] overflow-y-auto">
                <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {previousSeo.content.slice(0, 2000)}
                  {previousSeo.content.length > 2000 && '...'}
                </div>
              </div>
            </div>

            {/* New */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-pink-400 text-sm font-semibold">New Version</span>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                    {newSeo.stats?.internalLinksCount || 0} internal
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                    {newSeo.stats?.outboundLinksCount || 0} outbound
                  </span>
                </div>
              </div>
              <div className="bg-pink-500/5 rounded-lg border border-pink-500/30 p-3 max-h-[400px] overflow-y-auto">
                <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {newSeo.content.slice(0, 2000)}
                  {newSeo.content.length > 2000 && '...'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-pink-500/10 border-pink-500/20">
      <CardHeader>
        <CardTitle className="text-pink-400 flex items-center gap-2">
          <Sparkles className="w-6 h-6" /> Stage 6: SEO Optimize
        </CardTitle>
        <CardDescription>Adds internal links, .edu/.org outbound links, checks keywords</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!state.seoArticle ? (
          (loading && seoProgress > 0) || seoStatus ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-pink-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{seoStatus}</span>
                  <span className="text-pink-400 font-bold text-sm">{seoProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${seoProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
                    <span className="text-gray-400 text-xs">Optimizing for search engines...</span>
                  </div>
                  {timerActive && (
                    <span className="text-2xl font-mono font-bold text-pink-400">
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-gray-500 text-xs text-center">
                    🔍 Analyzing keywords, generating links, calculating RankMath score...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-yellow-400/80 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Please don&apos;t close this window during SEO optimization.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={() => seoOptimize(false)} disabled={loading} className="w-full h-14 bg-pink-600 hover:bg-pink-700 text-lg">
              <Sparkles className="w-5 h-5 mr-2" /> Optimize SEO
            </Button>
          )
        ) : (
          // Show loading state when redoing
          (loading && seoProgress > 0) ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-pink-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{seoStatus}</span>
                  <span className="text-pink-400 font-bold text-sm">{seoProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${seoProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-pink-400 animate-spin" />
                    <span className="text-gray-400 text-xs">Re-optimizing for SEO...</span>
                  </div>
                  {timerActive && (
                    <span className="text-2xl font-mono font-bold text-pink-400">
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center mt-2 gap-2 text-yellow-400/80 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Please don&apos;t close this window during SEO optimization.</span>
                </div>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {/* SEO Complete Header */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-green-400 font-semibold">SEO Optimized</p>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                    {state.seoStats?.internalLinksCount || 0} internal
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                    {state.seoStats?.outboundLinksCount || 0} outbound
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onEditArticle(state.seoArticle, 'seo')}
                  size="sm"
                  className="h-8 text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                >
                  <Edit3 className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button onClick={() => seoOptimize(true)} variant="outline" disabled={loading} size="sm" className="h-8">
                  <RefreshCw className="w-3 h-3 mr-1" /> Redo
                </Button>
              </div>
            </div>

            {/* Detailed SEO Results */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-4">
              <p className="text-pink-400 text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> SEO Analysis Results
              </p>

              {/* RankMath Score */}
              {state.seoStats?.rankMathScore != null && (
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-bold ${
                    state.seoStats.rankMathScore >= 80 ? 'text-green-400' :
                    state.seoStats.rankMathScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {state.seoStats.rankMathScore}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">/100 RankMath Score</p>
                    <p className="text-gray-500 text-xs">
                      {state.seoStats.rankMathScore >= 80 ? 'Excellent SEO' :
                       state.seoStats.rankMathScore >= 60 ? 'Good — room to improve' : 'Needs attention'}
                    </p>
                  </div>
                </div>
              )}

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white/5 rounded p-2 text-center">
                  <Link2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-white text-lg font-bold">{state.seoStats?.internalLinksCount || 0}</p>
                  <p className="text-gray-500 text-[10px]">Internal Links</p>
                </div>
                <div className="bg-white/5 rounded p-2 text-center">
                  <Link2 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <p className="text-white text-lg font-bold">{state.seoStats?.outboundLinksCount || 0}</p>
                  <p className="text-gray-500 text-[10px]">Outbound Links</p>
                </div>
                <div className="bg-white/5 rounded p-2 text-center">
                  <Search className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <p className="text-white text-lg font-bold">
                    {state.seoStats?.keywordDensity != null ? `${(state.seoStats.keywordDensity * 100).toFixed(1)}%` : '—'}
                  </p>
                  <p className="text-gray-500 text-[10px]">Keyword Density</p>
                </div>
                <div className="bg-white/5 rounded p-2 text-center">
                  <FileText className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <p className="text-white text-lg font-bold">
                    {state.seoStats?.readabilityScore != null ? Math.round(state.seoStats.readabilityScore) : '—'}
                  </p>
                  <p className="text-gray-500 text-[10px]">Readability</p>
                </div>
              </div>

              {/* Changes Summary */}
              {seoSummary && (
                <div className="bg-pink-500/5 border border-pink-500/20 rounded p-2.5">
                  <p className="text-pink-400 text-[10px] font-semibold uppercase mb-1">Optimization Summary</p>
                  <p className="text-gray-300 text-xs">{seoSummary}</p>
                </div>
              )}

              {/* Word count before/after */}
              {seoChanges?.wordCountBefore != null && seoChanges?.wordCountAfter != null && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Word count:</span>
                  <span className="text-gray-400">{seoChanges.wordCountBefore}</span>
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-white font-medium">{seoChanges.wordCountAfter}</span>
                  {seoChanges.wordCountAfter !== seoChanges.wordCountBefore && (
                    <span className={`text-[10px] ${seoChanges.wordCountAfter > seoChanges.wordCountBefore ? 'text-green-400' : 'text-yellow-400'}`}>
                      ({seoChanges.wordCountAfter > seoChanges.wordCountBefore ? '+' : ''}{seoChanges.wordCountAfter - seoChanges.wordCountBefore})
                    </span>
                  )}
                </div>
              )}

              {/* Internal Link Details */}
              {seoChanges?.internalLinkDetails && seoChanges.internalLinkDetails.length > 0 && (
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase mb-1.5 flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-blue-400" /> Internal Links Added ({seoChanges.internalLinkDetails.length})
                  </p>
                  <div className="space-y-1">
                    {seoChanges.internalLinkDetails.slice(0, 6).map((link: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-blue-500/5 rounded px-2 py-1">
                        <span className="text-blue-400 font-medium truncate flex-1">{link.anchor}</span>
                        <span className="text-gray-600 truncate max-w-[200px]">{link.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outbound Link Details */}
              {seoChanges?.outboundLinkDetails && seoChanges.outboundLinkDetails.length > 0 && (
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase mb-1.5 flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-purple-400" /> Outbound Links Added ({seoChanges.outboundLinkDetails.length})
                  </p>
                  <div className="space-y-1">
                    {seoChanges.outboundLinkDetails.slice(0, 4).map((link: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-purple-500/5 rounded px-2 py-1">
                        <span className="text-purple-400 font-medium truncate flex-1">{link.anchor}</span>
                        <span className="text-gray-600 truncate max-w-[200px]">{link.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {seoMetadata?.rankMathScore?.recommendations && seoMetadata.rankMathScore.recommendations.length > 0 && (
                <div>
                  <p className="text-gray-500 text-[10px] font-semibold uppercase mb-1.5">Recommendations</p>
                  <div className="space-y-1">
                    {seoMetadata.rankMathScore.recommendations.slice(0, 4).map((rec: string, i: number) => (
                      <p key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                        <span className="text-yellow-400 flex-shrink-0">•</span> {rec}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Cannibalization warnings */}
              {seoMetadata?.cannibalizationWarnings && seoMetadata.cannibalizationWarnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                  <p className="text-yellow-400 text-xs font-semibold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Keyword Conflicts ({seoMetadata.cannibalizationWarnings.length})
                  </p>
                  {seoMetadata.cannibalizationWarnings.slice(0, 3).map((w: any, i: number) => (
                    <p key={i} className="text-yellow-400/80 text-[10px]">
                      "{w.keyword}" also used in: {w.existingArticleTitle}
                    </p>
                  ))}
                </div>
              )}

              {/* Processing time */}
              {seoMetadata?.processingTime && (
                <p className="text-gray-600 text-[10px] text-right">
                  Processed in {seoMetadata.processingTime.toFixed(1)}s • {seoMetadata.similarArticlesFound || 0} similar articles analyzed
                </p>
              )}
            </div>

            {/* SEO Article Preview */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-4 max-h-[400px] overflow-y-auto">
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {state.seoArticle}
                </div>
              </div>
            </div>

            <Button onClick={() => setStage(7)} className="w-full h-12 bg-green-600 hover:bg-green-700">
              <ArrowRight className="w-5 h-5 mr-2" /> Continue to Meta
            </Button>
          </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

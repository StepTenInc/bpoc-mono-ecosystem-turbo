'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Textarea } from '@/components/shared/ui/textarea';
import { Search, Loader2, RefreshCw, Edit3, Check, Wand2, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { StageProps } from '../types';

interface ResearchStageProps extends StageProps {
  setStage: (stage: number) => void;
}

export default function ResearchStage({
  state,
  updateState,
  loading,
  setLoading,
  toast,
  savePipelineProgress,
  saveProgress,
  setStage
}: ResearchStageProps) {
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchStatus, setResearchStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTopic, setEditedTopic] = useState('');
  const [improvingTopic, setImprovingTopic] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [previousResearch, setPreviousResearch] = useState<any>(null);
  const [newResearch, setNewResearch] = useState<any>(null);

  const improveTopic = async () => {
    setImprovingTopic(true);
    try {
      const currentTopic = editedTopic || state.selectedIdea?.title || state.customTopic;
      const res = await fetch('/api/admin/insights/pipeline/improve-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: currentTopic })
      });
      const result = await res.json();
      if (result.success && result.improvedTopic) {
        setEditedTopic(result.improvedTopic);
        toast({ title: 'Topic improved!', description: 'AI enhanced your topic for better SEO' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to improve topic', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setImprovingTopic(false);
  };

  const saveTopic = async () => {
    if (editedTopic.trim()) {
      updateState({
        selectedIdea: {
          ...state.selectedIdea,
          title: editedTopic.trim()
        }
      });
      if (state.insightId) {
        await saveProgress(state.insightId, { title: editedTopic.trim() }, 'idea');
      }
      toast({ title: 'Topic updated!' });
    }
    setIsEditingTopic(false);
    setEditedTopic('');
  };

  const runResearch = async (isRedo = false) => {
    // If redo, save current research for comparison
    if (isRedo && state.researchData) {
      setPreviousResearch(state.researchData);
      setNewResearch(null);
    }

    setResearchProgress(5);
    setResearchStatus('Starting research...');
    setLoading(true);
    setIsComparing(false);

    // Start elapsed timer
    setElapsed(0);
    setTimerActive(true);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const topicTitle = state.selectedIdea?.title || state.customTopic || 'topic';
    const progressSteps = [
      { progress: 15, status: `Searching Perplexity AI for "${topicTitle.slice(0, 30)}${topicTitle.length > 30 ? '...' : ''}"` },
      { progress: 30, status: 'Finding unique angles & content gaps...' },
      { progress: 45, status: 'Searching Google with Serper...' },
      { progress: 60, status: 'Analyzing competitor content...' },
      { progress: 75, status: 'Validating outbound links...' },
      { progress: 85, status: 'GPT-4o synthesizing research...' },
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setResearchProgress(progressSteps[currentStep].progress);
        setResearchStatus(progressSteps[currentStep].status);
        currentStep++;
      }
    }, 1200);

    try {
      const res = await fetch('/api/admin/insights/pipeline/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: state.selectedIdea?.title || state.customTopic,
          focusKeyword: state.selectedIdea?.keywords?.[0] || state.selectedIdea?.title,
          siloTopic: state.selectedSilo,
          includeSerper: true,
          includeLaborLaw: true,
          originalBrief: state.transcript,
          selectedIdea: state.selectedIdea,
        })
      });

      clearInterval(progressInterval);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      setResearchProgress(95);
      setResearchStatus('Finalizing research...');

      const result = await res.json();

      if (result.success) {
        setResearchProgress(100);
        setResearchStatus('Research complete!');
        await new Promise(resolve => setTimeout(resolve, 400));

        // If redo, show comparison instead of directly updating
        if (isRedo && previousResearch) {
          setNewResearch(result);
          setIsComparing(true);
        } else {
          // First time - directly update state
          updateState({ researchData: result });

          if (state.pipelineId) {
            savePipelineProgress(state.pipelineId, 3, {
              serperResults: result.serperResults || result.competitors,
              hrKbResults: result.laborArticles,
              researchSynthesis: result.research?.synthesis,
            }, { action: 'research_completed', model: 'gpt-4o' })
              .catch(err => console.error('Pipeline save error:', err));
          }

          if (state.insightId) {
            saveProgress(state.insightId, { serper_research: result }, 'research')
              .catch(err => console.error('Save error:', err));
          }
        }

        toast({ title: isRedo ? 'New research generated!' : 'Research complete!', description: 'Found competitors & labor law articles' });
      } else {
        toast({ title: 'Error', description: result.error || 'Research failed', variant: 'destructive' });
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setResearchProgress(0);
      setResearchStatus('');
    }
  };

  const useNewResearch = () => {
    if (newResearch) {
      updateState({ researchData: newResearch });

      if (state.pipelineId) {
        savePipelineProgress(state.pipelineId, 3, {
          serperResults: newResearch.serperResults || newResearch.competitors,
          hrKbResults: newResearch.laborArticles,
          researchSynthesis: newResearch.research?.synthesis,
        }, { action: 'research_completed', model: 'gpt-4o' })
          .catch(err => console.error('Pipeline save error:', err));
      }

      toast({ title: 'New research selected!' });
    }
    setIsComparing(false);
    setPreviousResearch(null);
    setNewResearch(null);
  };

  const keepOriginalResearch = () => {
    setIsComparing(false);
    setPreviousResearch(null);
    setNewResearch(null);
    toast({ title: 'Kept original research' });
  };

  const getCompetitorCount = (data: any) => data?.serper?.competitors?.length || 0;
  const getLaborArticleCount = (data: any) => data?.laborLaw?.articles?.length || 0;

  // Comparison View
  if (isComparing && previousResearch && newResearch) {
    return (
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center gap-2">
            <Search className="w-6 h-6" /> Stage 2: Compare Research
          </CardTitle>
          <CardDescription>Choose which research version to keep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <Button onClick={keepOriginalResearch} variant="outline" className="border-gray-500 hover:bg-gray-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Keep Original
            </Button>
            <Button onClick={useNewResearch} className="bg-blue-600 hover:bg-blue-700">
              Use New Research <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-semibold">Original</span>
                <span className="text-gray-500 text-xs">
                  {getCompetitorCount(previousResearch)} competitors - {getLaborArticleCount(previousResearch)} articles
                </span>
              </div>
              <div className="bg-white/5 rounded-lg border border-gray-600 p-3 max-h-[400px] overflow-y-auto space-y-3">
                {previousResearch.research?.synthesis?.uniqueAngle && (
                  <div>
                    <p className="text-cyan-400 text-xs font-semibold mb-1">Unique Angle</p>
                    <p className="text-gray-300 text-xs">{previousResearch.research.synthesis.uniqueAngle}</p>
                  </div>
                )}
                {previousResearch.serper?.competitors?.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} className="bg-white/5 p-2 rounded text-xs">
                    <p className="text-white font-medium truncate">{c.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 text-sm font-semibold">New Research</span>
                <span className="text-blue-500 text-xs">
                  {getCompetitorCount(newResearch)} competitors - {getLaborArticleCount(newResearch)} articles
                </span>
              </div>
              <div className="bg-blue-500/5 rounded-lg border border-blue-500/30 p-3 max-h-[400px] overflow-y-auto space-y-3">
                {newResearch.research?.synthesis?.uniqueAngle && (
                  <div>
                    <p className="text-cyan-400 text-xs font-semibold mb-1">Unique Angle</p>
                    <p className="text-gray-300 text-xs">{newResearch.research.synthesis.uniqueAngle}</p>
                  </div>
                )}
                {newResearch.serper?.competitors?.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} className="bg-white/5 p-2 rounded text-xs">
                    <p className="text-white font-medium truncate">{c.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-500/10 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center gap-2">
          <Search className="w-6 h-6" /> Stage 2: Research
        </CardTitle>
        <CardDescription>Perplexity AI + Serper Google Search - Research based on your selected topic</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Topic Display - Title & Description */}
        <div className="bg-white/5 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-blue-400 text-sm font-semibold">Selected Topic for Research:</p>
            {!isEditingTopic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedTopic(state.selectedIdea?.title || state.customTopic || '');
                  setIsEditingTopic(true);
                }}
                className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
              >
                <Edit3 className="w-3 h-3 mr-1" /> Edit Title
              </Button>
            )}
          </div>

          {isEditingTopic ? (
            <div className="space-y-3">
              <Textarea
                value={editedTopic}
                onChange={(e) => setEditedTopic(e.target.value)}
                placeholder="Enter your article topic..."
                className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={improveTopic}
                  disabled={improvingTopic || !editedTopic.trim()}
                  className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                >
                  {improvingTopic ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                  Improve with AI
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => { setIsEditingTopic(false); setEditedTopic(''); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveTopic} disabled={!editedTopic.trim()} className="bg-green-600 hover:bg-green-700">
                  <Check className="w-3 h-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Title */}
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Title</p>
                <p className="text-white font-semibold text-lg">{state.selectedIdea?.title || state.customTopic}</p>
              </div>

              {/* Description */}
              {(state.selectedIdea?.description || state.selectedIdea?.rationale) && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Description</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {state.selectedIdea?.description || state.selectedIdea?.rationale}
                  </p>
                </div>
              )}

              {/* Keywords */}
              {state.selectedIdea?.keywords && state.selectedIdea.keywords.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Target Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {state.selectedIdea.keywords.map((keyword: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Research Action/Results */}
        {!state.researchData ? (
          (loading && researchProgress > 0) || researchStatus ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{researchStatus}</span>
                  <span className="text-blue-400 font-bold text-sm">{researchProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${researchProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-400 animate-pulse" />
                    <span className="text-gray-400 text-xs">Researching with Perplexity AI + Google...</span>
                  </div>
                  {timerActive && (
                    <span className="text-2xl font-mono font-bold text-blue-400">
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-gray-500 text-xs text-center">
                    🔎 Multi-source research typically takes 2-4 minutes
                  </p>
                  <div className="flex items-center justify-center gap-2 text-yellow-400/80 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Please don&apos;t close this window while research is in progress.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={() => runResearch(false)} disabled={loading} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg">
              <Search className="w-5 h-5 mr-2" /> Start Research
            </Button>
          )
        ) : (
          // Show loading state when redoing
          (loading && researchProgress > 0) ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{researchStatus}</span>
                  <span className="text-blue-400 font-bold text-sm">{researchProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${researchProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-gray-400 text-xs">Re-researching your topic...</span>
                  </div>
                  {timerActive && (
                    <span className="text-2xl font-mono font-bold text-blue-400">
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center mt-2 gap-2 text-yellow-400/80 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Please don&apos;t close this window while research is in progress.</span>
                </div>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {/* Research Complete Header */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-green-400 font-semibold">Research Complete</p>
                <p className="text-gray-400 text-xs">
                  Found {state.researchData.research?.serper?.competitors?.length || state.researchData.serper?.competitors?.length || 0} sources, {state.researchData.research?.synthesis?.contentGaps?.length || state.researchData._meta?.paa_questions || 0} content gaps identified
                </p>
                {/* Research metrics from _meta */}
                {state.researchData._meta && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {state.researchData._meta.perplexity_used && (
                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px]">
                        🧠 Perplexity ({state.researchData._meta.perplexity_citations} citations)
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px]">
                      🔍 {state.researchData._meta.serper_competitors} competitors
                    </span>
                    <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px]">
                      🔗 {state.researchData._meta.validated_links} validated links
                    </span>
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">
                      ❓ {state.researchData._meta.paa_questions} PAA
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      state.researchData._meta.research_depth === 'deep' ? 'bg-green-500/20 text-green-400' :
                      state.researchData._meta.research_depth === 'standard' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      Depth: {state.researchData._meta.research_depth}
                    </span>
                  </div>
                )}
              </div>
              <Button onClick={() => runResearch(true)} variant="outline" disabled={loading} size="sm" className="h-8">
                <RefreshCw className="w-3 h-3 mr-1" /> Redo
              </Button>
            </div>

            {/* Research Results Preview */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-4 max-h-[400px] overflow-y-auto">
              {/* Synthesis */}
              {state.researchData.research?.synthesis && (
                <div className="space-y-3">
                  {state.researchData.research.synthesis.uniqueAngle && (
                    <div>
                      <p className="text-cyan-400 text-xs font-semibold mb-1">Unique Angle</p>
                      <p className="text-white text-sm">{state.researchData.research.synthesis.uniqueAngle}</p>
                    </div>
                  )}
                  {state.researchData.research.synthesis.contentGaps && Array.isArray(state.researchData.research.synthesis.contentGaps) && (
                    <div>
                      <p className="text-cyan-400 text-xs font-semibold mb-1">Content Gaps to Fill</p>
                      <ul className="text-gray-300 text-sm space-y-1">
                        {state.researchData.research.synthesis.contentGaps.slice(0, 3).map((gap: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-cyan-500">-</span> {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Competitors */}
              {state.researchData.serper?.competitors && state.researchData.serper.competitors.length > 0 && (
                <div>
                  <p className="text-blue-400 text-xs font-semibold mb-2">Top Competitors ({state.researchData.serper.competitors.length})</p>
                  <div className="space-y-2">
                    {state.researchData.serper.competitors.slice(0, 3).map((c: any, i: number) => (
                      <div key={i} className="bg-white/5 p-2 rounded text-xs">
                        <p className="text-white font-medium truncate">{c.title}</p>
                        <p className="text-gray-500 truncate">{c.link}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labor Law Articles */}
              {state.researchData.laborLaw?.articles && state.researchData.laborLaw.articles.length > 0 && (
                <div>
                  <p className="text-purple-400 text-xs font-semibold mb-2">Labor Law References ({state.researchData.laborLaw.articles.length})</p>
                  <div className="space-y-2">
                    {state.researchData.laborLaw.articles.slice(0, 3).map((a: any, i: number) => (
                      <div key={i} className="bg-white/5 p-2 rounded text-xs">
                        <p className="text-white font-medium">{a.title}</p>
                        <p className="text-gray-400 line-clamp-2">{a.content?.slice(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

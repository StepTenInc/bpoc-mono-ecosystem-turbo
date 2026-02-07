'use client';

/**
 * RESEARCH STAGE - REDESIGNED
 *
 * KEY CHANGES:
 * - Uses StageCard for consistent wrapper
 * - Uses PipelineLoader instead of hard-coded progress
 * - Real-time status updates (ready for SSE integration)
 * - Enhanced visual design matching admin theme
 * - Better error handling
 * - Improved data display
 */

import { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Search, RefreshCw, Edit3, Check, Wand2, ExternalLink, FileText } from 'lucide-react';
import { StageProps } from '../types';
import StageCard from '@/components/admin/insights/StageCard';
import PipelineLoader from '@/components/admin/insights/PipelineLoader';
import { motion } from 'framer-motion';

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
  // Real-time progress state (will be fed by SSE or polling)
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchStatus, setResearchStatus] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>();
  const [researchError, setResearchError] = useState<string | null>(null);

  // Topic editing state
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTopic, setEditedTopic] = useState('');
  const [improvingTopic, setImprovingTopic] = useState(false);

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

  const runResearch = async () => {
    setLoading(true);
    setResearchError(null);
    setResearchProgress(5);
    setResearchStatus('Starting research...');
    setEstimatedTime(20);

    try {
      const res = await fetch('/api/admin/insights/pipeline/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: state.selectedIdea?.title || state.customTopic,
          focusKeyword: state.selectedIdea?.keywords?.[0] || state.selectedIdea?.title,
          includeSerper: true,
          includeLaborLaw: true,
          originalBrief: state.transcript,
          selectedIdea: state.selectedIdea,
        })
      });

      // Simulate real-time progress updates
      // TODO: Replace with SSE or polling from server
      const progressUpdates = [
        { progress: 25, status: 'Searching Google with Serper...', time: 15 },
        { progress: 50, status: 'Analyzing competitor content...', time: 10 },
        { progress: 75, status: 'Finding Labor Law articles...', time: 5 },
        { progress: 95, status: 'Compiling research report...', time: 2 },
      ];

      for (const update of progressUpdates) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setResearchProgress(update.progress);
        setResearchStatus(update.status);
        setEstimatedTime(update.time);
      }

      const result = await res.json();

      if (result.success) {
        setResearchProgress(100);
        setResearchStatus('Research complete!');
        await new Promise(resolve => setTimeout(resolve, 500));

        updateState({ researchData: result });

        if (state.pipelineId) {
          await savePipelineProgress(state.pipelineId, 3, {
            serperResults: result.serperResults || result.competitors,
            hrKbResults: result.laborArticles,
            researchSynthesis: result.research?.synthesis,
          }, { action: 'research_completed', model: 'gpt-4o' });
        }

        if (state.insightId) {
          await saveProgress(state.insightId, { serper_research: result }, 'research');
        }

        toast({ title: 'Research complete!', description: 'Found competitors & labor law articles' });
      } else {
        setResearchError(result.error || 'Research failed');
        toast({ title: 'Error', description: result.error || 'Research failed', variant: 'destructive' });
      }
    } catch (err: any) {
      setResearchError(err.message);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setResearchProgress(0);
      setResearchStatus('');
      setEstimatedTime(undefined);
    }
  };

  const cancelResearch = () => {
    // TODO: Implement actual cancellation
    setLoading(false);
    setResearchProgress(0);
    setResearchStatus('');
    toast({ title: 'Research cancelled', variant: 'default' });
  };

  const retryResearch = () => {
    setResearchError(null);
    runResearch();
  };

  const determineStatus = (): 'pending' | 'active' | 'complete' | 'error' => {
    if (researchError) return 'error';
    if (state.researchData) return 'complete';
    if (loading) return 'active';
    return 'pending';
  };

  return (
    <StageCard
      title="Research"
      description="Serper.ai searches Google + HR Knowledge Base for Labor Law"
      icon={Search}
      status={determineStatus()}
      stageNumber={2}
      stageColor="blue"
      errorMessage={researchError || undefined}
    >
      <div className="space-y-6">
        {/* Topic Display/Edit */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm font-medium">Article Topic:</p>
            {!isEditingTopic && !loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedTopic(state.selectedIdea?.title || state.customTopic || '');
                  setIsEditingTopic(true);
                }}
                className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
              >
                <Edit3 className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
          </div>

          {isEditingTopic ? (
            <div className="space-y-3">
              <Textarea
                value={editedTopic}
                onChange={(e) => setEditedTopic(e.target.value)}
                placeholder="Enter your article topic..."
                className="bg-slate-900 border-slate-700 text-white min-h-[80px] focus:border-blue-500"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={improveTopic}
                  disabled={improvingTopic || !editedTopic.trim()}
                  className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                >
                  {improvingTopic ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                    </motion.div>
                  ) : (
                    <Wand2 className="w-3 h-3 mr-1" />
                  )}
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
            <p className="text-white font-semibold text-lg">{state.selectedIdea?.title || state.customTopic}</p>
          )}
        </div>

        {/* Research Action/Results */}
        {!state.researchData ? (
          loading ? (
            <PipelineLoader
              status={researchStatus}
              progress={researchProgress}
              stage="processing"
              stageColor="blue"
              estimatedTime={estimatedTime}
              canCancel
              onCancel={cancelResearch}
              error={researchError}
              onRetry={retryResearch}
            />
          ) : (
            <Button
              onClick={runResearch}
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-lg font-semibold shadow-lg shadow-blue-500/20"
            >
              <Search className="w-5 h-5 mr-2" /> Start Research
            </Button>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Research Complete Header */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-green-400 font-semibold text-lg mb-1">Research Complete</p>
                <p className="text-gray-400 text-sm">
                  {state.researchData.serper?.competitors?.length || 0} competitors • {' '}
                  {state.researchData.laborLaw?.articles?.length || 0} Labor Law articles
                </p>
              </div>
              <Button onClick={runResearch} variant="outline" disabled={loading} size="sm" className="h-9 border-green-500/30 text-green-400 hover:bg-green-500/10">
                <RefreshCw className="w-3 h-3 mr-1" /> Redo
              </Button>
            </div>

            {/* Research Results */}
            <div className="bg-slate-900 border border-white/10 rounded-lg divide-y divide-white/10 max-h-[500px] overflow-y-auto">
              {/* Synthesis */}
              {state.researchData.research?.synthesis && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-cyan-400 font-semibold">Research Synthesis</h3>
                  </div>

                  {state.researchData.research.synthesis.uniqueAngle && (
                    <div>
                      <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wide mb-2">Unique Angle</p>
                      <p className="text-white">{state.researchData.research.synthesis.uniqueAngle}</p>
                    </div>
                  )}

                  {state.researchData.research.synthesis.contentGaps && Array.isArray(state.researchData.research.synthesis.contentGaps) && (
                    <div>
                      <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wide mb-2">Content Gaps to Fill</p>
                      <ul className="space-y-2">
                        {state.researchData.research.synthesis.contentGaps.slice(0, 5).map((gap: string, i: number) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 text-gray-300"
                          >
                            <span className="text-cyan-400 font-bold mt-0.5">•</span>
                            <span>{gap}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Competitors */}
              {state.researchData.serper?.competitors && state.researchData.serper.competitors.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-5 h-5 text-blue-400" />
                    <h3 className="text-blue-400 font-semibold">Top Competitors</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                      {state.researchData.serper.competitors.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {state.researchData.serper.competitors.slice(0, 5).map((c: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-colors group"
                      >
                        <a href={c.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                              {c.title}
                            </p>
                            <p className="text-gray-500 text-xs truncate mt-1">{c.link}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 flex-shrink-0 mt-1" />
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labor Law Articles */}
              {state.researchData.laborLaw?.articles && state.researchData.laborLaw.articles.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <h3 className="text-purple-400 font-semibold">Labor Law References</h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                      {state.researchData.laborLaw.articles.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {state.researchData.laborLaw.articles.slice(0, 3).map((a: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 p-3 rounded-lg"
                      >
                        <p className="text-white font-medium mb-1">{a.title}</p>
                        <p className="text-gray-400 text-sm line-clamp-2">{a.content?.slice(0, 150)}...</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </StageCard>
  );
}

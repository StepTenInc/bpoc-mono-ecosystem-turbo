'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Bot, Loader2, RefreshCw, Edit3, ArrowRight, ArrowLeft, AlertTriangle, Shield, Zap } from 'lucide-react';
import { StageProps } from '../types';

interface HumanizeStageProps extends StageProps {
  setStage: (stage: number) => void;
  onEditArticle: (content: string, type: string) => void;
}

export default function HumanizeStage({
  state,
  updateState,
  loading,
  setLoading,
  toast,
  savePipelineProgress,
  saveProgress,
  setStage,
  onEditArticle
}: HumanizeStageProps) {
  const [humanizeProgress, setHumanizeProgress] = useState(0);
  const [humanizeStatus, setHumanizeStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [humanizeResult, setHumanizeResult] = useState<any>(null);
  const [humanizeChanges, setHumanizeChanges] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [previousVersion, setPreviousVersion] = useState<{ content: string; score: number } | null>(null);
  const [newVersion, setNewVersion] = useState<{ content: string; score: number } | null>(null);

  const humanizeArticle = async (isRedo = false) => {
    // If redo, save current version for comparison
    if (isRedo && state.humanizedArticle) {
      setPreviousVersion({ content: state.humanizedArticle, score: state.humanScore || 0 });
      setNewVersion(null);
    }

    setHumanizeProgress(5);
    setHumanizeStatus('Starting humanization...');
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
      { progress: 15, status: 'Analyzing AI patterns...' },
      { progress: 30, status: 'Varying sentence structures...' },
      { progress: 45, status: 'Adding conversational flow...' },
      { progress: 60, status: 'Inserting natural expressions...' },
      { progress: 75, status: 'Preserving Filipino voice...' },
      { progress: 85, status: 'Checking human score...' },
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setHumanizeProgress(progressSteps[currentStep].progress);
        setHumanizeStatus(progressSteps[currentStep].status);
        currentStep++;
      }
    }, 1500);

    try {
      const res = await fetch('/api/admin/insights/pipeline/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: state.article,
          plan: state.plan,
          insightId: state.insightId,
          pipelineId: state.pipelineId,
        })
      });

      clearInterval(progressInterval);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      setHumanizeProgress(95);
      setHumanizeStatus('Finalizing...');

      const result = await res.json();

      // Store full result for summary display
      if (result.result) {
        setHumanizeResult(result.result);
      }
      if (result.changes) {
        setHumanizeChanges(result.changes);
      }

      if (result.success) {
        setHumanizeProgress(100);
        setHumanizeStatus(`Done! Score: ${result.humanScore}%`);
        await new Promise(resolve => setTimeout(resolve, 400));

        // If redo, show comparison instead of directly updating
        if (isRedo && previousVersion) {
          setNewVersion({ content: result.humanizedArticle, score: result.humanScore });
          setIsComparing(true);
        } else {
          // First time - directly update state
          updateState({ humanizedArticle: result.humanizedArticle, humanScore: result.humanScore });

          if (state.pipelineId) {
            savePipelineProgress(state.pipelineId, 5, {
              humanizedArticle: result.humanizedArticle,
              humanScore: result.humanScore,
            }, { action: 'humanized', model: 'grok-4-1-fast', humanScore: result.humanScore })
              .catch(err => console.error('Pipeline save error:', err));
          }

          if (state.insightId) {
            saveProgress(state.insightId, {
              content: result.humanizedArticle,
              humanization_score: result.humanScore,
            }, 'humanizing')
              .catch(err => console.error('Insight save error:', err));
          }
        }

        toast({ title: isRedo ? 'New version generated!' : 'Humanized!', description: `Human score: ${result.humanScore}%` });
      } else {
        toast({ title: 'Error', description: result.error || 'Humanization failed', variant: 'destructive' });
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setHumanizeProgress(0);
      setHumanizeStatus('');
    }
  };

  const useNewVersion = () => {
    if (newVersion) {
      updateState({ humanizedArticle: newVersion.content, humanScore: newVersion.score });

      if (state.pipelineId) {
        savePipelineProgress(state.pipelineId, 5, {
          humanizedArticle: newVersion.content,
          humanScore: newVersion.score,
        }, { action: 'humanized', model: 'grok-4-1-fast', humanScore: newVersion.score })
          .catch(err => console.error('Pipeline save error:', err));
      }

      toast({ title: 'New version selected!', description: `Human score: ${newVersion.score}%` });
    }
    setIsComparing(false);
    setPreviousVersion(null);
    setNewVersion(null);
  };

  const keepOriginal = () => {
    setIsComparing(false);
    setPreviousVersion(null);
    setNewVersion(null);
    toast({ title: 'Kept original version' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  // Comparison View
  if (isComparing && previousVersion && newVersion) {
    return (
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Bot className="w-6 h-6" /> Stage 5: Compare Versions
          </CardTitle>
          <CardDescription>Choose which humanized version to keep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <Button onClick={keepOriginal} variant="outline" className="border-gray-500 hover:bg-gray-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Keep Original
            </Button>
            <Button onClick={useNewVersion} className="bg-yellow-600 hover:bg-yellow-700">
              Use New Version <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-semibold">Original</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getScoreColor(previousVersion.score)}`}>
                  {previousVersion.score}% Human
                </span>
              </div>
              <div className="bg-white/5 rounded-lg border border-gray-600 p-3 max-h-[500px] overflow-y-auto">
                <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {previousVersion.content.slice(0, 3000)}
                  {previousVersion.content.length > 3000 && '...'}
                </div>
              </div>
            </div>

            {/* New */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 text-sm font-semibold">New Version</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getScoreColor(newVersion.score)}`}>
                  {newVersion.score}% Human
                </span>
              </div>
              <div className="bg-yellow-500/5 rounded-lg border border-yellow-500/30 p-3 max-h-[500px] overflow-y-auto">
                <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {newVersion.content.slice(0, 3000)}
                  {newVersion.content.length > 3000 && '...'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-yellow-500/10 border-yellow-500/20">
      <CardHeader>
        <CardTitle className="text-yellow-400 flex items-center gap-2">
          <Bot className="w-6 h-6" /> Stage 5: Humanize
        </CardTitle>
        <CardDescription>Rewrite to pass AI detectors (85%+ human score)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!state.humanizedArticle ? (
          (loading && humanizeProgress > 0) || humanizeStatus ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{humanizeStatus}</span>
                  <span className="text-yellow-400 font-bold text-sm">{humanizeProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${humanizeProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-yellow-400 animate-pulse" />
                    <span className="text-gray-400 text-xs">Making content sound more human...</span>
                  </div>
                  {timerActive && (
                    <span className="text-2xl font-mono font-bold text-yellow-400">
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-gray-500 text-xs text-center">
                    🤖 Humanizing {state.wordCount || 'your'} words with Grok — typically takes 3-5 minutes
                  </p>
                  <div className="flex items-center justify-center gap-2 text-yellow-400/80 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Please don&apos;t close this window while humanization is in progress.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={() => humanizeArticle(false)} disabled={loading} className="w-full h-14 bg-yellow-600 hover:bg-yellow-700 text-lg">
              <Bot className="w-5 h-5 mr-2" /> Humanize
            </Button>
          )
        ) : (
          // Show loading state when redoing
          (loading && humanizeProgress > 0) ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{humanizeStatus}</span>
                  <span className="text-yellow-400 font-bold text-sm">{humanizeProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${humanizeProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />
                    <span className="text-gray-400 text-xs">Re-humanizing content...</span>
                  </div>
                  {timerActive && (
                    <span className="text-2xl font-mono font-bold text-yellow-400">
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center mt-2 gap-2 text-yellow-400/80 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Please don&apos;t close this window while humanization is in progress.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Humanize Complete Header */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${state.humanScore >= 85 ? 'bg-green-500/20 text-green-400' :
                    state.humanScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                    {state.humanScore}% Human
                  </div>
                  <p className="text-gray-400 text-xs">
                    {state.humanScore >= 85 ? 'Passes AI detection' :
                      state.humanScore >= 70 ? 'May trigger detection' :
                        'Needs more humanization'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onEditArticle(state.humanizedArticle, 'humanized')}
                    size="sm"
                    disabled={loading}
                    className="h-8 text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                  >
                    <Edit3 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button onClick={() => humanizeArticle(true)} variant="outline" disabled={loading} size="sm" className="h-8">
                    <RefreshCw className="w-3 h-3 mr-1" /> Redo
                  </Button>
                </div>
              </div>

              {/* Humanization Summary */}
              {(humanizeResult || humanizeChanges) && (
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-3">
                  <p className="text-yellow-400 text-xs font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> What Changed
                  </p>

                  {/* Detailed changes from API */}
                  {humanizeChanges && (
                    <div className="bg-yellow-500/5 border border-yellow-500/15 rounded p-2.5">
                      <p className="text-gray-300 text-xs mb-2">{humanizeChanges.summary}</p>
                      <div className="flex flex-wrap gap-2">
                        {humanizeChanges.contractionsAdded > 0 && (
                          <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-400 rounded text-[10px]">
                            💬 {humanizeChanges.contractionsAdded} contractions
                          </span>
                        )}
                        {humanizeChanges.questionsAdded > 0 && (
                          <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 rounded text-[10px]">
                            ❓ {humanizeChanges.questionsAdded} rhetorical questions
                          </span>
                        )}
                        {humanizeChanges.filipinoExpressionsCount > 0 && (
                          <span className="px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded text-[10px]">
                            🇵🇭 {humanizeChanges.filipinoExpressionsCount} Filipino expressions
                          </span>
                        )}
                        {humanizeChanges.wordCountDiff !== 0 && (
                          <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-400 rounded text-[10px]">
                            📝 {humanizeChanges.wordCountDiff > 0 ? '+' : ''}{humanizeChanges.wordCountDiff} words
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {humanizeResult && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-yellow-500/15 text-yellow-400 rounded text-xs">
                          ✏️ {humanizeResult.changes?.length || 0} text changes
                        </span>
                        <span className="px-2 py-1 bg-purple-500/15 text-purple-400 rounded text-xs">
                          🔍 {humanizeResult.patterns?.length || 0} AI patterns fixed
                        </span>
                        {humanizeResult.aiDetection && (
                          <span className="px-2 py-1 bg-green-500/15 text-green-400 rounded text-xs">
                            📊 AI detection: {Math.round((humanizeResult.aiDetection.beforeScore || 0.85) * 100)}% → {Math.round((humanizeResult.aiDetection.afterScore || 0.08) * 100)}%
                          </span>
                        )}
                      </div>
                      {humanizeResult.patterns && humanizeResult.patterns.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-gray-500 text-[10px] font-semibold uppercase">Patterns Fixed</p>
                          {humanizeResult.patterns.slice(0, 4).map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <Shield className="w-3 h-3 text-green-400 flex-shrink-0" />
                              <span className="text-gray-400">{p.pattern?.replace(/_/g, ' ')}</span>
                              <span className="text-gray-600">×{p.frequency}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Humanized Article Preview */}
              <div className="bg-white/5 rounded-lg border border-white/10 p-4 max-h-[400px] overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                    {state.humanizedArticle}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

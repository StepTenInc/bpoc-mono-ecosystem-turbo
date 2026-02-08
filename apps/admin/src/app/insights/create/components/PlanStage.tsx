'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { FileText, Loader2, RefreshCw, Check, ArrowLeft, ArrowRight, Edit3, Plus, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { StageProps } from '../types';

interface PlanStageProps extends StageProps {
  setStage: (stage: number) => void;
}

export default function PlanStage({
  state,
  updateState,
  loading,
  setLoading,
  toast,
  savePipelineProgress,
  saveProgress,
  setStage
}: PlanStageProps) {
  const [planProgress, setPlanProgress] = useState(0);
  const [planStatus, setPlanStatus] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [previousPlan, setPreviousPlan] = useState<any>(null);
  const [newPlan, setNewPlan] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<any>(null);

  const generatePlan = async (isRedo = false) => {
    // If redo, save current plan for comparison
    if (isRedo && state.plan) {
      setPreviousPlan(state.plan);
      setNewPlan(null);
    }

    setPlanProgress(5);
    setPlanStatus('Starting plan generation...');
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
      { progress: 15, status: 'Analyzing research data...' },
      { progress: 30, status: 'Identifying focus keywords...' },
      { progress: 45, status: 'Claude structuring article...' },
      { progress: 60, status: 'Creating H2/H3 outline...' },
      { progress: 75, status: 'Planning internal links...' },
      { progress: 85, status: 'Generating FAQ section...' },
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setPlanProgress(progressSteps[currentStep].progress);
        setPlanStatus(progressSteps[currentStep].status);
        currentStep++;
      }
    }, 1000);

    try {
      const res = await fetch('/api/admin/insights/pipeline/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: state.selectedIdea?.title || state.customTopic,
          focusKeyword: state.selectedIdea?.keywords?.[0] || state.selectedIdea?.title,
          siloTopic: state.selectedSilo,
          research: state.researchData,
          insightId: state.insightId,
          pipelineId: state.pipelineId,
          originalBrief: state.transcript,
          selectedIdea: state.selectedIdea,
          isPillar: state.isPillar || false, // Pillar: 3000-4000 words, Supporting: 1800-2200 words
        })
      });

      clearInterval(progressInterval);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      setPlanProgress(95);
      setPlanStatus('Finalizing plan...');

      const result = await res.json();

      if (result.success) {
        setPlanProgress(100);
        setPlanStatus('Plan ready!');
        await new Promise(resolve => setTimeout(resolve, 400));

        // If redo, show comparison instead of directly updating
        if (isRedo && previousPlan) {
          setNewPlan(result.plan);
          setIsComparing(true);
        } else {
          // First time - directly update state
          updateState({ plan: result.plan, insightId: result.insightId });

          if (state.pipelineId) {
            savePipelineProgress(state.pipelineId, 3, {
              articlePlan: result.plan,
              planApproved: false,
            }, { action: 'plan_generated', model: 'claude-sonnet-4' })
              .catch(err => console.error('Pipeline save error:', err));
          }
        }

        toast({ title: isRedo ? 'New plan generated!' : 'Plan generated!', description: 'Review and approve to continue' });
      } else {
        toast({ title: 'Error', description: result.error || 'Plan generation failed', variant: 'destructive' });
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setTimerActive(false);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setPlanProgress(0);
      setPlanStatus('');
    }
  };

  const useNewPlan = () => {
    if (newPlan) {
      updateState({ plan: newPlan, planApproved: false });

      if (state.pipelineId) {
        savePipelineProgress(state.pipelineId, 3, {
          articlePlan: newPlan,
          planApproved: false,
        }, { action: 'plan_generated', model: 'claude-sonnet-4' })
          .catch(err => console.error('Pipeline save error:', err));
      }

      toast({ title: 'New plan selected!' });
    }
    setIsComparing(false);
    setPreviousPlan(null);
    setNewPlan(null);
  };

  const keepOriginalPlan = () => {
    setIsComparing(false);
    setPreviousPlan(null);
    setNewPlan(null);
    toast({ title: 'Kept original plan' });
  };

  const getSectionCount = (plan: any) => plan?.structure?.sections?.length || 0;
  const getFaqCount = (plan: any) => plan?.structure?.faq?.length || 0;

  const approvePlan = async () => {
    updateState({ planApproved: true });

    if (state.pipelineId) {
      await savePipelineProgress(state.pipelineId, 3, {
        articlePlan: state.plan,
        planApproved: true,
      }, { action: 'plan_approved' });
    }

    if (state.insightId) {
      await saveProgress(state.insightId, { pipeline_stage: 'plan_approved' }, 'plan_approved');
    }
  };

  // Start editing mode
  const startEditing = () => {
    setEditedPlan(JSON.parse(JSON.stringify(state.plan))); // Deep copy
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditedPlan(null);
    setIsEditing(false);
  };

  // Save edited plan
  const saveEditedPlan = async () => {
    if (!editedPlan) return;

    updateState({ plan: editedPlan, planApproved: false });

    if (state.pipelineId) {
      await savePipelineProgress(state.pipelineId, 3, {
        articlePlan: editedPlan,
        planApproved: false,
      }, { action: 'plan_edited' });
    }

    toast({ title: 'Plan updated!', description: 'Review and approve to continue' });
    setIsEditing(false);
    setEditedPlan(null);
  };

  // Update section H2
  const updateSectionH2 = (index: number, value: string) => {
    const newPlan = { ...editedPlan };
    if (newPlan.structure?.sections?.[index]) {
      if (typeof newPlan.structure.sections[index] === 'string') {
        newPlan.structure.sections[index] = value;
      } else {
        newPlan.structure.sections[index].h2 = value;
      }
    }
    setEditedPlan(newPlan);
  };

  // Update section H3
  const updateSectionH3 = (sectionIndex: number, h3Index: number, value: string) => {
    const newPlan = { ...editedPlan };
    if (newPlan.structure?.sections?.[sectionIndex]?.h3s) {
      newPlan.structure.sections[sectionIndex].h3s[h3Index] = value;
    }
    setEditedPlan(newPlan);
  };

  // Add H3 to section
  const addH3ToSection = (sectionIndex: number) => {
    const newPlan = { ...editedPlan };
    if (newPlan.structure?.sections?.[sectionIndex]) {
      if (!newPlan.structure.sections[sectionIndex].h3s) {
        newPlan.structure.sections[sectionIndex].h3s = [];
      }
      newPlan.structure.sections[sectionIndex].h3s.push('New subheading');
    }
    setEditedPlan(newPlan);
  };

  // Remove H3 from section
  const removeH3FromSection = (sectionIndex: number, h3Index: number) => {
    const newPlan = { ...editedPlan };
    if (newPlan.structure?.sections?.[sectionIndex]?.h3s) {
      newPlan.structure.sections[sectionIndex].h3s.splice(h3Index, 1);
    }
    setEditedPlan(newPlan);
  };

  // Add new section
  const addSection = () => {
    const newPlan = { ...editedPlan };
    if (!newPlan.structure) newPlan.structure = {};
    if (!newPlan.structure.sections) newPlan.structure.sections = [];
    newPlan.structure.sections.push({ h2: 'New Section', h3s: [] });
    setEditedPlan(newPlan);
  };

  // Remove section
  const removeSection = (index: number) => {
    const newPlan = { ...editedPlan };
    if (newPlan.structure?.sections) {
      newPlan.structure.sections.splice(index, 1);
    }
    setEditedPlan(newPlan);
  };

  // Update FAQ
  const updateFaq = (index: number, value: string) => {
    const newPlan = { ...editedPlan };
    if (newPlan.structure?.faq?.[index]) {
      if (typeof newPlan.structure.faq[index] === 'string') {
        newPlan.structure.faq[index] = value;
      } else {
        newPlan.structure.faq[index].question = value;
      }
    }
    setEditedPlan(newPlan);
  };

  // Add FAQ
  const addFaq = () => {
    const newPlan = { ...editedPlan };
    if (!newPlan.structure) newPlan.structure = {};
    if (!newPlan.structure.faq) newPlan.structure.faq = [];
    newPlan.structure.faq.push('New FAQ question?');
    setEditedPlan(newPlan);
  };

  // Remove FAQ
  const removeFaq = (index: number) => {
    const newPlan = { ...editedPlan };
    if (newPlan.structure?.faq) {
      newPlan.structure.faq.splice(index, 1);
    }
    setEditedPlan(newPlan);
  };

  // Comparison View
  if (isComparing && previousPlan && newPlan) {
    return (
      <Card className="bg-cyan-500/10 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <FileText className="w-6 h-6" /> Stage 3: Compare Plans
          </CardTitle>
          <CardDescription>Choose which plan version to keep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <Button onClick={keepOriginalPlan} variant="outline" className="border-gray-500 hover:bg-gray-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Keep Original
            </Button>
            <Button onClick={useNewPlan} className="bg-cyan-600 hover:bg-cyan-700">
              Use New Plan <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-semibold">Original</span>
                <span className="text-gray-500 text-xs">
                  {getSectionCount(previousPlan)} sections - {getFaqCount(previousPlan)} FAQs
                </span>
              </div>
              <div className="bg-white/5 rounded-lg border border-gray-600 p-3 max-h-[400px] overflow-y-auto space-y-2">
                <p className="text-white font-bold text-sm">{previousPlan.title || previousPlan.finalTitle}</p>
                {previousPlan.structure?.sections?.slice(0, 4).map((s: any, i: number) => (
                  <div key={i} className="bg-white/5 p-2 rounded text-xs">
                    <p className="text-gray-300">{i + 1}. {s.h2 || s}</p>
                  </div>
                ))}
                {getSectionCount(previousPlan) > 4 && (
                  <p className="text-gray-500 text-xs">+{getSectionCount(previousPlan) - 4} more sections</p>
                )}
              </div>
            </div>

            {/* New */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 text-sm font-semibold">New Plan</span>
                <span className="text-cyan-500 text-xs">
                  {getSectionCount(newPlan)} sections - {getFaqCount(newPlan)} FAQs
                </span>
              </div>
              <div className="bg-cyan-500/5 rounded-lg border border-cyan-500/30 p-3 max-h-[400px] overflow-y-auto space-y-2">
                <p className="text-white font-bold text-sm">{newPlan.title || newPlan.finalTitle}</p>
                {newPlan.structure?.sections?.slice(0, 4).map((s: any, i: number) => (
                  <div key={i} className="bg-white/5 p-2 rounded text-xs">
                    <p className="text-gray-300">{i + 1}. {s.h2 || s}</p>
                  </div>
                ))}
                {getSectionCount(newPlan) > 4 && (
                  <p className="text-gray-500 text-xs">+{getSectionCount(newPlan) - 4} more sections</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cyan-500/10 border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <FileText className="w-6 h-6" /> Stage 3: Article Plan
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          Claude generates the article structure
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            state.isPillar
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          }`}>
            {state.isPillar ? 'Pillar: 3000-4000 words' : 'Supporting: 1800-2200 words'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!state.plan ? (
          (loading && planProgress > 0) || planStatus ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{planStatus}</span>
                  <span className="text-cyan-400 font-bold text-sm">{planProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${planProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <span className="text-gray-400 text-xs">Creating article structure &amp; outline...</span>
                  </div>
                  {timerActive && (
                    <span className="text-2xl font-mono font-bold text-cyan-400">
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-gray-500 text-xs text-center">
                    🧠 Claude is structuring the article — typically takes 1-2 minutes
                  </p>
                  <div className="flex items-center justify-center gap-2 text-yellow-400/80 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Please don&apos;t close this window while planning.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={() => generatePlan(false)} disabled={loading} className="w-full h-14 bg-cyan-600 hover:bg-cyan-700 text-lg">
              <FileText className="w-5 h-5 mr-2" /> Generate Plan
            </Button>
          )
        ) : (
          // Show loading state when redoing
          (loading && planProgress > 0) ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{planStatus}</span>
                  <span className="text-cyan-400 font-bold text-sm">{planProgress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-500 ease-out relative"
                    style={{ width: `${planProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span className="text-gray-400 text-xs">Regenerating article plan...</span>
                  </div>
                  {timerActive && (
                    <span className="text-2xl font-mono font-bold text-cyan-400">
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center mt-2 gap-2 text-yellow-400/80 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Please don&apos;t close this window while planning.</span>
                </div>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            {/* Plan Complete Header */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-green-400 font-semibold">Plan Generated</p>
                <p className="text-gray-400 text-xs">
                  {state.plan.structure?.sections?.length || 0} sections planned, {state.plan.structure?.faq?.length || 0} FAQs — target {state.isPillar ? '3000-4000' : '1800-2200'} words
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={startEditing}
                  variant="outline"
                  disabled={loading || isEditing}
                  size="sm"
                  className="h-8 text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                >
                  <Edit3 className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button onClick={() => generatePlan(true)} variant="outline" disabled={loading || isEditing} size="sm" className="h-8">
                  <RefreshCw className="w-3 h-3 mr-1" /> Redo
                </Button>
              </div>
            </div>

            {/* Plan Preview / Edit Mode */}
            {isEditing && editedPlan ? (
              // Edit Mode
              <div className="bg-white/5 rounded-lg border border-orange-500/30 p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {/* Edit Title */}
                <div>
                  <p className="text-orange-400 text-xs font-semibold mb-1">Article Title</p>
                  <Input
                    value={editedPlan.title || editedPlan.finalTitle || ''}
                    onChange={(e) => setEditedPlan({ ...editedPlan, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white font-bold"
                    placeholder="Article title..."
                  />
                </div>

                {/* Edit Meta Description */}
                <div>
                  <p className="text-orange-400 text-xs font-semibold mb-1">Meta Description</p>
                  <Textarea
                    value={editedPlan.metaDescription || ''}
                    onChange={(e) => setEditedPlan({ ...editedPlan, metaDescription: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white min-h-[60px]"
                    placeholder="Meta description..."
                  />
                </div>

                {/* Edit Sections */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-orange-400 text-xs font-semibold">Article Structure</p>
                    <Button onClick={addSection} variant="outline" size="sm" className="h-6 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                      <Plus className="w-3 h-3 mr-1" /> Add Section
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {editedPlan.structure?.sections?.map((s: any, i: number) => (
                      <div key={i} className="bg-white/5 p-3 rounded border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-500 text-xs w-6">{i + 1}.</span>
                          <Input
                            value={typeof s === 'string' ? s : s.h2 || ''}
                            onChange={(e) => updateSectionH2(i, e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white text-sm flex-1"
                            placeholder="Section heading (H2)..."
                          />
                          <Button onClick={() => removeSection(i)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {/* H3 Subheadings */}
                        {s.h3s && (
                          <div className="ml-6 space-y-1.5">
                            {s.h3s.map((h3: string, j: number) => (
                              <div key={j} className="flex items-center gap-2">
                                <span className="text-gray-600 text-xs">-</span>
                                <Input
                                  value={h3}
                                  onChange={(e) => updateSectionH3(i, j, e.target.value)}
                                  className="bg-gray-900 border-gray-700 text-gray-300 text-xs flex-1 h-7"
                                  placeholder="Subheading (H3)..."
                                />
                                <Button onClick={() => removeH3FromSection(i, j)} variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10">
                                  <X className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button onClick={() => addH3ToSection(i)} variant="ghost" size="sm" className="ml-6 mt-1 h-6 text-xs text-gray-500 hover:text-gray-300">
                          <Plus className="w-2.5 h-2.5 mr-1" /> Add H3
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit FAQs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-orange-400 text-xs font-semibold">FAQ Questions ({editedPlan.structure?.faq?.length || 0})</p>
                    <Button onClick={addFaq} variant="outline" size="sm" className="h-6 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                      <Plus className="w-3 h-3 mr-1" /> Add FAQ
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editedPlan.structure?.faq?.map((q: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-cyan-500 text-xs">-</span>
                        <Input
                          value={typeof q === 'string' ? q : q.question || ''}
                          onChange={(e) => updateFaq(i, e.target.value)}
                          className="bg-gray-900 border-gray-700 text-gray-300 text-xs flex-1 h-7"
                          placeholder="FAQ question..."
                        />
                        <Button onClick={() => removeFaq(i)} variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10">
                          <X className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Button onClick={cancelEditing} variant="outline" className="flex-1 h-10 border-gray-600 text-gray-400 hover:bg-gray-700">
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button onClick={saveEditedPlan} className="flex-1 h-10 bg-orange-600 hover:bg-orange-700">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              // Read-only Preview
              <>
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-4 max-h-[400px] overflow-y-auto">
                  <div>
                    <p className="text-cyan-400 text-xs font-semibold mb-1">Article Title</p>
                    <p className="text-white font-bold text-lg">{state.plan.title || state.plan.finalTitle}</p>
                  </div>
                  {state.plan.metaDescription && (
                    <div>
                      <p className="text-cyan-400 text-xs font-semibold mb-1">Meta Description</p>
                      <p className="text-gray-300 text-sm">{state.plan.metaDescription}</p>
                    </div>
                  )}

                  {state.plan.structure?.sections && (
                    <div>
                      <p className="text-cyan-400 text-xs font-semibold mb-2">Article Structure</p>
                      <div className="space-y-2">
                        {state.plan.structure.sections.map((s: any, i: number) => (
                          <div key={i} className="bg-white/5 p-2 rounded">
                            <p className="text-white font-medium text-sm">{i + 1}. {s.h2 || s}</p>
                            {s.h3s && s.h3s.length > 0 && (
                              <div className="ml-4 mt-1 space-y-0.5">
                                {s.h3s.slice(0, 3).map((h3: string, j: number) => (
                                  <p key={j} className="text-gray-400 text-xs">- {h3}</p>
                                ))}
                                {s.h3s.length > 3 && <p className="text-gray-500 text-xs">+{s.h3s.length - 3} more</p>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {state.plan.structure?.faq && state.plan.structure.faq.length > 0 && (
                    <div>
                      <p className="text-cyan-400 text-xs font-semibold mb-2">FAQ Questions ({state.plan.structure.faq.length})</p>
                      <ul className="space-y-1">
                        {state.plan.structure.faq.slice(0, 5).map((q: any, i: number) => (
                          <li key={i} className="text-gray-300 text-xs flex items-start gap-2">
                            <span className="text-cyan-500">-</span> {typeof q === 'string' ? q : q.question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Keywords */}
                  {state.plan.keywords && (
                    <div>
                      <p className="text-cyan-400 text-xs font-semibold mb-1.5">Target Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {state.plan.keywords.main && (
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30 font-medium">
                            🎯 {state.plan.keywords.main}
                          </span>
                        )}
                        {(state.plan.keywords.cluster || []).map((kw: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-white/10 text-gray-300 text-[10px] rounded-full border border-white/10">
                            {kw}
                          </span>
                        ))}
                        {(state.plan.keywords.semantic || []).slice(0, 5).map((kw: string, i: number) => (
                          <span key={`s-${i}`} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 text-[10px] rounded-full border border-purple-500/15">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={approvePlan}
                  disabled={state.planApproved}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-70"
                >
                  <Check className="w-4 h-4 mr-2" /> {state.planApproved ? 'Approved!' : 'Approve Plan'}
                </Button>
              </>
            )}
          </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

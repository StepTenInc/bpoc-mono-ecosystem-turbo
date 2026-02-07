'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  Mic, Square, Sparkles, ChevronRight, Brain,
  Wand2, Check, X, AlertTriangle, Edit3, Lightbulb, Plus, Loader2
} from 'lucide-react';
import { StageProps } from '../types';

// Dynamic silo type from API
interface DynamicSilo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  context: string | null;
  icon: string | null;
  color: string | null;
}

interface BriefStageProps extends StageProps {
  ideas: any[];
  setIdeas: (ideas: any[]) => void;
  onSelectIdea: (idea: any) => void;
  setStage: (stage: number) => void;
  siloLocked?: boolean;
}

// Minimal loading spinner with BPOC colors
function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className={`${sizeClasses[size]} border-white/20 border-t-red-500 rounded-full animate-spin`} />
  );
}

// Voice/Type Input Component
function BriefInputOptions({
  onTranscript,
  typedBrief,
  setTypedBrief,
  toast
}: {
  onTranscript: (text: string) => void;
  typedBrief: string;
  setTypedBrief: (text: string) => void;
  toast: StageProps['toast'];
}) {
  const [inputMode, setInputMode] = useState<'choose' | 'record' | 'type'>('choose');
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'transcribing'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    mediaRecorderRef.current = null;
    setSeconds(0);
  };

  const startRecording = async () => {
    setError('');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const selectedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        cleanup();
        if (chunksRef.current.length === 0) { setError('No audio captured'); setStatus('idle'); return; }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 1000) { setError('Recording too short'); setStatus('idle'); return; }
        setStatus('transcribing');
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/admin/insights/pipeline/voice-personality', { method: 'POST', body: formData });
          const json = await res.json();
          const text = json.transcription || json.transcript;
          if (text) { onTranscript(text); toast({ title: 'Transcribed!' }); }
          else { setError(json.error || 'No transcript'); }
        } catch (err: any) { setError(err.message); }
        setStatus('idle');
      };
      recorder.start(500);
      setStatus('recording');
      toast({ title: 'Recording', description: 'Click STOP when done' });
      let count = 0;
      timerRef.current = setInterval(() => { count++; setSeconds(count); }, 1000);
    } catch (err: any) { setError(err.message); cleanup(); }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      try { recorder.requestData(); } catch { }
      recorder.stop();
      setStatus('processing');
    } else { setStatus('idle'); cleanup(); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // CHOOSE MODE - BPOC styled
  if (inputMode === 'choose') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setInputMode('record')}
          className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-all text-left overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Record Your Brief</h3>
              <p className="text-gray-400 text-sm">Speak naturally and we'll transcribe it</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setInputMode('type')}
          className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all text-left overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <Edit3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Type Your Brief</h3>
              <p className="text-gray-400 text-sm">Write out your article idea in text</p>
            </div>
          </div>
        </motion.button>
      </motion.div>
    );
  }

  // RECORD MODE - BPOC styled
  if (inputMode === 'record') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative p-8 rounded-2xl bg-white/5 border border-red-500/20 text-center"
      >
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6 pt-4">
          {status === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mx-auto flex items-center justify-center shadow-lg shadow-red-500/30">
                <Mic className="w-10 h-10 text-white" />
              </div>
              <p className="text-lg font-semibold text-white">Ready to Record</p>
              <Button
                onClick={startRecording}
                size="lg"
                className="w-48 h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border-0 font-semibold shadow-lg shadow-red-500/20"
              >
                <Mic className="w-5 h-5 mr-2" /> Start Recording
              </Button>
              <div>
                <button onClick={() => setInputMode('choose')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  Back to options
                </button>
              </div>
            </motion.div>
          )}

          {status === 'recording' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-20 h-20 rounded-full bg-red-500 mx-auto flex items-center justify-center shadow-lg shadow-red-500/50"
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </motion.div>
              <div>
                <p className="text-lg font-semibold text-white mb-1">Recording...</p>
                <p className="text-3xl font-mono font-bold text-red-400">{formatTime(seconds)}</p>
              </div>
              <Button
                onClick={stopRecording}
                size="lg"
                className="w-48 h-12 bg-red-600 hover:bg-red-700 border-0 font-semibold"
              >
                <Square className="w-5 h-5 mr-2 fill-white" /> Stop
              </Button>
            </motion.div>
          )}

          {(status === 'processing' || status === 'transcribing') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 mx-auto flex items-center justify-center border border-red-500/30">
                <LoadingSpinner size="lg" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white mb-1">
                  {status === 'processing' ? 'Processing audio...' : 'Transcribing with Whisper...'}
                </p>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-red-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // TYPE MODE
  if (inputMode === 'type') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 space-y-5"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20">
            <Edit3 className="w-6 h-6 text-white" />
          </div>
          <p className="text-lg font-semibold text-white">Type Your Brief</p>
          <p className="text-gray-500 text-sm mt-1">Describe the article you want to create</p>
        </div>
        <Textarea
          value={typedBrief}
          onChange={(e) => setTypedBrief(e.target.value)}
          placeholder="e.g., I want to write an article about how BPO workers can negotiate their salary during regularization..."
          className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl resize-none"
        />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setInputMode('choose')}
            className="flex-1 border-white/10 hover:border-white/20 hover:bg-white/5"
          >
            Back
          </Button>
          <Button
            onClick={() => { if (typedBrief.trim()) onTranscript(typedBrief.trim()); }}
            disabled={!typedBrief.trim()}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0"
          >
            <Check className="w-4 h-4 mr-2" /> Use This Brief
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}

export default function BriefStage({
  state,
  updateState,
  loading,
  setLoading,
  toast,
  ideas,
  setIdeas,
  onSelectIdea,
  setStage,
  siloLocked = false
}: BriefStageProps) {
  const [typedBrief, setTypedBrief] = useState('');
  const [aiCorrections, setAiCorrections] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [editedBrief, setEditedBrief] = useState('');
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [aiImproved, setAiImproved] = useState(false);
  const [originalBrief, setOriginalBrief] = useState('');

  // Dynamic silos from database
  const [silos, setSilos] = useState<DynamicSilo[]>([]);
  const [silosLoading, setSilosLoading] = useState(true);

  // Load silos from API on mount
  useEffect(() => {
    const fetchSilos = async () => {
      try {
        const res = await fetch('/api/silos');
        const data = await res.json();
        if (data.silos) {
          setSilos(data.silos);
        }
      } catch (error) {
        console.error('Error loading silos:', error);
        // Fallback to empty array - component will show message
      } finally {
        setSilosLoading(false);
      }
    };
    fetchSilos();
  }, []);

  const fixBrief = async () => {
    setLoading(true);
    setOriginalBrief(state.transcript); // Save original before AI changes
    setAiSuggestions([]); // Clear previous suggestions
    setAiCorrections([]); // Clear previous corrections
    try {
      const res = await fetch('/api/admin/insights/pipeline/fix-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: state.transcript })
      });
      const result = await res.json();

      console.log('AI Improve result:', result);

      if (result.success) {
        // Apply grammar/spelling fixes to the brief
        if (result.cleanedBrief) {
          updateState({ transcript: result.cleanedBrief });
          setAiImproved(true);

          // Show corrections that were applied
          if (result.corrections?.length) {
            setAiCorrections(result.corrections);
          }

          // Show optional suggestions separately
          if (result.suggestions?.length) {
            setAiSuggestions(result.suggestions);
          }

          const correctionCount = result.corrections?.length || 0;
          const suggestionCount = result.suggestions?.length || 0;

          let description = '';
          if (correctionCount > 0 && suggestionCount > 0) {
            description = `${correctionCount} fixes applied, ${suggestionCount} optional suggestions.`;
          } else if (correctionCount > 0) {
            description = `${correctionCount} grammar/spelling fixes applied.`;
          } else if (suggestionCount > 0) {
            description = `No errors found. ${suggestionCount} optional suggestions available.`;
          } else {
            description = 'No errors found. Brief looks good!';
          }

          toast({ title: 'Brief reviewed!', description });
        } else {
          setAiImproved(true);
          toast({ title: 'Brief reviewed', description: 'No changes needed. Click confirm to proceed.' });
        }
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to improve brief', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('AI Improve error:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const revertToOriginal = () => {
    if (originalBrief) {
      updateState({ transcript: originalBrief });
      setAiImproved(false);
      setAiCorrections([]);
      setAiSuggestions([]);
      toast({ title: 'Reverted to original brief' });
    }
  };

  const generateIdeas = async () => {
    setGeneratingProgress(5);
    setGeneratingStatus('Starting...');
    setLoading(true);

    const progressSteps = [
      { progress: 15, status: 'Analyzing your brief...' },
      { progress: 30, status: 'Understanding your topic...' },
      { progress: 45, status: 'AI is thinking...' },
      { progress: 60, status: 'Generating article ideas...' },
      { progress: 75, status: 'Crafting SEO titles...' },
      { progress: 85, status: 'Adding keywords & angles...' },
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setGeneratingProgress(progressSteps[currentStep].progress);
        setGeneratingStatus(progressSteps[currentStep].status);
        currentStep++;
      }
    }, 800);

    try {
      const res = await fetch('/api/admin/insights/pipeline/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceTranscript: state.transcript,
          silo: state.selectedSilo,
          topic: state.customTopic
        })
      });

      clearInterval(progressInterval);
      setGeneratingProgress(95);
      setGeneratingStatus('Packaging ideas...');

      const result = await res.json();

      if (result.success && result.ideas) {
        setGeneratingProgress(100);
        setGeneratingStatus('Done!');
        await new Promise(resolve => setTimeout(resolve, 400));
        setIdeas(result.ideas);
        toast({ title: 'Ideas ready!', description: `${result.ideas.length} ideas generated` });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to generate ideas', variant: 'destructive' });
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setGeneratingProgress(0);
      setGeneratingStatus('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Brief Input */}
      <AnimatePresence mode="wait">
        {!state.transcript && (
          <motion.div
            key="input"
            exit={{ opacity: 0, y: -20 }}
          >
            <BriefInputOptions
              onTranscript={(text) => updateState({ transcript: text, briefConfirmed: false })}
              typedBrief={typedBrief}
              setTypedBrief={setTypedBrief}
              toast={toast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brief Review */}
      <AnimatePresence>
        {state.transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border transition-colors ${
              state.briefConfirmed
                ? 'bg-green-500/5 border-green-500/20'
                : aiImproved
                  ? 'bg-cyan-500/5 border-cyan-500/20'
                  : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {state.briefConfirmed ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-sm font-medium text-green-400">Brief Confirmed</p>
                  </>
                ) : aiImproved ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-sm font-medium text-cyan-400">AI Improved</p>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">Review Your Brief</p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {/* Revert button - only show if AI improved and not confirmed */}
                {aiImproved && !state.briefConfirmed && originalBrief && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={revertToOriginal}
                    className="h-8 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" /> Revert
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setIsEditingBrief(true); setEditedBrief(state.transcript); }}
                  className="h-8 text-gray-400 hover:text-white"
                >
                  <Edit3 className="w-4 h-4 mr-1" /> Edit
                </Button>
                {!state.briefConfirmed && !aiImproved && (
                  <Button
                    size="sm"
                    onClick={fixBrief}
                    disabled={loading}
                    className="h-8 bg-red-500/20 text-red-300 hover:bg-red-500/30 border-0"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <><Wand2 className="w-4 h-4 mr-1" /> AI Improve</>}
                  </Button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isEditingBrief ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <Textarea
                    value={editedBrief}
                    onChange={(e) => setEditedBrief(e.target.value)}
                    className="min-h-[100px] bg-white/5 border-white/10 text-white rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateState({ transcript: editedBrief, briefConfirmed: false });
                        setIsEditingBrief(false);
                        setAiImproved(false); // Reset AI improved state on manual edit
                        setOriginalBrief(''); // Clear original since user manually edited
                        setAiCorrections([]); // Clear corrections
                        setAiSuggestions([]); // Clear suggestions
                      }}
                      className="bg-green-600 hover:bg-green-700 border-0"
                    >
                      <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingBrief(false)} className="border-white/10">
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-300 leading-relaxed"
                >
                  {state.transcript}
                </motion.p>
              )}
            </AnimatePresence>

            {/* AI Corrections - Show what was fixed (informational) */}
            <AnimatePresence>
              {aiCorrections.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-green-400 text-sm font-medium flex items-center gap-1">
                      <Check className="w-4 h-4" /> Grammar/Spelling Fixes Applied:
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAiCorrections([])}
                      className="h-6 text-xs text-gray-500 hover:text-white"
                    >
                      Dismiss
                    </Button>
                  </div>
                  {aiCorrections.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-green-500/5 border border-green-500/10 rounded-xl p-3"
                    >
                      <div className="text-sm">
                        <span className="text-red-400/70 line-through">{c.original}</span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="text-green-400">{c.suggested}</span>
                      </div>
                      {c.explanation && (
                        <p className="text-xs text-gray-500 mt-1">{c.explanation}</p>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Suggestions - Optional enhancements */}
            <AnimatePresence>
              {aiSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10 space-y-2"
                >
                  <p className="text-cyan-400 text-sm font-medium flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" /> Optional Suggestions:
                  </p>
                  {aiSuggestions.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{s.title}</p>
                          <p className="text-gray-400 text-sm mt-1">{s.description}</p>
                          {s.example && (
                            <p className="text-cyan-400/70 text-xs mt-2 italic">"{s.example}"</p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Add suggestion to the brief
                              const newBrief = state.transcript + ' ' + (s.example || s.description);
                              updateState({ transcript: newBrief });
                              setAiSuggestions(prev => prev.filter((_, idx) => idx !== i));
                              toast({ title: 'Suggestion added!' });
                            }}
                            className="h-7 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAiSuggestions(prev => prev.filter((_, idx) => idx !== i))}
                            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-300 hover:bg-white/5"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm Button - Always separate, shown when not confirmed */}
            {!state.briefConfirmed && !isEditingBrief && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <Button
                  onClick={() => updateState({ briefConfirmed: true })}
                  className="w-full bg-green-600 hover:bg-green-700 border-0"
                >
                  <Check className="w-4 h-4 mr-2" /> Confirm Brief
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Silo Selection */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-white">Select Content Silo</h3>
          {siloLocked && state.selectedSilo && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">
              LOCKED
            </span>
          )}
        </div>
        {silosLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
            <span className="text-gray-400">Loading silos...</span>
          </div>
        ) : silos.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white/5 rounded-xl border border-white/10">
            <p>No content silos available.</p>
            <p className="text-sm mt-1">Create silos in the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {silos.map((silo, index) => {
              const isSelected = state.selectedSilo === silo.slug;
              const isDisabled = siloLocked && !isSelected;

              return (
                <motion.button
                  key={silo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={!siloLocked ? { scale: 1.02 } : {}}
                  whileTap={!siloLocked ? { scale: 0.98 } : {}}
                  onClick={() => !siloLocked && updateState({ selectedSilo: silo.slug, selectedSiloId: silo.id })}
                  disabled={isDisabled}
                  className={`p-4 rounded-xl text-left transition-all ${
                    isSelected
                      ? siloLocked
                        ? 'bg-cyan-500/10 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-red-500/10 border-2 border-red-500/50 shadow-lg shadow-red-500/10'
                      : isDisabled
                        ? 'bg-white/5 border-2 border-transparent opacity-40 cursor-not-allowed'
                        : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                  }`}
                  style={{
                    borderColor: isSelected
                      ? siloLocked
                        ? '#06b6d480'
                        : (silo.color || '#EF4444') + '80'
                      : undefined,
                    backgroundColor: isSelected
                      ? siloLocked
                        ? '#06b6d410'
                        : (silo.color || '#EF4444') + '10'
                      : undefined,
                  }}
                >
                  <p
                    className={`font-medium text-sm ${isSelected ? '' : isDisabled ? 'text-gray-500' : 'text-white'}`}
                    style={{ color: isSelected ? (siloLocked ? '#06b6d4' : silo.color || '#EF4444') : undefined }}
                  >
                    {silo.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{silo.description || `/${silo.slug}`}</p>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Pillar Post Checkbox - Only show when silo is selected */}
        <AnimatePresence>
          {state.selectedSilo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  state.isPillar
                    ? 'bg-purple-500/10 border-purple-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
                onClick={() => updateState({ isPillar: !state.isPillar })}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    state.isPillar
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-gray-500'
                  }`}>
                    {state.isPillar && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${state.isPillar ? 'text-purple-400' : 'text-white'}`}>
                        This is the Pillar Post for this Silo
                      </p>
                      {state.isPillar && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500 text-white rounded">
                          PILLAR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pillar posts are the main long-form content that appears at the top of the silo page.
                      Each silo should have ONE pillar post that covers the topic comprehensively.
                    </p>
                    {state.isPillar && (
                      <p className="text-xs text-purple-400 mt-2">
                        This article will become the main content for the "{silos.find(s => s.slug === state.selectedSilo)?.name}" silo page.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Custom Topic */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Input
          value={state.customTopic}
          onChange={e => updateState({ customTopic: e.target.value })}
          placeholder="Or type a custom topic..."
          className="bg-white/5 border-white/10 h-12 text-white placeholder:text-gray-500 rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
        />
      </motion.div>

      {/* Generate Ideas Progress/Button */}
      <AnimatePresence mode="wait">
        {(loading && generatingProgress > 0) || generatingStatus ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl bg-white/5 border border-red-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">{generatingStatus}</span>
              <span className="text-red-400 font-mono font-bold">{generatingProgress}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${generatingProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-center mt-4 gap-2">
              <Brain className="w-5 h-5 text-red-400" />
              <span className="text-gray-500 text-sm">GPT-4 is generating ideas based on your brief...</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button
              onClick={generateIdeas}
              disabled={loading || (!state.briefConfirmed && !state.customTopic && !state.selectedSilo)}
              className="w-full h-14 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border-0 text-lg font-semibold shadow-lg shadow-red-500/20"
            >
              <Sparkles className="w-5 h-5 mr-2" /> Generate Ideas
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ideas List */}
      <AnimatePresence>
        {ideas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Select an Idea</h3>
            <div className="space-y-3">
              {ideas.map((idea, i) => {
                const isSelected = state.selectedIdea?.title === idea.title;
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => updateState({ selectedIdea: idea })}
                    disabled={loading}
                    className={`w-full p-5 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-green-500/10 border-2 border-green-500/50 shadow-lg shadow-green-500/10'
                        : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isSelected ? 'text-green-400' : 'text-white'}`}>
                          {idea.title}
                        </h4>
                        <p className="text-gray-500 text-sm mt-1">{idea.description}</p>
                        {isSelected && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-green-400 text-xs mt-3 font-medium flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Selected - Click "Next" to proceed
                          </motion.p>
                        )}
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-green-500/20' : 'bg-white/5'
                      }`}>
                        {isSelected ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Brain,
  Target,
  Lightbulb,
  PenLine,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/ui/toast';

/**
 * From Scratch Analysis Page
 * Different from the upload analysis - this HELPS BUILD rather than CRITIQUES
 * Shows what the AI found in their text and suggests what to add
 */
export default function FromScratchAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enhancementComplete, setEnhancementComplete] = useState(false);

  // Load generated resume data from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get the generated resume from localStorage
        const stored = localStorage.getItem('bpoc_generated_resume');
        const storedAnalysis = localStorage.getItem('bpoc_ai_analysis');
        
        if (stored) {
          const parsed = JSON.parse(stored);
          setResumeData(parsed);
          
          if (storedAnalysis) {
            setAnalysis(JSON.parse(storedAnalysis));
          }
          
          setIsLoading(false);
          return;
        }

        // No data found - redirect back to create
        setError('No resume data found. Please go back and enter your information.');
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load resume data. Please try again.');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate what's complete and what's missing
  const getCompletionStatus = () => {
    if (!resumeData) return { complete: [], missing: [], score: 0 };
    
    const complete: string[] = [];
    const missing: string[] = [];
    
    // Check each section
    if (resumeData.name && resumeData.name !== 'Your Name') {
      complete.push('Name');
    } else {
      missing.push('Full Name');
    }
    
    if (resumeData.email) complete.push('Email');
    else missing.push('Email Address');
    
    if (resumeData.phone && resumeData.phone !== 'Add phone') {
      complete.push('Phone');
    } else {
      missing.push('Phone Number');
    }
    
    if (resumeData.location && resumeData.location !== 'Add location') {
      complete.push('Location');
    } else {
      missing.push('Location');
    }
    
    if (resumeData.bestJobTitle && resumeData.bestJobTitle !== 'Professional' && resumeData.bestJobTitle !== 'Your Title') {
      complete.push('Job Title');
    } else {
      missing.push('Target Job Title');
    }
    
    if (resumeData.summary && resumeData.summary.length > 30) {
      complete.push('Summary');
    } else {
      missing.push('Professional Summary');
    }
    
    if (resumeData.experience?.length > 0) {
      complete.push(`${resumeData.experience.length} Work Experience(s)`);
    } else {
      missing.push('Work Experience');
    }
    
    if (resumeData.education?.length > 0) {
      complete.push(`${resumeData.education.length} Education Entry`);
    } else {
      missing.push('Education');
    }
    
    if (resumeData.skills?.technical?.length > 0 || resumeData.skills?.soft?.length > 0) {
      const skillCount = (resumeData.skills?.technical?.length || 0) + (resumeData.skills?.soft?.length || 0);
      complete.push(`${skillCount} Skills`);
    } else {
      missing.push('Skills');
    }
    
    const totalItems = complete.length + missing.length;
    const score = Math.round((complete.length / totalItems) * 100);
    
    return { complete, missing, score };
  };

  const status = getCompletionStatus();

  const handleEnhanceResume = async () => {
    if (!resumeData) return;
    
    setIsEnhancing(true);
    setProgress(0);
    setError(null);
    
    try {
      const sessionToken = await getSessionToken();
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 12;
        });
      }, 300);
      
      // Call AI analysis API to enhance the resume
      console.log('🤖 Calling AI to enhance from-scratch resume...');
      const response = await fetch('/api/candidates/ai-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
          ...(user?.id ? { 'x-user-id': String(user.id) } : {})
        },
        body: JSON.stringify({
          resumeData: resumeData,
          candidateId: user?.id,
          source: 'from-scratch'
        })
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI enhancement failed');
      }
      
      const result = await response.json();
      console.log('✅ Enhancement result:', result);
      
      setProgress(100);
      setAnalysis(result.analysis);
      
      // Store enhanced resume for build step
      if (result.improvedResume) {
        localStorage.setItem('bpoc_generated_resume', JSON.stringify(result.improvedResume));
        setResumeData(result.improvedResume);
      }
      
      // Store AI analysis for build page
      if (result.analysis) {
        localStorage.setItem('bpoc_ai_analysis', JSON.stringify(result.analysis));
      }
      
      setEnhancementComplete(true);
      toast.success('AI enhancement complete!');
      
    } catch (err) {
      console.error('Enhancement error:', err);
      setError(err instanceof Error ? err.message : 'Enhancement failed');
      setIsEnhancing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
        <p className="mt-4 text-gray-400">Loading your resume data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            AI Resume Assistant
          </h1>
          <p className="text-gray-400 mt-1">
            Let's build your perfect resume together
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/resume/create')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-purple-400">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <span className="font-medium">Input</span>
        </div>
        <div className="w-16 h-0.5 bg-purple-500" />
        <div className="flex items-center gap-2 text-cyan-400">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 bg-cyan-500/20 flex items-center justify-center animate-pulse">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-medium">AI Review</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-700" />
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center">
            <span className="text-sm">3</span>
          </div>
          <span>Build</span>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {enhancementComplete ? (
          /* Enhancement Complete - Show Results */
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Resume Enhanced! 🎉</h2>
              <p className="text-gray-400">AI has improved your resume content</p>
            </div>

            {/* What AI Found & Improved */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* AI Improvements */}
              <div className="relative overflow-hidden rounded-xl border border-green-500/20 bg-green-500/5 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-400" />
                  What AI Improved
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Enhanced your professional summary</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Optimized job descriptions with action verbs</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Added relevant industry keywords</span>
                  </div>
                </div>
              </div>

              {/* Suggestions for Builder */}
              <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  In the Builder, Add
                </h3>
                <div className="space-y-3">
                  {status.missing.slice(0, 4).map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10"
                    >
                      <Target className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{item}</span>
                    </motion.div>
                  ))}
                  {status.missing.length > 4 && (
                    <p className="text-gray-500 text-sm pl-8">+{status.missing.length - 4} more items</p>
                  )}
                </div>
              </div>
            </div>

            {/* Score & Summary */}
            {analysis && (
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 backdrop-blur-xl p-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore || status.score)}`}>
                      {analysis.overallScore || status.score}
                    </div>
                    <p className="text-gray-400 text-sm">Starting Score</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-cyan-400" />
                      AI Says:
                    </h3>
                    <p className="text-gray-300">
                      {analysis.improvedSummary?.slice(0, 200) || 
                       `Great start! You have ${status.complete.length} sections filled out. The AI Resume Builder will help you complete and polish the rest.`}
                      {analysis.improvedSummary?.length > 200 ? '...' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Continue to Build */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center pt-6"
            >
              <Button
                onClick={() => {
                  // Mark this as "from scratch" path so builder knows how to help
                  localStorage.setItem('bpoc_resume_source', 'from_scratch');
                  router.push('/resume/build');
                }}
                className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
              >
                <PenLine className="h-5 w-5 mr-2" />
                Open Resume Builder
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        ) : isEnhancing ? (
          /* Enhancing State */
          <motion.div
            key="enhancing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-12"
          >
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">AI is Enhancing Your Resume...</h2>
              <p className="text-gray-400 mb-8">
                Adding professional language, optimizing for job searches, and filling gaps
              </p>
              
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-purple-400 font-bold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-gray-800" />
              </div>
              
              <div className="mt-6 grid grid-cols-3 gap-3">
                {['Summary', 'Experience', 'Keywords'].map((step, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg border transition-all ${
                      progress > (i * 33) 
                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                        : 'border-white/10 bg-white/5 text-gray-500'
                    }`}
                  >
                    <p className="text-xs">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Initial Review State */
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* What We Found */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                  <FileText className="h-10 w-10 text-purple-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Here's What We Found</h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Based on what you told us, AI has created your initial resume. 
                  Let's enhance it before you start editing!
                </p>
              </div>

              {/* Completion Score */}
              <div className="flex justify-center mb-8">
                <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <span className="text-gray-400">Completion:</span>
                  <span className={`text-2xl font-bold ${getScoreColor(status.score)}`}>
                    {status.score}%
                  </span>
                </div>
              </div>

              {/* Two Columns: Complete vs Missing */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* What's Complete */}
                <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/20">
                  <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Sections Found ({status.complete.length})
                  </h3>
                  <div className="space-y-2">
                    {status.complete.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* What's Missing */}
                <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    To Add in Builder ({status.missing.length})
                  </h3>
                  <div className="space-y-2">
                    {status.missing.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                        <Target className="h-4 w-4 text-amber-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Resume Preview Snippet */}
            {resumeData && (
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  Resume Preview
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {resumeData.name && (
                    <div>
                      <span className="text-gray-500">Name:</span>{' '}
                      <span className="text-white">{resumeData.name}</span>
                    </div>
                  )}
                  {resumeData.bestJobTitle && (
                    <div>
                      <span className="text-gray-500">Title:</span>{' '}
                      <span className="text-white">{resumeData.bestJobTitle}</span>
                    </div>
                  )}
                  {resumeData.experience?.length > 0 && (
                    <div>
                      <span className="text-gray-500">Experience:</span>{' '}
                      <span className="text-white">{resumeData.experience[0]?.title} at {resumeData.experience[0]?.company}</span>
                    </div>
                  )}
                  {(resumeData.skills?.technical?.length > 0 || resumeData.skills?.soft?.length > 0) && (
                    <div>
                      <span className="text-gray-500">Skills:</span>{' '}
                      <span className="text-white">
                        {[...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])].slice(0, 4).join(', ')}
                        {([...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])].length > 4) && '...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={handleEnhanceResume}
                className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Enhance with AI
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button
                onClick={() => {
                  // Mark this as "from scratch" path
                  localStorage.setItem('bpoc_resume_source', 'from_scratch');
                  router.push('/resume/build');
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
              >
                Skip to Builder
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center"
        >
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <Button
            onClick={() => router.push('/resume/create')}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back to Create
          </Button>
        </motion.div>
      )}
    </div>
  );
}

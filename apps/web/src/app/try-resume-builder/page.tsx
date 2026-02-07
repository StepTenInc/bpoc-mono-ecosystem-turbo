'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/layout/Header';
import Footer from '@/components/shared/layout/Footer';
import { Button } from '@/components/shared/ui/button';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Star,
  Zap,
  Target,
  TrendingUp,
  X,
  Loader2,
  Briefcase,
  Brain,
  LineChart,
  Palette,
  Users,
  Award,
  ChevronRight,
  Shield,
  Clock,
  Trophy
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  initPageTracking,
  trackAnonEvent,
  trackCTAClick,
  trackSignupModal,
  getAnonSessionId
} from '@/lib/analytics/anonymous-tracking';

interface AnalysisResult {
  // Overall score
  score: number; // Keep for backward compatibility
  overallScore?: number;
  
  // Breakdown scores
  scores?: {
    ats: number;
    content: number;
    format: number;
    skills: number;
  };
  
  // Score reasoning
  scoreReasons?: {
    ats: string;
    content: string;
    format: string;
    skills: string;
  };
  
  // Ranking
  ranking?: {
    position: number;
    total: number;
    percentile: number;
  };
  
  // Quick wins
  quickWins?: Array<{
    improvement: string;
    keywords?: string[];
    points: number;
    explanation: string;
  }>;
  
  // Existing fields
  grade: string;
  summary: string;
  highlights: string[];
  improvements: string[];
  extractedName: string | null;
  extractedEmail: string | null;
  extractedTitle: string | null;
  skillsFound: string[];
  experienceYears: number | null;
}

interface PlatformStats {
  resumesAnalyzed: number;
  candidatesHired: number;
  totalCandidates: number;
  avgDaysToInterview: number;
  avgSalaryIncrease: number;
}

export default function TryResumeBuilder() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    resumesAnalyzed: 0,
    candidatesHired: 0,
    totalCandidates: 0,
    avgDaysToInterview: 7,
    avgSalaryIncrease: 8000
  });

  const handleSignUp = () => {
    // Track CTA click
    trackCTAClick('Sign Up Free', 'Resume Analyzer Results');
    trackSignupModal('open');

    // Trigger the Header's signup modal directly
    window.dispatchEvent(new Event('openSignupModal'));
  };
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anonSessionId, setAnonSessionId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize anonymous session and analytics tracking
  useEffect(() => {
    // Get or create anonymous session ID
    const sessionId = getAnonSessionId();
    setAnonSessionId(sessionId);

    // Initialize page tracking
    const cleanup = initPageTracking('Free Resume Analyzer');

    return cleanup;
  }, []);

  // Fetch real platform stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/marketing/stats');
        const data = await response.json();
        if (data.stats) {
          setPlatformStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
        // Keep default stats on error
      }
    };

    fetchStats();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    setResult(null);

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    const isValidType = validTypes.some(t => selectedFile.type.includes(t.split('/')[1])) ||
                        selectedFile.name.endsWith('.pdf') ||
                        selectedFile.name.endsWith('.doc') ||
                        selectedFile.name.endsWith('.docx');

    if (!isValidType) {
      setError('Please upload a PDF, DOC, DOCX, or image file');
      trackAnonEvent('resume_upload_start', {
        success: false,
        error: 'Invalid file type',
        file_type: selectedFile.type
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB.');
      trackAnonEvent('resume_upload_start', {
        success: false,
        error: 'File too large',
        file_size: selectedFile.size
      });
      return;
    }

    setFile(selectedFile);

    // Track successful file upload
    trackAnonEvent('resume_upload_complete', {
      success: true,
      file_type: selectedFile.type,
      file_size: selectedFile.size,
      file_name: selectedFile.name
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const analyzeResume = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    // Track analysis start
    trackAnonEvent('resume_upload_start', {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size
    });

    // Progress simulation
    const progressSteps = [
      { pct: 10, text: '📤 Uploading resume...' },
      { pct: 30, text: '🔄 Converting document...' },
      { pct: 50, text: '🔍 Extracting content...' },
      { pct: 70, text: '🤖 AI analyzing resume...' },
      { pct: 90, text: '📊 Generating report...' },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setProgress(progressSteps[stepIndex].pct);
        setProgressText(progressSteps[stepIndex].text);
        stepIndex++;
      }
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('anon_session_id', anonSessionId);

      const response = await fetch('/api/marketing/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        let errorMessage = 'Analysis failed';
        const responseText = await response.text();

        // Try to parse as JSON first
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response is not JSON - check for common errors
          if (responseText.toLowerCase().includes('forbidden') || response.status === 403) {
            errorMessage = 'Service temporarily unavailable. Please try uploading an image (JPG/PNG) instead of PDF.';
          } else if (response.status === 413) {
            errorMessage = 'File too large. Please upload a smaller file (under 10MB).';
          } else {
            errorMessage = `Server error (${response.status}). Please try again.`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setProgress(100);
      setProgressText('✅ Analysis complete!');

      // Track successful analysis
      trackAnonEvent('resume_analysis_complete', {
        success: true,
        score: data.analysis.score,
        grade: data.analysis.grade,
        extracted_name: data.analysis.extractedName,
        skills_count: data.analysis.skillsFound?.length || 0,
        experience_years: data.analysis.experienceYears
      });

      setTimeout(() => {
        setResult(data.analysis);
        setIsAnalyzing(false);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setIsAnalyzing(false);

      // Track analysis error
      trackAnonEvent('resume_analysis_complete', {
        success: false,
        error: errorMessage
      });
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressText('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'from-green-500 to-emerald-500';
    if (grade === 'B') return 'from-cyan-500 to-blue-500';
    if (grade === 'C') return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-white overflow-x-hidden">
      {/* Enhanced Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse-slow delay-1000" />
        <div className="absolute top-[40%] left-[50%] w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[120px] animate-pulse-slow delay-2000" />

        {/* Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Hero Section - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-sm font-bold uppercase tracking-wide">Free AI Resume Analysis</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Get Your{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-200">
                Resume Score
              </span>
              <br />
              in 60 Seconds
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Our AI analyzes your resume and gives you instant, actionable feedback.
              <span className="text-cyan-400 font-semibold"> No signup required.</span>
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>60 Second Analysis</span>
              </div>
            </div>
          </motion.div>

          {/* Main Card - Enhanced Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl blur-2xl opacity-50" />

            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <AnimatePresence mode="wait">

                {/* ===== UPLOAD STATE ===== */}
                {!result && !isAnalyzing && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-10 md:p-12"
                  >
                    {/* Drop Zone - Enhanced */}
                    <div
                      className={`relative border-2 border-dashed rounded-2xl p-16 transition-all duration-300 cursor-pointer group ${
                        dragActive
                          ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_30px_rgba(0,217,255,0.2)]'
                          : file
                            ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                            : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/5 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <div className="text-center">
                        {file ? (
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                          >
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                              <FileText className="w-10 h-10 text-white" />
                            </div>
                            <p className="text-white font-bold text-lg mb-2">{file.name}</p>
                            <p className="text-gray-400 text-sm mb-4">{(file.size / 1024).toFixed(1)} KB</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); setFile(null); }}
                              className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mx-auto px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
                            >
                              <X className="w-4 h-4" /> Remove File
                            </button>
                          </motion.div>
                        ) : (
                          <>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:border group-hover:border-cyan-500/30 transition-all"
                            >
                              <Upload className="w-10 h-10 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                            </motion.div>
                            <p className="text-white font-bold text-xl mb-2">Drop your resume here</p>
                            <p className="text-gray-400 text-base mb-4">or click to browse your files</p>
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-500 text-sm">
                              <span>Supported:</span>
                              <span className="text-cyan-400 font-medium">PDF, DOC, DOCX, JPG, PNG</span>
                              <span>•</span>
                              <span className="text-purple-400 font-medium">Max 10MB</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Error Message - Enhanced */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 backdrop-blur-sm"
                      >
                        <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                        <p className="text-red-300 font-medium">{error}</p>
                      </motion.div>
                    )}

                    {/* Analyze Button - Enhanced */}
                    <motion.div
                      whileHover={{ scale: file ? 1.02 : 1 }}
                      whileTap={{ scale: file ? 0.98 : 1 }}
                    >
                      <Button
                        onClick={analyzeResume}
                        disabled={!file}
                        className="w-full mt-8 h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed border-0 shadow-[0_0_30px_rgba(0,217,255,0.3)] hover:shadow-[0_0_50px_rgba(0,217,255,0.5)] transition-all duration-300"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Analyze My Resume with AI
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {/* ===== ANALYZING STATE ===== */}
                {isAnalyzing && (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-16 text-center"
                  >
                    {/* Circular Progress - Enhanced */}
                    <div className="w-32 h-32 mx-auto mb-8 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-3xl font-black text-white">{progress}</span>
                          <span className="text-cyan-400 text-xl font-bold">%</span>
                        </div>
                      </div>
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
                    </div>

                    <motion.p
                      key={progressText}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-white text-xl font-semibold mb-3"
                    >
                      {progressText}
                    </motion.p>
                    <p className="text-gray-400">This usually takes 30-60 seconds...</p>
                  </motion.div>
                )}

                {/* ===== RESULTS STATE ===== */}
                {result && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-10 md:p-12"
                  >
                    {/* Score Display - NEW CIRCULAR GAUGE */}
                    <div className="text-center mb-12">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.8 }}
                        className="relative inline-block mb-8"
                      >
                        {/* SVG Circular Progress */}
                        <svg className="w-48 h-48 transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="none"
                            stroke="rgba(55, 65, 81, 0.2)"
                            strokeWidth="12"
                          />
                          <motion.circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="none"
                            stroke="url(#scoreGradient)"
                            strokeWidth="12"
                            strokeDasharray={`${((result.overallScore || result.score) / 100) * 553} 553`}
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0 553" }}
                            animate={{ strokeDasharray: `${((result.overallScore || result.score) / 100) * 553} 553` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                          />
                          <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Score number in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-7xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                          >
                            {result.overallScore || result.score}
                          </motion.span>
                          <span className="text-gray-400 text-lg mt-1">/ 100</span>
                        </div>
                      </motion.div>
                      
                      {/* Ranking badge */}
                      {result.ranking && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 mb-6"
                        >
                          <Trophy className="w-5 h-5 text-cyan-400" />
                          <span className="text-white font-bold">
                            You rank #{result.ranking.position.toLocaleString()}
                          </span>
                          <span className="text-gray-400">
                            out of {result.ranking.total.toLocaleString()} resumes
                          </span>
                        </motion.div>
                      )}
                      
                      {result.ranking && (
                        <p className="text-gray-400 text-sm mb-6">
                          Better than {100 - result.ranking.percentile}% of candidates!
                        </p>
                      )}

                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="text-3xl md:text-4xl font-black text-white mb-4"
                      >
                        {result.grade === 'A' && '🌟 Excellent Resume!'}
                        {result.grade === 'B' && '👍 Good Resume'}
                        {result.grade === 'C' && '📝 Needs Improvement'}
                        {(result.grade === 'D' || result.grade === 'F') && '⚠️ Needs Work'}
                      </motion.h2>
                      <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">{result.summary}</p>
                    </div>

                    {/* Extracted Info - Enhanced */}
                    {(result.extractedName || result.extractedTitle) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-10"
                      >
                        <p className="text-white font-bold text-xl">
                          {result.extractedName || 'Candidate'}
                          {result.extractedTitle && <span className="text-gray-400"> • {result.extractedTitle}</span>}
                        </p>
                        {result.experienceYears && (
                          <p className="text-gray-400 text-sm mt-1">{result.experienceYears}+ years experience</p>
                        )}
                      </motion.div>
                    )}

                    {/* Highlights & Improvements - Enhanced Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 backdrop-blur-sm"
                      >
                        <h3 className="text-green-400 font-black text-lg mb-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          Strengths
                        </h3>
                        <ul className="space-y-3">
                          {result.highlights.slice(0, 3).map((item, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + i * 0.1 }}
                              className="text-gray-300 flex items-start gap-3"
                            >
                              <Star className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm"
                      >
                        <h3 className="text-yellow-400 font-black text-lg mb-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Target className="w-6 h-6" />
                          </div>
                          Improvements
                        </h3>
                        <ul className="space-y-3">
                          {result.improvements.slice(0, 3).map((item, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + i * 0.1 }}
                              className="text-gray-300 flex items-start gap-3"
                            >
                              <TrendingUp className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    </div>

                    {/* Skills - Enhanced */}
                    {result.skillsFound.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mb-12"
                      >
                        <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
                          <Zap className="w-6 h-6 text-purple-400" />
                          Skills Detected
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {result.skillsFound.slice(0, 12).map((skill, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.9 + i * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-200 font-medium hover:border-purple-400/40 hover:bg-purple-500/10 transition-all"
                            >
                              {skill}
                            </motion.span>
                          ))}
                          {result.skillsFound.length > 12 && (
                            <span className="px-4 py-2 rounded-xl bg-white/5 text-gray-500 font-medium">
                              +{result.skillsFound.length - 12} more
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* 4 SCORE BREAKDOWN */}
                    {result.scores && (
                      <div className="mb-12">
                        <h3 className="text-2xl font-black text-white mb-6">Score Breakdown</h3>
                        <div className="grid md:grid-cols-2 gap-5">
                          {/* ATS Score */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.0 }}
                            whileHover={{ y: -4 }}
                            className="bg-gradient-to-br from-gray-900/90 to-black rounded-2xl p-6 border-2 border-gray-800/50 hover:border-cyan-500/70 transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                                  <CheckCircle className="w-6 h-6 text-cyan-400" />
                                </div>
                                <span className="text-white font-bold text-lg">ATS Compatibility</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-4xl font-black ${result.scores.ats >= 80 ? 'text-green-400' : result.scores.ats >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {result.scores.ats}
                                </span>
                                <span className="text-gray-500 text-xl">/100</span>
                              </div>
                            </div>
                            {result.scoreReasons && (
                              <p className="text-gray-400 text-sm leading-relaxed">{result.scoreReasons.ats}</p>
                            )}
                          </motion.div>

                          {/* Content Score */}
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 }}
                            whileHover={{ y: -4 }}
                            className="bg-gradient-to-br from-gray-900/90 to-black rounded-2xl p-6 border-2 border-gray-800/50 hover:border-purple-500/70 transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                  <Brain className="w-6 h-6 text-purple-400" />
                                </div>
                                <span className="text-white font-bold text-lg">Content Quality</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-4xl font-black ${result.scores.content >= 80 ? 'text-green-400' : result.scores.content >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {result.scores.content}
                                </span>
                                <span className="text-gray-500 text-xl">/100</span>
                              </div>
                            </div>
                            {result.scoreReasons && (
                              <p className="text-gray-400 text-sm leading-relaxed">{result.scoreReasons.content}</p>
                            )}
                          </motion.div>

                          {/* Format Score */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 }}
                            whileHover={{ y: -4 }}
                            className="bg-gradient-to-br from-gray-900/90 to-black rounded-2xl p-6 border-2 border-gray-800/50 hover:border-green-500/70 transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                  <Palette className="w-6 h-6 text-green-400" />
                                </div>
                                <span className="text-white font-bold text-lg">Formatting</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-4xl font-black ${result.scores.format >= 80 ? 'text-green-400' : result.scores.format >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {result.scores.format}
                                </span>
                                <span className="text-gray-500 text-xl">/100</span>
                              </div>
                            </div>
                            {result.scoreReasons && (
                              <p className="text-gray-400 text-sm leading-relaxed">{result.scoreReasons.format}</p>
                            )}
                          </motion.div>

                          {/* Skills Score */}
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.3 }}
                            whileHover={{ y: -4 }}
                            className="bg-gradient-to-br from-gray-900/90 to-black rounded-2xl p-6 border-2 border-gray-800/50 hover:border-orange-500/70 transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                                  <Zap className="w-6 h-6 text-orange-400" />
                                </div>
                                <span className="text-white font-bold text-lg">Skills Match</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-4xl font-black ${result.scores.skills >= 80 ? 'text-green-400' : result.scores.skills >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {result.scores.skills}
                                </span>
                                <span className="text-gray-500 text-xl">/100</span>
                              </div>
                            </div>
                            {result.scoreReasons && (
                              <p className="text-gray-400 text-sm leading-relaxed">{result.scoreReasons.skills}</p>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    )}

                    {/* QUICK WINS SECTION */}
                    {result.quickWins && result.quickWins.length > 0 && (
                      <div className="mb-12">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.4 }}
                        >
                          <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                            <Target className="w-7 h-7 text-yellow-400" />
                            Quick Wins to Boost Your Score
                          </h3>
                          <p className="text-gray-400 mb-6">Make these easy improvements to rank higher:</p>
                        </motion.div>
                        
                        <div className="space-y-4">
                          {result.quickWins.map((win, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.5 + i * 0.1 }}
                              whileHover={{ x: 4 }}
                              className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-400/50 transition-all"
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <h4 className="text-white font-bold text-lg flex-1">{win.improvement}</h4>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex-shrink-0">
                                  <TrendingUp className="w-5 h-5 text-black" />
                                  <span className="text-black font-black text-xl">+{win.points}</span>
                                </div>
                              </div>
                              <p className="text-gray-400 text-sm leading-relaxed mb-3">{win.explanation}</p>
                              {win.keywords && win.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-gray-500 text-xs font-medium">Keywords to add:</span>
                                  {win.keywords.map((keyword, ki) => (
                                    <span key={ki} className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs font-semibold border border-yellow-500/30">
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* LOCKED INSIGHTS TEASER */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.7 }}
                      className="mb-12"
                    >
                      <div className="relative bg-gradient-to-br from-gray-900/90 to-black border-2 border-cyan-500/30 rounded-3xl p-10 overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-transparent" />
                        
                        <div className="relative z-10">
                          <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
                              <Shield className="w-5 h-5 text-cyan-400" />
                              <span className="text-cyan-400 font-bold text-sm uppercase tracking-wide">Premium Features</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                              Unlock Full Career Intelligence
                            </h3>
                            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                              Sign up free to access detailed insights, AI recommendations, and exclusive tools
                            </p>
                          </div>
                          
                          {/* Blurred preview content */}
                          <div className="space-y-4 relative">
                            {/* Blur overlay */}
                            <div className="absolute inset-0 backdrop-blur-md bg-black/40 rounded-2xl z-20 flex items-center justify-center">
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1.9 }}
                                className="text-center px-6"
                              >
                                <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                                <p className="text-white font-bold text-2xl mb-3">Create Free Account to Unlock</p>
                                <Button
                                  size="lg"
                                  onClick={handleSignUp}
                                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-8 h-14 rounded-2xl shadow-[0_0_30px_rgba(0,217,255,0.4)] border-0"
                                >
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  Sign Up Free
                                  <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                              </motion.div>
                            </div>
                            
                            {/* Preview items (blurred behind) */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                  <Award className="w-6 h-6 text-cyan-400" />
                                  <h4 className="text-cyan-400 font-bold text-lg">Full AI Analysis</h4>
                                </div>
                                <p className="text-gray-500 text-sm mb-3">Get 12+ detailed insights on grammar, tone, achievements, keywords, and more...</p>
                                <div className="space-y-2">
                                  <div className="h-3 bg-white/5 rounded w-full" />
                                  <div className="h-3 bg-white/5 rounded w-3/4" />
                                  <div className="h-3 bg-white/5 rounded w-5/6" />
                                </div>
                              </div>
                              
                              <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                  <Briefcase className="w-6 h-6 text-purple-400" />
                                  <h4 className="text-purple-400 font-bold text-lg">Job Match Analysis</h4>
                                </div>
                                <p className="text-gray-500 text-sm mb-3">See which BPO roles you're best suited for based on your resume...</p>
                                <div className="space-y-2">
                                  <div className="h-3 bg-white/5 rounded w-full" />
                                  <div className="h-3 bg-white/5 rounded w-2/3" />
                                  <div className="h-3 bg-white/5 rounded w-4/5" />
                                </div>
                              </div>
                              
                              <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                  <LineChart className="w-6 h-6 text-green-400" />
                                  <h4 className="text-green-400 font-bold text-lg">Salary Intelligence</h4>
                                </div>
                                <p className="text-gray-500 text-sm mb-3">Get market data on what you should be earning in your target role...</p>
                                <div className="space-y-2">
                                  <div className="h-3 bg-white/5 rounded w-5/6" />
                                  <div className="h-3 bg-white/5 rounded w-full" />
                                  <div className="h-3 bg-white/5 rounded w-3/4" />
                                </div>
                              </div>
                              
                              <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                  <Palette className="w-6 h-6 text-yellow-400" />
                                  <h4 className="text-yellow-400 font-bold text-lg">Resume Builder Access</h4>
                                </div>
                                <p className="text-gray-500 text-sm mb-3">Create ATS-optimized resumes with AI-powered templates and suggestions...</p>
                                <div className="space-y-2">
                                  <div className="h-3 bg-white/5 rounded w-full" />
                                  <div className="h-3 bg-white/5 rounded w-4/5" />
                                  <div className="h-3 bg-white/5 rounded w-2/3" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* SIGNUP PITCH CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.0 }}
                      className="space-y-8"
                    >
                      {/* Main CTA Card */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl" />
                        <div className="relative bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 border-2 border-cyan-500/30 rounded-3xl p-10 backdrop-blur-sm">

                          <div className="text-center mb-8">
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
                              🎁 Unlock Your Full Career Potential
                            </h3>
                            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                              Create a <span className="text-cyan-400 font-bold">FREE account</span> to get:
                            </p>
                          </div>

                          {/* Benefits List */}
                          <div className="space-y-4 mb-8 max-w-2xl mx-auto">
                            {[
                              {
                                icon: Brain,
                                title: 'Full AI Resume Analysis',
                                description: '12 detailed insights to improve your resume'
                              },
                              {
                                icon: Palette,
                                title: 'AI-Powered Resume Builder',
                                description: 'Create professional resumes in minutes'
                              },
                              {
                                icon: Briefcase,
                                title: 'Personalized Job Matches',
                                description: 'Get matched to 5 perfect BPO jobs instantly'
                              },
                              {
                                icon: Users,
                                title: 'Apply to Real Agencies',
                                description: 'Direct applications to verified employers'
                              },
                              {
                                icon: LineChart,
                                title: 'Salary Insights & Career Path',
                                description: 'Know your worth and plan your future'
                              },
                              {
                                icon: CheckCircle,
                                title: 'Real-Time Application Tracking',
                                description: 'See which recruiters viewed your profile'
                              }
                            ].map((benefit, i) => (
                              <motion.div
                                key={benefit.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 2.1 + i * 0.1 }}
                                className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                              >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                                  <benefit.icon className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white font-bold text-base mb-1">{benefit.title}</h4>
                                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                                </div>
                                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                              </motion.div>
                            ))}
                          </div>

                          {/* Social Proof Stats - REAL DATA */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.8 }}
                            className="grid md:grid-cols-3 gap-6 mb-10 py-8 border-y border-white/10"
                          >
                            <div className="text-center">
                              <div className="text-4xl md:text-5xl font-black text-cyan-400 mb-2">
                                {platformStats.candidatesHired > 0
                                  ? platformStats.candidatesHired.toLocaleString()
                                  : platformStats.totalCandidates.toLocaleString()}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {platformStats.candidatesHired > 0 ? 'candidates placed' : 'job seekers'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-4xl md:text-5xl font-black text-green-400 mb-2">
                                {platformStats.avgDaysToInterview} days
                              </div>
                              <div className="text-gray-400 text-sm">average time to first interview</div>
                            </div>
                            <div className="text-center">
                              <div className="text-4xl md:text-5xl font-black text-purple-400 mb-2">
                                ₱{platformStats.avgSalaryIncrease.toLocaleString()}
                              </div>
                              <div className="text-gray-400 text-sm">average salary increase/month</div>
                            </div>
                          </motion.div>

                          {/* Action Buttons - Enhanced */}
                          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="lg"
                                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-10 h-16 text-lg rounded-2xl shadow-[0_0_30px_rgba(0,217,255,0.3)] hover:shadow-[0_0_50px_rgba(0,217,255,0.5)] border-0"
                                onClick={handleSignUp}
                              >
                                <Sparkles className="w-5 h-5 mr-2" />
                                Sign Up Free
                                <ArrowRight className="w-5 h-5 ml-2" />
                              </Button>
                            </motion.div>
                            <Link href="/how-it-works">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-10 h-16 text-lg rounded-2xl font-bold">
                                  See How It Works
                                  <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                              </motion.div>
                            </Link>
                          </div>

                          {/* Trust Note */}
                          <p className="text-center text-gray-400 text-sm flex flex-wrap items-center justify-center gap-3">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              100% Free
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <Shield className="w-4 h-4 text-cyan-400" />
                              No Credit Card
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-purple-400" />
                              2 Minutes Setup
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Secondary Action */}
                      <div className="text-center">
                        <Button variant="ghost" onClick={resetAnalysis} className="text-gray-400 hover:text-white hover:bg-white/10 h-12 px-6 rounded-xl font-semibold">
                          <FileText className="w-5 h-5 mr-2" />
                          Analyze Another Resume
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Trust Badges - Enhanced with REAL DATA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="flex flex-wrap justify-center gap-8 text-gray-400">
              {[
                { icon: Zap, text: 'AI-Powered Analysis', color: 'text-cyan-400' },
                { icon: CheckCircle, text: 'No Signup Required', color: 'text-green-400' },
                {
                  icon: Star,
                  text: platformStats.resumesAnalyzed > 0
                    ? `${platformStats.resumesAnalyzed.toLocaleString()}+ Resumes Analyzed`
                    : 'AI Resume Analysis',
                  color: 'text-yellow-400'
                },
                { icon: Shield, text: '100% Secure & Private', color: 'text-purple-400' }
              ].map((badge, i) => (
                <motion.div
                  key={badge.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <badge.icon className={`w-5 h-5 ${badge.color}`} />
                  <span className="font-medium">{badge.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

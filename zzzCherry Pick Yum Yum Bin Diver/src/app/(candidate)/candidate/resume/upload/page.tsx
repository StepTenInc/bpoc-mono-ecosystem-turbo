'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Plus,
  Image
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { processResumeFile } from '@/lib/utils';
import { toast } from '@/components/shared/ui/toast';
import { PacmanLoader } from 'react-spinners';
import { v4 as uuidv4 } from 'uuid';

/**
 * Step 1: Upload & Extract Resume - ENHANCED VERSION
 * Combines best of OLD resume-builder with candidate dashboard
 */
export default function ResumeUploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // File state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  
  // Anonymous session
  const [anonSessionId, setAnonSessionId] = useState<string | null>(null);

  // Initialize anon session for guests
  useEffect(() => {
    if (user?.id) {
      setAnonSessionId(null);
      return;
    }
    try {
      const existing = localStorage.getItem('anon_session_id');
      if (existing) {
        setAnonSessionId(existing);
      } else {
        const newId = `anon-${uuidv4()}`;
        localStorage.setItem('anon_session_id', newId);
        setAnonSessionId(newId);
      }
    } catch {}
  }, [user?.id]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'image/jpeg', 
      'image/png', 
      'image/webp'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, Word document, or image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setError(null);
    setUploadedFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleProcessResume = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep(0);
    setLogs([]);
    setError(null);
    setShowProcessingModal(true);
    
    try {
      addLog('🔑 Fetching secure API keys...');
      setProgress(5);
      
      // Fetch API keys
      const keyResponse = await fetch('/api/get-api-key');
      const keyResult = keyResponse.ok ? await keyResponse.json() : { success: false };
      const hasKeys = keyResult?.success === true;
      
      if (!hasKeys) {
        addLog('⚠️ API keys not configured. Running in demo mode.');
        setProgress(15);
      } else {
        addLog('✅ API keys obtained successfully');
      }
      
      addLog('🚀 Starting resume extraction pipeline...');
      setProgress(10);
      setCurrentStep(1);
      
      // Intercept console.log to capture processing logs
      const originalConsoleLog = console.log;
      const progressMap: Record<string, { progress: number; step: number }> = {
        '📤 Step 1: Converting file': { progress: 20, step: 1 },
        '✅ Step 1 Complete': { progress: 30, step: 1 },
        '🤖 Step 2: Performing GPT Vision OCR': { progress: 40, step: 2 },
        '✅ Step 2 Complete': { progress: 55, step: 2 },
        '📄 Step 3': { progress: 65, step: 3 },
        '✅ Step 3 Complete': { progress: 75, step: 3 },
        '🔄 Step 4': { progress: 80, step: 3 },
        '✅ Step 4 Complete': { progress: 90, step: 4 },
        '🏗️ Step 5': { progress: 92, step: 4 },
        '✅ Pipeline Complete': { progress: 95, step: 4 },
      };
      
      console.log = (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        originalConsoleLog(...args);
        
        // Update progress and add safe logs
        for (const [pattern, { progress: prog, step }] of Object.entries(progressMap)) {
          if (message.includes(pattern)) {
            setProgress(prog);
            setCurrentStep(step);
            addLog(message);
            break;
          }
        }
      };
      
      let processedResume: any = null;
      
      if (hasKeys) {
        const sessionToken = await getSessionToken();
        processedResume = await processResumeFile(
          uploadedFile,
          keyResult.openaiApiKey,
          keyResult.cloudConvertApiKey,
          sessionToken ?? undefined
        );
      } else {
        // Demo fallback
        processedResume = {
          name: 'Demo User',
          email: 'demo@bpoc.io',
          phone: '',
          bestJobTitle: 'Customer Support Specialist',
          summary: 'Experienced support professional exploring BPOC.IO resume builder.',
          experience: [],
          education: [],
          skills: {
            technical: ['Customer Support', 'Communication'],
            soft: ['Problem Solving', 'Teamwork'],
            languages: ['English', 'Filipino']
          }
        };
        addLog('✅ Demo resume data generated');
        setProgress(75);
      }
      
      // Restore console.log
      console.log = originalConsoleLog;
      
      if (!processedResume) {
        throw new Error('No data extracted from resume');
      }
      
      addLog('💾 Saving extracted data...');
      setProgress(98);
      setCurrentStep(4);
      
      // Save to database or localStorage
      const sessionToken = await getSessionToken();
      
      if (user?.id && sessionToken && hasKeys) {
        // Read file as base64 for upload
        let fileDataBase64: string | null = null;
        try {
          fileDataBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(uploadedFile);
          });
        } catch (error) {
          console.warn('⚠️ Could not read file as base64:', error);
          // Continue without file data - it's optional
        }

        const saveResponse = await fetch('/api/candidates/resume/save-extracted', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
            'x-user-id': String(user.id)
          },
          body: JSON.stringify({
            resumeData: processedResume,
            originalFileName: uploadedFile.name,
            candidateId: user.id,
            fileData: fileDataBase64 // Send file data for upload to storage
          })
        });
        
        if (saveResponse.ok) {
          addLog('✅ Resume saved to your profile!');
        } else {
          addLog('⚠️ Could not save to database, stored locally');
          localStorage.setItem('anon_extracted_resume', JSON.stringify(processedResume));
        }
      } else {
        // Guest flow
        addLog('💾 Storing resume locally (sign up to save permanently!)');
        localStorage.setItem('anon_extracted_resume', JSON.stringify(processedResume));
        localStorage.setItem('bpoc_processed_resumes', JSON.stringify([processedResume]));
      }
      
      setProgress(100);
      addLog('🎉 Extraction complete! Ready for AI analysis.');
      toast.success('Resume extracted successfully!');
      
      // Short delay then navigate
      setTimeout(() => {
        router.push('/candidate/resume/analysis');
      }, 1500);
      
    } catch (err) {
      console.error('Error processing resume:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process resume';
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  const getLogColor = (log: string) => {
    if (log.includes('❌')) return 'text-red-400';
    if (log.includes('✅') || log.includes('🎉')) return 'text-green-400';
    if (log.includes('⚠️')) return 'text-yellow-400';
    if (log.includes('🚀') || log.includes('🔑') || log.includes('💾')) return 'text-cyan-400';
    return 'text-gray-300';
  };

  const steps = [
    { name: 'Converting', icon: '📄' },
    { name: 'OCR Reading', icon: '🤖' },
    { name: 'Extracting', icon: '📊' },
    { name: 'Saving', icon: '💾' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Step 1: Upload Resume
          </h1>
          <p className="text-gray-400 mt-1">
            Upload your existing resume to get started
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push('/candidate/resume')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 bg-cyan-500/20 flex items-center justify-center animate-pulse">
            <Upload className="h-5 w-5" />
          </div>
          <span className="font-medium">Upload</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-700" />
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center">
            <span className="text-sm">2</span>
          </div>
          <span>Analysis</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-700" />
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-10 h-10 rounded-full border-2 border-gray-600 flex items-center justify-center">
            <span className="text-sm">3</span>
          </div>
          <span>Build</span>
        </div>
      </div>

      {/* Main Upload Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 p-8">
          {uploadedFile ? (
            /* File Selected State */
            <div className="flex flex-col items-center py-8">
              <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10 w-full max-w-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                      <FileText className="h-7 w-7 text-cyan-400" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-white font-medium text-lg truncate">{uploadedFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    className="text-gray-400 hover:text-red-400 flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleProcessResume}
                disabled={isProcessing}
                className="relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Extract Resume Data
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Upload State */
            <div 
              className={`text-center py-16 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                isDragActive 
                  ? 'border-cyan-400 bg-cyan-500/10' 
                  : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/5'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                <Upload className={`h-10 w-10 ${isDragActive ? 'text-cyan-400' : 'text-gray-400'}`} />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {isDragActive ? 'Drop your file here' : 'Upload Your Resume'}
              </h2>
              <p className="text-gray-400 mb-6">
                Drag and drop or click to browse
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">PDF</Badge>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400">DOC</Badge>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400">DOCX</Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">Images</Badge>
              </div>
              
              <p className="text-gray-500 text-sm">
                Maximum file size: 10MB
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* What Happens Next */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          What Happens Next?
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: '📄', title: 'Convert', desc: 'CloudConvert processes your file' },
            { icon: '🤖', title: 'OCR Read', desc: 'GPT Vision extracts all text' },
            { icon: '📊', title: 'Structure', desc: 'AI organizes your data' },
            { icon: '💾', title: 'Save', desc: 'Stored securely for analysis' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <h4 className="text-white font-medium">{step.title}</h4>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Processing Modal */}
      <Dialog open={showProcessingModal} onOpenChange={() => {}}>
        <DialogContent 
          className="max-w-2xl bg-gradient-to-br from-[#0B0B0D] via-gray-900 to-[#0B0B0D] border-cyan-500/20"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              {progress < 100 ? 'Extracting Resume Data...' : '✅ Extraction Complete!'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {progress < 100 
                ? 'This usually takes 1-2 minutes. Please wait...'
                : 'Your resume has been processed successfully!'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            {/* Loader */}
            {progress < 100 && (
              <div className="flex justify-center">
                <PacmanLoader color="#0EA5E9" size={35} />
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-cyan-400 font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            
            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-2">
              {steps.map((step, i) => (
                <div 
                  key={i}
                  className={`text-center p-3 rounded-lg border transition-all ${
                    currentStep > i 
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : currentStep === i 
                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 animate-pulse'
                        : 'border-white/10 bg-white/5 text-gray-500'
                  }`}
                >
                  <span className="text-xl">{step.icon}</span>
                  <p className="text-xs mt-1">{step.name}</p>
                </div>
              ))}
            </div>
            
            {/* Live Console */}
            <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="text-sm text-gray-400 font-mono">Live Console</span>
                </div>
                {progress < 100 && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    Processing
                  </div>
                )}
              </div>
              <div className="p-4 max-h-48 overflow-y-auto font-mono text-sm space-y-1">
                {logs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`${getLogColor(log)}`}
                  >
                    <span className="text-gray-600 mr-2">{'>'}</span>
                    {log}
                  </motion.div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
            
            {/* Success Actions */}
            {progress >= 100 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <Button
                  onClick={() => router.push('/candidate/resume/analysis')}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-3"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Continue to AI Analysis
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

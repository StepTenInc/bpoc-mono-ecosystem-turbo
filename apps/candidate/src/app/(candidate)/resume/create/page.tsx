'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Loader2,
  Lightbulb,
  FileText,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';

/**
 * Create Resume From Scratch
 * User can paste text/voice about themselves, AI organizes it into a resume
 */
export default function CreateFromScratchPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [textContent, setTextContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Example prompts to help user
  const examplePrompts = [
    "I worked at Jollibee for 2 years as a cashier, then moved to a call center...",
    "I just graduated from college with a degree in Business Administration...",
    "I have 5 years experience in customer service at Teleperformance...",
    "I'm good at Excel, typing fast, and I speak English fluently..."
  ];

  const handleProcess = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some information about yourself first');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Send to AI to organize into resume structure
      setProcessingStep('Analyzing your information...');
      
      const sessionToken = await getSessionToken();
      const response = await fetch('/api/candidates/resume/create-from-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
          ...(user?.id && { 'x-user-id': String(user.id) })
        },
        body: JSON.stringify({ 
          textContent: textContent.trim(),
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process your information');
      }

      const data = await response.json();
      
      // Step 2: Save the generated resume data to localStorage for the builder
      setProcessingStep('Creating your resume...');
      
      if (data.resumeData) {
        localStorage.setItem('bpoc_generated_resume', JSON.stringify(data.resumeData));
        localStorage.setItem('bpoc_ai_analysis', JSON.stringify(data.analysis || {}));
      }

      // Step 3: Redirect to AI analysis step (same as upload path!)
      setProcessingStep('Opening AI Assistant...');
      
      toast.success('Resume created! Let AI enhance it.');
      router.push('/resume/create/analysis');
      
    } catch (error) {
      console.error('Error processing:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Send to Whisper API for transcription
        try {
          toast.info('Transcribing your voice...');
          
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          const result = await response.json();
          
          if (result.success && result.text) {
            // Append transcribed text to existing text
            setTextContent(prev => prev ? `${prev}\n\n${result.text}` : result.text);
            toast.success('Voice transcribed! You can keep talking or edit the text.');
          } else {
            toast.error(result.error || 'Transcription failed. Please try again or type instead.');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Could not transcribe. Please type instead.');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording... Speak now!');
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Could not access microphone. Please type instead.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link 
          href="/resume"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Resume Options
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">AI Resume Creator</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Tell Us About Yourself
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Paste your work history, certifications, or just describe what you've done. 
            AI will organize it into a professional resume.
          </p>
        </motion.div>

        {/* Main Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Tell me about your work experience, skills, education, certifications... Paste anything here! I'll organize it into a proper resume.

Example: I worked at Jollibee for 2 years as a crew member, then I got a job at Teleperformance in customer service. I'm good at talking to customers and I can type 60 words per minute. I graduated from..."
              className="w-full h-72 lg:h-96 bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              disabled={isProcessing}
            />

            {/* Character count */}
            <div className="absolute bottom-4 right-4 text-gray-500 text-sm">
              {textContent.length} characters
            </div>
          </div>

          {/* Voice button */}
          <div className="flex justify-center mt-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant="outline"
              className={`border-purple-500/30 ${isRecording ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'text-purple-400 hover:bg-purple-500/10'}`}
              disabled={isProcessing}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Or Use Voice
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <Lightbulb className="w-5 h-5" />
              <span className="font-semibold">Tips for a Better Resume</span>
            </div>
            <ul className="text-gray-400 space-y-2 text-sm">
              <li>• Include your job titles and company names with dates</li>
              <li>• Mention specific skills (Excel, customer service, languages)</li>
              <li>• Add your education and any certifications</li>
              <li>• Don't worry about formatting - AI will organize everything!</li>
            </ul>
          </div>
        </motion.div>

        {/* Example prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-gray-500 text-sm mb-3">Not sure what to write? Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setTextContent(prompt)}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-gray-400 hover:text-white transition-all truncate max-w-xs"
              >
                "{prompt.slice(0, 40)}..."
              </button>
            ))}
          </div>
        </motion.div>

        {/* Process Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleProcess}
            disabled={isProcessing || !textContent.trim()}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {processingStep || 'Processing...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Create My Resume
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Processing overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-400" />
              </div>
              <p className="text-xl font-semibold text-white mb-2">{processingStep}</p>
              <p className="text-gray-400">AI is working its magic...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

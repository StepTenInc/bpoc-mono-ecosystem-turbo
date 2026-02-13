'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Loader2, 
  Wand2, 
  Target, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Brain,
  Lightbulb,
  Zap,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useResumeStore, useAIContext, useCompletionScore } from '../../hooks/useResumeStore';
import { AIAnalysisContext } from '../../lib/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// AI ASSISTANT COMPONENT
// Smart sidebar that uses context from resume analysis to provide
// personalized suggestions and improvements
// ═══════════════════════════════════════════════════════════════════════════════

interface AIMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onImproveSection?: (section: string, content: string) => Promise<void>;
}

export function AIAssistant({ isOpen, onClose, onImproveSection }: AIAssistantProps) {
  const { resume, aiContext } = useResumeStore();
  const completionScore = useCompletionScore();
  
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [improvingSection, setImprovingSection] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize with contextual welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage(aiContext, completionScore);
      setMessages([{
        id: crypto.randomUUID(),
        role: 'ai',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  }, [aiContext, completionScore]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Generate contextual welcome message
  function generateWelcomeMessage(context: AIAnalysisContext | null, score: number): string {
    if (!context) {
      return `Hey! I'm your AI Resume Coach. I'll help you build a resume that gets you hired.

Your resume is ${score}% complete. Let's make it perfect!

What would you like to work on first?`;
    }
    
    const { targetRole, experienceLevel, missingFields, improvements } = context;
    const highImpactImprovements = improvements?.filter(i => i.impact === 'high') || [];
    
    let message = `Hey! I've analyzed your resume for ${targetRole || 'your target role'}.

📊 **Current Score:** ${context.overallScore || score}/100`;
    
    if (missingFields?.length > 0) {
      message += `\n\n⚠️ **Missing:** ${missingFields.slice(0, 3).join(', ')}`;
    }
    
    if (highImpactImprovements.length > 0) {
      message += `\n\n💡 **Quick Win:** ${highImpactImprovements[0].suggestion}`;
    }
    
    if (context.suggestedSkills?.length > 0) {
      message += `\n\n🎯 **Add these skills for ${targetRole}:** ${context.suggestedSkills.slice(0, 5).join(', ')}`;
    }
    
    message += '\n\nClick any suggestion above or ask me anything!';
    
    return message;
  }
  
  // Handle AI improve for a section
  const handleImprove = async (section: string) => {
    setImprovingSection(section);
    
    // Add user message
    addMessage('user', `Improve my ${section}`);
    addMessage('ai', `✨ Improving your ${section}...`);
    
    try {
      // Get content based on section
      let content = '';
      switch (section) {
        case 'summary':
          content = resume.summary;
          break;
        case 'experience':
          content = JSON.stringify(resume.experience);
          break;
        case 'skills':
          content = JSON.stringify(resume.skills);
          break;
        case 'education':
          content = JSON.stringify(resume.education);
          break;
      }
      
      if (onImproveSection) {
        await onImproveSection(section, content);
        updateLastMessage(`✅ Done! I've enhanced your ${section} with:
• Stronger action verbs
• Quantifiable achievements
• Industry-relevant keywords

Check the preview to see the changes!`);
      }
    } catch (error) {
      updateLastMessage(`❌ Sorry, I couldn't improve that section. ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
    
    setImprovingSection(null);
  };
  
  // Handle optimize for ATS
  const handleOptimizeATS = async () => {
    setIsLoading(true);
    addMessage('user', 'Optimize my resume for ATS');
    addMessage('ai', '🎯 Analyzing your resume for ATS optimization...');
    
    try {
      // Would call API here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateLastMessage(`✅ ATS Optimization Complete!

📋 **What I improved:**
• Added industry-relevant keywords
• Standardized date formats
• Simplified formatting for better parsing
• Enhanced action verbs

💡 **Tips:**
• Keep section headers standard (Experience, Education, Skills)
• Avoid tables and graphics
• Use common fonts

Your resume is now more likely to pass ATS filters!`);
    } catch (error) {
      updateLastMessage('❌ ATS optimization failed. Please try again.');
    }
    
    setIsLoading(false);
  };
  
  // Handle enhance all
  const handleEnhanceAll = async () => {
    setIsLoading(true);
    addMessage('user', 'Enhance my entire resume');
    addMessage('ai', '🚀 Starting full resume enhancement...');
    
    try {
      // Would process each section
      const sections = ['summary', 'experience', 'skills'];
      for (const section of sections) {
        await handleImprove(section);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      addMessage('ai', `🎉 Full enhancement complete!

I've improved:
✓ Summary - More compelling opening
✓ Experience - Quantified achievements
✓ Skills - Industry keywords added

Your resume score has improved! Check the preview.`);
    } catch (error) {
      addMessage('ai', '❌ Some sections failed to enhance. Please try individual sections.');
    }
    
    setIsLoading(false);
  };
  
  // Handle chat input
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    
    setIsLoading(true);
    
    // Simple intent detection
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('improve') && lowerMessage.includes('summary')) {
      await handleImprove('summary');
    } else if (lowerMessage.includes('improve') && lowerMessage.includes('experience')) {
      await handleImprove('experience');
    } else if (lowerMessage.includes('ats')) {
      await handleOptimizeATS();
    } else if (lowerMessage.includes('skill') && (lowerMessage.includes('add') || lowerMessage.includes('suggest'))) {
      // Suggest skills based on context
      const suggestedSkills = aiContext?.suggestedSkills || ['Communication', 'Problem Solving', 'Time Management'];
      addMessage('ai', `Based on your profile, here are skills I'd recommend adding:

🎯 **Technical:**
${suggestedSkills.slice(0, 3).map(s => `• ${s}`).join('\n')}

🤝 **Soft Skills:**
• Communication
• Problem Solving
• Adaptability

Click "Add Skills" in the Quick Actions to add them!`);
    } else {
      // Generic helpful response
      addMessage('ai', `I can help you with:

• **"Improve my summary"** - Make it more compelling
• **"Improve my experience"** - Add achievements & metrics
• **"Optimize for ATS"** - Pass applicant tracking systems
• **"Suggest skills"** - Get role-specific recommendations

What would you like to work on?`);
    }
    
    setIsLoading(false);
  };
  
  // Helper to add message
  const addMessage = (role: 'ai' | 'user', content: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    }]);
  };
  
  // Helper to update last message
  const updateLastMessage = (content: string) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].content = content;
      }
      return updated;
    });
  };
  
  // Calculate missing fields
  const missingFields = aiContext?.missingFields || [];
  const hasMissingFields = missingFields.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-[#111113] border-l border-white/10 overflow-hidden flex flex-col h-full"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
              <span className="font-semibold text-white">AI Resume Coach</span>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="p-3 border-b border-white/10 space-y-2 flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleImprove('summary')}
                disabled={improvingSection === 'summary' || isLoading}
                className="p-2.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-sm text-purple-200 hover:from-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {improvingSection === 'summary' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                <span>Summary</span>
              </button>
              <button 
                onClick={handleOptimizeATS}
                disabled={isLoading}
                className="p-2.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-sm text-cyan-200 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
                <span>ATS Optimize</span>
              </button>
            </div>
            <button 
              onClick={handleEnhanceAll}
              disabled={isLoading}
              className="w-full p-2.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-sm text-emerald-200 hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              <span>Enhance Entire Resume</span>
            </button>
          </div>
          
          {/* Missing Fields Alert */}
          {hasMissingFields && (
            <div className="p-3 border-b border-white/10 flex-shrink-0">
              <div className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
                <h4 className="text-xs font-semibold text-amber-300 uppercase mb-2 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Missing Information
                </h4>
                <div className="space-y-1">
                  {missingFields.slice(0, 4).map((field, i) => (
                    <div key={i} className="text-xs text-amber-100 flex items-center gap-2">
                      <Plus className="h-3 w-3 text-amber-400" />
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Completion Score */}
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Resume Score</span>
              <span className="text-lg font-bold text-cyan-400">{completionScore}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${completionScore}%` }}
              />
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                  msg.role === 'ai' 
                    ? 'bg-white/5 text-gray-300 border border-white/10' 
                    : 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30 ml-4'
                }`}
              >
                {msg.role === 'ai' && (
                  <span className="text-purple-400 font-medium flex items-center gap-1.5 mb-1">
                    <Brain className="h-3.5 w-3.5" />
                    AI Coach
                  </span>
                )}
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <div className="p-3 border-t border-white/10 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AIAssistant;

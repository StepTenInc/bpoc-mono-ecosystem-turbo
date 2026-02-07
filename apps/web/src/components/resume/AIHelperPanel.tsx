'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Send,
  Phone,
  MapPin,
  Calendar,
  Wrench,
  GraduationCap,
  Award,
  Loader2,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';

interface Issue {
  id: string;
  type: 'phone' | 'location' | 'dates' | 'skills' | 'education' | 'summary' | 'other';
  message: string;
  field: string;
  resolved: boolean;
}

interface AIHelperPanelProps {
  analysisData: any;
  extractedData: any;
  onUpdateField: (field: string, value: any) => void;
  onApplySuggestion: (suggestion: string, field: string) => void;
}

export default function AIHelperPanel({ 
  analysisData, 
  extractedData,
  onUpdateField,
  onApplySuggestion 
}: AIHelperPanelProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'ai' | 'user', content: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse issues from AI analysis
  useEffect(() => {
    if (!analysisData) return;
    
    const detectedIssues: Issue[] = [];
    const improvements = analysisData.improvements || [];
    
    improvements.forEach((imp: string, index: number) => {
      const lowerImp = imp.toLowerCase();
      
      if (lowerImp.includes('phone') || lowerImp.includes('contact')) {
        detectedIssues.push({
          id: `phone-${index}`,
          type: 'phone',
          message: imp,
          field: 'phone',
          resolved: !!extractedData?.phone
        });
      } else if (lowerImp.includes('location') || lowerImp.includes('address')) {
        detectedIssues.push({
          id: `location-${index}`,
          type: 'location',
          message: imp,
          field: 'location',
          resolved: !!extractedData?.location
        });
      } else if (lowerImp.includes('date') || lowerImp.includes('employment')) {
        detectedIssues.push({
          id: `dates-${index}`,
          type: 'dates',
          message: imp,
          field: 'experience_dates',
          resolved: false
        });
      } else if (lowerImp.includes('skill')) {
        detectedIssues.push({
          id: `skills-${index}`,
          type: 'skills',
          message: imp,
          field: 'skills',
          resolved: extractedData?.skills?.technical?.length > 0
        });
      } else if (lowerImp.includes('education') || lowerImp.includes('degree')) {
        detectedIssues.push({
          id: `education-${index}`,
          type: 'education',
          message: imp,
          field: 'education',
          resolved: false
        });
      } else {
        detectedIssues.push({
          id: `other-${index}`,
          type: 'other',
          message: imp,
          field: 'other',
          resolved: false
        });
      }
    });
    
    setIssues(detectedIssues);
    
    // Set initial message
    const unresolvedCount = detectedIssues.filter(i => !i.resolved).length;
    if (unresolvedCount > 0) {
      setMessages([{
        role: 'ai',
        content: `Hey! I found ${unresolvedCount} things we can improve on your resume. Let's fix them together! 🚀\n\nClick on an issue below to get started.`
      }]);
    } else {
      setMessages([{
        role: 'ai',
        content: `Your resume looks great! 🎉 All the major issues have been addressed.`
      }]);
    }
  }, [analysisData, extractedData]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIssueClick = (issue: Issue) => {
    if (issue.resolved) return;
    
    setCurrentIssue(issue);
    
    // Add AI message asking for this field
    let prompt = '';
    switch (issue.type) {
      case 'phone':
        prompt = "What's your phone number? I'll add it to your resume. 📞";
        break;
      case 'location':
        prompt = "Where are you located? (City, Country) 📍";
        break;
      case 'dates':
        prompt = "Let's add dates to your work experience. What are the start and end dates for your most recent job? (e.g., Jan 2020 - Dec 2023)";
        break;
      case 'skills':
        prompt = "What are your top technical skills? List them separated by commas. (e.g., Excel, Customer Service, Zendesk)";
        break;
      case 'education':
        prompt = "Tell me about your education. What degree did you get and from where?";
        break;
      default:
        prompt = `Let's fix this: "${issue.message}"\n\nWhat would you like to add?`;
    }
    
    setMessages(prev => [...prev, { role: 'ai', content: prompt }]);
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || !currentIssue) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: inputValue }]);
    
    // Process the input based on issue type
    const value = inputValue.trim();
    
    switch (currentIssue.type) {
      case 'phone':
        onUpdateField('phone', value);
        break;
      case 'location':
        onUpdateField('location', value);
        break;
      case 'dates':
        // Parse dates if possible
        onUpdateField('experience_dates', value);
        break;
      case 'skills':
        // Split by comma and add to skills
        const skillsList = value.split(',').map(s => s.trim()).filter(Boolean);
        onUpdateField('skills.technical', skillsList);
        break;
      case 'education':
        onUpdateField('education_text', value);
        break;
      default:
        onApplySuggestion(value, currentIssue.field);
    }
    
    // Mark issue as resolved
    setIssues(prev => prev.map(i => 
      i.id === currentIssue.id ? { ...i, resolved: true } : i
    ));
    
    // AI response
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: `✅ Got it! I've added that to your resume.\n\n${
          issues.filter(i => !i.resolved && i.id !== currentIssue.id).length > 0 
            ? 'What would you like to fix next?' 
            : '🎉 Amazing! All issues are fixed. Your resume is looking great!'
        }`
      }]);
      setIsTyping(false);
      setCurrentIssue(null);
    }, 500);
    
    setInputValue('');
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'dates': return <Calendar className="h-4 w-4" />;
      case 'skills': return <Wrench className="h-4 w-4" />;
      case 'education': return <GraduationCap className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const resolvedCount = issues.filter(i => i.resolved).length;
  const totalCount = issues.length;
  const progressPercent = totalCount > 0 ? (resolvedCount / totalCount) * 100 : 100;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">AI Resume Helper</h3>
            <p className="text-gray-400 text-xs">I'll help you fix issues</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Issues Fixed</span>
            <span className="text-cyan-400">{resolvedCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="p-3 border-b border-white/10 max-h-[200px] overflow-y-auto">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Click to fix:</p>
        <div className="space-y-2">
          {issues.map(issue => (
            <motion.button
              key={issue.id}
              onClick={() => handleIssueClick(issue)}
              disabled={issue.resolved}
              className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                issue.resolved 
                  ? 'bg-green-500/10 border border-green-500/20 opacity-60' 
                  : currentIssue?.id === issue.id
                    ? 'bg-cyan-500/20 border border-cyan-500/40'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              whileHover={!issue.resolved ? { scale: 1.02 } : {}}
              whileTap={!issue.resolved ? { scale: 0.98 } : {}}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                issue.resolved ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {issue.resolved ? <CheckCircle className="h-4 w-4" /> : getIssueIcon(issue.type)}
              </div>
              <span className={`text-xs flex-1 truncate ${issue.resolved ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                {issue.type === 'phone' && 'Add phone number'}
                {issue.type === 'location' && 'Add location'}
                {issue.type === 'dates' && 'Add work dates'}
                {issue.type === 'skills' && 'Add skills'}
                {issue.type === 'education' && 'Complete education'}
                {issue.type === 'other' && issue.message.slice(0, 30) + '...'}
              </span>
              {!issue.resolved && <ChevronRight className="h-4 w-4 text-gray-500" />}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px]">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] p-3 rounded-xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-cyan-500/20 text-cyan-100 rounded-br-sm' 
                  : 'bg-white/10 text-gray-200 rounded-bl-sm'
              }`}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-1 p-3"
          >
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {currentIssue && (
        <div className="p-3 border-t border-white/10 bg-black/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={
                currentIssue.type === 'phone' ? '+63 XXX XXX XXXX' :
                currentIssue.type === 'location' ? 'Manila, Philippines' :
                currentIssue.type === 'dates' ? 'Jan 2020 - Dec 2023' :
                currentIssue.type === 'skills' ? 'Excel, Zendesk, English...' :
                'Type your answer...'
              }
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

/**
 * HR Assistant Component - RECRUITER VERSION
 * Vibrant orange/amber gradient design matching recruiter dashboard aesthetic
 */

import { useState, useEffect } from 'react';
import { Loader2, Send, FileCheck, Zap, BookOpen, ChevronRight, Sparkles, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: {
    section: string;
    article: string | null;
    topics: string[];
    similarity: number;
  }[];
  relatedArticles?: string[];
}

const EXAMPLE_QUESTIONS = [
  'What is the legal probationary period?',
  'What are valid grounds for termination?',
  'What are regularization requirements?',
  'What employment records must we maintain?',
  'What are employer obligations for benefits?'
];

export function HRAssistantRecruiter() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load conversation history on mount
  useEffect(() => {
    if (user && session) {
      loadConversationHistory();
    } else {
      setLoadingHistory(false);
    }
  }, [user, session]);

  async function loadConversationHistory() {
    try {
      if (!session) return;

      const response = await fetch(
        `/api/hr-assistant/history?role=recruiter`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          const historicalMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            type: msg.message_type,
            content: msg.content,
            sources: msg.sources ? JSON.parse(msg.sources) : undefined,
            relatedArticles: msg.related_articles
          }));
          setMessages(historicalMessages);
          setSessionId(data.messages[0]?.session_id || null);
        }
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent, directQuestion?: string) {
    if (e) e.preventDefault();
    
    const questionText = directQuestion || input;
    if (!questionText.trim() || loading || !user || !session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: questionText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/hr-assistant/ask', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          question: questionText, 
          role: 'recruiter',
          sessionId 
        })
      });

      if (!response.ok) throw new Error('Failed to get answer');

      const data = await response.json();

      // Update session ID if new
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.answer,
        sources: data.sources,
        relatedArticles: data.relatedArticles
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  if (loadingHistory) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent shadow-lg shadow-orange-500/10 h-[640px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent shadow-lg shadow-orange-500/10">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none" />
      
      {/* Main container */}
      <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/20 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/30">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Labor Law Compliance
                  <Zap className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-sm text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  Philippine Labor Code • Recruiter's Guide
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <History className="w-4 h-4" />
                {messages.length} messages
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-orange-500/30 scrollbar-track-transparent">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 mb-4 shadow-lg shadow-orange-500/20">
                  <BookOpen className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Your Compliance Partner</h3>
                <p className="text-sm text-gray-300">
                  Get instant answers about hiring requirements, employee obligations & best practices
                </p>
              </div>

              <div className="grid gap-3">
                {EXAMPLE_QUESTIONS.map((question, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleSubmit(undefined, question)}
                    disabled={loading || !user}
                    className="group w-full text-left px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-amber-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-all">
                        <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <span className="text-sm text-gray-200 group-hover:text-white transition-colors font-medium">
                        {question}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white/10 border border-white/10 text-gray-100 backdrop-blur-xl'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-xs font-semibold text-amber-300 mb-2.5 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        Legal References:
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="text-xs bg-orange-500/10 rounded-xl px-3.5 py-2.5 border border-orange-500/20">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">
                                {source.article ? `Article ${source.article}` : source.section}
                              </span>
                              <span className="text-amber-300 font-mono font-bold">
                                {source.similarity}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Articles */}
                  {message.relatedArticles && message.relatedArticles.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-xs text-gray-300">
                        <span className="font-semibold text-amber-400">Related Articles: </span>
                        {message.relatedArticles.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 border border-orange-500/20 rounded-2xl px-5 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                  <span className="text-sm text-gray-300 font-medium">Checking compliance requirements...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl px-6 py-5">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about hiring requirements, compliance, employee obligations..."
              disabled={loading || !user}
              className="flex-1 px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !user}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2 font-semibold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Ask
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


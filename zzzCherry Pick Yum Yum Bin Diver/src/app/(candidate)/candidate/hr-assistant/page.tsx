'use client';

/**
 * FULL PAGE: Candidate HR Assistant
 * Chat interface for understanding Philippine Labor Law rights
 */

import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, Book, Sparkles, Scale, ChevronRight, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { FormattedAIResponse } from '@/components/hr/FormattedAIResponse';

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
  'When do I become a regular employee?',
  'Am I entitled to night shift differential in BPO?',
  'Can I back out after accepting a job offer?',
  'What are my rights during probationary period?',
  'When should I receive my 13th month pay?'
];

export default function CandidateHRAssistantPage() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    if (user) {
      loadConversationHistory();
    }
  }, [user]);

  async function loadConversationHistory() {
    try {
      if (!session) return;

      const response = await fetch(
        `/api/hr-assistant/history?role=candidate`,
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
    
    // Use direct question if provided (from predefined questions), otherwise use input
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
          role: 'candidate',
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

  function clearChat() {
    setMessages([]);
    setSessionId(null);
  }

  if (loadingHistory) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex-none border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 px-4 sm:px-8 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <Scale className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Your Rights Assistant
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                Philippine Labor Law
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {messages.length > 0 && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                  <History className="w-4 h-4" />
                  {messages.length} messages
                </div>
                <button
                  onClick={clearChat}
                  className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-2 rounded-lg border border-white/10 hover:border-red-500/30 transition-all min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 bg-[#0B0B0D]">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pt-12"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-6 shadow-lg shadow-cyan-500/20">
                  <Book className="w-12 h-12 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Ask Me Anything!</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  I'm here to help you understand your rights as a worker in the Philippines. 
                  Ask me about employment terms, benefits, regularization, or any labor law questions.
                </p>
              </div>

              <div className="grid gap-4 max-w-3xl mx-auto">
                {EXAMPLE_QUESTIONS.map((question, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleSubmit(undefined, question)}
                    disabled={loading}
                    className="group w-full text-left px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-4">
                      <ChevronRight className="w-6 h-6 text-cyan-400 mt-1 group-hover:translate-x-2 transition-transform" />
                      <span className="text-base text-gray-300 group-hover:text-white transition-colors font-medium">
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
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-4 sm:py-5 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-xl shadow-cyan-500/30'
                      : 'bg-white/5 border border-white/10 text-gray-100 backdrop-blur-xl shadow-lg'
                  }`}
                >
                  <FormattedAIResponse content={message.content} accentColor="cyan" />

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-white/10">
                      <p className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                        <Book className="w-4 h-4" />
                        Legal Sources:
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="text-sm bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-300">
                                {source.article ? `Article ${source.article}` : source.section}
                              </span>
                              <span className="text-cyan-400 font-mono font-bold">
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
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-gray-400">
                        <span className="font-medium text-purple-400">Related Articles: </span>
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
              <div className="bg-white/5 border border-white/10 rounded-3xl px-6 py-5 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                  <span className="text-gray-400">Searching Philippine Labor Code...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-none border-t border-white/10 bg-[#0B0B0D]/95 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2 sm:gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your rights..."
              disabled={loading || !user}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 disabled:opacity-50 transition-all min-h-[44px]"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !user}
              className="px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl sm:rounded-2xl hover:shadow-xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 sm:gap-3 font-semibold text-sm sm:text-base min-h-[44px] flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 sm:mt-3 text-center hidden sm:block">
            Powered by Philippine Labor Code • All answers cited from official DOLE regulations
          </p>
        </form>
      </div>
    </div>
  );
}


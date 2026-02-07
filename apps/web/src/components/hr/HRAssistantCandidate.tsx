'use client';

/**
 * HR Assistant Component - CANDIDATE VERSION with CONVERSATION MEMORY
 * Beautiful gradient design matching candidate dashboard aesthetic
 */

import { useState, useEffect } from 'react';
import { Loader2, Send, Book, Sparkles, Scale, ChevronRight, History } from 'lucide-react';
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
  'When do I become a regular employee?',
  'Am I entitled to night shift differential in BPO?',
  'Can I back out after accepting a job offer?',
  'What are my rights during probationary period?',
  'When should I receive my 13th month pay?'
];

export function HRAssistantCandidate() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load conversation history on mount
  useEffect(() => {
    if (user) {
      loadConversationHistory();
    }
  }, [user]);

  async function loadConversationHistory() {
    try {
      const { data: { session } } = await user.supabase.auth.getSession();
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
    
    const questionText = directQuestion || input;
    if (!questionText.trim() || loading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: questionText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await user.supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

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

  if (loadingHistory) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 glass-card-gradient shadow-glow-cyan h-[640px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 glass-card-gradient shadow-glow-cyan">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent opacity-50 animate-pulse pointer-events-none" />
      
      {/* Main container */}
      <div className="relative bg-[#0B0B0D]/90 backdrop-blur-xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 shadow-lg shadow-cyan-500/25">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Your Rights Assistant
                </h2>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Philippine Labor Law • Know Your Rights
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
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mb-4">
                  <Book className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Ask Me Anything!</h3>
                <p className="text-sm text-gray-400">
                  I'm here to help you understand your rights as a worker in the Philippines
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
                    className="group w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-3">
                      <ChevronRight className="w-5 h-5 text-cyan-400 mt-0.5 group-hover:translate-x-1 transition-transform" />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
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
                      ? 'bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-white/5 border border-white/10 text-gray-100 backdrop-blur-xl'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                        <Book className="w-3 h-3" />
                        Legal Sources:
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="text-xs bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-300">
                                {source.article ? `Article ${source.article}` : source.section}
                              </span>
                              <span className="text-cyan-400 font-mono">
                                {source.similarity}% match
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Articles */}
                  {message.relatedArticles && message.relatedArticles.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400">
                        <span className="font-medium text-purple-400">Related: </span>
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
              <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span className="text-sm text-gray-400">Searching Philippine Labor Code...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-[#0B0B0D]/95 backdrop-blur-xl px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your rights, benefits, employment terms..."
              disabled={loading || !user}
              className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !user}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2 font-medium"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
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


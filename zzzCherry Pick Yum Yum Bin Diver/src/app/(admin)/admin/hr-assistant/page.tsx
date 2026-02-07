'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, Shield, AlertCircle, CheckCircle2, ChevronRight, History, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { FormattedAIResponse } from '@/components/hr/FormattedAIResponse';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: any[];
  relatedArticles?: string[];
}

const EXAMPLE_QUESTIONS = [
  'What are employer compliance requirements?',
  'What are penalties for labor violations?',
  'What reports must be submitted to DOLE?',
  'What are establishment registration requirements?',
  'What are the inspection procedures?'
];

export default function AdminHRAssistantPage() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversationHistory();
    }
  }, [user]);

  async function loadConversationHistory() {
    try {
      if (!session) return;

      const response = await fetch(
        `/api/hr-assistant/history?role=admin`,
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
          role: 'admin',
          sessionId 
        })
      });

      if (!response.ok) throw new Error('Failed to get answer');

      const data = await response.json();

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
          <p className="text-gray-400">Loading conversation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-none border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-transparent px-8 py-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                BPOC Compliance Center
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Philippine Labor Code • Administrative Reference & Compliance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {messages.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-lg border border-cyan-500/20">
                  <History className="w-4 h-4" />
                  {messages.length} messages
                </div>
                <button
                  onClick={clearChat}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-4 py-2 rounded-lg border border-white/10 hover:border-red-500/30 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#0B0B0D]">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pt-12"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 mb-6 shadow-lg shadow-cyan-500/20">
                  <AlertCircle className="w-12 h-12 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Compliance Assistant</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Ask about regulations, requirements, and administrative procedures to ensure BPOC compliance
                </p>
              </div>

              <div className="grid gap-3 max-w-3xl mx-auto">
                {EXAMPLE_QUESTIONS.map((question, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleSubmit(undefined, question)}
                    disabled={loading}
                    className="group w-full text-left px-5 py-3.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors font-medium">
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
                  className={`max-w-[85%] rounded-xl px-5 py-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/20'
                      : 'bg-white/5 border border-white/10 text-gray-100 backdrop-blur-xl'
                  }`}
                >
                  <FormattedAIResponse content={message.content} accentColor="blue" />

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs font-semibold text-cyan-400 mb-2.5 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Legal References:
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source: any, idx: number) => (
                          <div key={idx} className="text-xs bg-cyan-500/10 rounded-lg px-3 py-2 border border-cyan-500/20">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">
                                {source.article ? `Article ${source.article}` : source.section}
                              </span>
                              <span className="text-cyan-300 font-mono text-[10px]">
                                {source.similarity}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.relatedArticles && message.relatedArticles.length > 0 && (
                    <div className="mt-3 text-xs text-gray-400">
                      <span className="font-medium text-cyan-400">See Also: </span>
                      {message.relatedArticles.join(', ')}
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
              <div className="bg-white/5 border border-cyan-500/20 rounded-xl px-5 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span className="text-sm text-gray-400">Analyzing compliance requirements...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-none border-t border-cyan-500/20 bg-[#0A0A0C]/95 backdrop-blur-xl px-8 py-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about compliance, regulations, requirements..."
              disabled={loading || !user}
              className="flex-1 px-5 py-3 bg-white/5 border border-cyan-500/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-50 transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !user}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center gap-2 font-medium text-sm"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Query
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            BPOC Administrative Compliance • Philippine Labor Code
          </p>
        </form>
      </div>
    </div>
  );
}

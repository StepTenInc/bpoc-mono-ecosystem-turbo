'use client';

/**
 * HR Assistant Component
 * 
 * AI-powered assistant for Philippine Labor Law questions
 * Supports all roles: candidate, recruiter, admin
 */

import { useState, useEffect } from 'react';
import { Loader2, Send, Book, Search, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HRAssistantProps {
  role: 'candidate' | 'recruiter' | 'admin';
  className?: string;
}

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

const EXAMPLE_QUESTIONS = {
  candidate: [
    'When do I become a regular employee?',
    'Can I back out after accepting a job offer?',
    'What leave benefits am I entitled to?',
    'When should I receive my 13th month pay?',
    'What happens if I resign during probation?'
  ],
  recruiter: [
    'What is the legal probationary period?',
    'What are valid grounds for termination?',
    'What are regularization requirements?',
    'What employment records must we maintain?',
    'What are employer obligations for benefits?'
  ],
  admin: [
    'What are employer compliance requirements?',
    'What are penalties for labor violations?',
    'What reports must be submitted to DOLE?',
    'What are establishment registration requirements?',
    'What are the inspection procedures?'
  ]
};

export function HRAssistant({ role, className = '' }: HRAssistantProps) {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load conversation history on mount
  useEffect(() => {
    if (user && session) {
      loadConversationHistory();
    } else {
      setLoadingHistory(false);
    }
  }, [user, session, role]);

  async function loadConversationHistory() {
    try {
      if (!session) return;

      const response = await fetch(
        `/api/hr-assistant/history?role=${role}`,
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
          setShowExamples(false);
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
    setShowExamples(false);

    try {
      const response = await fetch('/api/hr-assistant/ask', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          question: questionText, 
          role,
          sessionId 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

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
      <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-gray-500 mt-2">Loading conversation history...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">HR Assistant</h2>
              <p className="text-sm text-blue-100">
                Philippine Labor Law • {role.charAt(0).toUpperCase() + role.slice(1)}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <History className="w-4 h-4" />
              {messages.length} messages
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && showExamples && (
          <div className="space-y-4">
            <div className="text-center text-gray-500 mb-6">
              <p className="text-lg font-medium mb-2">Ask me about Philippine labor law</p>
              <p className="text-sm">Try one of these questions:</p>
            </div>

            <div className="space-y-2">
              {EXAMPLE_QUESTIONS[role].map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(undefined, question)}
                  disabled={loading || !user}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4 inline mr-2 text-gray-400" />
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs font-semibold mb-2 text-gray-600">Sources:</p>
                  <div className="space-y-1">
                    {message.sources.map((source, idx) => (
                      <div key={idx} className="text-xs text-gray-600">
                        <span className="font-medium">
                          {source.article ? `Article ${source.article}` : source.section}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({source.similarity}% match)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Articles */}
              {message.relatedArticles && message.relatedArticles.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Related Articles: </span>
                  {message.relatedArticles.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Philippine labor law..."
            disabled={loading || !user}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !user}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Ask
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}


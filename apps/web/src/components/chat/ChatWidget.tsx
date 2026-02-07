'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  User,
  Loader2,
  Minimize2,
  ChevronDown,
  Heart,
  ThumbsUp,
  Smile,
  Zap,
  Phone,
  Video,
  MoreVertical,
  Info,
  Bot,
  FileText,
  Briefcase,
  Target,
  Rocket,
  Scale,
  DollarSign,
  Wrench,
  TrendingUp,
  CheckCircle2,
  Search,
  MousePointerClick
} from 'lucide-react';
import Image from 'next/image';

// Ate Yna's avatar image path
const ATE_YNA_AVATAR = '/Chat Agent/Ate Yna.png';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatWidgetProps {
  pageContext?: string;
}

// Emoji to Lucide icon mapping
const EMOJI_ICON_MAP: Record<string, { Icon: any; color: string; label: string }> = {
  '👋': { Icon: MousePointerClick, color: 'text-yellow-400', label: 'wave' },
  '🤖': { Icon: Bot, color: 'text-cyan-400', label: 'AI' },
  '📄': { Icon: FileText, color: 'text-blue-400', label: 'document' },
  '💼': { Icon: Briefcase, color: 'text-purple-400', label: 'briefcase' },
  '🎯': { Icon: Target, color: 'text-red-400', label: 'target' },
  '😊': { Icon: Smile, color: 'text-yellow-400', label: 'smile' },
  '🚀': { Icon: Rocket, color: 'text-purple-400', label: 'rocket' },
  '⚖️': { Icon: Scale, color: 'text-blue-400', label: 'legal' },
  '💰': { Icon: DollarSign, color: 'text-green-400', label: 'money' },
  '⚡': { Icon: Zap, color: 'text-yellow-400', label: 'fast' },
  '🔧': { Icon: Wrench, color: 'text-gray-400', label: 'tools' },
  '💪': { Icon: TrendingUp, color: 'text-green-400', label: 'strength' },
  '✓': { Icon: CheckCircle2, color: 'text-green-400', label: 'check' },
  '🔍': { Icon: Search, color: 'text-blue-400', label: 'search' },
};

// Replace emojis with Lucide icons
function replaceEmojisWithIcons(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = '';
  let iconIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    let foundEmoji = false;

    // Check for multi-char emojis (like ⚖️)
    for (let len = 3; len >= 1; len--) {
      const substr = text.slice(i, i + len);
      if (EMOJI_ICON_MAP[substr]) {
        // Add accumulated text
        if (currentText) {
          parts.push(<span key={`${keyPrefix}-text-${iconIndex}`}>{currentText}</span>);
          currentText = '';
        }

        // Add icon
        const { Icon, color, label } = EMOJI_ICON_MAP[substr];
        parts.push(
          <Icon
            key={`${keyPrefix}-icon-${iconIndex}`}
            className={`inline-block w-4 h-4 ${color} mx-0.5 -mt-0.5`}
            aria-label={label}
          />
        );

        i += len - 1;
        iconIndex++;
        foundEmoji = true;
        break;
      }
    }

    if (!foundEmoji) {
      currentText += char;
    }
  }

  // Add remaining text
  if (currentText) {
    parts.push(<span key={`${keyPrefix}-text-final`}>{currentText}</span>);
  }

  return parts.length > 0 ? parts : [text];
}

// Parse markdown-like formatting to JSX
function formatMessage(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Split by lines first to handle lists
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push(<br key={`br-${lineIndex}`} />);
    }

    // Check for list items
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      const listContent = line.replace(/^[\s]*[-•]\s*/, '');
      parts.push(
        <span key={`list-${lineIndex}`} className="flex items-start gap-2 my-1.5">
          <span className="flex-shrink-0 w-1 h-1 bg-cyan-400 rounded-full mt-2" />
          <span className="flex-1">{parseInlineFormatting(listContent, `list-content-${lineIndex}`)}</span>
        </span>
      );
    } else if (line.trim().match(/^\d+\)\s/)) {
      // Numbered list
      const match = line.match(/^(\d+)\)\s*(.*)/);
      if (match) {
        parts.push(
          <span key={`num-${lineIndex}`} className="flex items-start gap-2.5 my-1.5">
            <span className="flex-shrink-0 text-cyan-400 font-bold text-xs min-w-[1.5rem]">{match[1]}.</span>
            <span className="flex-1">{parseInlineFormatting(match[2], `num-content-${lineIndex}`)}</span>
          </span>
        );
      }
    } else {
      parts.push(
        <span key={`line-${lineIndex}`}>
          {parseInlineFormatting(line, `inline-${lineIndex}`)}
        </span>
      );
    }
  });

  return parts;
}

// Parse inline formatting like **bold** with emoji replacement
function parseInlineFormatting(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];

  // Match **bold** text
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  let matchIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match (with emoji replacement)
    if (match.index > lastIndex) {
      const textBeforeMatch = text.slice(lastIndex, match.index);
      parts.push(
        <span key={`${keyPrefix}-text-${matchIndex}`}>
          {replaceEmojisWithIcons(textBeforeMatch, `${keyPrefix}-emoji-${matchIndex}`)}
        </span>
      );
    }
    // Add the bold text (with emoji replacement)
    parts.push(
      <strong key={`${keyPrefix}-bold-${matchIndex}`} className="text-cyan-300 font-bold">
        {replaceEmojisWithIcons(match[1], `${keyPrefix}-bold-emoji-${matchIndex}`)}
      </strong>
    );
    lastIndex = match.index + match[0].length;
    matchIndex++;
  }

  // Add remaining text (with emoji replacement)
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(
      <span key={`${keyPrefix}-rest`}>
        {replaceEmojisWithIcons(remainingText, `${keyPrefix}-emoji-rest`)}
      </span>
    );
  }

  return parts.length > 0 ? parts : [text];
}

export default function ChatWidget({ pageContext = 'unknown' }: ChatWidgetProps) {
  const { user, isAuthenticated, userType } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [anonSessionId, setAnonSessionId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [typingText, setTypingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize anonymous session ID
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem('bpoc_anon_session_id');
      if (stored) {
        setAnonSessionId(stored);
      } else {
        const newId = uuidv4();
        localStorage.setItem('bpoc_anon_session_id', newId);
        setAnonSessionId(newId);
      }
    }
  }, [isAuthenticated]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Typing animation phrases - Ate Yna style
  useEffect(() => {
    if (isLoading) {
      const phrases = ['Thinking', 'One moment', 'Almost there', 'Working on it'];
      let phraseIndex = 0;
      const interval = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTypingText(phrases[phraseIndex]);
      }, 1500);
      setTypingText(phrases[0]);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowWelcome(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationId,
          userId: user?.id || null,
          userType: isAuthenticated ? (userType || 'candidate') : 'anonymous',
          anonSessionId: !isAuthenticated ? anonSessionId : null,
          pageContext,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConversationId(data.conversationId);
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry about that! I'm having a bit of trouble right now. Please try again in a moment! 😊",
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops! Something went wrong on my end. Please try again! 🔧",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user, isAuthenticated, userType, anonSessionId, pageContext, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const quickActions = [
    { label: "What is BPOC?", Icon: Rocket, gradient: "from-purple-500 to-pink-500", iconColor: "text-purple-300" },
    { label: "Build my resume", Icon: FileText, gradient: "from-blue-500 to-cyan-500", iconColor: "text-cyan-300" },
    { label: "Find jobs", Icon: Briefcase, gradient: "from-green-500 to-emerald-500", iconColor: "text-emerald-300" },
    { label: "HR Rights Help", Icon: Scale, gradient: "from-orange-500 to-red-500", iconColor: "text-orange-300" },
  ];

  return (
    <>
      {/* DESIGN MOCKUP: Floating Button with Pulse & Notification Badge */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 group"
          >
            {/* Animated pulse ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 opacity-75 animate-ping"
                 style={{ animationDuration: '2s' }} />

            {/* Main button with glassmorphism */}
            <div className="relative w-16 h-16 rounded-full
                          bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600
                          shadow-2xl shadow-cyan-500/50
                          flex items-center justify-center
                          transition-all duration-300
                          group-hover:shadow-cyan-500/70
                          border-2 border-white/20
                          backdrop-blur-xl
                          overflow-hidden">

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

              {/* Ate Yna's face */}
              <Image
                src={ATE_YNA_AVATAR}
                alt="Ate Yna"
                width={64}
                height={64}
                className="w-full h-full object-cover relative z-10 rounded-full"
              />

              {/* DESIGN MOCKUP: Notification badge */}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-400 to-pink-500 rounded-full
                         border-2 border-white shadow-lg z-20 flex items-center justify-center text-[10px] font-black text-white
                         relative group/badge"
              >
                1
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-2 text-[10px] shadow-2xl">
                    💡 IDEA: New message counter
                  </div>
                </div>
              </motion.span>

              {/* Online indicator with pulse */}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-green-300 to-green-500 rounded-full
                             border-2 border-white shadow-lg z-20">
                <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
              </span>
            </div>

            {/* Hover tooltip */}
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              whileHover={{ opacity: 1, x: 0, scale: 1 }}
              className="absolute right-full mr-4 top-1/2 -translate-y-1/2
                        bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm px-4 py-2 rounded-xl
                        whitespace-nowrap opacity-0 group-hover:opacity-100
                        transition-all duration-200 pointer-events-none
                        border border-cyan-500/30 shadow-xl shadow-cyan-500/20
                        flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium">Chat with Ate Yna!</span>
              <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
              {/* Arrow */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 -translate-x-1
                            w-2 h-2 bg-gray-900 border-r border-t border-cyan-500/30 rotate-45" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* DESIGN MOCKUP: Modern Chat Panel with Glassmorphism */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 'auto' : 'min(620px, 85vh)'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)]
                       rounded-3xl overflow-hidden
                       bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95
                       backdrop-blur-2xl
                       border border-gray-700/50
                       shadow-2xl shadow-black/50
                       flex flex-col"
          >
            {/* DESIGN MOCKUP: Modern Header with Actions */}
            <div className="relative px-5 py-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10
                           border-b border-gray-700/50 backdrop-blur-xl">

              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 animate-pulse"
                   style={{ animationDuration: '3s' }} />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  {/* DESIGN MOCKUP: Animated Avatar with Status Ring */}
                  <div className="relative group/avatar">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600
                                flex items-center justify-center shadow-lg shadow-cyan-500/30 overflow-hidden
                                border-2 border-white/20 relative cursor-pointer"
                    >
                      <Image
                        src={ATE_YNA_AVATAR}
                        alt="Ate Yna"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                      {/* Status indicator */}
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gradient-to-br from-green-300 to-green-500 rounded-full
                                     border-2 border-gray-900 shadow-lg">
                        <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                      </span>
                    </motion.div>

                    {/* Tooltip on avatar hover */}
                    <div className="absolute left-full ml-3 top-0 opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-3 text-xs shadow-2xl">
                        <p className="font-bold text-cyan-300 flex items-center gap-2">
                          <span>Ate Yna</span>
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        </p>
                        <p className="text-gray-400 text-[10px] flex items-center gap-1.5 mt-1">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          Your AI Career Buddy
                        </p>
                        <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-500 flex items-center gap-1.5">
                          <Info className="w-3 h-3 text-gray-500" />
                          <span>💡 IDEA: Profile popup</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-base flex items-center gap-2">
                        <span>Ate Yna</span>
                        <Bot className="w-4 h-4 text-cyan-400" />
                      </h3>
                      {/* DESIGN MOCKUP: Verified badge */}
                      <div className="relative group/verified">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 15 }}
                          className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500
                                   flex items-center justify-center cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                        </motion.div>
                        {/* Tooltip */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover/verified:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-2 text-[10px] shadow-2xl flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>💡 IDEA: Verified AI badge</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-cyan-400 flex items-center gap-1.5 font-medium">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                      />
                      Active now • Usually replies instantly
                    </p>
                  </div>
                </div>

                {/* DESIGN MOCKUP: Header Action Buttons */}
                <div className="flex items-center gap-1">
                  {/* Video call mockup */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-cyan-400
                             relative group/video"
                  >
                    <Video className="w-4 h-4" />
                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-2 text-[10px] shadow-2xl">
                        💡 IDEA: Video call feature
                      </div>
                    </div>
                  </motion.button>

                  {/* Phone call mockup */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-green-400
                             relative group/phone"
                  >
                    <Phone className="w-4 h-4" />
                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 opacity-0 group-hover/phone:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      <div className="bg-gray-900 border border-green-500/50 rounded-lg p-2 text-[10px] shadow-2xl">
                        💡 IDEA: Voice call feature
                      </div>
                    </div>
                  </motion.button>

                  {/* Info button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white
                             relative group/info"
                  >
                    <Info className="w-4 h-4" />
                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      <div className="bg-gray-900 border border-gray-500/50 rounded-lg p-2 text-[10px] shadow-2xl">
                        💡 IDEA: Chat info/settings
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                  >
                    {isMinimized ? <ChevronDown className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* DESIGN MOCKUP: Messages Area with Modern Styling */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[320px]
                              scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent
                              hover:scrollbar-thumb-cyan-500/40">

                  {/* Welcome Message with Modern Design */}
                  {showWelcome && messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Assistant intro with gradient bubble */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex gap-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600
                                      flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30 overflow-hidden
                                      border-2 border-white/10">
                          <Image
                            src={ATE_YNA_AVATAR}
                            alt="Ate Yna"
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="relative max-w-[80%]">
                          <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/60
                                        rounded-2xl rounded-tl-sm px-4 py-3.5
                                        border border-gray-700/50 backdrop-blur-sm
                                        shadow-xl shadow-black/20">
                            <p className="text-gray-100 text-sm leading-relaxed font-medium flex items-center gap-1 flex-wrap">
                              Hey there! <MousePointerClick className="inline-block w-4 h-4 text-yellow-400 animate-pulse" /> I'm <span className="text-cyan-400 font-bold">Ate Yna</span>, your AI career buddy here at BPOC!
                            </p>
                            <p className="text-gray-400 text-sm mt-2 leading-relaxed flex items-center gap-1 flex-wrap">
                              I've been through the job hunting grind myself, so I totally get the struggle. How can I help you today? <TrendingUp className="inline-block w-4 h-4 text-green-400" />
                            </p>
                          </div>
                          {/* Message tail */}
                          <div className="absolute -left-1 top-0 w-3 h-3 bg-gray-800/80 transform rotate-45 border-l border-t border-gray-700/50" />
                        </div>
                      </motion.div>

                      {/* DESIGN MOCKUP: Modern Quick Actions with Gradients */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="pl-12 space-y-2"
                      >
                        <p className="text-xs text-gray-500 font-medium mb-2">Quick actions:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {quickActions.map((action, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + (0.05 * i) }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => sendMessage(action.label)}
                              className={`relative px-4 py-3 rounded-xl overflow-hidden
                                       bg-gradient-to-br ${action.gradient} bg-opacity-10
                                       border border-white/10
                                       text-sm text-white font-medium
                                       hover:border-white/20 hover:shadow-lg hover:shadow-${action.iconColor}/20
                                       transition-all duration-200
                                       flex items-center gap-2.5 group`}
                            >
                              {/* Gradient overlay on hover */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />

                              {/* Modern icon with animation */}
                              <motion.div
                                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                                className="relative z-10"
                              >
                                <action.Icon className={`w-5 h-5 ${action.iconColor} drop-shadow-lg`} strokeWidth={2.5} />
                              </motion.div>

                              <span className="text-xs relative z-10 leading-tight text-left">{action.label}</span>

                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                                            translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* DESIGN MOCKUP: Message History with iMessage-style Bubbles */}
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, type: 'spring' }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden border-2 border-white/10
                                    ${msg.role === 'user'
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/30'
                                      : 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/30'}`}>
                        {msg.role === 'user'
                          ? <User className="w-4 h-4 text-white" />
                          : <Image
                              src={ATE_YNA_AVATAR}
                              alt="Ate Yna"
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                        }
                      </div>

                      {/* Message bubble with modern styling */}
                      <div className="flex flex-col gap-1 max-w-[75%]">
                        <div className={`relative rounded-2xl px-4 py-3 shadow-xl
                                      ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 rounded-tr-sm text-white shadow-purple-500/30 border border-white/10'
                                        : 'bg-gradient-to-br from-gray-800/80 to-gray-800/60 rounded-tl-sm border border-gray-700/50 backdrop-blur-sm shadow-black/20'}`}>
                          <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-100'}`}>
                            {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                          </div>

                          {/* Message tail */}
                          {msg.role === 'user' ? (
                            <div className="absolute -right-1 top-0 w-3 h-3 bg-gradient-to-br from-purple-600 to-purple-600 transform rotate-45 border-r border-t border-white/10" />
                          ) : (
                            <div className="absolute -left-1 top-0 w-3 h-3 bg-gray-800/80 transform rotate-45 border-l border-t border-gray-700/50" />
                          )}
                        </div>

                        {/* Timestamp & Read Receipt */}
                        <div className={`flex items-center gap-2 px-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {/* DESIGN MOCKUP: Read receipt */}
                          {msg.role === 'user' && (
                            <div className="relative group/read">
                              <span className="text-[10px] text-cyan-400">✓✓</span>
                              {/* Tooltip */}
                              <div className="absolute right-0 bottom-full mb-1 opacity-0 group-hover/read:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-1.5 text-[9px] shadow-xl">
                                  💡 IDEA: Read receipt
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* DESIGN MOCKUP: Message Reactions (on hover) */}
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                          <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-full p-1 shadow-lg relative group/reactions">
                            {[
                              { icon: Heart, color: 'hover:text-red-400' },
                              { icon: ThumbsUp, color: 'hover:text-blue-400' },
                              { icon: Smile, color: 'hover:text-yellow-400' },
                              { icon: Zap, color: 'hover:text-purple-400' }
                            ].map((reaction, i) => (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-gray-500 ${reaction.color} transition-colors text-[10px]`}
                              >
                                <reaction.icon className="w-3 h-3" />
                              </motion.button>
                            ))}
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/reactions:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              <div className="bg-gray-900 border border-cyan-500/50 rounded-lg p-2 text-[10px] shadow-2xl">
                                💡 IDEA: Message reactions
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* DESIGN MOCKUP: Modern Typing Indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600
                                    flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30 overflow-hidden border-2 border-white/10">
                        <Image
                          src={ATE_YNA_AVATAR}
                          alt="Ate Yna"
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/60 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-700/50 backdrop-blur-sm shadow-xl shadow-black/20">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[0, 150, 300].map((delay, i) => (
                              <motion.span
                                key={i}
                                animate={{ y: [0, -8, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: delay / 1000,
                                  ease: 'easeInOut'
                                }}
                                className="w-2 h-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-400/50"
                              />
                            ))}
                          </div>
                          <span className="text-gray-400 text-xs font-medium">{typingText}...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* DESIGN MOCKUP: Modern Input Area */}
                <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-xl">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Type your message..."
                          disabled={isLoading}
                          className="w-full px-4 py-3 pr-10 rounded-2xl
                                   bg-gray-800/80 border border-gray-700/50
                                   text-white text-sm placeholder-gray-500
                                   focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-all duration-200 backdrop-blur-sm"
                        />
                        {/* Character count (mockup) */}
                        {inputValue.length > 0 && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-3 bottom-3 text-[10px] text-gray-600 font-medium relative group/count"
                          >
                            {inputValue.length}
                            {/* Tooltip */}
                            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/count:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              <div className="bg-gray-900 border border-gray-500/50 rounded-lg p-1.5 text-[9px] shadow-xl">
                                💡 IDEA: Character counter
                              </div>
                            </div>
                          </motion.span>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="p-3 rounded-2xl
                                 bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600
                                 text-white shadow-xl shadow-cyan-500/30
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                 hover:shadow-cyan-500/50
                                 transition-all duration-200
                                 border border-white/10"
                      >
                        <Send className="w-5 h-5" />
                      </motion.button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-center gap-2">
                      <Bot className="w-3 h-3 text-cyan-500 animate-pulse" />
                      <p className="text-[10px] text-gray-600 font-medium flex items-center gap-1.5">
                        <span>Powered by Ate Yna AI</span>
                        <span className="text-cyan-500">•</span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-green-500" />
                          Secure & Private
                        </span>
                      </p>
                    </div>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

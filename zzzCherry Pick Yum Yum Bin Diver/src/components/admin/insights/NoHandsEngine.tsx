'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/shared/ui/badge';
import { createClient } from '@/lib/supabase/client';
import {
  Lightbulb, Search, FileText, PenTool, ImageIcon, Link2,
  CheckCircle, Radio, AlertTriangle, Clock, RefreshCw,
  Activity, Zap, ChevronDown, ChevronUp, X, Loader2,
  Play, Pause, RotateCcw, Eye
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface PipelineStage {
  id: string;
  emoji: string;
  label: string;
  icon: typeof Lightbulb;
  color: string;
  glowColor: string;
  description: string;
}

interface PipelineArticle {
  id: string;
  title: string;
  slug: string;
  currentStage: string;
  startedAt: string;
  status: 'active' | 'completed' | 'failed' | 'queued';
  error?: string;
  retryCount?: number;
  siloName?: string;
  stageProgress?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  articleTitle?: string;
  stage?: string;
}

interface QueueStats {
  total: number;
  queued: number;
  published: number;
  failed: number;
  paused: number;
  inProgress: number;
  research: number;
  idea: number;
  writing: number;
  humanizing: number;
  seo: number;
  media: number;
  publishing: number;
}

interface QueueData {
  stats: QueueStats;
  siloStats: Record<string, { total: number; published: number; queued: number; inProgress: number; failed: number }>;
  activeItems: any[];
  recentPublished: any[];
  failedItems: any[];
  nextUp: any[];
  activityLog: any[];
  engineRunning: boolean;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const STAGES: PipelineStage[] = [
  { id: 'research', emoji: '🔍', label: 'RESEARCH', icon: Search, color: '#60A5FA', glowColor: 'rgba(96,165,250,0.3)', description: 'Perplexity Sonar Pro research' },
  { id: 'idea', emoji: '💡', label: 'IDEA', icon: Lightbulb, color: '#FBBF24', glowColor: 'rgba(251,191,36,0.3)', description: 'Grok title + brief generation' },
  { id: 'writing', emoji: '✍️', label: 'WRITING', icon: PenTool, color: '#A78BFA', glowColor: 'rgba(167,139,250,0.3)', description: 'Claude Sonnet full article' },
  { id: 'humanizing', emoji: '🤖', label: 'HUMANIZE', icon: FileText, color: '#F472B6', glowColor: 'rgba(244,114,182,0.3)', description: 'Grok AI detection bypass' },
  { id: 'seo', emoji: '🔗', label: 'SEO', icon: Link2, color: '#2DD4BF', glowColor: 'rgba(45,212,191,0.3)', description: 'Gemini meta + schema + links' },
  { id: 'media', emoji: '🖼️', label: 'MEDIA', icon: ImageIcon, color: '#FB923C', glowColor: 'rgba(251,146,60,0.3)', description: 'Imagen 4 hero image' },
  { id: 'publishing', emoji: '📤', label: 'PUBLISH', icon: CheckCircle, color: '#4ADE80', glowColor: 'rgba(74,222,128,0.3)', description: 'Insert into Supabase' },
];

// Map of stage → estimated progress percentages for animation
const STAGE_PROGRESS: Record<string, number> = {
  research: 14,
  idea: 28,
  writing: 42,
  humanizing: 57,
  seo: 71,
  media: 85,
  publishing: 95,
};

// ═══════════════════════════════════════════════════════════
// DATA TRANSFORM — Convert API response to component types
// ═══════════════════════════════════════════════════════════

function transformToArticles(data: QueueData): PipelineArticle[] {
  const articles: PipelineArticle[] = [];

  // Active/in-progress items
  for (const item of data.activeItems || []) {
    articles.push({
      id: item.id,
      title: item.title,
      slug: item.slug,
      currentStage: item.status,
      startedAt: item.started_at || item.updated_at,
      status: item.status === 'failed' ? 'failed' : 'active',
      error: item.error_message || undefined,
      retryCount: item.retry_count || 0,
      siloName: item.silo_name,
      stageProgress: STAGE_PROGRESS[item.status] || 50,
    });
  }

  // Failed items (if not already in active)
  for (const item of data.failedItems || []) {
    if (!articles.find((a) => a.id === item.id)) {
      articles.push({
        id: item.id,
        title: item.title,
        slug: item.slug,
        currentStage: item.status,
        startedAt: item.started_at || item.updated_at,
        status: 'failed',
        error: item.error_message || 'Unknown error',
        retryCount: item.retry_count || 0,
        siloName: item.silo_name,
        stageProgress: 0,
      });
    }
  }

  // Recently published
  for (const item of data.recentPublished || []) {
    if (!articles.find((a) => a.id === item.id)) {
      articles.push({
        id: item.id,
        title: item.title,
        slug: item.slug,
        currentStage: 'publishing',
        startedAt: item.completed_at || item.updated_at,
        status: 'completed',
        siloName: item.silo_name,
        stageProgress: 100,
      });
    }
  }

  // Next up (queued)
  for (const item of (data.nextUp || []).slice(0, 3)) {
    if (!articles.find((a) => a.id === item.id)) {
      articles.push({
        id: item.id,
        title: item.title,
        slug: item.slug,
        currentStage: 'research',
        startedAt: item.created_at,
        status: 'queued',
        siloName: item.silo_name,
        stageProgress: 0,
      });
    }
  }

  return articles;
}

function transformToLogs(data: QueueData): LogEntry[] {
  return (data.activityLog || []).map((log: any) => ({
    id: log.id,
    timestamp: log.timestamp,
    message: log.message,
    type: log.type as LogEntry['type'],
    articleTitle: log.articleTitle,
    stage: log.stage,
  }));
}

// ═══════════════════════════════════════════════════════════
// FLOATING PARTICLES (the factory atmosphere)
// ═══════════════════════════════════════════════════════════

function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    size: number; opacity: number; color: string; life: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#FBBF24', '#60A5FA', '#A78BFA', '#F472B6', '#4ADE80', '#38BDF8', '#2DD4BF'];
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const spawn = () => {
      if (particlesRef.current.length < 60) {
        particlesRef.current.push({
          x: Math.random() * W(),
          y: H() + 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.3 + Math.random() * 0.6),
          size: 1 + Math.random() * 2.5,
          opacity: 0.15 + Math.random() * 0.35,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 200 + Math.random() * 300,
        });
      }
    };

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, W(), H());
      spawn();

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.opacity *= 0.998;

        if (p.life <= 0 || p.opacity < 0.01) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// CONVEYOR BELT CONNECTOR
// ═══════════════════════════════════════════════════════════

function ConveyorSegment({ fromColor, toColor, hasActiveArticle }: { fromColor: string; toColor: string; hasActiveArticle: boolean }) {
  return (
    <div className="flex items-center justify-center w-12 md:w-16 flex-shrink-0 relative">
      <div className="h-[3px] w-full rounded-full relative overflow-hidden"
        style={{ background: `linear-gradient(90deg, ${fromColor}30, ${toColor}30)` }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 6px, ${hasActiveArticle ? fromColor : fromColor + '40'} 6px, ${hasActiveArticle ? toColor : toColor + '40'} 12px)`,
            backgroundSize: '24px 100%',
          }}
          animate={{ backgroundPositionX: ['0px', '-24px'] }}
          transition={{ duration: hasActiveArticle ? 0.6 : 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      {hasActiveArticle && (
        <motion.div
          className="absolute w-2 h-2 rounded-full"
          style={{ background: toColor, boxShadow: `0 0 8px ${toColor}` }}
          animate={{ left: ['0%', '100%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PIPELINE STAGE NODE
// ═══════════════════════════════════════════════════════════

function StageNode({
  stage, articles, index, isExpanded, onToggle, stageCount
}: {
  stage: PipelineStage;
  articles: PipelineArticle[];
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  stageCount: number;
}) {
  const activeArticles = articles.filter(a => a.currentStage === stage.id);
  const hasActive = activeArticles.some(a => a.status === 'active');
  const hasFailed = activeArticles.some(a => a.status === 'failed');
  const hasCompleted = activeArticles.some(a => a.status === 'completed');
  const count = stageCount;
  const Icon = stage.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
      className="flex-shrink-0 relative group"
    >
      <button
        onClick={onToggle}
        className={`
          relative w-[100px] md:w-[120px] rounded-xl border backdrop-blur-sm
          transition-all duration-500 cursor-pointer
          ${hasFailed
            ? 'border-red-500/60 bg-red-950/40'
            : hasActive
              ? 'border-white/20 bg-white/[0.06]'
              : hasCompleted
                ? 'border-green-500/30 bg-green-950/20'
                : 'border-white/[0.08] bg-white/[0.03]'
          }
          hover:border-white/30 hover:bg-white/[0.08]
        `}
        style={{
          boxShadow: hasActive
            ? `0 0 30px ${stage.glowColor}, inset 0 1px 0 rgba(255,255,255,0.06)`
            : hasFailed
              ? '0 0 20px rgba(239,68,68,0.2)'
              : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {hasActive && (
          <>
            <motion.div
              className="absolute -inset-[2px] rounded-xl border-2 pointer-events-none"
              style={{ borderColor: stage.color + '40' }}
              animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.04, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full z-10"
              style={{ background: stage.color, boxShadow: `0 0 10px ${stage.color}` }}
              animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </>
        )}

        {hasFailed && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full z-10 bg-red-500"
            style={{ boxShadow: '0 0 10px rgba(239,68,68,0.6)' }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}

        <div className="p-3 flex flex-col items-center gap-2">
          <span className="text-2xl leading-none select-none">{stage.emoji}</span>
          <span
            className="text-[10px] font-bold tracking-wider uppercase"
            style={{ color: hasActive || hasCompleted ? stage.color : 'rgba(255,255,255,0.4)' }}
          >
            {stage.label}
          </span>
          {count > 0 && (
            <Badge
              className="text-[10px] px-1.5 py-0 border"
              style={{
                backgroundColor: hasFailed ? 'rgba(239,68,68,0.2)' : `${stage.color}20`,
                borderColor: hasFailed ? 'rgba(239,68,68,0.4)' : `${stage.color}40`,
                color: hasFailed ? '#FCA5A5' : stage.color,
              }}
            >
              {count}
            </Badge>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && activeArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-72 md:w-80"
          >
            <div
              className="rounded-xl border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl p-3 space-y-2 shadow-2xl"
              style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${stage.glowColor}` }}
            >
              <div
                className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-l border-t border-white/10"
                style={{ background: '#0a0a0f' }}
              />
              {activeArticles.map(article => (
                <div
                  key={article.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    article.status === 'failed'
                      ? 'border-red-500/40 bg-red-950/30'
                      : article.status === 'completed'
                        ? 'border-green-500/20 bg-green-950/20'
                        : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{article.title}</p>
                      {article.siloName && (
                        <p className="text-[10px] text-gray-500 mt-0.5">{article.siloName}</p>
                      )}
                    </div>
                    {article.status === 'failed' && (
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    {article.status === 'active' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: stage.color }} />
                      </motion.div>
                    )}
                  </div>
                  {article.status === 'active' && article.stageProgress !== undefined && (
                    <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${stage.color}, ${stage.color}80)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${article.stageProgress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  )}
                  {article.error && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-300/80">{article.error}</p>
                    </div>
                  )}
                  {article.retryCount && article.retryCount > 0 && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] text-amber-400">Retry #{article.retryCount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOG PANEL
// ═══════════════════════════════════════════════════════════

function LogPanel({ logs }: { logs: LogEntry[] }) {
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
      case 'error': return <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
      default: return <Activity className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />;
    }
  };

  const getLogBorder = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500/50';
      case 'error': return 'border-l-red-500/50';
      case 'warning': return 'border-l-amber-500/50';
      default: return 'border-l-cyan-500/50';
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#08080c]/80 backdrop-blur overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-sm font-semibold text-white">Pipeline Activity Log</span>
          <Badge className="bg-white/5 text-gray-400 border-white/10 text-[10px]">
            {logs.length} events
          </Badge>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div
              ref={scrollRef}
              className="max-h-64 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            >
              {logs.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No pipeline activity yet. Start the engine to begin processing.
                </div>
              )}
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={i === 0 ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  className={`px-4 py-2.5 flex items-start gap-3 border-l-2 ${getLogBorder(log.type)} hover:bg-white/[0.02] transition-colors`}
                >
                  <div className="mt-0.5">{getLogIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${
                      log.type === 'error' ? 'text-red-300/90' : 'text-gray-300/90'
                    }`}>
                      {log.message}
                    </p>
                  </div>
                  <time className="text-[10px] text-gray-600 font-mono whitespace-nowrap mt-0.5">
                    {formatTime(log.timestamp)}
                  </time>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════════════════════

function StatsBar({ stats, activeFilter, onFilter }: { stats: QueueStats | null; activeFilter: string | null; onFilter: (f: string | null) => void }) {
  const s = stats || { published: 0, inProgress: 0, queued: 0, failed: 0, total: 0 };
  
  const items = [
    { label: 'Published', value: s.published, color: '#4ADE80', icon: CheckCircle, filter: 'completed' },
    { label: 'In Progress', value: s.inProgress, color: '#60A5FA', icon: Loader2, filter: 'active' },
    { label: 'Queued', value: s.queued, color: '#FBBF24', icon: Clock, filter: 'queued' },
    { label: 'Failed', value: s.failed, color: '#EF4444', icon: AlertTriangle, filter: 'failed' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-4">
      <button
        onClick={() => onFilter(null)}
        className={`flex items-center gap-2 mr-2 px-2 py-1 rounded-lg transition-colors ${!activeFilter ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-white/[0.04]'}`}
      >
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-white">{s.total} articles</span>
      </button>
      {items.map(stat => (
        <button
          key={stat.label}
          onClick={() => onFilter(activeFilter === stat.filter ? null : stat.filter)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
            activeFilter === stat.filter
              ? 'bg-white/[0.08] border-white/[0.15] ring-1'
              : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
          }`}
          style={activeFilter === stat.filter ? { ringColor: stat.color, borderColor: stat.color + '60' } : {}}
        >
          <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
          <span className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</span>
          <span className="text-xs text-gray-500">{stat.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ARTICLE TRAVELER
// ═══════════════════════════════════════════════════════════

function ArticleTravelers({ articles }: { articles: PipelineArticle[] }) {
  const activeArticles = articles.filter(a => a.status === 'active');
  if (activeArticles.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {activeArticles.map(article => {
        const stageIndex = STAGES.findIndex(s => s.id === article.currentStage);
        const stage = STAGES[stageIndex];
        if (!stage) return null;

        return (
          <motion.div
            key={article.id}
            layout
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm"
            style={{
              borderColor: `${stage.color}40`,
              background: `${stage.color}10`,
            }}
            animate={{
              boxShadow: [
                `0 0 0px ${stage.color}00`,
                `0 0 15px ${stage.color}30`,
                `0 0 0px ${stage.color}00`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: stage.color }}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-medium text-white/80 truncate max-w-[180px]">
              {article.title}
            </span>
            <span className="text-[10px] font-mono" style={{ color: stage.color }}>
              {stage.emoji} {stage.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SILO BREAKDOWN
// ═══════════════════════════════════════════════════════════

function SiloBreakdown({ siloStats }: { siloStats: Record<string, { total: number; published: number; queued: number; inProgress: number; failed: number }> }) {
  const [expanded, setExpanded] = useState(false);
  const silos = Object.entries(siloStats).sort((a, b) => b[1].total - a[1].total);
  if (silos.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#08080c]/60 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Silo Breakdown</span>
          <Badge className="bg-white/5 text-gray-400 border-white/10 text-[10px]">
            {silos.length} silos
          </Badge>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {silos.map(([name, stats]) => {
                const publishedPct = stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0;
                return (
                  <div key={name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-white truncate">{name}</span>
                      <span className="text-[10px] text-gray-500">{stats.published}/{stats.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${publishedPct}%` }}
                      />
                    </div>
                    <div className="flex gap-3 mt-2">
                      {stats.queued > 0 && <span className="text-[10px] text-amber-400">⏳ {stats.queued}</span>}
                      {stats.inProgress > 0 && <span className="text-[10px] text-blue-400">⚡ {stats.inProgress}</span>}
                      {stats.failed > 0 && <span className="text-[10px] text-red-400">✗ {stats.failed}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function NoHandsEngine() {
  const [data, setData] = useState<QueueData | null>(null);
  const [articles, setArticles] = useState<PipelineArticle[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [engineRunning, setEngineRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const localLogsRef = useRef<LogEntry[]>([]);
  const supabaseRef = useRef(createClient());

  // Fetch queue data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/insights/production-queue');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: QueueData = await res.json();
      setData(json);
      setArticles(transformToArticles(json));
      setLogs(prev => {
        const apiLogs = transformToLogs(json);
        const merged = [...localLogsRef.current, ...apiLogs];
        const seen = new Set<string>();
        return merged.filter(l => {
          if (seen.has(l.id)) return false;
          seen.add(l.id);
          return true;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
      });
      setEngineRunning(json.engineRunning);
      setError(null);
      setLastFetch(new Date());
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Initial fetch + Supabase Realtime subscription (replaces polling)
  useEffect(() => {
    fetchData();

    // Subscribe to realtime changes on insights_production_queue
    const channel = supabaseRef.current
      .channel('queue-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insights_production_queue' },
        (payload) => {
          console.log('🔴 Realtime update:', payload.eventType, (payload.new as any)?.title?.slice(0, 40), '→', (payload.new as any)?.status);
          // Refetch on any change — keeps everything in sync
          fetchData();
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription:', status);
      });

    // Fallback poll every 30s in case realtime hiccups
    const fallbackInterval = setInterval(fetchData, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [fetchData]);

  // Add a local log entry
  const addLocalLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: `local-${Date.now()}`,
      timestamp: new Date().toISOString(),
      message,
      type,
    };
    localLogsRef.current = [newLog, ...localLogsRef.current].slice(0, 20);
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  // Start engine
  const handleStart = useCallback(async () => {
    setIsStarting(true);
    addLocalLog('🏭 Engine starting — picking next article from queue…', 'info');
    try {
      const res = await fetch('/api/admin/insights/production-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const json = await res.json();
      if (json.success) {
        setEngineRunning(true);
        addLocalLog('✅ Engine started — processing pipeline initiated', 'success');
        // Rapid polling while processing
        setTimeout(fetchData, 2000);
        setTimeout(fetchData, 5000);
      } else {
        addLocalLog(`❌ Engine start failed: ${json.error}`, 'error');
      }
    } catch (err: any) {
      addLocalLog(`❌ Engine start error: ${err.message}`, 'error');
    } finally {
      setIsStarting(false);
    }
  }, [addLocalLog, fetchData]);

  // Stop engine
  const handleStop = useCallback(async () => {
    addLocalLog('⏸ Stopping engine after current article…', 'warning');
    try {
      const res = await fetch('/api/admin/insights/production-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      const json = await res.json();
      if (json.success) {
        setEngineRunning(false);
        addLocalLog('⏹ Engine stopped', 'info');
      }
    } catch (err: any) {
      addLocalLog(`❌ Stop error: ${err.message}`, 'error');
    }
  }, [addLocalLog]);

  // Retry a failed item
  const handleRetry = useCallback(async (itemId: string) => {
    addLocalLog('🔄 Retrying failed article…', 'info');
    try {
      await fetch('/api/admin/insights/production-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action: 'retry' }),
      });
      addLocalLog('✅ Article queued for retry', 'success');
      fetchData();
    } catch (err: any) {
      addLocalLog(`❌ Retry error: ${err.message}`, 'error');
    }
  }, [addLocalLog, fetchData]);

  // Check if there are active articles between consecutive stages
  const hasFlowBetween = (fromIdx: number, toIdx: number) => {
    const fromStage = STAGES[fromIdx];
    const toStage = STAGES[toIdx];
    return articles.some(a =>
      (a.currentStage === fromStage.id || a.currentStage === toStage.id) &&
      a.status === 'active'
    );
  };

  const stats = data?.stats || null;

  return (
    <div className="relative min-h-[600px] space-y-6">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <FloatingParticles />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center"
                animate={{ boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 20px rgba(245,158,11,0.3)', '0 0 0px rgba(245,158,11,0)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="w-5 h-5 text-amber-400" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                No Hands Engine
                <motion.span
                  className={`inline-block w-2 h-2 rounded-full ${engineRunning ? 'bg-green-400' : 'bg-gray-500'}`}
                  animate={engineRunning ? { opacity: [1, 0.3, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                {engineRunning && (
                  <span className="text-xs font-normal text-green-400 ml-1">RUNNING</span>
                )}
              </h2>
              <p className="text-sm text-gray-500">
                Autonomous article factory — research → publish in minutes
                {lastFetch && (
                  <span className="text-gray-600 ml-2">
                    · Updated {lastFetch.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <StatsBar stats={stats} activeFilter={statusFilter} onFilter={setStatusFilter} />
        </div>

        {/* Engine controls */}
        <div className="flex items-center gap-3 mt-3">
          {!engineRunning ? (
            <button
              onClick={handleStart}
              disabled={isStarting || (stats?.queued === 0)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-green-800/50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isStarting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isStarting ? 'Starting…' : 'Start Engine'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause Engine
            </button>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 text-sm transition-colors border border-white/[0.08]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {stats && stats.queued > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              {stats.queued} articles waiting in queue
            </span>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Failed to fetch queue data: {error}
          </div>
        )}
      </div>

      {/* Pipeline visualization */}
      <div className="relative z-10">
        <div className="rounded-xl border border-white/[0.08] bg-[#08080c]/60 backdrop-blur-sm p-4 md:p-6 overflow-x-auto">
          <div className="flex items-center justify-start md:justify-center gap-0 min-w-max py-4">
            {STAGES.map((stage, idx) => (
              <div key={stage.id} className="contents">
                <StageNode
                  stage={stage}
                  articles={articles}
                  index={idx}
                  isExpanded={expandedStage === stage.id}
                  onToggle={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                  stageCount={stats ? (stats as any)[stage.id] || 0 : 0}
                />
                {idx < STAGES.length - 1 && (
                  <ConveyorSegment
                    fromColor={stage.color}
                    toColor={STAGES[idx + 1].color}
                    hasActiveArticle={hasFlowBetween(idx, idx + 1)}
                  />
                )}
              </div>
            ))}
          </div>
          <ArticleTravelers articles={articles} />
        </div>
      </div>

      {/* Article cards grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {articles.filter(a => !statusFilter || a.status === statusFilter).map((article, i) => {
          const stage = STAGES.find(s => s.id === article.currentStage) || STAGES[STAGES.length - 1];

          return (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl border p-4 backdrop-blur-sm transition-all ${
                article.status === 'failed'
                  ? 'border-red-500/40 bg-red-950/20'
                  : article.status === 'completed'
                    ? 'border-green-500/20 bg-green-950/10'
                    : article.status === 'queued'
                      ? 'border-white/[0.06] bg-white/[0.02]'
                      : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{article.title}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-mono">/{article.slug}</p>
                </div>
                <Badge
                  className="text-[10px] px-1.5 py-0 border flex-shrink-0"
                  style={{
                    backgroundColor: article.status === 'failed' ? 'rgba(239,68,68,0.2)' :
                      article.status === 'completed' ? 'rgba(74,222,128,0.2)' :
                      article.status === 'queued' ? 'rgba(251,191,36,0.15)' :
                      `${stage.color}20`,
                    borderColor: article.status === 'failed' ? 'rgba(239,68,68,0.4)' :
                      article.status === 'completed' ? 'rgba(74,222,128,0.4)' :
                      article.status === 'queued' ? 'rgba(251,191,36,0.3)' :
                      `${stage.color}40`,
                    color: article.status === 'failed' ? '#FCA5A5' :
                      article.status === 'completed' ? '#86EFAC' :
                      article.status === 'queued' ? '#FDE68A' :
                      stage.color,
                  }}
                >
                  {article.status === 'failed' ? '✗ FAILED' :
                   article.status === 'completed' ? '✓ DONE' :
                   article.status === 'queued' ? '◌ QUEUED' :
                   '● ACTIVE'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-base leading-none">{stage.emoji}</span>
                <span className="text-xs font-medium" style={{ color: stage.color }}>{stage.label}</span>
                {article.siloName && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-[10px] text-gray-500 truncate">{article.siloName}</span>
                  </>
                )}
              </div>

              {/* Pipeline stage dots (mini progress) */}
              <div className="flex items-center gap-1 mb-3">
                {STAGES.map((s, si) => {
                  const currentIdx = STAGES.findIndex(st => st.id === article.currentStage);
                  const isCompleted = si < currentIdx;
                  const isCurrent = si === currentIdx;
                  return (
                    <div key={s.id} className="flex items-center gap-1">
                      <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: isCompleted ? s.color : isCurrent ? stage.color : 'rgba(255,255,255,0.1)',
                          boxShadow: isCurrent ? `0 0 6px ${stage.color}` : 'none',
                        }}
                        animate={isCurrent && article.status === 'active' ? {
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.7, 1],
                        } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      {si < STAGES.length - 1 && (
                        <div
                          className="w-2 h-[1px]"
                          style={{ background: isCompleted ? s.color + '60' : 'rgba(255,255,255,0.06)' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar for active */}
              {article.status === 'active' && article.stageProgress !== undefined && (
                <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${stage.color}, ${stage.color}60)` }}
                    animate={{ width: `${article.stageProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}

              {/* Error message */}
              {article.error && (
                <div className="flex items-start gap-1.5 mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-300/90">{article.error}</p>
                </div>
              )}

              {/* Retry button for failed */}
              {article.status === 'failed' && (
                <button
                  onClick={() => handleRetry(article.id)}
                  className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                  {article.retryCount && article.retryCount > 0 && (
                    <span className="text-amber-500/70">(attempt #{article.retryCount})</span>
                  )}
                </button>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.04]">
                <Clock className="w-3 h-3 text-gray-600" />
                <span className="text-[10px] text-gray-600 font-mono">
                  {article.status === 'completed' ? 'Published' : 'Started'}{' '}
                  {new Date(article.startedAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            </motion.div>
          );
        })}

        {articles.length === 0 && !error && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-600" />
            Loading queue data…
          </div>
        )}
      </div>

      {/* Silo breakdown */}
      {data?.siloStats && Object.keys(data.siloStats).length > 0 && (
        <div className="relative z-10">
          <SiloBreakdown siloStats={data.siloStats} />
        </div>
      )}

      {/* Log panel */}
      <div className="relative z-10">
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}

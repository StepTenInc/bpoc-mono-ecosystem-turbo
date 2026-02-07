'use client';

import { useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/shared/ui/badge';
import {
  CheckCircle, AlertTriangle, Loader2, Play, Square,
  Search, Wrench, Sparkles, ExternalLink, ChevronDown,
  ChevronUp, RefreshCw, Trash2
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ScanPost {
  slug: string;
  title: string;
  silo_slug?: string | null;
  missing: string[];
  has: string[];
}

interface ScanResult {
  total: number;
  complete: number;
  needsFix: number;
  posts: ScanPost[];
}

interface FixResult {
  fixed: string[];
  errors: string[];
  post: { slug: string; title: string };
}

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'fixing';
}

// ═══════════════════════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════════════════════

async function callCleanupAPI(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/insights/pipeline/cleanup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════
// BADGE COMPONENTS
// ═══════════════════════════════════════════════════════════

function HasBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <CheckCircle className="w-3 h-3" />
      {label}
    </span>
  );
}

function MissingBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/30">
      <AlertTriangle className="w-3 h-3" />
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">Completion</span>
        <span className="text-xs font-mono text-white">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
              : pct >= 75
                ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                : 'linear-gradient(90deg, #FB923C, #F97316)',
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ACTIVITY LOG
// ═══════════════════════════════════════════════════════════

function ActivityLog({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getLogStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return { icon: <CheckCircle className="w-3.5 h-3.5 text-green-400" />, border: 'border-l-green-500/50', text: 'text-green-300/90' };
      case 'error': return { icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />, border: 'border-l-red-500/50', text: 'text-red-300/90' };
      case 'warning': return { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />, border: 'border-l-amber-500/50', text: 'text-amber-300/90' };
      case 'fixing': return { icon: <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />, border: 'border-l-blue-500/50', text: 'text-blue-300/90' };
      default: return { icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, border: 'border-l-cyan-500/50', text: 'text-gray-300/90' };
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#08080c]/80 backdrop-blur overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">Activity Log</span>
          <Badge className="bg-white/5 text-gray-400 border-white/10 text-[10px]">
            {logs.length} events
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1"
              title="Clear log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div
          ref={scrollRef}
          className="max-h-72 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          {logs.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No activity yet. Run a scan to get started.
            </div>
          )}
          {logs.map((log) => {
            const style = getLogStyle(log.type);
            return (
              <div
                key={log.id}
                className={`px-4 py-2.5 flex items-start gap-3 border-l-2 ${style.border} hover:bg-white/[0.02] transition-colors`}
              >
                <div className="mt-0.5 flex-shrink-0">{style.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${style.text}`}>{log.message}</p>
                </div>
                <time className="text-[10px] text-gray-600 font-mono whitespace-nowrap mt-0.5">
                  {log.timestamp.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </time>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function CleanupEngine() {
  // State
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [fixingSlug, setFixingSlug] = useState<string | null>(null);
  const [fixAllRunning, setFixAllRunning] = useState(false);
  const [fixAllRemaining, setFixAllRemaining] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for fix-all abort
  const abortRef = useRef(false);

  // Add a log entry
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
      message,
      type,
    }, ...prev].slice(0, 100));
  }, []);

  // ── SCAN ──
  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    addLog('🔍 Scanning published posts...', 'info');

    try {
      const data = await callCleanupAPI({ action: 'scan' });
      setScanResult(data);
      addLog(
        `Scan complete: ${data.total} total, ${data.complete} complete, ${data.needsFix} need fixing`,
        data.needsFix === 0 ? 'success' : 'warning'
      );
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
      addLog(`Scan failed: ${(err instanceof Error ? err.message : String(err))}`, 'error');
    } finally {
      setScanning(false);
    }
  }, [addLog]);

  // ── FIX ONE ──
  const handleFixOne = useCallback(async (slug: string, title: string) => {
    setFixingSlug(slug);
    addLog(`🔧 Fixing: ${title}...`, 'fixing');

    try {
      const data: FixResult = await callCleanupAPI({ action: 'fix-one', slug });

      if (data.fixed.length > 0) {
        addLog(`✅ ${title}: fixed ${data.fixed.join(', ')}`, 'success');
      }
      if (data.errors.length > 0) {
        addLog(`⚠️ ${title}: errors — ${data.errors.join(', ')}`, 'error');
      }
      if (data.fixed.length === 0 && data.errors.length === 0) {
        addLog(`ℹ️ ${title}: nothing to fix`, 'info');
      }

      // Re-scan to refresh the table
      const refreshed = await callCleanupAPI({ action: 'scan' });
      setScanResult(refreshed);

    } catch (err: unknown) {
      addLog(`❌ Fix failed for ${title}: ${(err instanceof Error ? err.message : String(err))}`, 'error');
    } finally {
      setFixingSlug(null);
    }
  }, [addLog]);

  // ── FIX ALL ──
  const handleFixAll = useCallback(async () => {
    setFixAllRunning(true);
    abortRef.current = false;
    setFixAllRemaining(scanResult?.needsFix || 0);
    addLog('🚀 Starting Fix All — processing all posts needing repair...', 'info');

    try {
      let remaining = scanResult?.needsFix || 0;
      let processed = 0;

      while (remaining > 0 && !abortRef.current) {
        addLog(`⏳ Processing next post (${remaining} remaining)...`, 'fixing');

        const data = await callCleanupAPI({ action: 'fix-next' });

        if (data.message === 'All posts complete!') {
          addLog('🎉 All posts are now complete!', 'success');
          remaining = 0;
          break;
        }

        processed++;
        const postTitle = data.post?.title || 'Unknown';

        if (data.fixed?.length > 0) {
          addLog(`✅ ${postTitle}: fixed ${data.fixed.join(', ')}`, 'success');
        }
        if (data.errors?.length > 0) {
          addLog(`⚠️ ${postTitle}: errors — ${data.errors.join(', ')}`, 'error');
        }

        remaining = data.remaining ?? (remaining - 1);
        setFixAllRemaining(remaining);
      }

      if (abortRef.current) {
        addLog(`⏹ Fix All stopped after ${processed} posts`, 'warning');
      } else {
        addLog(`✅ Fix All complete — processed ${processed} posts`, 'success');
      }

      // Final re-scan
      const refreshed = await callCleanupAPI({ action: 'scan' });
      setScanResult(refreshed);

    } catch (err: unknown) {
      addLog(`❌ Fix All error: ${(err instanceof Error ? err.message : String(err))}`, 'error');
    } finally {
      setFixAllRunning(false);
      abortRef.current = false;
    }
  }, [addLog, scanResult]);

  const handleStopFixAll = useCallback(() => {
    abortRef.current = true;
    addLog('🛑 Stopping Fix All after current post finishes...', 'warning');
  }, [addLog]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="relative min-h-[400px] space-y-6">

      {/* ── Header ── */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Cleanup Engine
                {fixAllRunning && (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-xs font-normal text-blue-400 ml-1">RUNNING</span>
                  </>
                )}
              </h2>
              <p className="text-sm text-gray-500">
                Scan published posts, find missing assets, auto-generate what&apos;s needed
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            onClick={handleScan}
            disabled={scanning || fixAllRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {scanning ? 'Scanning...' : 'Scan Posts'}
          </button>

          {scanResult && scanResult.needsFix > 0 && !fixAllRunning && (
            <button
              onClick={handleFixAll}
              disabled={fixingSlug !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-green-800/50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Fix All ({scanResult.needsFix})
            </button>
          )}

          {fixAllRunning && (
            <button
              onClick={handleStopFixAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop ({fixAllRemaining} remaining)
            </button>
          )}

          {scanResult && (
            <button
              onClick={handleScan}
              disabled={scanning || fixAllRunning}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 text-sm transition-colors border border-white/[0.08]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* ── Stats Cards ── */}
      {scanResult && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Published</p>
            <p className="text-3xl font-bold text-white">{scanResult.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">Complete</p>
            <p className="text-3xl font-bold text-emerald-400">{scanResult.complete}</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 p-4">
            <p className="text-xs text-orange-400/70 uppercase tracking-wider mb-1">Needs Fix</p>
            <p className="text-3xl font-bold text-orange-400">{scanResult.needsFix}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <ProgressBar value={scanResult.complete} total={scanResult.total} />
          </div>
        </div>
      )}

      {/* ── Fix All Live Progress ── */}
      {fixAllRunning && (
        <div className="relative z-10 rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-sm font-semibold text-blue-300">
              Fix All in progress — {fixAllRemaining} posts remaining
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{
                width: scanResult
                  ? `${Math.round(((scanResult.needsFix - fixAllRemaining) / scanResult.needsFix) * 100)}%`
                  : '0%',
              }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5">
            Each post takes ~60-120s for image/video generation. Grab a coffee ☕
          </p>
        </div>
      )}

      {/* ── Posts Table ── */}
      {scanResult && scanResult.posts.length > 0 && (
        <div className="relative z-10">
          <div className="rounded-xl border border-white/[0.08] bg-[#08080c]/60 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-white">Posts Needing Fixes</span>
                <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[10px]">
                  {scanResult.posts.length}
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {scanResult.posts.map((post) => {
                const isFixing = fixingSlug === post.slug;
                const siloSlug = post.silo_slug || 'articles';

                return (
                  <div
                    key={post.slug}
                    className={`px-4 py-4 hover:bg-white/[0.02] transition-colors ${
                      isFixing ? 'bg-blue-950/20 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      {/* Title & Link */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-white truncate">
                            {post.title}
                          </h3>
                          <Link
                            href={`/insights/${siloSlug}/${post.slug}`}
                            target="_blank"
                            className="text-gray-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                        <p className="text-[11px] text-gray-600 font-mono mt-0.5">/{post.slug}</p>
                      </div>

                      {/* Has badges */}
                      <div className="flex flex-wrap gap-1">
                        {post.has.map(h => (
                          <HasBadge key={h} label={h} />
                        ))}
                      </div>

                      {/* Missing badges */}
                      <div className="flex flex-wrap gap-1">
                        {post.missing.map(m => (
                          <MissingBadge key={m} label={m} />
                        ))}
                      </div>

                      {/* Fix button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleFixOne(post.slug, post.title)}
                          disabled={isFixing || fixAllRunning || fixingSlug !== null}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isFixing
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-wait'
                              : 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                        >
                          {isFixing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Fixing...
                            </>
                          ) : (
                            <>
                              <Wrench className="w-3.5 h-3.5" />
                              Fix
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── All Complete Message ── */}
      {scanResult && scanResult.needsFix === 0 && (
        <div className="relative z-10 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-emerald-300 mb-1">All Posts Complete!</h3>
          <p className="text-sm text-gray-400">
            All {scanResult.total} published posts have video, images, alt text, and meta descriptions.
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!scanResult && !scanning && (
        <div className="relative z-10 rounded-xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
          <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-400 mb-1">Ready to Scan</h3>
          <p className="text-sm text-gray-500 mb-4">
            Click &quot;Scan Posts&quot; to check all published articles for missing assets
          </p>
          <p className="text-xs text-gray-600">
            Checks: video, hero image, section images (×3), alt text, meta description
          </p>
        </div>
      )}

      {/* ── Activity Log ── */}
      <div className="relative z-10">
        <ActivityLog logs={logs} onClear={() => setLogs([])} />
      </div>
    </div>
  );
}

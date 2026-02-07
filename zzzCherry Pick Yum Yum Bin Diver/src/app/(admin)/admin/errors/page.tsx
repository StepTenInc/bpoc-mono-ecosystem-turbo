'use client';

/**
 * ADMIN ERROR DASHBOARD
 * 
 * Kanban-style view of all platform errors with:
 * - Real-time stats
 * - AI-powered diagnosis
 * - Resolution workflow
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { 
  AlertTriangle, AlertCircle, Info, CheckCircle, Loader2, 
  Bug, Server, Database, Shield, Globe, Clock, RefreshCw,
  Brain, ChevronRight, X, ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlatformError {
  id: string;
  error_message: string;
  error_code: string | null;
  category: string;
  severity: string;
  status: string;
  endpoint: string | null;
  external_service: string | null;
  ai_diagnosis: any;
  occurrence_count: number;
  created_at: string;
  last_occurred_at: string;
}

interface ErrorStats {
  new_count: number;
  analyzing_count: number;
  diagnosed_count: number;
  in_progress_count: number;
  resolved_count: number;
  critical_open: number;
  high_open: number;
  errors_24h: number;
  errors_7d: number;
  most_failing_service: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-gray-500',
};

const CATEGORY_ICONS: Record<string, any> = {
  api: Server,
  database: Database,
  auth: Shield,
  external_service: Globe,
  rate_limit: Clock,
  unknown: Bug,
  validation: AlertCircle,
  permission: Shield,
  ui: Info,
};

const STATUS_COLUMNS = [
  { id: 'new', label: 'New', color: 'bg-red-500/20 border-red-500/50' },
  { id: 'analyzing', label: 'Analyzing', color: 'bg-yellow-500/20 border-yellow-500/50' },
  { id: 'diagnosed', label: 'Diagnosed', color: 'bg-blue-500/20 border-blue-500/50' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-purple-500/20 border-purple-500/50' },
  { id: 'resolved', label: 'Resolved', color: 'bg-green-500/20 border-green-500/50' },
];

export default function ErrorDashboard() {
  const { session } = useAuth();
  const [errors, setErrors] = useState<PlatformError[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<PlatformError | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch errors and stats
  const fetchData = async () => {
    if (!session?.access_token) return;

    try {
      const [errorsRes, statsRes] = await Promise.all([
        fetch('/api/admin/errors/log?limit=100', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch('/api/admin/errors/analyze', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);
      
      const errorsData = await errorsRes.json();
      const statsData = await statsRes.json();
      
      if (errorsData.success) setErrors(errorsData.errors || []);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) {
      console.error('Failed to fetch errors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [session?.access_token]);

  // Trigger AI analysis
  const analyzeError = async (errorId: string) => {
    if (!session?.access_token) return;
    setAnalyzing(errorId);
    try {
      const res = await fetch('/api/admin/errors/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ errorId }),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: '🤖 Analysis complete', description: 'AI diagnosis ready' });
        fetchData(); // Refresh to get updated diagnosis
      } else {
        toast({ title: 'Analysis failed', description: result.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAnalyzing(null);
    }
  };

  // Update error status
  const updateStatus = async (errorId: string, newStatus: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/admin/errors/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ errorId, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setErrors(prev => prev.map(e => e.id === errorId ? { ...e, status: newStatus } : e));
        toast({ title: 'Status updated' });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Get errors for a status column
  const getErrorsForStatus = (status: string) => {
    return errors.filter(e => e.status === status);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Error Dashboard</h1>
          <p className="text-gray-400">AI-powered error tracking & diagnosis</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-red-400">{stats.critical_open}</p>
              <p className="text-sm text-gray-400">Critical Open</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-orange-400">{stats.high_open}</p>
              <p className="text-sm text-gray-400">High Priority</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{stats.errors_24h}</p>
              <p className="text-sm text-gray-400">Last 24h</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{stats.errors_7d}</p>
              <p className="text-sm text-gray-400">Last 7 Days</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-green-400">{stats.resolved_count}</p>
              <p className="text-sm text-gray-400">Resolved</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Most Failing Service Alert */}
      {stats?.most_failing_service && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-white font-semibold">Most Failing Service: {stats.most_failing_service}</p>
              <p className="text-sm text-gray-400">This service has the most open errors</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[600px]">
        {STATUS_COLUMNS.map(column => (
          <div key={column.id} className={`rounded-xl border-2 ${column.color} p-3`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">{column.label}</h3>
              <Badge variant="secondary">{getErrorsForStatus(column.id).length}</Badge>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {getErrorsForStatus(column.id).map(error => {
                const CategoryIcon = CATEGORY_ICONS[error.category] || Bug;
                return (
                  <Card 
                    key={error.id}
                    className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-gray-500 transition-all"
                    onClick={() => setSelectedError(error)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 ${SEVERITY_COLORS[error.severity]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{error.error_message.slice(0, 60)}...</p>
                          <div className="flex items-center gap-2 mt-1">
                            <CategoryIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{error.category}</span>
                            {error.occurrence_count > 1 && (
                              <Badge variant="secondary" className="text-xs">x{error.occurrence_count}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {error.external_service && (
                        <Badge variant="outline" className="text-xs">{error.external_service}</Badge>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{formatTime(error.created_at)}</span>
                        {error.ai_diagnosis && (
                          <Brain className="w-4 h-4 text-purple-400" title="AI Diagnosed" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {getErrorsForStatus(column.id).length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No errors</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedError(null)}>
          <Card className="bg-gray-900 border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${SEVERITY_COLORS[selectedError.severity]}`} />
                <CardTitle className="text-white">{selectedError.severity.toUpperCase()} Error</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedError(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Message */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Error Message</p>
                <p className="text-white bg-gray-800 rounded-lg p-3 font-mono text-sm">{selectedError.error_message}</p>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Category</p>
                  <p className="text-white capitalize">{selectedError.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Service</p>
                  <p className="text-white">{selectedError.external_service || 'Internal'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Endpoint</p>
                  <p className="text-white font-mono text-sm">{selectedError.endpoint || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Occurrences</p>
                  <p className="text-white">{selectedError.occurrence_count}</p>
                </div>
              </div>

              {/* AI Diagnosis */}
              {selectedError.ai_diagnosis ? (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <p className="text-purple-400 font-semibold">AI Diagnosis</p>
                    <Badge variant="outline" className="ml-auto">{selectedError.ai_diagnosis.assigned_ai}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Root Cause</p>
                      <p className="text-white">{selectedError.ai_diagnosis.root_cause}</p>
                    </div>
                    
                    {selectedError.ai_diagnosis.suggested_fix && (
                      <div>
                        <p className="text-sm text-gray-400">Suggested Fix</p>
                        <p className="text-white">{selectedError.ai_diagnosis.suggested_fix}</p>
                      </div>
                    )}
                    
                    {selectedError.ai_diagnosis.code_snippet && (
                      <div>
                        <p className="text-sm text-gray-400">Code Fix</p>
                        <pre className="bg-gray-800 rounded p-2 text-sm text-green-400 overflow-x-auto">
                          {selectedError.ai_diagnosis.code_snippet}
                        </pre>
                      </div>
                    )}
                    
                    {selectedError.ai_diagnosis.estimated_time && (
                      <p className="text-sm text-gray-400">
                        Estimated fix time: <span className="text-white">{selectedError.ai_diagnosis.estimated_time}</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => analyzeError(selectedError.id)}
                  disabled={analyzing === selectedError.id}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {analyzing === selectedError.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Brain className="w-4 h-4 mr-2" /> Run AI Diagnosis</>
                  )}
                </Button>
              )}

              {/* Status Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                {selectedError.status !== 'in_progress' && selectedError.status !== 'resolved' && (
                  <Button 
                    onClick={() => { updateStatus(selectedError.id, 'in_progress'); setSelectedError(null); }}
                    variant="outline"
                    className="flex-1"
                  >
                    Mark In Progress
                  </Button>
                )}
                {selectedError.status !== 'resolved' && (
                  <Button 
                    onClick={() => { updateStatus(selectedError.id, 'resolved'); setSelectedError(null); }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


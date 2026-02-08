'use client';

/**
 * Admin Audit Log Viewer
 *
 * Compliance page showing all administrative actions across the platform.
 * Every admin action is logged here for accountability and audit purposes.
 *
 * Features:
 * - View all admin actions chronologically
 * - Filter by admin, action type, entity type
 * - Search by entity name
 * - Date range filtering
 * - Action breakdown statistics
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AuditLog {
  id: string;
  admin: {
    id: string;
    name: string;
    email: string | null;
    avatar: string | null;
  };
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  details: any;
  reason: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  returned: number;
  actionBreakdown: Record<string, number>;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async (retryCount = 0) => {
    try {
      setIsLoading(true);

      // Get session - the layout already ensures we're authenticated
      // So if session is null, wait a bit and retry (async race condition)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Retry up to 3 times with delay (layout may still be authenticating)
        if (retryCount < 3) {
          console.log(`Session not ready, retry ${retryCount + 1}/3...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchAuditLogs(retryCount + 1);
        }
        // After retries, just show empty state - don't redirect (layout handles auth)
        console.error('Could not get session after retries');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/admin/audit-log', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.entityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      actionFilter === 'all' || log.action === actionFilter;

    const matchesEntityType =
      entityTypeFilter === 'all' || log.entityType === entityTypeFilter;

    return matchesSearch && matchesAction && matchesEntityType;
  });

  // Action type config for styling
  const getActionConfig = (action: string) => {
    if (action.includes('suspend')) {
      return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle };
    } else if (action.includes('reactivate')) {
      return { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 };
    } else if (action.includes('delete')) {
      return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle };
    } else if (action.includes('note')) {
      return { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: FileText };
    } else if (action.includes('update') || action.includes('override')) {
      return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Activity };
    }
    return { color: 'bg-white/10 text-white/70 border-white/20', icon: Activity };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-bold">Audit Log</h1>
        </div>
        <p className="text-white/70">
          Complete record of all administrative actions for compliance and accountability
        </p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Total Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/70">Total Actions</p>
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </motion.div>

          {/* Suspensions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-red-400">Suspensions</p>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-400">
              {Object.entries(stats.actionBreakdown)
                .filter(([key]) => key.includes('suspend'))
                .reduce((sum, [, count]) => sum + count, 0)}
            </p>
          </motion.div>

          {/* Reactivations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-400">Reactivations</p>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">
              {Object.entries(stats.actionBreakdown)
                .filter(([key]) => key.includes('reactivate'))
                .reduce((sum, [, count]) => sum + count, 0)}
            </p>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-cyan-400">Notes Added</p>
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-cyan-400">
              {Object.entries(stats.actionBreakdown)
                .filter(([key]) => key.includes('note'))
                .reduce((sum, [, count]) => sum + count, 0)}
            </p>
          </motion.div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            placeholder="Search by admin, entity, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-3
              bg-white/5 backdrop-blur-sm
              border border-white/10
              rounded-lg
              text-white placeholder:text-white/50
              focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
              transition-all duration-200
            "
          />
        </div>

        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="
            px-4 py-3
            bg-white/5 backdrop-blur-sm
            border border-white/10
            rounded-lg
            text-white
            focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
            transition-all duration-200
            cursor-pointer
          "
        >
          <option value="all" className="bg-[#1A1A2E]">All Actions</option>
          <option value="suspend_agency" className="bg-[#1A1A2E]">Suspend Agency</option>
          <option value="reactivate_agency" className="bg-[#1A1A2E]">Reactivate Agency</option>
          <option value="suspend_candidate" className="bg-[#1A1A2E]">Suspend Candidate</option>
          <option value="reactivate_candidate" className="bg-[#1A1A2E]">Reactivate Candidate</option>
          <option value="add_admin_note" className="bg-[#1A1A2E]">Add Note</option>
        </select>

        {/* Entity Type Filter */}
        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="
            px-4 py-3
            bg-white/5 backdrop-blur-sm
            border border-white/10
            rounded-lg
            text-white
            focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
            transition-all duration-200
            cursor-pointer
          "
        >
          <option value="all" className="bg-[#1A1A2E]">All Entities</option>
          <option value="agency" className="bg-[#1A1A2E]">Agencies</option>
          <option value="candidate" className="bg-[#1A1A2E]">Candidates</option>
          <option value="job" className="bg-[#1A1A2E]">Jobs</option>
          <option value="application" className="bg-[#1A1A2E]">Applications</option>
        </select>
      </div>

      {/* Audit Log Timeline */}
      <div className="space-y-4">
        {filteredLogs.map((log, index) => {
          const actionConfig = getActionConfig(log.action);
          const ActionIcon = actionConfig.icon;
          const isExpanded = expandedLogId === log.id;

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="
                bg-white/5 backdrop-blur-sm
                border border-white/10
                rounded-xl p-6
                hover:bg-white/10 hover:border-white/20
                transition-all duration-200
              "
            >
              <div className="flex items-start gap-4">
                {/* Admin Avatar */}
                <Avatar className="w-10 h-10 border-2 border-white/20 flex-shrink-0">
                  <AvatarImage src={log.admin.avatar || undefined} />
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-sm">
                    {log.admin.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Log Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">
                        {log.admin.name}
                        <span className="text-white/50 font-normal ml-2">
                          {log.admin.email}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={actionConfig.color}>
                          <ActionIcon className="w-3 h-3 mr-1" />
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-white/70">on</span>
                        <Badge variant="outline" className="border-white/20 text-white/70">
                          {log.entityType}
                        </Badge>
                        {log.entityName && (
                          <span className="text-sm text-white/90 font-medium">
                            {log.entityName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm text-white/50 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(log.createdAt)}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpandedLogId(isExpanded ? null : log.id)
                        }
                        className="text-white/70 hover:text-white"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Reason */}
                  {log.reason && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2">
                      <p className="text-xs text-white/50 mb-1">Reason</p>
                      <p className="text-sm text-white/90">{log.reason}</p>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && log.details && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 mt-3"
                    >
                      <p className="text-xs text-white/50 mb-2">Additional Details</p>
                      <pre className="text-xs text-white/70 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredLogs.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-white/30 mb-4" />
            <p className="text-white/70">No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

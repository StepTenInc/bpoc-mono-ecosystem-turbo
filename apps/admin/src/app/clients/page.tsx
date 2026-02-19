'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Briefcase, Search, Loader2, ExternalLink, CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shared/ui/tooltip';

type VerificationData = {
  summary?: string;
  checkedAt?: string;
  sources?: string[];
  [key: string]: unknown;
};

type ClientRow = {
  id: string;
  status: string;
  createdAt: string;
  agencyId: string;
  agencyName: string;
  companyId: string;
  companyName: string;
  companyIndustry?: string | null;
  companyLogoUrl?: string | null;
  companyWebsite?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  jobCount: number;
  activeJobCount: number;
  verificationStatus?: 'verified' | 'unverified' | 'suspicious';
  verificationData?: VerificationData | null;
};

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const verificationBadgeStyles: Record<string, { className: string; icon: React.ElementType; label: string }> = {
  verified: {
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
    label: '✓ Verified',
  },
  unverified: {
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: HelpCircle,
    label: '? Unverified',
  },
  suspicious: {
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertTriangle,
    label: '⚠ Suspicious',
  },
};

function VerificationBadge({ status, summary }: { status?: string; summary?: string }) {
  const style = verificationBadgeStyles[status || 'unverified'] || verificationBadgeStyles.unverified;
  const Icon = style.icon;
  
  const badge = (
    <Badge variant="outline" className={`${style.className} text-xs cursor-help`}>
      <Icon className="h-3 w-3 mr-1" />
      {style.label}
    </Badge>
  );

  if (!summary) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs bg-gray-900 border-white/10 text-white">
          <p className="text-sm">{summary}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error('Failed to fetch admin clients:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Search is applied server-side and client-side (server is best-effort); keep UI snappy while typing.
  useEffect(() => {
    const t = setTimeout(() => fetchClients(), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.status === 'active').length;
    const pending = clients.filter((c) => c.status === 'pending').length;
    const jobs = clients.reduce((sum, c) => sum + (c.jobCount || 0), 0);
    const verified = clients.filter((c) => c.verificationStatus === 'verified').length;
    const unverified = clients.filter((c) => c.verificationStatus === 'unverified' || !c.verificationStatus).length;
    const suspicious = clients.filter((c) => c.verificationStatus === 'suspicious').length;
    return { total, active, pending, jobs, verified, unverified, suspicious };
  }, [clients]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Clients</h1>
        <p className="text-gray-400 mt-1">Companies connected to agencies (and their job activity)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: stats.total, icon: Building2, color: 'bg-white/5 border-white/10' },
          { label: 'Active', value: stats.active, icon: Building2, color: 'bg-emerald-500/5 border-emerald-500/20' },
          { label: 'Pending', value: stats.pending, icon: Building2, color: 'bg-orange-500/5 border-orange-500/20' },
          { label: 'Total Jobs', value: stats.jobs, icon: Briefcase, color: 'bg-purple-500/5 border-purple-500/20' },
        ].map((s) => (
          <Card key={s.label} className={`${s.color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-400 text-sm">{s.label}</p>
              </div>
              <s.icon className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Verified ✅', value: stats.verified, icon: ShieldCheck, color: 'bg-emerald-500/5 border-emerald-500/20', desc: 'Online presence confirmed' },
          { label: 'Unverified ⚠️', value: stats.unverified, icon: ShieldQuestion, color: 'bg-amber-500/5 border-amber-500/20', desc: 'Limited info found' },
          { label: 'Suspicious 🚨', value: stats.suspicious, icon: ShieldAlert, color: 'bg-red-500/5 border-red-500/20', desc: 'No online presence, needs review' },
        ].map((s) => (
          <Card key={s.label} className={`${s.color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-400 text-sm">{s.label}</p>
                <p className="text-gray-500 text-xs mt-1">{s.desc}</p>
              </div>
              <s.icon className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search companies, agencies, industry, contact email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="" disabled>────────────</option>
          <option value="verified">✓ Verified Only</option>
          <option value="unverified">? Unverified Only</option>
          <option value="suspicious">⚠ Suspicious Only</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading clients...</p>
        </div>
      ) : clients.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-10 text-center text-gray-400">No clients found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((client, idx) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card className={`bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all ${
                client.verificationStatus === 'suspicious' ? 'border-red-500/40 ring-1 ring-red-500/20' : ''
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-cyan-400" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold truncate">{client.companyName}</p>
                            <VerificationBadge
                              status={client.verificationStatus}
                              summary={client.verificationData?.summary}
                            />
                          </div>
                          <p className="text-gray-500 text-sm truncate">
                            {client.companyIndustry || 'No industry'} • Agency: {client.agencyName}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline" className={statusStyles[client.status] || statusStyles.pending}>
                          {client.status}
                        </Badge>
                        <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20">
                          Jobs: {client.jobCount}
                        </Badge>
                        <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20">
                          Active: {client.activeJobCount}
                        </Badge>
                        {client.primaryContactEmail && (
                          <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20">
                            {client.primaryContactEmail}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/admin/agencies/${client.agencyId}`}
                        className="text-sm text-cyan-400 hover:text-cyan-300"
                        title="View agency"
                      >
                        View Agency
                      </Link>
                      {client.companyWebsite && (
                        <a
                          href={client.companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white"
                          title="Open company website"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}






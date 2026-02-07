'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Briefcase,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { useRouter } from 'next/navigation';
import { StatsCard } from '@/components/admin/StatsCard';
import { FilterBar } from '@/components/admin/FilterBar';
import { EmptyState } from '@/components/admin/EmptyState';
import { getSessionToken } from '@/lib/auth-helpers';

interface CounterOffer {
  id: string;
  offerId: string;
  status: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  agency: string;
  client: string;
  originalSalary: number;
  requestedSalary: number;
  difference: number;
  percentageIncrease: number;
  currency: string;
  salaryType: string;
  candidateMessage?: string;
  employerResponse?: string;
  responseType?: string;
  createdAt: string;
  respondedAt?: string;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  averageIncrease: number;
  acceptanceRate: number;
}

const statusConfig: Record<string, { label: string; color: string; textColor: string }> = {
  pending: {
    label: 'Pending',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    textColor: 'text-orange-400'
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    textColor: 'text-green-400'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    textColor: 'text-red-400'
  }
};

const formatCurrency = (amount: number, currency: string) => {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'PHP': '₱',
    'EUR': '€',
    'GBP': '£'
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
};

export default function AdminCounterOffersPage() {
  const router = useRouter();
  const [counterOffers, setCounterOffers] = useState<CounterOffer[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, accepted: 0, rejected: 0, averageIncrease: 0, acceptanceRate: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCounterOffers();
  }, []);

  const fetchCounterOffers = async () => {
    setLoading(true);
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/admin/counter-offers', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();

      if (response.ok) {
        setCounterOffers(data.counterOffers || []);
        setStats(data.stats || { total: 0, pending: 0, accepted: 0, rejected: 0, averageIncrease: 0, acceptanceRate: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch counter offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredCounterOffers = useMemo(() => {
    return counterOffers.filter(co => {
      if (statusFilter !== 'all' && co.status !== statusFilter) return false;

      const query = searchQuery.toLowerCase();
      return (
        co.candidateName.toLowerCase().includes(query) ||
        co.jobTitle.toLowerCase().includes(query) ||
        co.agency.toLowerCase().includes(query)
      );
    });
  }, [counterOffers, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Counter Offers Monitoring</h1>
        <p className="text-white/70">Track salary negotiations across the platform</p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatsCard
          label="Total Counters"
          value={stats.total}
          icon={DollarSign}
          color="gray"
          delay={0}
        />
        <StatsCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="orange"
          delay={0.1}
        />
        <StatsCard
          label="Accepted"
          value={stats.accepted}
          icon={CheckCircle2}
          color="green"
          delay={0.2}
        />
        <StatsCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="red"
          delay={0.3}
        />
        <StatsCard
          label="Avg Increase"
          value={`${stats.averageIncrease.toFixed(1)}%`}
          icon={TrendingUp}
          color="cyan"
          delay={0.4}
        />
        <StatsCard
          label="Acceptance Rate"
          value={`${stats.acceptanceRate.toFixed(1)}%`}
          icon={Percent}
          color="cyan"
          delay={0.5}
        />
      </div>

      {/* Search & Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'all', label: 'All Status' },
          { value: 'pending', label: 'Pending' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'rejected', label: 'Rejected' },
        ]}
      />

      {/* Counter Offers Grid */}
      {filteredCounterOffers.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No Counter Offers Found"
          description="No counter offers match your current filters."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchQuery('');
              setStatusFilter('all');
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCounterOffers.map((counterOffer, index) => {
            const statusStyle = statusConfig[counterOffer.status] || statusConfig.pending;

            return (
              <motion.div
                key={counterOffer.id}
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
                {/* Candidate Header */}
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="w-12 h-12 border-2 border-white/20">
                    <AvatarImage src={counterOffer.candidateAvatar} />
                    <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                      {counterOffer.candidateName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white truncate">{counterOffer.candidateName}</h3>
                      <Badge className={statusStyle.color}>
                        {statusStyle.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/70 truncate">{counterOffer.candidateEmail}</p>
                  </div>
                </div>

                {/* 4-Panel Salary Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {/* Panel 1: Original Offer */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/50 mb-1">Original</p>
                    <p className="text-lg font-bold text-white truncate">
                      {formatCurrency(counterOffer.originalSalary, counterOffer.currency)}
                    </p>
                    <p className="text-xs text-white/50 mt-1 truncate">/{counterOffer.salaryType}</p>
                  </div>

                  {/* Panel 2: Requested */}
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <p className="text-xs text-orange-400 mb-1">Requested</p>
                    <p className="text-lg font-bold text-orange-400 truncate">
                      {formatCurrency(counterOffer.requestedSalary, counterOffer.currency)}
                    </p>
                    <p className="text-xs text-orange-400/70 mt-1 truncate">
                      +{counterOffer.percentageIncrease.toFixed(1)}%
                    </p>
                  </div>

                  {/* Panel 3: Difference */}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                    <p className="text-xs text-cyan-400 mb-1">Difference</p>
                    <p className="text-lg font-bold text-cyan-400 truncate">
                      +{formatCurrency(counterOffer.difference, counterOffer.currency)}
                    </p>
                  </div>

                  {/* Panel 4: Status */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col justify-center">
                    <p className="text-xs text-white/50 mb-1">Status</p>
                    <p className={`text-sm font-semibold ${statusStyle.textColor}`}>
                      {statusStyle.label}
                    </p>
                  </div>
                </div>

                {/* Job & Agency Info */}
                <div className="space-y-2 mb-6 bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-white/50 flex-shrink-0" />
                    <span className="text-white/70 truncate">{counterOffer.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-white/50 flex-shrink-0" />
                    <span className="text-white/70 truncate">{counterOffer.agency}</span>
                    {counterOffer.client && <span className="text-white/50 truncate hidden sm:inline">• {counterOffer.client}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-white/50 flex-shrink-0" />
                    <span className="text-white/70 truncate">
                      Created {formatDate(counterOffer.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Candidate Justification Message */}
                {counterOffer.candidateMessage && (
                  <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-cyan-400 mb-1">
                          Candidate's Justification
                        </p>
                        <p className="text-sm text-white/70 line-clamp-3">
                          {counterOffer.candidateMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white"
                    onClick={() => router.push(`/admin/offers?offerId=${counterOffer.offerId}`)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Offer
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white"
                    onClick={() => router.push(`/admin/candidates/${counterOffer.candidateId}`)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    View Candidate
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

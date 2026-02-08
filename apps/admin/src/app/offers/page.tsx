'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  Search,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Loader2,
  Briefcase,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';

interface Offer {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  company?: string;
  agency?: string;
  salaryOffered: number;
  salaryType: string;
  currency: string;
  startDate?: string;
  benefits: string[];
  status: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  candidateResponse?: string;
  rejectionReason?: string;
  counterOffersCount?: number;
  latestCounterOffer?: {
    requestedSalary: number;
    currency: string;
    status: string;
    message: string;
  };
  createdAt: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      const response = await fetch(`/api/admin/offers?status=${statusFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ElementType }> = {
      draft: { bg: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
      sent: { bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Send },
      viewed: { bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Eye },
      accepted: { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
      rejected: { bg: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
      negotiating: { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: TrendingUp },
      countered: { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: TrendingUp },
      expired: { bg: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
      withdrawn: { bg: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
    };
    const style = styles[status] || styles.draft;
    const Icon = style.icon;
    return (
      <Badge variant="outline" className={`${style.bg} capitalize`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatSalary = (amount: number, currency: string, type: string) => {
    const formatted = Number(amount).toLocaleString();
    return `${currency} ${formatted}/${type || 'monthly'}`;
  };

  const filteredOffers = offers.filter(offer =>
    (offer.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (offer.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (offer.agency || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count by status
  const statusCounts = offers.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const negotiatingCount = offers.filter(o => o.counterOffersCount && o.counterOffersCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Job Offers</h1>
          <p className="text-gray-400 mt-1">Monitor offers sent to candidates across all agencies</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
          <Eye className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-400">View Only</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-white">{offers.length}</p>
            <p className="text-gray-400 text-xs">Total Offers</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-cyan-400">{statusCounts['sent'] || 0}</p>
            <p className="text-gray-400 text-xs">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-orange-400">{negotiatingCount}</p>
            <p className="text-gray-400 text-xs">Negotiating</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{statusCounts['accepted'] || 0}</p>
            <p className="text-gray-400 text-xs">Accepted</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-red-400">{statusCounts['rejected'] || 0}</p>
            <p className="text-gray-400 text-xs">Declined</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="sent">Pending</option>
          <option value="viewed">Viewed</option>
          <option value="countered">Counter-offered</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Declined</option>
        </select>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading offers...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Gift className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Offers Yet</h3>
            <p className="text-gray-400">Offers will appear here when recruiters send them to candidates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`border-white/10 transition-all ${
                offer.status === 'accepted' ? 'bg-emerald-500/5 border-emerald-500/30' :
                offer.counterOffersCount ? 'bg-orange-500/5 border-orange-500/20' :
                'bg-white/5 hover:border-purple-500/30'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={offer.candidateAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm">
                          {offer.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-white font-medium">{offer.candidateName}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Briefcase className="h-3 w-3" />
                          <span>{offer.jobTitle}</span>
                          {offer.agency && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-cyan-400">{offer.agency}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Salary info */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-white font-medium">
                          <DollarSign className="h-4 w-4 text-emerald-400" />
                          {formatSalary(offer.salaryOffered, offer.currency, offer.salaryType)}
                        </div>
                        {offer.startDate && (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Calendar className="h-3 w-3" />
                            Start: {new Date(offer.startDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-2">
                        {getStatusBadge(offer.status)}
                        {offer.counterOffersCount && offer.counterOffersCount > 0 && (
                          <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {offer.counterOffersCount} counter{offer.counterOffersCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Dates */}
                      <span className="text-gray-500 text-xs">
                        {offer.sentAt && `Sent ${new Date(offer.sentAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Accepted message */}
                  {offer.status === 'accepted' && (
                    <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-emerald-300 text-sm">
                        🎉 <span className="font-medium">Hired!</span> {offer.candidateName} accepted this offer
                        {offer.respondedAt && ` on ${new Date(offer.respondedAt).toLocaleDateString()}`}.
                      </p>
                    </div>
                  )}
                  
                  {/* Counter offer info */}
                  {offer.latestCounterOffer && offer.status !== 'accepted' && (
                    <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-orange-300 text-sm">
                        <span className="font-medium">Counter-offer:</span>{' '}
                        {formatSalary(offer.latestCounterOffer.requestedSalary, offer.latestCounterOffer.currency, offer.salaryType)}
                        {offer.latestCounterOffer.message && (
                          <span className="text-orange-400/80"> - "{offer.latestCounterOffer.message}"</span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {/* Rejection reason */}
                  {offer.status === 'rejected' && offer.rejectionReason && (
                    <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-300 text-sm">
                        <span className="font-medium">Declined:</span> {offer.rejectionReason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/5">
        <p>Offer creation and negotiation are managed by recruiters in the Agency Portal</p>
      </div>
    </div>
  );
}

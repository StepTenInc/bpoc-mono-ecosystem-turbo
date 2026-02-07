'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Search, DollarSign, Calendar, CheckCircle, XCircle, Clock, Loader2, Briefcase,
  PartyPopper, AlertCircle, Filter, ChevronDown, Mail, Eye, Timer, FileSignature,
  MessageSquare, History, ChevronRight, TrendingUp, Send, X, AlertTriangle, Video, Ban
} from 'lucide-react';
import { VideoCallButton } from '@/components/video';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import { StatusStepper } from '@/components/shared/ui/status-stepper';
import { CounterOfferManager } from '@/components/recruiter/CounterOfferManager';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';
import Link from 'next/link';

interface NegotiationEntry {
  id: string;
  type: 'offer_sent' | 'counter_offer' | 'note' | 'viewed' | 'accepted' | 'rejected';
  amount?: number;
  currency?: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

interface OfferCall {
  id: string;
  createdAt: string;
  endedAt?: string;
  status: string;
  duration?: number;
  rating?: number;
  notes?: string;
}

interface CounterOffer {
  id: string;
  requestedSalary: number;
  requestedCurrency: string;
  candidateMessage?: string;
  employerResponse?: string;
  responseType?: string;
  status: string;
  createdAt: string;
  respondedAt?: string;
}

interface Offer {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId?: string;
  jobTitle: string;
  applicationId?: string;
  salaryOffered: number;
  currency: string;
  salaryType: string;
  startDate?: string;
  benefits?: any;
  additionalTerms?: string;
  status: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  candidateResponse?: string;
  rejectionReason?: string;
  counterOffers?: CounterOffer[];
  offerCalls?: OfferCall[];
  negotiationHistory?: NegotiationEntry[];
}

// Offer pipeline steps
const OFFER_STEPS = [
  { key: 'draft', label: 'Draft', icon: Gift },
  { key: 'sent', label: 'Sent', icon: Send },
  { key: 'viewed', label: 'Viewed', icon: Eye },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
];

// Countdown Timer Component
function ExpirationCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Mark as urgent if less than 24 hours
      setIsUrgent(days === 0);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (isExpired) {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expired
      </Badge>
    );
  }

  return (
    <Badge className={`${
      isUrgent 
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' 
        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }`}>
      <Timer className="h-3 w-3 mr-1" />
      {timeLeft} left
    </Badge>
  );
}

// Offer Details Component - Shows ALL offer information
function OfferDetails({ offer }: { offer: Offer }) {
  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <FileSignature className="h-4 w-4" />
        Complete Offer Details
      </h4>

      {/* Compensation */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-white/5">
        <div>
          <p className="text-xs text-gray-500 mb-1">Offered Salary</p>
          <p className="text-white font-semibold">{offer.currency} {offer.salaryOffered.toLocaleString()}</p>
          <p className="text-xs text-gray-400">per {offer.salaryType}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Start Date</p>
          <p className="text-white">{offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'TBD'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Offer Status</p>
          <Badge variant="outline" className={
            offer.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            offer.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
            'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }>
            {offer.status}
          </Badge>
        </div>
      </div>

      {/* Benefits */}
      {offer.benefits && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Benefits Package</p>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex flex-wrap gap-2">
              {Array.isArray(offer.benefits) ? (
                offer.benefits.map((benefit: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {benefit}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-400">Benefits included</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Terms */}
      {offer.additionalTerms && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Additional Terms & Conditions</p>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{offer.additionalTerms}</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Sent On</p>
          <p className="text-sm text-white">{offer.sentAt ? new Date(offer.sentAt).toLocaleString() : 'Not sent'}</p>
        </div>
        {offer.viewedAt && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Viewed On</p>
            <p className="text-sm text-white">{new Date(offer.viewedAt).toLocaleString()}</p>
          </div>
        )}
        {offer.respondedAt && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Responded On</p>
            <p className="text-sm text-white">{new Date(offer.respondedAt).toLocaleString()}</p>
          </div>
        )}
        {offer.expiresAt && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Expires On</p>
            <p className="text-sm text-white">{new Date(offer.expiresAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Rejection Reason */}
      {offer.status === 'rejected' && offer.rejectionReason && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-gray-500 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-400">{offer.rejectionReason}</p>
        </div>
      )}

      {/* Candidate Response */}
      {offer.candidateResponse && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-gray-500 mb-1">Candidate's Response</p>
          <p className="text-sm text-amber-400">{offer.candidateResponse}</p>
        </div>
      )}

      {/* Offer Negotiation Calls */}
      {offer.offerCalls && offer.offerCalls.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
            <Video className="h-3 w-3" />
            Offer Discussion Calls ({offer.offerCalls.length})
          </p>
          <div className="space-y-2">
            {offer.offerCalls.map((call: OfferCall) => (
              <div key={call.id} className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
                      {call.status}
                    </Badge>
                    <span className="text-sm text-white">
                      {new Date(call.createdAt).toLocaleDateString()} at {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {call.duration && (
                    <span className="text-xs text-gray-400">{Math.round(call.duration / 60)}m</span>
                  )}
                </div>
                {call.notes && (
                  <p className="text-xs text-gray-400 mt-2">{call.notes}</p>
                )}
                {call.rating && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs text-amber-400">★ {call.rating}/5</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Negotiation History Component
function NegotiationHistory({ history, currency }: { history: NegotiationEntry[]; currency: string }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
        <History className="h-4 w-4" />
        Negotiation History
      </h4>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {history.map((entry, index) => (
          <div
            key={entry.id || index}
            className="flex items-start gap-3 text-sm"
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 ${
              entry.type === 'accepted' ? 'bg-emerald-500' :
              entry.type === 'rejected' ? 'bg-red-500' :
              entry.type === 'counter_offer' ? 'bg-amber-500' :
              entry.type === 'offer_sent' ? 'bg-cyan-500' :
              'bg-gray-500'
            }`} />
            <div className="flex-1">
              <p className="text-gray-300">
                {entry.type === 'offer_sent' && `Initial offer: ${currency} ${entry.amount?.toLocaleString()}`}
                {entry.type === 'counter_offer' && `Counter offer: ${currency} ${entry.amount?.toLocaleString()}`}
                {entry.type === 'viewed' && 'Candidate viewed the offer'}
                {entry.type === 'accepted' && 'Offer accepted! 🎉'}
                {entry.type === 'rejected' && 'Offer declined'}
                {entry.type === 'note' && entry.note}
              </p>
              <p className="text-gray-500 text-xs">
                {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {entry.createdBy && ` • ${entry.createdBy}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// E-Signature Placeholder Component
function ESignaturePlaceholder() {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <FileSignature className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">E-Signature Ready</p>
          <p className="text-gray-400 text-xs">Send offer letter for electronic signature</p>
        </div>
        <Button
          size="sm"
          className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
          onClick={() => toast.info('E-signature integration coming soon!')}
        >
          <FileSignature className="h-4 w-4 mr-1" />
          Send for Signature
        </Button>
      </div>
    </div>
  );
}

export default function RecruiterOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (user?.id) fetchOffers();
  }, [user?.id]);

  const fetchOffers = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/offers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
      const data = await response.json();
      if (response.ok) setOffers(data.offers || []);
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string; bgColor: string }> = {
      sent: { 
        color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', 
        icon: <Send className="h-3 w-3" />,
        label: 'Sent',
        bgColor: 'bg-cyan-500/5 border-cyan-500/30'
      },
      viewed: { 
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
        icon: <Eye className="h-3 w-3" />,
        label: 'Viewed',
        bgColor: 'bg-purple-500/5 border-purple-500/30'
      },
      accepted: { 
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Accepted',
        bgColor: 'bg-emerald-500/5 border-emerald-500/30'
      },
      rejected: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        icon: <XCircle className="h-3 w-3" />,
        label: 'Declined',
        bgColor: 'bg-red-500/5 border-red-500/30'
      },
    };
    return configs[status] || configs.sent;
  };

  const formatSalary = (offer: Offer) => {
    const formatted = Number(offer.salaryOffered).toLocaleString();
    return `${offer.currency} ${formatted}`;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const sent = new Date(date);
    const diffDays = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const handleWithdrawClick = (offerId: string) => {
    setSelectedOfferId(offerId);
    setWithdrawalReason('');
    setWithdrawDialogOpen(true);
  };

  const handleWithdrawOffer = async () => {
    if (!selectedOfferId || !withdrawalReason.trim()) {
      toast.error('Please provide a withdrawal reason');
      return;
    }

    setWithdrawing(true);
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/offers/${selectedOfferId}/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          withdrawalReason: withdrawalReason.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Offer withdrawn successfully');
        setWithdrawDialogOpen(false);
        setSelectedOfferId(null);
        setWithdrawalReason('');
        fetchOffers(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to withdraw offer');
      }
    } catch (error) {
      console.error('Error withdrawing offer:', error);
      toast.error('Failed to withdraw offer');
    } finally {
      setWithdrawing(false);
    }
  };

  const statuses = ['all', 'sent', 'viewed', 'accepted', 'rejected'];
  
  const filtered = offers.filter(o => {
    const matchesSearch = (o.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (o.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group offers
  const pending = filtered.filter(o => ['sent', 'viewed'].includes(o.status));
  const accepted = filtered.filter(o => o.status === 'accepted');
  const declined = filtered.filter(o => o.status === 'rejected');

  const stats = {
    total: offers.length,
    pending: offers.filter(o => ['sent', 'viewed'].includes(o.status)).length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    declined: offers.filter(o => o.status === 'rejected').length,
    acceptanceRate: offers.length > 0 
      ? Math.round((offers.filter(o => o.status === 'accepted').length / offers.filter(o => ['accepted', 'rejected'].includes(o.status)).length) * 100) || 0
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Job Offers</h1>
          <p className="text-gray-400 mt-1">Track offers and manage negotiations</p>
        </div>
        <Link href="/recruiter/interviews">
          <Button className="bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
            <Gift className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-gray-400 text-sm">Total Sent</p>
          </CardContent>
        </Card>
        <Card className="bg-cyan-500/5 backdrop-blur-xl border-cyan-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{stats.pending}</p>
            <p className="text-gray-400 text-sm">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 backdrop-blur-xl border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.accepted}</p>
            <p className="text-gray-400 text-sm">Accepted</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 backdrop-blur-xl border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.declined}</p>
            <p className="text-gray-400 text-sm">Declined</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/5 backdrop-blur-xl border-purple-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.acceptanceRate}%</p>
            <p className="text-gray-400 text-sm">Acceptance Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search candidates..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-10 bg-white/5 border-white/10 text-white" 
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/10 text-gray-400">
              <Filter className="h-4 w-4 mr-2" />
              {statusFilter === 'all' ? 'All Status' : getStatusConfig(statusFilter).label}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0a0a0f] border-white/10">
            {statuses.map((status) => (
              <DropdownMenuItem 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-gray-300 hover:text-white cursor-pointer ${statusFilter === status ? 'bg-white/10' : ''}`}
              >
                {status === 'all' ? 'All Status' : getStatusConfig(status).label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-12 text-center">
            <Gift className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Offers</h3>
            <p className="text-gray-400 mb-4">Send offers from the Interviews page after candidates pass.</p>
            <Link href="/recruiter/interviews">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-600">
                Go to Interviews
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Accepted Offers - Hired! */}
          {accepted.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <PartyPopper className="h-5 w-5 text-emerald-400" />
                Hired! ({accepted.length})
              </h2>
              {accepted.map((offer, i) => {
                const statusConfig = getStatusConfig(offer.status);
                const isExpanded = expandedOffer === offer.id;
                
                return (
                  <motion.div key={offer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="bg-white/5 backdrop-blur-xl border-emerald-500/30 overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={offer.candidateAvatar} />
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm">
                                {offer.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-semibold">{offer.candidateName}</h3>
                                <Badge variant="outline" className={statusConfig.color}>
                                  {statusConfig.icon}
                                  <span className="ml-1">{statusConfig.label}</span>
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm">{offer.jobTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-emerald-400 font-bold text-lg">{formatSalary(offer)}</p>
                              <p className="text-gray-400 text-sm">per {offer.salaryType}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedOffer(isExpanded ? null : offer.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </Button>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 space-y-4">
                                {/* Prominent Offer Call Button */}
                                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-white font-semibold mb-1">Discuss Offer with Candidate</h4>
                                      <p className="text-gray-400 text-sm">Schedule a call to negotiate or clarify offer terms</p>
                                    </div>
                                    {offer.candidateId && (
                                      <VideoCallButton
                                        candidateUserId={offer.candidateId}
                                        candidateName={offer.candidateName}
                                        candidateEmail={offer.candidateEmail}
                                        candidateAvatar={offer.candidateAvatar}
                                        jobId={offer.jobId}
                                        jobTitle={offer.jobTitle}
                                        applicationId={offer.applicationId}
                                        variant="prominent"
                                        context="offer_negotiation"
                                        label="Schedule Offer Call"
                                      />
                                    )}
                                  </div>
                                </div>
                                
                                {/* Complete Offer Details */}
                                <OfferDetails offer={offer} />
                                
                                {/* E-Signature */}
                                <ESignaturePlaceholder />
                                
                                {/* Negotiation History */}
                                <NegotiationHistory history={offer.negotiationHistory || []} currency={offer.currency} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pending Offers */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                Pending Response ({pending.length})
              </h2>
              {pending.map((offer, i) => {
                const statusConfig = getStatusConfig(offer.status);
                const isExpanded = expandedOffer === offer.id;
                
                return (
                  <motion.div key={offer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={offer.candidateAvatar} />
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-sm">
                                {offer.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-semibold">{offer.candidateName}</h3>
                                <Badge variant="outline" className={statusConfig.color}>
                                  {statusConfig.icon}
                                  <span className="ml-1">{statusConfig.label}</span>
                                </Badge>
                                {offer.expiresAt && (
                                  <ExpirationCountdown expiresAt={offer.expiresAt} />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-gray-400 text-sm">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {offer.jobTitle}
                                </span>
                                {offer.sentAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Sent {getTimeAgo(offer.sentAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {offer.candidateId && (
                              <VideoCallButton
                                candidateUserId={offer.candidateId}
                                candidateName={offer.candidateName}
                                candidateEmail={offer.candidateEmail}
                                candidateAvatar={offer.candidateAvatar}
                                jobId={offer.jobId}
                                jobTitle={offer.jobTitle}
                                applicationId={offer.applicationId}
                                variant="compact"
                                context="offers"
                              />
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWithdrawClick(offer.id)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Withdraw
                            </Button>
                            <div className="text-right">
                              <p className="text-white font-bold text-lg">{formatSalary(offer)}</p>
                              <p className="text-gray-400 text-sm">per {offer.salaryType}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedOffer(isExpanded ? null : offer.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </Button>
                          </div>
                        </div>

                        {/* Status Stepper */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <StatusStepper
                            steps={OFFER_STEPS}
                            currentStatus={offer.status}
                            variant="compact"
                          />
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 space-y-4">
                                {/* Prominent Offer Call Button */}
                                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-white font-semibold mb-1">Discuss Offer with Candidate</h4>
                                      <p className="text-gray-400 text-sm">Schedule a call to negotiate terms or answer questions</p>
                                    </div>
                                    {offer.candidateId && (
                                      <VideoCallButton
                                        candidateUserId={offer.candidateId}
                                        candidateName={offer.candidateName}
                                        candidateEmail={offer.candidateEmail}
                                        candidateAvatar={offer.candidateAvatar}
                                        jobId={offer.jobId}
                                        jobTitle={offer.jobTitle}
                                        applicationId={offer.applicationId}
                                        variant="prominent"
                                        context="offer_negotiation"
                                        label="Schedule Offer Call"
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Counter Offer Manager */}
                                <CounterOfferManager
                                  offerId={offer.id}
                                  originalSalary={offer.salaryOffered}
                                  currency={offer.currency}
                                  salaryType={offer.salaryType}
                                  candidateName={offer.candidateName}
                                  onActionComplete={fetchOffers}
                                />
                                
                                {/* Complete Offer Details */}
                                <OfferDetails offer={offer} />
                                
                                {/* E-Signature */}
                                <ESignaturePlaceholder />
                                
                                {/* Negotiation History */}
                                <NegotiationHistory history={offer.negotiationHistory || []} currency={offer.currency} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Declined Offers */}
          {declined.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <XCircle className="h-5 w-5 text-gray-400" />
                Declined ({declined.length})
              </h2>
              {declined.map((offer, i) => {
                const statusConfig = getStatusConfig(offer.status);
                return (
                  <motion.div key={offer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11">
                              <AvatarFallback className="bg-gray-600 text-white text-sm">
                                {offer.candidateName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-semibold">{offer.candidateName}</h3>
                                <Badge variant="outline" className={statusConfig.color}>
                                  {statusConfig.icon}
                                  <span className="ml-1">{statusConfig.label}</span>
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm mt-1">{offer.jobTitle}</p>
                            </div>
                          </div>
                          <p className="text-gray-500">{formatSalary(offer)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Withdraw Offer Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="bg-[#0a0a0f] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-400" />
              Withdraw Offer
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This action will withdraw the job offer and notify the candidate. Please provide a reason for withdrawal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Reason for Withdrawal <span className="text-red-400">*</span>
              </label>
              <Textarea
                placeholder="e.g., Position has been filled, Budget constraints, Candidate requirements changed..."
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
                disabled={withdrawing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawDialogOpen(false)}
              disabled={withdrawing}
              className="border-white/10 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawOffer}
              disabled={withdrawing || !withdrawalReason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {withdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Withdraw Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

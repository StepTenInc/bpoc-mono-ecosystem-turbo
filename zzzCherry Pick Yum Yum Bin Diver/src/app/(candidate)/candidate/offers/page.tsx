'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Briefcase,
  PartyPopper,
  ArrowRight,
  FileText,
  TrendingUp,
  FileSignature
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import CounterOfferModal from '@/components/candidate/CounterOfferModal';
import { ESignatureCapture } from '@/components/shared/offer/ESignatureCapture';

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
  jobId: string;
  jobTitle: string;
  company: string;
  salaryOffered: number;
  salaryType: string;
  currency: string;
  startDate?: string;
  benefits: string[];
  additionalTerms?: string;
  status: string;
  sentAt?: string;
  expiresAt?: string;
  createdAt: string;
  counterOffers?: CounterOffer[];
  latestCounter?: CounterOffer | null;
}

export default function CandidateOffersPage() {
  const { session } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [counterOfferModal, setCounterOfferModal] = useState<Offer | null>(null);
  const [signingOffer, setSigningOffer] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!session?.access_token) return;

      try {
        const response = await fetch('/api/candidate/offers', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
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

    fetchOffers();
  }, [session]);

  const handleRespond = async (offerId: string, action: 'accept' | 'reject') => {
    if (!session?.access_token) return;

    setResponding(offerId);

    try {
      const response = await fetch('/api/candidate/offers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ offerId, action }),
      });

      const data = await response.json();

      if (response.ok) {
        setOffers(prev => prev.map(o =>
          o.id === offerId
            ? { ...o, status: action === 'accept' ? 'accepted' : 'rejected' }
            : o
        ));
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setResponding(null);
    }
  };

  const formatSalary = (offer: Offer) => {
    const formatted = Number(offer.salaryOffered).toLocaleString();
    return `${offer.currency} ${formatted}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      viewed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      negotiating: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <Badge variant="outline" className={`${styles[status] || styles.sent} capitalize`}>
        {status}
      </Badge>
    );
  };

  const pendingOffers = offers.filter(o => ['sent', 'viewed', 'negotiating'].includes(o.status));
  const respondedOffers = offers.filter(o => ['accepted', 'rejected'].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Job Offers</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Review and respond to your job offers</p>
        </div>
        <Link href="/candidate/applications">
          <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 w-full sm:w-auto min-h-[44px]">
            <FileText className="h-4 w-4 mr-2" />
            View Applications
          </Button>
        </Link>
      </div>

      {/* Journey Context Banner */}
      {pendingOffers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-3">
            <PartyPopper className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-white font-medium">Congratulations! You have offers waiting! 🎉</p>
              <p className="text-gray-400 text-sm">Review the details carefully and respond to secure your new position.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3"
        >
          <PartyPopper className="h-5 w-5 text-emerald-400" />
          <p className="text-emerald-400">{successMessage}</p>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">
              {pendingOffers.length}
            </p>
            <p className="text-gray-400 text-sm">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {offers.filter(o => o.status === 'accepted').length}
            </p>
            <p className="text-gray-400 text-sm">Accepted</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">
              {offers.filter(o => o.status === 'rejected').length}
            </p>
            <p className="text-gray-400 text-sm">Declined</p>
          </CardContent>
        </Card>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Gift className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Offers Yet</h3>
            <p className="text-gray-400 mb-4">When you receive a job offer, it will appear here.</p>
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              onClick={() => window.location.href = '/candidate/jobs'}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Offers */}
          {pendingOffers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                Pending Response
              </h2>
              {pendingOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border-cyan-500/30">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">{offer.jobTitle}</h3>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Building2 className="h-4 w-4" />
                            <span>{offer.company}</span>
                          </div>
                        </div>
                        {getStatusBadge(offer.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <DollarSign className="h-4 w-4" />
                            Salary Offered
                          </div>
                          <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                            {formatSalary(offer)}
                            <span className="text-sm font-normal text-gray-400">/{offer.salaryType}</span>
                          </p>
                        </div>
                        {offer.startDate && (
                          <div className="p-4 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                              <Calendar className="h-4 w-4" />
                              Start Date
                            </div>
                            <p className="text-lg font-semibold text-white">
                              {new Date(offer.startDate).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {offer.benefits && offer.benefits.length > 0 && (
                        <div className="mb-6">
                          <p className="text-gray-400 text-sm mb-2">Benefits Included:</p>
                          <div className="flex flex-wrap gap-2">
                            {offer.benefits.map((benefit, i) => (
                              <Badge key={i} variant="outline" className="bg-white/5 text-gray-300 border-white/20">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {offer.additionalTerms && (
                        <div className="mb-6 p-3 rounded-lg bg-white/5">
                          <p className="text-gray-400 text-sm mb-1">Additional Terms:</p>
                          <p className="text-gray-300 text-sm">{offer.additionalTerms}</p>
                        </div>
                      )}

                      {/* Counter Offer Status */}
                      {offer.status === 'negotiating' && offer.latestCounter && (
                        <div className="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-5 w-5 text-orange-400" />
                            <h4 className="font-semibold text-orange-400">Counter Offer in Progress</h4>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Your Counter Offer:</span>
                              <span className="text-xl font-bold text-orange-400">
                                {offer.latestCounter.requestedCurrency} {offer.latestCounter.requestedSalary.toLocaleString()}
                                <span className="text-sm font-normal text-gray-400">/{offer.salaryType}</span>
                              </span>
                            </div>

                            {offer.latestCounter.candidateMessage && (
                              <div className="pt-2 border-t border-white/10">
                                <p className="text-gray-400 text-xs mb-1">Your Message:</p>
                                <p className="text-gray-300 text-sm italic">"{offer.latestCounter.candidateMessage}"</p>
                              </div>
                            )}

                            {offer.latestCounter.status === 'pending' && (
                              <div className="pt-2">
                                <p className="text-gray-400 text-sm">⏳ Waiting for employer response...</p>
                              </div>
                            )}

                            {offer.latestCounter.responseType === 'accepted' && offer.latestCounter.employerResponse && (
                              <div className="pt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <p className="text-emerald-400 font-medium text-sm mb-1">🎉 Counter Accepted!</p>
                                <p className="text-gray-300 text-sm">{offer.latestCounter.employerResponse}</p>
                              </div>
                            )}

                            {offer.latestCounter.responseType === 'rejected' && offer.latestCounter.employerResponse && (
                              <div className="pt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                <p className="text-red-400 font-medium text-sm mb-1">❌ Counter Declined</p>
                                <p className="text-gray-300 text-sm">{offer.latestCounter.employerResponse}</p>
                              </div>
                            )}

                            {offer.latestCounter.responseType === 'revised' && offer.latestCounter.employerResponse && (
                              <div className="pt-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                                <p className="text-cyan-400 font-medium text-sm mb-1">🔄 Revised Offer</p>
                                <p className="text-gray-300 text-sm">{offer.latestCounter.employerResponse}</p>
                              </div>
                            )}

                            <div className="pt-2">
                              <p className="text-gray-500 text-xs">
                                Submitted {new Date(offer.latestCounter.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                            onClick={() => handleRespond(offer.id, 'accept')}
                            disabled={responding === offer.id}
                          >
                            {responding === offer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {offer.status === 'negotiating' && offer.latestCounter?.responseType === 'accepted'
                                  ? 'Accept Counter Offer'
                                  : 'Accept Offer'}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleRespond(offer.id, 'reject')}
                            disabled={responding === offer.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                        {offer.status !== 'negotiating' && (
                          <Button
                            variant="outline"
                            className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                            onClick={() => setCounterOfferModal(offer)}
                            disabled={responding === offer.id}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Make Counter Offer
                          </Button>
                        )}
                        {offer.status === 'negotiating' && offer.latestCounter?.status === 'pending' && (
                          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                            <p className="text-orange-400 text-sm">
                              Counter offer submitted. Waiting for employer response...
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Responded Offers */}
          {respondedOffers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                Previous Offers
              </h2>
              {respondedOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-white/10 ${offer.status === 'accepted'
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-white/5'
                    }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{offer.jobTitle}</h3>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Building2 className="h-4 w-4" />
                            <span>{offer.company}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">{formatSalary(offer)}</p>
                          {getStatusBadge(offer.status)}
                        </div>
                      </div>
                      {offer.status === 'accepted' && (
                        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-emerald-300 text-sm">
                            🎉 Congratulations! You accepted this offer. Check your email for next steps.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterOfferModal && (
        <CounterOfferModal
          offer={counterOfferModal}
          isOpen={!!counterOfferModal}
          onClose={() => setCounterOfferModal(null)}
          onSuccess={() => {
            // Refresh offers
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

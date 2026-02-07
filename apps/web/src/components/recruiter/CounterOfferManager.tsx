'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Check,
  X,
  MessageSquare,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/shared/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';

interface CounterOffer {
  id: string;
  offerId: string;
  requestedSalary: number;
  requestedCurrency: string;
  candidateMessage: string | null;
  status: string;
  employerResponseSalary: number | null;
  employerResponseMessage: string | null;
  respondedAt: string | null;
  createdAt: string;
}

interface CounterOfferManagerProps {
  offerId: string;
  originalSalary: number;
  currency: string;
  salaryType: string;
  candidateName: string;
  onActionComplete?: () => void;
}

export function CounterOfferManager({
  offerId,
  originalSalary,
  currency,
  salaryType,
  candidateName,
  onActionComplete
}: CounterOfferManagerProps) {
  const { user } = useAuth();
  const [counterOffers, setCounterOffers] = useState<CounterOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCounterDialog, setShowCounterDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [revisedSalary, setRevisedSalary] = useState('');
  const [employerMessage, setEmployerMessage] = useState('');
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(null);

  useEffect(() => {
    fetchCounterOffers();
  }, [offerId]);

  const fetchCounterOffers = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/offers/${offerId}/counter`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });

      const data = await response.json();
      if (response.ok) {
        setCounterOffers(data.counterOffers || []);
      }
    } catch (error) {
      console.error('Failed to fetch counter offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (counterOfferId: string) => {
    setActionLoading(true);
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/offers/${offerId}/counter/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          counterOfferId,
          employerMessage: 'We accept your counter offer. Welcome to the team!'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Counter offer accepted! ${candidateName} is now hired! 🎉`);
        fetchCounterOffers();
        onActionComplete?.();
      } else {
        toast.error(data.error || 'Failed to accept counter offer');
      }
    } catch (error) {
      console.error('Failed to accept:', error);
      toast.error('Failed to accept counter offer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (sendNewCounter: boolean = false) => {
    if (!selectedCounterId) return;

    setActionLoading(true);
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/offers/${offerId}/counter/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          counterOfferId: selectedCounterId,
          employerMessage,
          sendNewCounter,
          revisedSalary: sendNewCounter ? parseFloat(revisedSalary) : undefined,
          revisedCurrency: currency
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(sendNewCounter ? 'New counter offer sent!' : 'Counter offer declined');
        setShowRejectDialog(false);
        setShowCounterDialog(false);
        setEmployerMessage('');
        setRevisedSalary('');
        setSelectedCounterId(null);
        fetchCounterOffers();
        onActionComplete?.();
      } else {
        toast.error(data.error || 'Failed to reject counter offer');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject counter offer');
    } finally {
      setActionLoading(false);
    }
  };

  const openCounterDialog = (counterOfferId: string) => {
    setSelectedCounterId(counterOfferId);
    setRevisedSalary(originalSalary.toString());
    setShowCounterDialog(true);
  };

  const openRejectDialog = (counterOfferId: string) => {
    setSelectedCounterId(counterOfferId);
    setShowRejectDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const pendingCounter = counterOffers.find(co => co.status === 'pending');

  if (!pendingCounter) {
    return null;
  }

  const difference = pendingCounter.requestedSalary - originalSalary;
  const percentageIncrease = ((difference / originalSalary) * 100).toFixed(1);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">Counter Offer Received</h3>
              </div>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1 text-sm">
                Pending Response
              </Badge>
            </div>

            {/* Salary Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <p className="text-sm font-medium text-gray-400 mb-2">Original Offer</p>
                <p className="text-2xl font-bold text-white mb-1">
                  {currency} {originalSalary.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">/ {salaryType}</p>
              </div>

              <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                   <TrendingUp className="h-24 w-24 text-orange-500 -mr-4 -mt-4" />
                </div>
                <p className="text-sm font-medium text-orange-400 mb-2">Candidate Requests</p>
                <p className="text-2xl font-bold text-white mb-1">
                  {pendingCounter.requestedCurrency} {pendingCounter.requestedSalary.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-orange-400">
                    +{currency} {difference.toLocaleString()}
                  </p>
                  <Badge className="bg-orange-500/20 text-orange-400 border-none text-xs">
                    {percentageIncrease}% increase
                  </Badge>
                </div>
              </div>
            </div>

            {/* Candidate Message */}
            {pendingCounter.candidateMessage && (
              <div className="mb-6 p-5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-3 mb-3">
                  <MessageSquare className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <p className="text-sm font-semibold text-cyan-400">Candidate's Justification</p>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed pl-8">
                  {pendingCounter.candidateMessage}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={() => handleAccept(pendingCounter.id)}
                disabled={actionLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 py-6 text-base"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Accept Counter
                  </>
                )}
              </Button>

              <Button
                onClick={() => openCounterDialog(pendingCounter.id)}
                disabled={actionLoading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 py-6 text-base"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                Send New Counter
              </Button>

              <Button
                onClick={() => openRejectDialog(pendingCounter.id)}
                disabled={actionLoading}
                variant="outline"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 py-6 text-base"
              >
                <X className="h-5 w-5 mr-2" />
                Decline
              </Button>
            </div>

            {/* Info Note */}
            <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <AlertCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-cyan-300/90 leading-relaxed">
                <span className="font-semibold text-cyan-400">Pro Tip:</span> Consider market rates and the candidate's experience level before responding.
                Accepting will immediately hire the candidate with the revised salary terms.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Send New Counter Dialog */}
      <Dialog open={showCounterDialog} onOpenChange={setShowCounterDialog}>
        <DialogContent className="bg-[#0F1419] border-white/10 text-gray-300">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Send New Counter Offer
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Propose a revised salary to {candidateName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Original vs Requested */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Original Offer:</span>
                <span className="text-white font-semibold">{currency} {originalSalary.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">They Requested:</span>
                <span className="text-orange-400 font-semibold">
                  {currency} {pendingCounter?.requestedSalary.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Revised Salary Input */}
            <div className="space-y-2">
              <Label htmlFor="revised-salary" className="text-gray-300">
                Your Counter Offer *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="revised-salary"
                  type="number"
                  value={revisedSalary}
                  onChange={(e) => setRevisedSalary(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                  placeholder="Enter amount"
                />
              </div>
              {revisedSalary && parseFloat(revisedSalary) > 0 && (
                <p className="text-sm text-gray-400">
                  Difference from original:
                  <span className={`ml-2 font-semibold ${
                    parseFloat(revisedSalary) > originalSalary ? 'text-orange-400' : 'text-cyan-400'
                  }`}>
                    {parseFloat(revisedSalary) > originalSalary ? '+' : ''}
                    {currency} {(parseFloat(revisedSalary) - originalSalary).toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300">
                Message to Candidate (Optional)
              </Label>
              <Textarea
                id="message"
                value={employerMessage}
                onChange={(e) => setEmployerMessage(e.target.value)}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                placeholder="Explain your counter offer..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowCounterDialog(false);
                  setEmployerMessage('');
                  setRevisedSalary('');
                }}
                variant="outline"
                className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReject(true)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                disabled={actionLoading || !revisedSalary || parseFloat(revisedSalary) <= 0}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Counter Offer'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-[#0F1419] border-white/10 text-gray-300">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Decline Counter Offer
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Let {candidateName} know why you're declining their counter offer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Warning */}
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">
                <strong>Note:</strong> Declining will revert the offer to its original terms.
                The candidate can choose to accept the original offer or withdraw.
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="reject-message" className="text-gray-300">
                Reason for Declining (Optional)
              </Label>
              <Textarea
                id="reject-message"
                value={employerMessage}
                onChange={(e) => setEmployerMessage(e.target.value)}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                placeholder="Explain why you cannot accept this counter offer..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowRejectDialog(false);
                  setEmployerMessage('');
                }}
                variant="outline"
                className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReject(false)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Declining...
                  </>
                ) : (
                  'Decline Counter Offer'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

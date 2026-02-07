'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, MessageSquare, Send, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';

interface CounterOfferModalProps {
  offer: {
    id: string;
    jobTitle: string;
    company: string;
    salaryOffered: number;
    currency: string;
    salaryType: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CounterOfferModal({
  offer,
  isOpen,
  onClose,
  onSuccess,
}: CounterOfferModalProps) {
  const [requestedSalary, setRequestedSalary] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedSalary) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/candidate/offers/counter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: offer.id,
          requestedSalary: parseFloat(requestedSalary),
          candidateMessage: message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setRequestedSalary('');
        setMessage('');
      } else {
        alert(data.error || 'Failed to submit counter offer');
      }
    } catch (error) {
      console.error('Failed to submit counter offer:', error);
      alert('Failed to submit counter offer');
    } finally {
      setSubmitting(false);
    }
  };

  const differencePercent = requestedSalary
    ? (((parseFloat(requestedSalary) - offer.salaryOffered) / offer.salaryOffered) * 100).toFixed(1)
    : '0';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#121217] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Make a Counter Offer</h2>
              <p className="text-gray-400 text-sm">{offer.jobTitle} at {offer.company}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Offer Info */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-gray-400 text-sm mb-1">Current Offer</p>
            <p className="text-2xl font-bold text-white">
              {offer.currency} {offer.salaryOffered.toLocaleString()}
              <span className="text-sm font-normal text-gray-400">/{offer.salaryType}</span>
            </p>
          </div>

          {/* Requested Salary */}
          <div>
            <Label htmlFor="requestedSalary" className="text-gray-300">
              Your Counter Offer *
            </Label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="requestedSalary"
                type="number"
                placeholder={`e.g. ${Math.round(offer.salaryOffered * 1.1)}`}
                value={requestedSalary}
                onChange={(e) => setRequestedSalary(e.target.value)}
                required
                className="pl-10 bg-white/5 border-white/10 text-white text-lg"
                min={offer.salaryOffered}
              />
            </div>
            {requestedSalary && parseFloat(requestedSalary) > offer.salaryOffered && (
              <p className="text-cyan-400 text-sm mt-2">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                +{differencePercent}% increase ({offer.currency} {(parseFloat(requestedSalary) - offer.salaryOffered).toLocaleString()} more)
              </p>
            )}
            {requestedSalary && parseFloat(requestedSalary) <= offer.salaryOffered && (
              <p className="text-orange-400 text-sm mt-2">
                ⚠️ Your counter should be higher than the current offer
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-gray-300">
              Explain Your Counter (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Share why you're requesting this amount. For example: based on my experience, market rates, or specific skills..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-2 bg-white/5 border-white/10 text-white resize-none"
            />
            <p className="text-gray-500 text-xs mt-1">
              A thoughtful explanation increases your chances of getting accepted
            </p>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <p className="text-cyan-400 font-medium text-sm mb-2">💡 Counter Offer Tips:</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Research market rates for this position</li>
              <li>• Justify with your experience and skills</li>
              <li>• Be realistic - huge jumps may get rejected</li>
              <li>• Stay professional and polite</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-white/10 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !requestedSalary || parseFloat(requestedSalary) <= offer.salaryOffered}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Counter Offer
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { DollarSign, Loader2, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CounterOfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  currentSalary: number;
  currency: string;
  salaryType: string;
  onSuccess: () => void;
}

export function CounterOfferDialog({
  isOpen,
  onClose,
  offerId,
  currentSalary,
  currency,
  salaryType,
  onSuccess,
}: CounterOfferDialogProps) {
  const { session } = useAuth();
  const [requestedSalary, setRequestedSalary] = useState(currentSalary.toString());
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const salary = parseFloat(requestedSalary);

    if (!salary || salary <= 0) {
      setError('Please enter a valid salary amount');
      return;
    }

    if (salary <= currentSalary) {
      setError('Counter offer must be higher than current offer');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/candidate/offers/${offerId}/counter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          requestedSalary: salary,
          requestedCurrency: currency,
          candidateMessage: message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to submit counter offer');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const difference = parseFloat(requestedSalary) - currentSalary;
  const percentageIncrease = currentSalary > 0
    ? ((difference / currentSalary) * 100).toFixed(1)
    : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1419] border-white/10 text-gray-300">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Submit Counter Offer
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Negotiate your salary. The employer will review your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current Offer */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Current Offer</p>
            <p className="text-lg font-bold text-white">
              {currency} {currentSalary.toLocaleString()}
              <span className="text-sm text-gray-400 ml-2">/ {salaryType}</span>
            </p>
          </div>

          {/* Requested Salary */}
          <div className="space-y-2">
            <Label htmlFor="requested-salary" className="text-gray-300">
              Your Counter Offer *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="requested-salary"
                type="number"
                value={requestedSalary}
                onChange={(e) => setRequestedSalary(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
                placeholder="Enter amount"
              />
            </div>

            {/* Difference Indicator */}
            {difference > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="text-emerald-400">
                  +{currency} {difference.toLocaleString()} ({percentageIncrease}% increase)
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300">
              Justification (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white/5 border-white/10 text-white min-h-[100px]"
              placeholder="Explain why you're requesting this salary (experience, market rate, skills, etc.)"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Counter Offer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

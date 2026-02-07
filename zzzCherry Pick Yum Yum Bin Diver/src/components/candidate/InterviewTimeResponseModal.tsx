'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { Button } from '@/components/shared/ui/button';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Calendar } from '@/components/shared/ui/calendar';
import { Loader2, Clock, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import { getSessionToken } from '@/lib/auth-helpers';

interface ProposedTime {
  date: string;
  time: string;
}

interface InterviewTimeResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proposalId: string;
  proposedTimes: ProposedTime[];
  interviewType: string;
  duration: number;
  notes?: string;
}

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  recruiter_prescreen: 'Pre-Screen',
  recruiter_round_1: 'Round 1',
  recruiter_round_2: 'Round 2',
  recruiter_round_3: 'Round 3',
  client_round_1: 'Client Round 1',
  client_round_2: 'Client Round 2',
  client_final: 'Client Final',
};

// Generate time slots for alternative time picker
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute of [0, 15, 30, 45]) {
      if (hour === 20 && minute > 0) break;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function InterviewTimeResponseModal({
  isOpen,
  onClose,
  onSuccess,
  proposalId,
  proposedTimes,
  interviewType,
  duration,
  notes,
}: InterviewTimeResponseModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [showAlternative, setShowAlternative] = useState(false);
  const [alternativeDate, setAlternativeDate] = useState<Date | undefined>(new Date());
  const [alternativeTime, setAlternativeTime] = useState('09:00');
  const [responseMessage, setResponseMessage] = useState('');

  const handleAccept = async () => {
    if (selectedTime === null) {
      toast.error('Please select a time slot');
      return;
    }

    setLoading(true);
    try {
      const token = await getSessionToken();
      const acceptedSlot = proposedTimes[selectedTime];

      const response = await fetch('/api/candidate/interviews/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposalId,
          action: 'accept',
          acceptedTime: {
            date: acceptedSlot.date,
            time: acceptedSlot.time,
          },
          message: responseMessage || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept interview time');
      }

      toast.success('Interview time confirmed!');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to accept interview time:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept interview time');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeAlternative = async () => {
    if (!alternativeDate) {
      toast.error('Please select a date for your alternative time');
      return;
    }

    // Validate alternative time is at least 2 hours in the future
    const altDateTime = new Date(alternativeDate);
    const [hours, minutes] = alternativeTime.split(':').map(Number);
    altDateTime.setHours(hours, minutes, 0, 0);

    const minTime = new Date();
    minTime.setHours(minTime.getHours() + 2);

    if (altDateTime < minTime) {
      toast.error('Alternative time must be at least 2 hours in the future');
      return;
    }

    setLoading(true);
    try {
      const token = await getSessionToken();

      const response = await fetch('/api/candidate/interviews/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposalId,
          action: 'counter_propose',
          alternativeTime: {
            date: altDateTime.toISOString(),
            time: alternativeTime,
          },
          message: responseMessage || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to propose alternative time');
      }

      toast.success('Alternative time proposed to recruiter');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to propose alternative time:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to propose alternative time');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTime(null);
    setShowAlternative(false);
    setResponseMessage('');
    setAlternativeDate(new Date());
    setAlternativeTime('09:00');
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })} at ${timeStr}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Interview Time Proposal</DialogTitle>
          <DialogDescription className="text-gray-400">
            {INTERVIEW_TYPE_LABELS[interviewType] || interviewType} - {duration} minutes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recruiter Notes */}
          {notes && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Label className="text-blue-400 text-sm font-medium">Note from Recruiter</Label>
              <p className="text-gray-300 text-sm mt-1">{notes}</p>
            </div>
          )}

          {/* Proposed Times */}
          {!showAlternative && (
            <div className="space-y-3">
              <Label className="text-white">Select Your Preferred Time</Label>
              <div className="space-y-2">
                {proposedTimes.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedTime(index)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTime === index
                        ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {selectedTime === index ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(slot.date, slot.time)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAlternative(true)}
                className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                None of these work? Propose alternative time
              </Button>
            </div>
          )}

          {/* Alternative Time Picker */}
          {showAlternative && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Propose Alternative Time</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlternative(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Back to proposed times
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={alternativeDate}
                    onSelect={setAlternativeDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border border-white/10 bg-black/20"
                  />
                </div>

                {/* Time Picker */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Select Time</Label>
                  <Select value={alternativeTime} onValueChange={setAlternativeTime}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {alternativeDate && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <p className="text-sm text-emerald-400 font-medium">
                        {formatDateTime(alternativeDate.toISOString(), alternativeTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-white">Message (Optional)</Label>
            <Textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Add any additional notes or questions..."
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-white/10 text-gray-300 hover:bg-white/5"
          >
            Cancel
          </Button>
          {showAlternative ? (
            <Button
              type="button"
              onClick={handleProposeAlternative}
              disabled={loading || !alternativeDate}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Propose Alternative'
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAccept}
              disabled={loading || selectedTime === null}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Time'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

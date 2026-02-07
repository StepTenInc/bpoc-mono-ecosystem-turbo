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
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Calendar } from '@/components/shared/ui/calendar';
import { Loader2, X, Plus, Clock } from 'lucide-react';
import { toast } from '@/components/shared/ui/toast';
import { getSessionToken } from '@/lib/auth-helpers';

interface TimeSlot {
  date: Date;
  time: string;
}

interface InterviewSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  applicationId: string;
  candidateId: string;
  candidateName: string;
}

const INTERVIEW_TYPES = [
  { value: 'recruiter_prescreen', label: 'Pre-Screen' },
  { value: 'recruiter_round_1', label: 'Round 1' },
  { value: 'recruiter_round_2', label: 'Round 2' },
  { value: 'recruiter_round_3', label: 'Round 3' },
  { value: 'client_round_1', label: 'Client Round 1' },
  { value: 'client_round_2', label: 'Client Round 2' },
  { value: 'client_final', label: 'Client Final' },
];

const DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
];

// Generate time slots for a day (8am-8pm, 15-min intervals)
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute of [0, 15, 30, 45]) {
      if (hour === 20 && minute > 0) break; // Stop at 8:00 PM
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function InterviewSchedulerModal({
  isOpen,
  onClose,
  onSuccess,
  applicationId,
  candidateId,
  candidateName,
}: InterviewSchedulerModalProps) {
  const [loading, setLoading] = useState(false);
  const [interviewType, setInterviewType] = useState('recruiter_prescreen');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);

  // For adding new slot
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());
  const [currentTime, setCurrentTime] = useState('09:00');

  const handleAddSlot = () => {
    if (!currentDate) {
      toast.error('Please select a date');
      return;
    }

    // Combine date and time
    const slotDateTime = new Date(currentDate);
    const [hours, minutes] = currentTime.split(':').map(Number);
    slotDateTime.setHours(hours, minutes, 0, 0);

    // Validate: must be at least 2 hours in the future
    const minTime = new Date();
    minTime.setHours(minTime.getHours() + 2);

    if (slotDateTime < minTime) {
      toast.error('Time slot must be at least 2 hours in the future');
      return;
    }

    // Check if already exists
    const exists = selectedSlots.some(
      slot => slot.date.getTime() === slotDateTime.getTime() && slot.time === currentTime
    );

    if (exists) {
      toast.error('This time slot is already added');
      return;
    }

    if (selectedSlots.length >= 3) {
      toast.error('Maximum 3 time slots allowed');
      return;
    }

    setSelectedSlots([...selectedSlots, { date: slotDateTime, time: currentTime }]);
  };

  const handleRemoveSlot = (index: number) => {
    setSelectedSlots(selectedSlots.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedSlots.length === 0) {
      toast.error('Please add at least one time slot');
      return;
    }

    setLoading(true);
    try {
      const token = await getSessionToken();

      const response = await fetch('/api/recruiter/interviews/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationId,
          candidateId,
          interviewType,
          duration,
          proposedTimes: selectedSlots.map(slot => ({
            date: slot.date.toISOString(),
            time: slot.time,
          })),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to propose interview times');
      }

      toast.success('Interview time proposal sent to candidate');
      onSuccess();
      onClose();

      // Reset form
      setSelectedSlots([]);
      setNotes('');
      setInterviewType('recruiter_prescreen');
      setDuration(60);
    } catch (error) {
      console.error('Failed to propose interview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to propose interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Schedule Interview</DialogTitle>
          <DialogDescription className="text-gray-400">
            Propose interview times for {candidateName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Interview Type */}
          <div className="space-y-2">
            <Label className="text-white">Interview Type</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-white">Duration</Label>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map(d => (
                  <SelectItem key={d.value} value={d.value.toString()}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Slot Picker */}
          <div className="space-y-2">
            <Label className="text-white">Propose Time Slots (up to 3)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={setCurrentDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border border-white/10 bg-black/20"
                />
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Select Time</Label>
                <Select value={currentTime} onValueChange={setCurrentTime}>
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

                <Button
                  type="button"
                  onClick={handleAddSlot}
                  className="w-full mt-4 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30"
                  disabled={!currentDate || selectedSlots.length >= 3}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Slots */}
          {selectedSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white">Proposed Times ({selectedSlots.length}/3)</Label>
              <div className="space-y-2">
                {selectedSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                  >
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {slot.date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        at {slot.time}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSlot(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-white">Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information for the candidate..."
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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || selectedSlots.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Proposal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

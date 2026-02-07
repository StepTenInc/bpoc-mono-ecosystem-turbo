'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Briefcase,
  Sparkles,
  Loader2,
  Check,
  DollarSign,
  MapPin,
  Clock
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

export default function CreateJobModal({ isOpen, onClose, onJobCreated }: CreateJobModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    useAI: true,
    salary_min: '',
    salary_max: '',
    work_arrangement: 'remote',
    work_type: 'full_time',
    shift: 'day',
    experience_level: 'mid_level',
    location: '',
  });

  const [generatedJob, setGeneratedJob] = useState<Record<string, unknown> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateWithAI = async () => {
    if (!formData.title || !formData.description) {
      setError('Please enter a job title and brief description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          useAI: true,
          work_arrangement: formData.work_arrangement,
          work_type: formData.work_type,
          shift: formData.shift,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create job');
      }

      setGeneratedJob(result.job);
      setSuccess(true);
      
      // Close and refresh after 2 seconds
      setTimeout(() => {
        onJobCreated();
        handleClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCreate = async () => {
    if (!formData.title) {
      setError('Please enter a job title');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          useAI: false,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create job');
      }

      setSuccess(true);
      setTimeout(() => {
        onJobCreated();
        handleClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      title: '',
      description: '',
      useAI: true,
      salary_min: '',
      salary_max: '',
      work_arrangement: 'remote',
      work_type: 'full_time',
      shift: 'day',
      experience_level: 'mid_level',
      location: '',
    });
    setGeneratedJob(null);
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20">
                <Briefcase className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Job</h2>
                <p className="text-gray-400 text-sm">Post a job with AI assistance</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Job Created!</h3>
                <p className="text-gray-400">The job has been posted successfully.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Error */}
                {error && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Job Title */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Job Title *</label>
                  <Input
                    name="title"
                    placeholder="e.g., Senior Virtual Assistant"
                    value={formData.title}
                    onChange={handleChange}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {/* Brief Description for AI */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Brief Description 
                    <span className="text-purple-400 ml-2">(AI will expand this)</span>
                  </label>
                  <Textarea
                    name="description"
                    placeholder="e.g., Looking for an experienced VA to handle customer support, email management, and scheduling for a US-based e-commerce company..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {/* Quick Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Work Type</label>
                    <select
                      name="work_type"
                      value={formData.work_type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Arrangement</label>
                    <select
                      name="work_arrangement"
                      value={formData.work_arrangement}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Shift</label>
                    <select
                      name="shift"
                      value={formData.shift}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                      <option value="both">Flexible</option>
                    </select>
                  </div>
                </div>

                {/* Salary (Optional) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Min Salary (PHP)
                    </label>
                    <Input
                      name="salary_min"
                      type="number"
                      placeholder="e.g., 25000"
                      value={formData.salary_min}
                      onChange={handleChange}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Max Salary (PHP)
                    </label>
                    <Input
                      name="salary_max"
                      type="number"
                      placeholder="e.g., 45000"
                      value={formData.salary_max}
                      onChange={handleChange}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
              <Button variant="outline" onClick={handleClose} className="border-white/10">
                Cancel
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleManualCreate}
                  disabled={loading}
                  className="border-white/10"
                >
                  Create Manually
                </Button>
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={loading || !formData.title || !formData.description}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


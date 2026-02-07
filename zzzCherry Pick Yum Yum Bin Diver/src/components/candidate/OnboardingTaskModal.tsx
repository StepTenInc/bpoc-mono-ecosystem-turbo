'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  PenTool,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';

// Types (should ideally be shared)
export type TaskType = 'document_upload' | 'form_fill' | 'e_sign' | 'acknowledgment' | 'training' | 'information';

interface OnboardingTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    taskType: string;
    isRequired: boolean;
  };
  onSubmit: (taskId: string, data: any) => Promise<void>;
}

export default function OnboardingTaskModal({
  isOpen,
  onClose,
  task,
  onSubmit
}: OnboardingTaskModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for different task types
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [acknowledged, setAcknowledged] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      let submissionData = {};

      switch (task.taskType) {
        case 'document_upload':
          if (!file) throw new Error('Please select a file to upload');
          // In a real app, upload file to storage first, then send URL
          // Simulating file upload for now
          submissionData = {
            attachments: [{
              fileName: file.name,
              fileUrl: URL.createObjectURL(file), // Mock URL
              fileSize: file.size
            }]
          };
          break;

        case 'form_fill':
          // Validate form data (simplified)
          if (Object.keys(formData).length === 0) throw new Error('Please fill out the form');
          submissionData = { formData };
          break;

        case 'acknowledgment':
        case 'information':
          if (!acknowledged && task.taskType === 'acknowledgment') throw new Error('Please acknowledge to continue');
          submissionData = { acknowledgmentComplete: true };
          break;
          
        default:
          submissionData = {};
      }

      await onSubmit(task.id, submissionData);
      onClose();
    } catch (err: any) {
      console.error('Task submission error:', err);
      setError(err.message || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (task.taskType) {
      case 'document_upload':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-orange-500/30 transition-colors bg-white/5">
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-orange-500 hover:text-orange-400 font-medium">Upload a file</span>
                  <span className="text-gray-400"> or drag and drop</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
              </div>
              {file && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">{file.name}</span>
                  <Button variant="ghost" size="sm" className="ml-auto h-auto p-1 text-gray-400 hover:text-white" onClick={() => setFile(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'form_fill':
        return (
          <div className="space-y-4">
            {/* Example dynamic form fields - normally would come from task definition */}
            <div className="space-y-2">
              <Label className="text-gray-300">Full Name</Label>
              <Input 
                className="bg-white/5 border-white/10 text-white focus:border-orange-500/50"
                placeholder="Enter your full name"
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Address</Label>
              <Textarea 
                className="bg-white/5 border-white/10 text-white focus:border-orange-500/50"
                placeholder="Enter your address"
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>
        );

      case 'acknowledgment':
      case 'information':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm leading-relaxed">
              <p>
                By clicking confirm below, I acknowledge that I have read and understood the
                {task.title}. I agree to comply with all policies and procedures outlined.
              </p>
            </div>
            {task.taskType === 'acknowledgment' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/20"
                />
                <Label htmlFor="acknowledge" className="text-gray-300 cursor-pointer select-none">
                  I acknowledge and agree
                </Label>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-400">
            <p>Task type not supported yet.</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1419] border-white/10 text-gray-300 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            {task.taskType === 'document_upload' && <Upload className="h-5 w-5 text-orange-500" />}
            {task.taskType === 'form_fill' && <FileText className="h-5 w-5 text-cyan-500" />}
            {task.taskType === 'acknowledgment' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            {task.title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {task.description || 'Please complete this task to proceed with your onboarding.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {renderContent()}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Task'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


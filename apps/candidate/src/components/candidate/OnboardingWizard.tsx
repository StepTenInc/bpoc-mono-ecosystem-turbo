'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PartyPopper,
  Calendar,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  FileImage,
  Shield,
  Building2,
  Briefcase,
  User,
  CreditCard,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  offer: {
    id: string;
    jobTitle: string;
    company: string;
    salaryOffered: number;
    currency: string;
    salaryType: string;
    startDate?: string;
    benefits?: string[];
  };
  onComplete: () => void;
}

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  uploaded?: boolean;
  file?: File;
}

const REQUIRED_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'government_id',
    name: 'Government-Issued ID',
    description: 'Valid passport, driver\'s license, or national ID',
    icon: <CreditCard className="h-5 w-5" />,
    required: true,
  },
  {
    id: 'nbi_clearance',
    name: 'NBI Clearance',
    description: 'National Bureau of Investigation clearance (valid within 6 months)',
    icon: <Shield className="h-5 w-5" />,
    required: true,
  },
  {
    id: 'sss_id',
    name: 'SSS ID / E1 Form',
    description: 'Social Security System ID or E1 registration',
    icon: <User className="h-5 w-5" />,
    required: true,
  },
  {
    id: 'philhealth',
    name: 'PhilHealth ID',
    description: 'Philippine Health Insurance Corporation ID',
    icon: <Building2 className="h-5 w-5" />,
    required: true,
  },
  {
    id: 'pagibig',
    name: 'Pag-IBIG MID Number',
    description: 'Home Development Mutual Fund membership ID',
    icon: <Building2 className="h-5 w-5" />,
    required: true,
  },
  {
    id: 'tin',
    name: 'TIN Certificate',
    description: 'Tax Identification Number certificate',
    icon: <FileText className="h-5 w-5" />,
    required: true,
  },
  {
    id: 'diploma',
    name: 'Educational Credentials',
    description: 'Diploma or Transcript of Records',
    icon: <GraduationCap className="h-5 w-5" />,
    required: false,
  },
  {
    id: 'employment_cert',
    name: 'Certificate of Employment',
    description: 'From previous employer (if applicable)',
    icon: <Briefcase className="h-5 w-5" />,
    required: false,
  },
];

type WizardStep = 'welcome' | 'start_date' | 'documents' | 'upload' | 'complete';

export default function OnboardingWizard({
  isOpen,
  onClose,
  offer,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [confirmedStartDate, setConfirmedStartDate] = useState(offer.startDate || '');
  const [documents, setDocuments] = useState<DocumentRequirement[]>(REQUIRED_DOCUMENTS);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const totalRequired = documents.filter(d => d.required).length;
  const uploadedRequired = documents.filter(d => d.required && d.uploaded).length;
  const progress = Math.round((uploadedRequired / totalRequired) * 100);

  const handleFileSelect = (docId: string, file: File) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === docId
          ? { ...doc, file, uploaded: true }
          : doc
      )
    );
  };

  const handleUploadAll = async () => {
    const filesToUpload = documents.filter(d => d.file);
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      // TODO: Actually upload files to Google Vision / storage
      // const formData = new FormData();
      // filesToUpload.forEach(doc => {
      //   if (doc.file) formData.append(doc.id, doc.file);
      // });
      // await fetch('/api/candidate/onboarding/documents', {
      //   method: 'POST',
      //   body: formData,
      // });

      setStep('complete');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to {offer.company}!</h2>
              <p className="text-gray-400">
                Congratulations on accepting your offer for <span className="text-white font-medium">{offer.jobTitle}</span>
              </p>
            </div>

            <Card className="bg-white/5 border-emerald-500/30">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-gray-400 text-sm">Your Salary</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {offer.currency} {offer.salaryOffered.toLocaleString()}
                      <span className="text-sm font-normal text-gray-400">/{offer.salaryType}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Start Date</p>
                    <p className="text-white font-semibold">
                      {offer.startDate
                        ? new Date(offer.startDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'To be confirmed'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-left">
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                What's Next?
              </h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Confirm your start date
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Upload required documents
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  Complete onboarding verification
                </li>
              </ul>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
              onClick={() => setStep('start_date')}
            >
              Let's Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        );

      case 'start_date':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Confirm Your Start Date</h2>
              <p className="text-gray-400">
                Please confirm when you'll be ready to start
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Start Date</Label>
                <Input
                  type="date"
                  value={confirmedStartDate}
                  onChange={(e) => setConfirmedStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-white/5 border-white/20 text-white mt-2"
                />
              </div>

              {offer.startDate && confirmedStartDate !== offer.startDate && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-amber-400 text-sm">
                    Note: This differs from the original start date ({new Date(offer.startDate).toLocaleDateString()}).
                    The employer will be notified.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20"
                onClick={() => setStep('welcome')}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
                onClick={() => setStep('documents')}
                disabled={!confirmedStartDate}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'documents':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Required Documents</h2>
              <p className="text-gray-400">
                Please prepare the following documents for upload
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border transition-all ${
                    doc.required
                      ? 'bg-white/5 border-white/20'
                      : 'bg-white/3 border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      doc.required ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {doc.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium text-sm">{doc.name}</h4>
                        {doc.required && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{doc.description}</p>
                    </div>
                    {doc.uploaded && (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                Accepted formats: PDF, JPG, PNG (max 10MB per file)
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20"
                onClick={() => setStep('start_date')}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
                onClick={() => setStep('upload')}
              >
                Upload Documents
                <Upload className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'upload':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Upload Your Documents</h2>
              <p className="text-gray-400">
                Select files for each required document
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">{uploadedRequired} of {totalRequired} required</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {documents.filter(d => d.required).map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border transition-all ${
                    doc.uploaded
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/5 border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      doc.uploaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {doc.uploaded ? <CheckCircle className="h-5 w-5" /> : doc.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">{doc.name}</h4>
                      {doc.file && (
                        <p className="text-emerald-400 text-xs mt-1">{doc.file.name}</p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(doc.id, file);
                        }}
                      />
                      <Button
                        size="sm"
                        variant={doc.uploaded ? 'outline' : 'default'}
                        className={doc.uploaded
                          ? 'border-emerald-500/30 text-emerald-400'
                          : 'bg-orange-500 hover:bg-orange-600'
                        }
                        asChild
                      >
                        <span>{doc.uploaded ? 'Change' : 'Select'}</span>
                      </Button>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading documents...</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20"
                onClick={() => setStep('documents')}
                disabled={uploading}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600"
                onClick={handleUploadAll}
                disabled={uploadedRequired < totalRequired || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    Submit All Documents
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto"
            >
              <CheckCircle className="h-12 w-12 text-white" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
              <p className="text-gray-400">
                Your documents have been submitted for verification.
              </p>
            </div>

            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-4 text-left">
                <h3 className="text-white font-medium mb-3">What happens next?</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <span>Your documents will be processed via AI verification (usually within 24 hours)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <span>You'll receive an email with your onboarding checklist</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <span>Your recruiter will contact you with final details before your start date</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-cyan-400" />
                <div className="text-left">
                  <p className="text-gray-400 text-sm">Your confirmed start date</p>
                  <p className="text-white font-semibold">
                    {new Date(confirmedStartDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
              onClick={() => {
                onComplete();
                onClose();
              }}
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0f] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Onboarding Wizard</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

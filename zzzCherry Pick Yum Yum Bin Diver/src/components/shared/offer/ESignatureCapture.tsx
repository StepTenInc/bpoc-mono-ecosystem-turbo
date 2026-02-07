'use client';

/**
 * E-Signature Capture Component
 * Legally compliant with Philippine Republic Act 8792 (E-Commerce Act)
 * 
 * Features:
 * - Full name confirmation
 * - Legal consent display
 * - SHA-256 document hash verification
 * - IP address + device capture
 * - Signature certificate generation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSignature,
  CheckCircle,
  Shield,
  Lock,
  Calendar,
  Globe,
  Smartphone,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Card, CardContent } from '@/components/shared/ui/card';
import { toast } from '@/components/shared/ui/toast';

interface ESignatureCaptureProps {
  offerId: string;
  offerDetails: {
    salary: number;
    currency: string;
    salaryType: string;
    jobTitle: string;
    startDate?: string;
  };
  candidateName?: string;
  onSignatureComplete?: (signatureData: any) => void;
  disabled?: boolean;
}

export function ESignatureCapture({
  offerId,
  offerDetails,
  candidateName = '',
  onSignatureComplete,
  disabled = false,
}: ESignatureCaptureProps) {
  const [step, setStep] = useState<'consent' | 'confirm' | 'signing' | 'complete'>('consent');
  const [fullName, setFullName] = useState(candidateName);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signatureData, setSignatureData] = useState<any>(null);

  const consentText = `I, ${fullName || '[Your Name]'}, hereby accept and agree to all terms and conditions stated in this employment offer. I understand that this constitutes a legally binding agreement under Philippine law (Republic Act 8792 - E-Commerce Act of 2000). I confirm that I have read, understood, and voluntarily agree to the offer of ${offerDetails.currency} ${offerDetails.salary.toLocaleString()} per ${offerDetails.salaryType} for the position of ${offerDetails.jobTitle}.`;

  const handleSign = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!hasReadTerms) {
      toast.error('Please confirm that you have read and agree to all terms');
      return;
    }

    setLoading(true);
    setStep('signing');

    try {
      const response = await fetch(`/api/offers/${offerId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          signatoryName: fullName,
          signatureMethod: 'click_to_sign',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign offer');
      }

      setSignatureData(data.signature);
      setStep('complete');
      toast.success('Offer signed successfully! 🎉');
      
      if (onSignatureComplete) {
        onSignatureComplete(data.signature);
      }

    } catch (error: any) {
      console.error('Failed to sign offer:', error);
      toast.error(error.message || 'Failed to sign offer. Please try again.');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <Card className="bg-gray-500/10 border-gray-500/20">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">E-signature not available for this offer</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* Step 1: Read Consent */}
        {step === 'consent' && (
          <motion.div
            key="consent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <FileSignature className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Electronic Signature Agreement
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Please review the terms before signing
                    </p>
                  </div>
                </div>

                {/* Offer Summary */}
                <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-sm font-medium text-white mb-2">Offer Details:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Position:</span>
                      <span className="text-white font-medium">{offerDetails.jobTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Salary:</span>
                      <span className="text-emerald-400 font-semibold">
                        {offerDetails.currency} {offerDetails.salary.toLocaleString()} / {offerDetails.salaryType}
                      </span>
                    </div>
                    {offerDetails.startDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Start Date:</span>
                        <span className="text-white">{new Date(offerDetails.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legal Consent Text */}
                <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-400 font-medium">
                      Legal Agreement (Republic Act 8792)
                    </p>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {consentText}
                  </p>
                </div>

                <Button
                  onClick={() => setStep('confirm')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  I Have Read and Understand
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Confirm Identity */}
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Confirm Your Identity
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Please enter your full legal name exactly as it appears on official documents
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Full Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Full Legal Name *
                    </label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Juan Dela Cruz"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be used as your legal signature
                    </p>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={hasReadTerms}
                      onChange={(e) => setHasReadTerms(e.target.checked)}
                      className="mt-1 cursor-pointer"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-300 cursor-pointer flex-1">
                      I confirm that I have read, understood, and agree to all terms and conditions of this employment offer. I understand this is a legally binding electronic signature under Philippine law (RA 8792).
                    </label>
                  </div>

                  {/* Legal Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <Shield className="h-3 w-3 mr-1" />
                      Legally Binding
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                      <Lock className="h-3 w-3 mr-1" />
                      Secure & Encrypted
                    </Badge>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                      <Calendar className="h-3 w-3 mr-1" />
                      Timestamp Verified
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('consent')}
                      className="flex-1"
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSign}
                      disabled={!fullName.trim() || !hasReadTerms || loading}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing...
                        </>
                      ) : (
                        <>
                          <FileSignature className="mr-2 h-4 w-4" />
                          Sign Offer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Signing in Progress */}
        {step === 'signing' && (
          <motion.div
            key="signing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Processing Your Signature...
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Generating secure certificate and verifying document integrity
                </p>
                <div className="flex justify-center gap-2">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    Capturing IP
                  </Badge>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Recording Device
                  </Badge>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Hashing Document
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && signatureData && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/40">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle className="h-10 w-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Offer Signed Successfully! 🎉
                  </h3>
                  <p className="text-gray-300">
                    Your electronic signature has been recorded and verified
                  </p>
                </div>

                {/* Signature Certificate */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    Signature Certificate
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Certificate ID:</span>
                      <span className="text-white font-mono text-xs">{signatureData.certificateId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Signed At:</span>
                      <span className="text-white">{new Date(signatureData.signedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} PHT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Document Hash:</span>
                      <span className="text-white font-mono text-xs">{signatureData.documentHash.substring(0, 16)}...</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Lock className="h-3 w-3" />
                  <span>Legally binding under Philippine Republic Act 8792</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


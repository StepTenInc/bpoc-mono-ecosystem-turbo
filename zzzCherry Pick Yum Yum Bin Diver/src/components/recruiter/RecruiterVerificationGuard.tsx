'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FileText, Shield, Loader2, CheckCircle, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';

interface RecruiterData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verificationStatus: string;
  agencyId: string;
  agencyName: string;
}

interface RecruiterVerificationGuardProps {
  children: React.ReactNode;
}

export default function RecruiterVerificationGuard({ children }: RecruiterVerificationGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recruiter, setRecruiter] = useState<RecruiterData | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch('/api/recruiter/verify');
      const data = await response.json();

      if (!response.ok || !data.recruiter) {
        // Not a recruiter, redirect to login
        router.push('/recruiter/login');
        return;
      }

      setRecruiter(data.recruiter);

      const status = data.recruiter.verificationStatus;

      // Redirect based on verification status
      if (status === 'pending_documents') {
        // Authorized head needs to upload documents
        router.push('/recruiter/signup/documents');
      } else if (status === 'pending_admin_review') {
        // Documents uploaded, awaiting admin approval
        router.push('/recruiter/signup/pending-verification');
      } else if (status === 'pending_authorization_head') {
        // Non-authorized recruiter waiting for auth head
        router.push('/recruiter/signup/awaiting-authorization');
      } else if (status === 'rejected') {
        // Rejected, show rejection screen
        // For now, allow access to dashboard so they can see rejection message
        setLoading(false);
      } else if (status === 'verified') {
        // Verified, allow access
        setLoading(false);
      } else {
        // Unknown status, allow access
        setLoading(false);
      }
    } catch (error) {
      console.error('Verification check failed:', error);
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setChecking(true);
    await checkVerificationStatus();
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0B0D]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Checking verification status...</p>
        </div>
      </div>
    );
  }

  // If recruiter is rejected, show rejection message
  if (recruiter?.verificationStatus === 'rejected') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0B0D] px-4">
        <div className="max-w-2xl w-full">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Account Verification Rejected</h2>
                <p className="text-gray-400 mb-6">
                  Your account verification was not approved. Please contact support for more information.
                </p>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  Status: Rejected
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Allow access to verified recruiters
  return <>{children}</>;
}

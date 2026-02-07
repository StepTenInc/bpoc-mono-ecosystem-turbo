'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Clock,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { AnimatedLogo } from '@/components/shared/ui/AnimatedLogo';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AwaitingAuthorizationPage() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [authHeadEmail, setAuthHeadEmail] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/recruiter/verify');
      const data = await response.json();

      if (data.recruiter) {
        setStatus(data.recruiter.verification_status);

        // Get auth head invitation details
        const { data: invitation } = await supabase
          .from('team_invitations')
          .select('invitee_email')
          .eq('inviter_id', session.user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (invitation) {
          setAuthHeadEmail(invitation.invitee_email);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  if (status === 'verified') {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">You're Verified!</h2>
          <p className="text-gray-400 mb-6">Your authorization head has been approved. You can now access your recruiter dashboard.</p>
          <Link href="/recruiter">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-600">
              Go to Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] selection:bg-orange-500/20 selection:text-orange-200">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 border-b border-white/5 bg-[#0B0B0D]/80 backdrop-blur-md"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 relative flex items-center justify-center rounded-xl bg-white/5 border border-white/10 overflow-hidden group-hover:border-orange-500/50 transition-colors">
              <AnimatedLogo className="from-orange-400 via-amber-500 to-yellow-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-orange-400 transition-colors">BPOC.IO</span>
              <span className="text-[10px] tracking-wider text-orange-500 font-mono uppercase">Recruiter</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/recruiter/login">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-orange-500/20 flex items-center justify-center relative">
              <Clock className="h-12 w-12 text-orange-400" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-orange-500/30"
              />
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Waiting for Authorization
            </h1>

            <p className="text-xl text-gray-400 mb-8">
              We're waiting for your recruitment head to complete the verification process.
            </p>

            {/* Status Card */}
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-8 text-left mb-8">
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Your account created</p>
                    <p className="text-sm text-gray-400">You successfully signed up on BPOC</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Invitation sent</p>
                    <p className="text-sm text-gray-400">
                      We emailed an invitation to{' '}
                      <span className="text-orange-400 font-medium">{authHeadEmail || 'your authorization head'}</span>
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 relative">
                    <Mail className="w-4 h-4 text-orange-400" />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-2 border-orange-500/30"
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Waiting for them to accept</p>
                    <p className="text-sm text-gray-400">They need to click the link and complete setup</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Admin verification</p>
                    <p className="text-sm text-gray-500">BPOC will review their documents</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-4 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">You're activated</p>
                    <p className="text-sm text-gray-500">Once approved, you'll both get access</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 text-left mb-8">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-400">
                <p className="font-medium mb-1">What happens next?</p>
                <p className="text-blue-300/80">
                  Your authorization head will receive an email with a signup link. Once they complete verification and get approved by our admin team, you'll both receive an email and can start using BPOC.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={checkStatus}
                disabled={checking}
                variant="outline"
                className="border-white/10 hover:border-orange-500/50 text-white"
              >
                {checking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>

              <Link href="/recruiter/login">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  Sign Out
                </Button>
              </Link>
            </div>

            {/* Email Notice */}
            <p className="text-sm text-gray-500 mt-8">
              We'll email you at{' '}
              <span className="text-gray-400 font-medium">your registered email</span>{' '}
              once your account is verified.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

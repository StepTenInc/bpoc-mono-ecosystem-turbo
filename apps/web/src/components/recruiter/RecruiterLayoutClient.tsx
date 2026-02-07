'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';
import { Loader2, AlertCircle, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { Button } from '@/components/shared/ui/button';

interface Recruiter {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  agencyId: string;
  verificationStatus?: string;
  agency?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

// Get saved sidebar state from localStorage
const getSavedSidebarState = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('recruiter-sidebar-collapsed');
  return saved === 'true';
};

export default function RecruiterLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, session, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state on mount
  useEffect(() => {
    setSidebarCollapsed(getSavedSidebarState());
  }, []);

  const handleToggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('recruiter-sidebar-collapsed', String(newState));
  };

  // Skip auth check for login/signup/demo pages
  const isAuthPage = pathname === '/recruiter/login' || pathname === '/recruiter/signup' || pathname === '/recruiter/demo';

  // Skip verification check for specific pages where redirects go
  const isVerificationPage = pathname?.startsWith('/recruiter/signup/documents') ||
                               pathname?.startsWith('/recruiter/signup/pending-verification') ||
                               pathname?.startsWith('/recruiter/signup/awaiting-authorization');

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        if (authLoading) return;

        if (!session || !user) {
          router.push('/recruiter/login');
          return;
        }

        // Verify recruiter status
        const response = await fetch('/api/recruiter/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        const data = await response.json();

        if (!response.ok || !data.isRecruiter) {
          await signOut();
          router.push('/recruiter/login');
          return;
        }

        setRecruiter(data.recruiter);

        // Check verification status and redirect if needed (unless already on verification page)
        if (!isVerificationPage && data.recruiter) {
          const status = data.recruiter.verificationStatus;

          if (status === 'pending_documents') {
            // Authorized head needs to upload documents
            router.push('/recruiter/signup/documents');
            return;
          } else if (status === 'pending_admin_review') {
            // Documents uploaded, awaiting admin approval
            router.push('/recruiter/signup/pending-verification');
            return;
          } else if (status === 'pending_authorization_head') {
            // Non-authorized recruiter waiting for auth head
            router.push('/recruiter/signup/awaiting-authorization');
            return;
          } else if (status === 'rejected') {
            // Rejected - for now, show message in dashboard
            // Could create a dedicated rejection page
          }
          // If verified, continue to load dashboard
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/recruiter/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthPage, router, pathname, authLoading, session, user, signOut]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/recruiter/login');
  };

  // For auth pages, render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Sidebar */}
      <RecruiterSidebar 
        recruiter={recruiter ? {
          ...recruiter,
          id: recruiter.id,
          agencyId: recruiter.agencyId,
        } : undefined} 
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content - adjusts based on sidebar state */}
      <motion.main
        className="min-h-screen relative z-10"
        animate={{ marginLeft: sidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <div className="p-8">
          <div className="flex justify-end mb-4">
            <NotificationBell />
          </div>

          {/* Verification Status Banner */}
          {recruiter?.verificationStatus && recruiter.verificationStatus !== 'verified' && (
            <div className="mb-6">
              {recruiter.verificationStatus === 'pending_documents' && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-4">
                  <FileText className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-orange-400 font-semibold mb-1">Upload Required Documents</h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Please upload your agency documents (TIN, DTI Certificate, Business Permit, SEC Registration) to activate your account.
                    </p>
                    <Button
                      onClick={() => router.push('/recruiter/signup/documents')}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Upload Documents
                    </Button>
                  </div>
                </div>
              )}
              {recruiter.verificationStatus === 'pending_admin_review' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-4">
                  <Clock className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-blue-400 font-semibold mb-1">Documents Under Review</h3>
                    <p className="text-gray-300 text-sm">
                      Your documents have been submitted and are being reviewed by our admin team. This typically takes 24-48 hours.
                    </p>
                  </div>
                </div>
              )}
              {recruiter.verificationStatus === 'pending_authorization_head' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-amber-400 font-semibold mb-1">Awaiting Authorization</h3>
                    <p className="text-gray-300 text-sm">
                      Your authorization head has been invited to complete the signup process. Once they upload the required documents and are verified, your account will be activated.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {children}
        </div>
      </motion.main>
    </div>
  );
}


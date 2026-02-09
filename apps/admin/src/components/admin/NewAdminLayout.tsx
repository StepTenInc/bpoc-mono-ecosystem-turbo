'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import { supabase } from '@/lib/supabase';
import { Loader2, Menu } from 'lucide-react';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { ErrorBoundary } from './ErrorBoundary';

interface NewAdminLayoutProps {
  children: React.ReactNode;
}

export default function NewAdminLayout({ children }: NewAdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Skip auth check on login and signup pages - they render without sidebar
    if (pathname === '/login' || pathname === '/signup') {
      setLoading(false);
      // Don't set isAuthenticated - we want to render children directly without sidebar
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        // Verify user is a BPOC admin via API (bypasses RLS)
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            access_token: session.access_token,
          }),
          cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok || !result.isAdmin) {
          console.warn('Admin verification failed:', result);
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // For login/signup pages, render children directly without sidebar
  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-slate-950 flex overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px]" />
        </div>

        {/* Sidebar */}
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <motion.main
          initial={false}
          animate={{ marginLeft: sidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col h-screen relative overflow-hidden max-md:!ml-0"
        >
          {/* Top Bar */}
          <header className="h-14 md:h-16 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl flex-shrink-0 z-40 flex items-center px-4 md:px-6">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 mr-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1">
              {/* Breadcrumb or page title can go here */}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </header>

          {/* Scrollable Page Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden admin-scrollbar-container p-4 md:p-6">
            {children}
          </div>
        </motion.main>
      </div>
    </ErrorBoundary>
  );
}

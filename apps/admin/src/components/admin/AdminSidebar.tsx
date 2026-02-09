'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  Briefcase,
  FileText,
  Calendar,
  Gift,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Bell,
  AlertCircle,
  Mail,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Users', href: '/users', icon: Users, highlight: true },
  { label: 'Recruiters', href: '/recruiters', icon: UserCircle, highlight: true },
  { label: 'Agencies', href: '/agencies', icon: Building2 },
  { label: 'Clients', href: '/clients', icon: Building2 },
  { label: 'Candidates', href: '/candidates', icon: Users },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Applications', href: '/applications', icon: FileText },
  { label: 'Interviews', href: '/interviews', icon: Calendar },
  { label: 'Offers', href: '/offers', icon: Gift },
  { label: 'Counter Offers', href: '/counter-offers', icon: TrendingUp },
  { label: 'Onboarding', href: '/onboarding', icon: CheckCircle2 },
  { label: 'Insights Manager', href: '/insights', icon: Newspaper },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Billing', href: '/billing', icon: TrendingUp, highlight: true },
  { label: 'BPOC Compliance', href: '/hr-assistant', icon: Shield },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Outbound', href: '/outbound', icon: Mail, highlight: true },
  { label: 'Audit Log', href: '/audit-log', icon: Shield },
  { label: 'Error Dashboard', href: '/errors', icon: AlertCircle },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-3" onClick={onMobileClose}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">BPOC</span>
              <span className="text-red-400 text-xs block -mt-1">Admin</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6 text-white" />
          </div>
        )}
        {/* Desktop toggle */}
        <button
          onClick={onToggle}
          className="hidden md:block p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto admin-sidebar-scroll">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    item.highlight && !active
                      ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                      : active
                      ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-red-400 border border-red-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', item.highlight && !active ? 'text-cyan-400' : active && 'text-red-400')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && !active && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-500/30 text-cyan-200 font-bold">NEW</span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-4 mx-3 border-t border-white/10" />

        {/* Bottom Nav */}
        <ul className="space-y-1 px-3">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-red-400 border border-red-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-red-400')} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-white/10">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5',
          collapsed && 'justify-center'
        )}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-gray-500 text-xs truncate">Administrator</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style jsx global>{`
        .admin-sidebar-scroll {
          scroll-behavior: smooth;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: rgba(239, 68, 68, 0.3) transparent;
        }
        .admin-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin: 8px 0;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(239, 68, 68, 0.4) 0%,
            rgba(249, 115, 22, 0.4) 50%,
            rgba(234, 88, 12, 0.3) 100%
          );
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(239, 68, 68, 0.7) 0%,
            rgba(249, 115, 22, 0.7) 50%,
            rgba(234, 88, 12, 0.6) 100%
          );
        }
        .admin-sidebar-scroll::-webkit-scrollbar-button {
          display: none;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex fixed left-0 top-0 h-screen bg-slate-950 border-r border-white/10 flex-col z-50"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden fixed left-0 top-0 h-screen w-[280px] bg-slate-950 border-r border-white/10 flex flex-col z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

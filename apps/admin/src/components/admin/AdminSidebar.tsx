'use client';

import React, { useState } from 'react';
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
  CheckCircle2,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  CreditCard,
  ChevronDown,
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

interface NavGroup {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Grouped navigation - much cleaner
const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    defaultOpen: true,
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Recruitment',
    defaultOpen: true,
    items: [
      { label: 'Jobs', href: '/jobs', icon: Briefcase },
      { label: 'Applications', href: '/applications', icon: FileText },
      { label: 'Interviews', href: '/interviews', icon: Calendar },
      { label: 'Offers', href: '/offers', icon: Gift },
      { label: 'Onboarding', href: '/onboarding', icon: CheckCircle2 },
    ]
  },
  {
    title: 'People',
    defaultOpen: true,
    items: [
      { label: 'Candidates', href: '/candidates', icon: Users },
      { label: 'Recruiters', href: '/recruiters', icon: UserCircle },
      { label: 'Users', href: '/users', icon: Users },
    ]
  },
  {
    title: 'Organizations',
    defaultOpen: false,
    items: [
      { label: 'Agencies', href: '/agencies', icon: Building2 },
      { label: 'Clients', href: '/clients', icon: Building2 },
    ]
  },
  {
    title: 'Analytics',
    defaultOpen: false,
    items: [
      { label: 'Insights', href: '/insights', icon: Newspaper },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Billing', href: '/billing', icon: CreditCard },
    ]
  },
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach(group => {
      initial[group.title] = group.defaultOpen ?? true;
    });
    return initial;
  });

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname.startsWith(href);
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-3" onClick={onMobileClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">BPOC</span>
              <span className="text-red-400 text-xs block -mt-1">Admin</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
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
        {navGroups.map((group) => (
          <div key={group.title} className="mb-2">
            {/* Group Header */}
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
              >
                <span>{group.title}</span>
                <ChevronDown 
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expandedGroups[group.title] ? "" : "-rotate-90"
                  )} 
                />
              </button>
            )}
            
            {/* Group Items */}
            <AnimatePresence initial={false}>
              {(collapsed || expandedGroups[group.title]) && (
                <motion.ul
                  initial={collapsed ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-0.5 px-3 overflow-hidden"
                >
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onMobileClose}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
                            active
                              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-r-full" />
                          )}
                          <item.icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-red-400')} />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-sm font-medium">{item.label}</span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400 font-medium">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Divider */}
        <div className="my-4 mx-3 border-t border-white/10" />

        {/* Bottom Nav */}
        <ul className="space-y-0.5 px-3">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
                    active
                      ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-r-full" />
                  )}
                  <item.icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-red-400')} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10">
                      {item.label}
                    </div>
                  )}
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
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
          width: 4px;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.3);
          border-radius: 10px;
        }
        .admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.5);
        }
      `}</style>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
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
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden fixed left-0 top-0 h-screen w-[260px] bg-slate-950 border-r border-white/10 flex flex-col z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

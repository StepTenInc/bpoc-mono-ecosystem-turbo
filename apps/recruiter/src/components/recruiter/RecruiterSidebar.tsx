'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  FileText,
  Calendar,
  Gift,
  Settings,
  LogOut,
  Search,
  Trophy,
  Kanban,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  ChevronDown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badgeKey?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Simplified grouped navigation
const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    defaultOpen: true,
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Recruitment',
    defaultOpen: true,
    items: [
      { name: 'Jobs', href: '/jobs', icon: Briefcase },
      { name: 'Applications', href: '/applications', icon: FileText, badgeKey: 'newApplications' },
      { name: 'Pipeline', href: '/pipeline', icon: Kanban },
      { name: 'Interviews', href: '/interviews', icon: Calendar, badgeKey: 'pendingInterviews' },
      { name: 'Offers', href: '/offers', icon: Gift, badgeKey: 'pendingOffers' },
      { name: 'Onboarding', href: '/onboarding', icon: FileCheck },
      { name: 'Placements', href: '/placements', icon: Trophy },
    ]
  },
  {
    title: 'Resources',
    defaultOpen: true,
    items: [
      { name: 'Clients', href: '/clients', icon: Building2 },
      { name: 'Talent Pool', href: '/talent', icon: Search },
    ]
  },
];

interface NotificationBadges {
  newApplications: number;
  pendingInterviews: number;
  pendingOffers: number;
}

interface RecruiterSidebarProps {
  recruiter?: {
    first_name: string;
    last_name: string;
    email: string;
    id?: string;
    agency_id?: string;
    agency?: {
      name: string;
      logo_url?: string;
    };
  };
  onSignOut?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function RecruiterSidebar({ 
  recruiter, 
  onSignOut, 
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}: RecruiterSidebarProps) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<NotificationBadges>({
    newApplications: 0,
    pendingInterviews: 0,
    pendingOffers: 0,
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach(group => {
      initial[group.title] = group.defaultOpen ?? true;
    });
    return initial;
  });

  // Fetch notification badges
  useEffect(() => {
    const fetchBadges = async () => {
      if (!recruiter?.id) return;
      
      try {
        const response = await fetch('/api/recruiter/dashboard/stats', {
          headers: {
            'x-user-id': recruiter.id,
            'x-agency-id': recruiter.agency_id || '',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setBadges({
            newApplications: data.stats?.newApplicationsToday || 0,
            pendingInterviews: data.stats?.scheduledInterviews || 0,
            pendingOffers: data.stats?.pendingOffers || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch badges:', error);
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, [recruiter?.id, recruiter?.agency_id]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname.startsWith(href);
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getBadgeCount = (badgeKey?: string): number => {
    if (!badgeKey) return 0;
    return badges[badgeKey as keyof NotificationBadges] || 0;
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <motion.div 
        className={cn(
          "h-screen bg-[#0a0a0f] border-r border-white/10 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300",
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {/* Logo & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3" onClick={onMobileClose}>
            {recruiter?.agency?.logo_url ? (
              <Avatar className="h-10 w-10 rounded-xl">
                <AvatarImage src={recruiter.agency.logo_url} alt={recruiter.agency.name} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl">
                  {recruiter.agency.name?.substring(0, 2).toUpperCase() || 'BP'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            {!collapsed && (
              <div>
                <span className="text-lg font-bold text-white tracking-tight">
                  {recruiter?.agency?.name || 'BPOC'}
                </span>
                <span className="text-xs block text-orange-400 -mt-0.5">Recruiter</span>
              </div>
            )}
          </Link>
          
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto recruiter-sidebar-scroll">
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
                      const badgeCount = getBadgeCount(item.badgeKey);
                      
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={onMobileClose}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
                              active
                                ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            )}
                          >
                            {active && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-r-full" />
                            )}
                            <div className="relative">
                              <item.icon className={cn('h-4 w-4', active && 'text-orange-400')} />
                              {badgeCount > 0 && collapsed && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 text-white text-[8px] font-bold flex items-center justify-center">
                                  {badgeCount > 9 ? '9+' : badgeCount}
                                </span>
                              )}
                            </div>
                            {!collapsed && (
                              <>
                                <span className="flex-1 text-sm font-medium">{item.name}</span>
                                {badgeCount > 0 && (
                                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] px-1.5">
                                    {badgeCount}
                                  </Badge>
                                )}
                              </>
                            )}
                            {collapsed && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10">
                                {item.name}
                                {badgeCount > 0 && <span className="ml-1 text-orange-400">({badgeCount})</span>}
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

          {/* Settings */}
          <ul className="space-y-0.5 px-3">
            <li>
              <Link
                href="/settings"
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
                  pathname.startsWith('/settings')
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {pathname.startsWith('/settings') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-r-full" />
                )}
                <Settings className={cn('h-4 w-4', pathname.startsWith('/settings') && 'text-orange-400')} />
                {!collapsed && <span className="text-sm font-medium">Settings</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10">
                    Settings
                  </div>
                )}
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-white/10">
          <div className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5',
            collapsed && 'justify-center'
          )}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg shadow-orange-500/20">
              {recruiter?.first_name?.[0] || 'R'}
              {recruiter?.last_name?.[0] || ''}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {recruiter ? `${recruiter.first_name} ${recruiter.last_name}` : 'Recruiter'}
                </p>
                <p className="text-gray-500 text-xs truncate">
                  {recruiter?.agency?.name || 'Agency'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onSignOut}
            className={cn(
              'flex items-center gap-2 w-full mt-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </motion.div>

      <style jsx global>{`
        .recruiter-sidebar-scroll {
          scroll-behavior: smooth;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: rgba(249, 115, 22, 0.3) transparent;
        }
        .recruiter-sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .recruiter-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .recruiter-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.3);
          border-radius: 10px;
        }
        .recruiter-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.5);
        }
      `}</style>
    </>
  );
}

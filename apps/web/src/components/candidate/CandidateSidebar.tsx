'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  ClipboardList,
  MessageSquare,
  Gift,
  Bell,
  LogOut,
  ChevronRight,
  Settings,
  Award,
  Scale,
  Sparkles,
  TrendingUp,
  Target,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { calculateProfileCompletion, getCompletionColor } from '@/lib/profile-completion'

interface CandidateSidebarProps {
  profile: any
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const sidebarItems = [
  { href: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/candidate/profile', label: 'Profile', icon: User },
  { href: '/candidate/resume', label: 'Resume Builder', icon: FileText },
  { href: '/candidate/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/candidate/applications', label: 'Applications', icon: ClipboardList },
  { href: '/candidate/interviews', label: 'Interviews', icon: MessageSquare },
  { href: '/candidate/hr-assistant', label: 'Your Rights Assistant', icon: Scale, highlight: true },
  { href: '/candidate/notifications', label: 'Notifications', icon: Bell },
  { href: '/candidate/offers', label: 'Offers', icon: Gift },
  { href: '/candidate/placement', label: 'My Placement', icon: Award },
  { href: '/candidate/settings', label: 'Settings', icon: Settings },
]

export function CandidateSidebar({ profile, mobileOpen, setMobileOpen }: CandidateSidebarProps) {
  const pathname = usePathname()
  const { signOut, session } = useAuth()
  const [candidate, setCandidate] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Fetch full profile data for completion calculation
  useEffect(() => {
    const fetchFullProfile = async () => {
      if (profile?.id) {
        try {
          const res = await fetch(`/api/candidates/${profile.id}`)
          if (res.ok) {
            const data = await res.json()
            setCandidate(data.candidate)
            setProfileData(data.profile)
            console.log('📊 Profile completion data refreshed:', {
              candidate: data.candidate?.id,
              profile: data.profile?.id,
              hasPhone: !!data.profile?.phone,
              hasLocation: !!data.profile?.location,
              hasBio: !!data.profile?.bio,
            })
          }
        } catch (error) {
          console.error('Error fetching full profile:', error)
        }
      }
    }

    fetchFullProfile()

    // Listen for profile updates and refetch
    const handleProfileUpdate = () => {
      console.log('🔄 Profile updated event received, refetching...')
      fetchFullProfile()
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [profile?.id])

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!session?.access_token) return

      try {
        const res = await fetch('/api/candidate/notifications', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUnreadNotifications(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Error fetching unread notifications:', error)
      }
    }

    fetchUnreadCount()

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [session?.access_token])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  // Calculate completion - wait for data to load
  console.log('🎯 Sidebar calculating completion with:', {
    hasCandidate: !!candidate,
    hasProfile: !!profileData,
    candidateId: candidate?.id,
    profileId: profileData?.id,
  })

  // Don't show error on initial load - data is fetching async
  const isLoading = !candidate || !profileData

  const completion = candidate && profileData
    ? calculateProfileCompletion(candidate, profileData)
    : {
        percentage: 0,
        encouragingMessage: isLoading ? "Loading..." : "Complete your profile",
        nextStep: isLoading ? 'Please wait' : 'Start filling out your information',
        completedFields: 0,
        totalFields: 15,
        missingFields: []
      }

  console.log('📈 Sidebar completion result:', completion.percentage + '%', {
    completedFields: completion.completedFields,
    totalFields: completion.totalFields,
    missingFields: completion.missingFields
  })

  const colors = getCompletionColor(completion.percentage)

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-in-out",
          "bg-[#0B0B0D] border-r border-white/10",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Background Ambience */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-purple-500/5 to-transparent" />
          </div>

          {/* Header */}
          <div className="relative z-10 p-6 border-b border-white/10">
            <Link href="/candidate/dashboard" className="block">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                BPOC.IO
              </h2>
              <p className="text-xs text-gray-400 mt-1 tracking-wider uppercase">
                Candidate Portal
              </p>
            </Link>

            {/* User Info */}
            <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name || profile?.first_name || 'Welcome Candidate'}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {profile?.email || 'Ready to start?'}
              </p>
            </div>

            {/* PROFILE COMPLETION CARD - Only show if incomplete */}
            {completion.percentage < 100 && (
              <Link href="/candidate/profile">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "mt-4 p-4 rounded-2xl cursor-pointer transition-all",
                    colors.bg,
                    colors.border,
                    colors.glow,
                    "border hover:border-opacity-100"
                  )}
                >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", colors.bg)}>
                      <Target className={cn("w-4 h-4", colors.text)} />
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      Profile Completion
                    </span>
                  </div>
                  <span className={cn("text-xl font-black", colors.text)}>
                    {completion.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completion.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      completion.percentage < 25 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                      completion.percentage < 50 ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
                      completion.percentage < 75 ? "bg-gradient-to-r from-yellow-500 to-cyan-500" :
                      completion.percentage < 100 ? "bg-gradient-to-r from-cyan-500 to-blue-500" :
                      "bg-gradient-to-r from-green-500 to-emerald-500"
                    )}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </motion.div>
                </div>

                {/* Encouraging Message */}
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-300 leading-tight">
                    {completion.encouragingMessage}
                  </p>
                  {completion.percentage < 100 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Sparkles className={cn("w-3 h-3", colors.text)} />
                      <span className={cn("font-semibold", colors.text)}>
                        Next: {completion.nextStep}
                      </span>
                    </div>
                  )}
                </div>

                {/* Fields Counter */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {completion.completedFields} of {completion.totalFields} fields completed
                  </span>
                  <ChevronRight className={cn("w-4 h-4", colors.text)} />
                </div>
              </motion.div>
            </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="relative z-10 flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href ||
                (item.href !== '/candidate/dashboard' && pathname?.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                    item.highlight && !isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)]"
                      : isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10 border border-transparent"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Icon className={cn(
                        "h-5 w-5 transition-colors",
                        item.highlight && !isActive ? "text-cyan-300" : isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-white"
                      )} />
                      {/* Notification badge */}
                      {item.href === '/candidate/notifications' && unreadNotifications > 0 && (
                        <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg animate-pulse">
                          {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-cyan-400 animate-pulse" />}
                  {item.highlight && !isActive && (
                    <span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full font-bold">NEW</span>
                  )}
                  {/* Show green verified badge on Profile when 100% complete */}
                  {item.href === '/candidate/profile' && completion.percentage === 100 && (
                    <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">100%</span>
                    </div>
                  )}
                  {/* Show unread count badge on Notifications */}
                  {item.href === '/candidate/notifications' && unreadNotifications > 0 && (
                    <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full">
                      <span className="text-[10px] font-bold">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="relative z-10 p-4 border-t border-white/10 bg-[#0B0B0D]">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  )
}

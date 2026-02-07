'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, LogOut, LogIn, Home, Briefcase,
  Users, ChevronDown, X,
  Gamepad2, Sparkles, Lightbulb, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/shared/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shared/ui/alert-dialog'
import { cn } from '@/lib/utils'
import LoginForm from '@/components/shared/auth/LoginForm'
import SignUpForm from '@/components/shared/auth/SignUpForm'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/contexts/AdminContext'
import { getSessionToken } from '@/lib/auth-helpers'
import { AnimatedLogo } from '@/components/shared/ui/AnimatedLogo'
import { LayoutDashboard } from 'lucide-react'
import { trackSignupModal } from '@/lib/analytics/anonymous-tracking'

interface HeaderProps {
  className?: string
}

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  username?: string
  location: string
  avatar_url?: string
  phone?: string
  bio?: string
  position?: string
  created_at: string
  updated_at: string
  slug?: string
}

export default function Header({}: HeaderProps) {
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdmin()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isSignUpDialogOpen, setIsSignUpDialogOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [savedResumeInfo, setSavedResumeInfo] = useState<{ hasSavedResume: boolean; resumeUrl: string } | null>(null)
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isAuthenticated = !!user

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Listen for URL params to trigger modals (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined' || user) return

    const params = new URLSearchParams(window.location.search)

    if (params.get('signup') === 'true') {
      setIsSignUpDialogOpen(true)
      params.delete('signup')
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname
      window.history.replaceState({}, '', newUrl)
    }

    if (params.get('login') === 'true') {
      setIsLoginDialogOpen(true)
      params.delete('login')
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [pathname, user])

  // Listen for custom event to open signup modal immediately
  useEffect(() => {
    if (typeof window === 'undefined' || user) return

    const handleOpenSignupModal = () => {
      setIsSignUpDialogOpen(true)
      trackSignupModal('open')
    }

    window.addEventListener('openSignupModal', handleOpenSignupModal)
    return () => {
      window.removeEventListener('openSignupModal', handleOpenSignupModal)
    }
  }, [user])

  // Track signup modal close/abandon
  useEffect(() => {
    if (!isSignUpDialogOpen && !user && typeof window !== 'undefined') {
      // Modal was closed without signup - track abandonment
      const wasOpen = localStorage.getItem('signup_modal_was_open');
      if (wasOpen === 'true') {
        trackSignupModal('abandoned');
        localStorage.removeItem('signup_modal_was_open');
      }
    } else if (isSignUpDialogOpen && !user) {
      localStorage.setItem('signup_modal_was_open', 'true');
    }
  }, [isSignUpDialogOpen, user])

  // Redirect non-admin users away from admin routes
  useEffect(() => {
    if (user && !isAdmin && pathname.startsWith('/admin')) {
      router.push('/home')
    }
  }, [isAdmin, user, pathname, router])

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          setProfileLoading(true)
          const response = await fetch(`/api/user/profile?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setUserProfile(data.user)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        } finally {
          setProfileLoading(false)
        }
      }
    }
    fetchUserProfile()
  }, [user?.id])

  // Refresh profile helper
  const refreshUserProfile = async () => {
    if (user?.id) {
      try {
        setProfileLoading(true)
        const response = await fetch(`/api/user/profile?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data.user)
        }
      } finally {
        setProfileLoading(false)
      }
    }
  }

  // Clear profile on logout
  useEffect(() => {
    if (!user) {
      setUserProfile(null)
      setProfileLoading(false)
    }
  }, [user])

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => refreshUserProfile()
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [user?.id])

  // Check saved resumes
  useEffect(() => {
    const checkSavedResumes = async () => {
      if (user?.id) {
        try {
          const sessionToken = await getSessionToken()
          if (!sessionToken) return
          const response = await fetch('/api/user/saved-resumes', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          })
          if (response.ok) {
            const data = await response.json()
            setSavedResumeInfo({
              hasSavedResume: data.hasSavedResume,
              resumeUrl: data.resumeUrl
            })
          }
        } catch (error) {
          console.error('Error checking saved resumes:', error)
        }
      }
    }
    checkSavedResumes()
  }, [user?.id])

  const userDisplayName = userProfile?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitials = userProfile?.full_name
    ? userProfile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  const navigationItems = [
    { title: 'Home', href: '/home', icon: Home },
    { title: 'Jobs', href: '/jobs', icon: Briefcase },
    { title: 'Free Resume Analyzer', href: '/try-resume-builder', icon: Sparkles, highlight: true },
    { title: 'Insights', href: '/insights', icon: Lightbulb },
    { title: 'How It Works', href: '/how-it-works', icon: Sparkles },
    { title: 'About', href: '/about', icon: Users }
  ]

  const isActiveRoute = (href: string) => {
    if (href === '/home') return pathname === '/home' || pathname === '/'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowSignOutDialog(false)
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      setShowSignOutDialog(false)
    }
  }

  // Determine user role and dashboard URL
  const isRecruiter = user?.user_metadata?.admin_level === 'recruiter' || user?.user_metadata?.role === 'recruiter'

  const getDashboardUrl = () => {
    if (isAdmin) return '/admin'
    if (isRecruiter) return '/recruiter'
    return '/candidate/dashboard'
  }

  const allMenuItems = [
    {
      label: 'Dashboard',
      href: getDashboardUrl(),
      icon: LayoutDashboard,
      disabled: false
    },
    { label: 'Sign Out', href: null, icon: LogOut, action: () => setShowSignOutDialog(true), disabled: false }
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-[#0B0B0D]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            : "bg-transparent border-b border-white/5"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo - Enhanced */}
            <Link href="/home" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-500/30 transition-all duration-300">
                  <AnimatedLogo />
                </div>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  BPOC.IO
                </span>
                <span className="text-[9px] text-cyan-500/80 font-mono tracking-[0.2em] uppercase">Future of Work</span>
              </div>
            </Link>

            {/* Desktop Navigation - Enhanced */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const isActive = isActiveRoute(item.href)
                const isDisabled = 'disabled' in item && item.disabled
                const isComingSoon = 'comingSoon' in item && item.comingSoon

                if (isDisabled) {
                  return (
                    <div
                      key={item.title}
                      className="relative group cursor-not-allowed"
                    >
                      <motion.div
                        className={cn(
                          "relative font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-300 overflow-hidden",
                          "text-gray-500 bg-white/5 opacity-60"
                        )}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {item.title}
                          {isComingSoon && (
                            <Badge className="ml-1 px-1.5 py-0 text-[9px] bg-gradient-to-r from-purple-500 to-pink-600 border-0 text-white">
                              SOON
                            </Badge>
                          )}
                        </span>
                      </motion.div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="relative group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-300 overflow-hidden",
                        isActive
                          ? "text-white bg-white/10 shadow-[0_0_20px_rgba(0,217,255,0.3)]"
                          : "text-gray-300 hover:text-white"
                      )}
                    >
                      {/* Gradient border effect on hover */}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-cyan-500/20 to-purple-500/20" />
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20"
                        />
                      )}

                      <span className="relative z-10 flex items-center gap-2">
                        {item.title}
                        {item.highlight && (
                          <Badge className="ml-1 px-1.5 py-0 text-[9px] bg-gradient-to-r from-cyan-500 to-blue-600 border-0 text-white">
                            FREE
                          </Badge>
                        )}
                      </span>
                    </motion.div>
                  </Link>
                )
              })}
            </nav>

            {/* User Section - Enhanced */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="hidden md:flex items-center space-x-4">
                  <div className="relative group">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 pl-3 pr-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                    >
                      <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                        {/* Animated ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-pulse" />
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white relative z-10">{userInitials}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-white hidden sm:block">{userDisplayName}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                    </motion.button>

                    {/* Dropdown Menu - Enhanced */}
                    <div className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="w-64 bg-[#0B0B0D]/95 backdrop-blur-xl rounded-2xl p-2 border border-white/10 shadow-2xl shadow-purple-500/10"
                      >
                        {allMenuItems.map((item) => {
                          const hasAction = 'action' in item && typeof item.action === 'function'
                          const hasHref = item.href && item.href !== '#'

                          if (hasHref) {
                            return (
                              <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group/item"
                                onClick={hasAction ? (e) => {
                                  e.preventDefault();
                                  if (typeof item.action === 'function') {
                                    item.action()
                                  }
                                } : undefined}
                              >
                                <item.icon className="w-5 h-5 text-cyan-400 group-hover/item:scale-110 transition-transform" />
                                <span className="font-medium">{item.label}</span>
                              </Link>
                            )
                          } else if (hasAction && typeof item.action === 'function') {
                            return (
                              <button
                                key={item.label}
                                onClick={item.action}
                                className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-red-500/10 rounded-xl transition-all duration-200 w-full text-left group/item"
                              >
                                <item.icon className="w-5 h-5 text-red-400 group-hover/item:scale-110 transition-transform" />
                                <span className="font-medium">{item.label}</span>
                              </button>
                            )
                          }
                          return null
                        })}
                      </motion.div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 rounded-xl font-semibold transition-all duration-300"
                    onClick={() => { setIsSignUpDialogOpen(false); setIsLoginDialogOpen(true); }}
                  >
                    Sign In
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    {/* Pulse ring effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-75 blur-xl animate-pulse" />

                    <Button
                      className="relative overflow-hidden rounded-2xl px-8 h-14 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-[0_0_40px_rgba(0,217,255,0.6),0_0_80px_rgba(147,51,234,0.4)] hover:shadow-[0_0_60px_rgba(0,217,255,0.8),0_0_100px_rgba(147,51,234,0.6)] transition-all border-2 border-white/20 font-black text-base group"
                      onClick={() => { setIsLoginDialogOpen(false); setIsSignUpDialogOpen(true); }}
                    >
                      {/* Animated gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <span className="relative z-10 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        I Want a Job
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>

                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Mobile Menu Trigger - Enhanced */}
              <div className="lg:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 text-white"
                    >
                      <Menu className="w-6 h-6" />
                    </motion.button>
                  </SheetTrigger>
                  <SheetContent className="w-[320px] bg-[#0B0B0D]/98 backdrop-blur-xl border-l border-white/10 p-0">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <div className="flex flex-col h-full p-6">

                      {/* Mobile Header */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <AnimatedLogo />
                          </div>
                          <span className="text-xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">BPOC.IO</span>
                        </div>
                        <button
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      {/* Mobile Navigation */}
                      <nav className="space-y-2 flex-1">
                        {navigationItems.map((item) => {
                          const isActive = isActiveRoute(item.href)
                          const isDisabled = 'disabled' in item && item.disabled
                          const isComingSoon = 'comingSoon' in item && item.comingSoon

                          if (isDisabled) {
                            return (
                              <div
                                key={item.title}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                                  "text-gray-500 bg-white/5 opacity-60 cursor-not-allowed"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <item.icon className="w-5 h-5 text-gray-600" />
                                  <span className="font-semibold">{item.title}</span>
                                </div>
                                {isComingSoon && (
                                  <Badge className="px-2 py-0.5 text-[9px] bg-gradient-to-r from-purple-500 to-pink-600 border-0 text-white">
                                    SOON
                                  </Badge>
                                )}
                              </div>
                            )
                          }

                          return (
                            <Link
                              key={item.title}
                              href={item.href}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-xl transition-all duration-200 group",
                                isActive
                                  ? "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-white shadow-lg"
                                  : "text-gray-400 hover:text-white hover:bg-white/5"
                              )}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className={cn("w-5 h-5", isActive ? "text-cyan-400" : "text-gray-500 group-hover:text-cyan-400")} />
                                <span className="font-semibold">{item.title}</span>
                              </div>
                              {item.highlight && (
                                <Badge className="px-2 py-0.5 text-[9px] bg-cyan-500 border-0 text-white">
                                  FREE
                                </Badge>
                              )}
                            </Link>
                          )
                        })}
                      </nav>

                      {/* Mobile Auth Buttons */}
                      <div className="pt-6 border-t border-white/10 space-y-3">
                        {!isAuthenticated ? (
                          <>
                            <Button
                              variant="outline"
                              className="w-full justify-start border-white/10 text-gray-300 hover:text-white hover:bg-white/10 h-12 rounded-xl"
                              onClick={() => { setIsMobileMenuOpen(false); setIsLoginDialogOpen(true); }}
                            >
                              <LogIn className="w-5 h-5 mr-3" />
                              Sign In
                            </Button>
                            <Button
                              className="w-full justify-center bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 border-2 border-white/20 h-14 rounded-2xl font-black text-base shadow-[0_0_30px_rgba(0,217,255,0.5)] relative overflow-hidden group"
                              onClick={() => { setIsMobileMenuOpen(false); setIsSignUpDialogOpen(true); }}
                            >
                              {/* Animated gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 opacity-0 group-active:opacity-100 transition-opacity duration-300" />

                              <span className="relative z-10 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                                I Want a Job
                                <ArrowRight className="w-5 h-5" />
                              </span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Link href={getDashboardUrl()}>
                              <Button
                                variant="outline"
                                className="w-full justify-start border-white/10 text-gray-300 hover:text-white hover:bg-white/10 h-12 rounded-xl"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <LayoutDashboard className="w-5 h-5 mr-3" />
                                Dashboard
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="w-full justify-start border-red-500/20 text-red-400 hover:bg-red-500/10 h-12 rounded-xl"
                              onClick={() => { setIsMobileMenuOpen(false); setShowSignOutDialog(true); }}
                            >
                              <LogOut className="w-5 h-5 mr-3" />
                              Sign Out
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Auth Dialogs */}
      <LoginForm
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onSwitchToSignUp={() => { setIsLoginDialogOpen(false); setTimeout(() => setIsSignUpDialogOpen(true), 100) }}
      />
      <SignUpForm
        open={isSignUpDialogOpen}
        onOpenChange={setIsSignUpDialogOpen}
        onSwitchToLogin={() => { setIsSignUpDialogOpen(false); setTimeout(() => setIsLoginDialogOpen(true), 100) }}
      />

      {/* Sign Out Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="bg-[#0B0B0D]/95 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">Sign Out</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-base">
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

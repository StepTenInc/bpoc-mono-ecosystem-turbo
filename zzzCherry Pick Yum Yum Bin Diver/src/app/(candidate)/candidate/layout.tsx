'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CandidateSidebar } from '@/components/candidate/CandidateSidebar'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { NotificationBell } from '@/components/shared/NotificationBell'

// Pages that allow guest (anonymous) access
const GUEST_ALLOWED_PATHS = [
  '/candidate/resume',
  '/candidate/resume/upload',
  '/candidate/resume/analysis',
  '/candidate/resume/build',
]

// Pages that require full-screen mode (no sidebar/header/padding)
const FULL_SCREEN_PATHS = [
  '/candidate/resume/build'
]

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isGuestAllowed, setIsGuestAllowed] = useState(false)

  // Check if current page should be full screen
  const isFullScreen = FULL_SCREEN_PATHS.some(path => pathname === path);

  // Debug log for full screen detection
  useEffect(() => {
    if (pathname?.includes('resume/build')) {
      console.log('Layout: Full screen detection:', { pathname, isFullScreen })
    }
  }, [pathname, isFullScreen])

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!authChecked) {
        console.log('⏰ Layout: Auth check timed out, proceeding...')
        setAuthChecked(true)
        setIsAuthenticated(false)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [authChecked])

  useEffect(() => {
    // Check if current path allows guest access
    const guestAllowed = GUEST_ALLOWED_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'))
    setIsGuestAllowed(guestAllowed)

    const checkAuth = async () => {
      // Wait for AuthContext to finish loading
      if (loading) {
        return
      }

      // If AuthContext has a user, we're good
      if (user) {
        setIsAuthenticated(true)
        setAuthChecked(true)
        fetchProfile(user.id)
        return
      }

      // Double-check with Supabase directly (AuthContext might not have updated yet)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('✅ Layout: Session found directly from Supabase')
          setIsAuthenticated(true)
          setAuthChecked(true)
          fetchProfile(session.user.id)
          return
        }
      } catch (error) {
        console.error('Layout auth check error:', error)
      }

      // No user found - allow guest access on certain pages, redirect others
      if (guestAllowed) {
        console.log('✅ Layout: Guest allowed on this page')
        setIsAuthenticated(false)
        setAuthChecked(true)
        return
      }

      // Not a guest-allowed page - redirect to home
      console.log('❌ Layout: No user found, redirecting to home')
      router.push('/')
    }

    checkAuth()
  }, [user, loading, router, pathname])

  async function fetchProfile(userId: string) {
    if (!userId) return
    try {
      console.log('📥 Layout: Fetching profile for user:', userId)

      // Use API which has admin permissions (bypasses RLS)
      const res = await fetch(`/api/candidates/${userId}`)
      if (!res.ok) {
        console.error('❌ Layout: Failed to fetch candidate:', res.status)
        setProfile(null)
        return
      }

      const { candidate } = await res.json()
      console.log('✅ Layout: Candidate fetched:', candidate?.id)
      setProfile(candidate)
    } catch (error) {
      console.error('❌ Layout: Error fetching profile:', error)
      setProfile(null)
    }
  }

  // Show loading state while checking auth
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading Portal...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not guest-allowed, return null (redirect already happening)
  if (!isAuthenticated && !isGuestAllowed) {
    return null
  }

  // Guest layout
  if (!isAuthenticated && isGuestAllowed) {
    if (isFullScreen) {
      return <>{children}</>;
    }

    return (
      <div className="min-h-screen bg-[#0B0B0D] text-gray-300">
        {/* Guest Header */}
        <div className="bg-[#0B0B0D] border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <a href="/" className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            BPOC.IO
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Try it free!</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/?signup=true')}
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              Sign Up to Save
            </Button>
          </div>
        </div>

        {/* Main Content - Full width for guests */}
        <main className="overflow-y-auto relative">
          <div className="absolute top-0 left-0 w-full h-96 bg-cyan-500/5 blur-[100px] pointer-events-none" />
          <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // Authenticated layout
  // If full screen mode is requested, strip away all wrappers
  if (isFullScreen) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-gray-300">
      {/* Incoming call UI is handled globally in `src/app/layout.tsx` via `IncomingCallNotification` + `VideoCallOverlay`.
          Keeping a second candidate-specific modal causes duplicate "Answer" popups. */}

      {/* Mobile Header */}
      <div className="lg:hidden bg-[#0B0B0D] border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          BPOC.IO
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex h-[calc(100vh-57px)] lg:h-screen overflow-hidden">
        {/* Reusable Sidebar */}
        <CandidateSidebar
          profile={profile}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative pb-16 lg:pb-0">
          <div className="absolute top-0 left-0 w-full h-96 bg-cyan-500/5 blur-[100px] pointer-events-none" />
          <div className="relative z-10 px-4 py-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-end mb-4">
              <NotificationBell />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

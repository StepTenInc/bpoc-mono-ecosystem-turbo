'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  FileText,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateProfileCompletion, getCompletionColor } from '@/lib/profile-completion'
import { motion } from 'framer-motion'


interface ProfileData {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  avatar_url?: string
  completed_data?: boolean
  slug?: string
}

interface DashboardStats {
  profile_completion: number
  has_resume: boolean
  applications_count: number
  job_matches_count: number
}

export default function CandidateDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(true)
  const [candidate, setCandidate] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileCompletion, setProfileCompletion] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return

      if (user) {
        setCurrentUserId(user.id)
        setCheckingAuth(false)
        // fetchProfile removed - we get same data from fetchStats via /api/candidates
        fetchStats(user.id)
        return
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error && error.message && !error.message.includes('session')) {
          router.push('/')
          return
        }

        if (session?.user) {
          setCurrentUserId(session.user.id)
          setCheckingAuth(false)
          // fetchProfile removed - we get same data from fetchStats via /api/candidates
          fetchStats(session.user.id)
          return
        }

        router.push('/')
      } catch (error) {
        console.error('Error in auth check:', error)
      }
    }

    checkAuth()
  }, [user, loading, router])

  // Check if user just signed up - redirect to profile page
  useEffect(() => {
    const justSignedUp = sessionStorage.getItem('justSignedUp')
    const welcome = searchParams?.get('welcome')
    
    if ((justSignedUp === 'true' || welcome === 'true') && currentUserId && stats) {
      // Clear the flag
      sessionStorage.removeItem('justSignedUp')
      
      // Redirect to profile page if incomplete
      if (stats.profile_completion < 100) {
        router.push('/profile?welcome=true')
      }
    }
  }, [currentUserId, searchParams, stats, router])

  // Check if profile is incomplete for banner
  useEffect(() => {
    if (stats) {
      if (stats.profile_completion >= 100) {
        // Profile is complete - always hide the banner
        setShowBanner(false)
      } else {
        // Show banner if profile incomplete and not dismissed
        const bannerDismissed = localStorage.getItem('profile_banner_dismissed')
        setShowBanner(!bannerDismissed)
      }
    }
  }, [stats])

  async function fetchProfile(userId: string) {
    if (!userId) return
    try {
      const response = await fetch(`/api/user/profile?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  async function fetchStats(userId: string) {
    if (!userId) return
    try {
      setLoadingStats(true)

      // Fetch full candidate and profile data for accurate completion calculation
      let candidateData = null
      let profileDataFull = null
      let calculatedCompletion = null

      try {
        const res = await fetch(`/api/candidates/${userId}`)
        if (res.ok) {
          const data = await res.json()
          candidateData = data.candidate
          profileDataFull = data.profile
          setCandidate(candidateData)
          setProfileData(profileDataFull)

          // Calculate accurate profile completion
          if (candidateData && profileDataFull) {
            calculatedCompletion = calculateProfileCompletion(candidateData, profileDataFull)
            setProfileCompletion(calculatedCompletion)
            console.log('📊 Dashboard - Accurate profile completion:', calculatedCompletion)
          }
        }
      } catch (e) {
        console.log('⚠️ Dashboard: Candidate data fetch failed (non-critical)')
      }

      // Fetch resume status (truly silent fail - suppress all console errors)
      let hasResume = false
      try {
        const resumeRes = await fetch('/api/user/saved-resumes')
        hasResume = resumeRes.ok
        // Silent - don't log anything
      } catch (e) {
        // Silent - don't log anything
      }

      // Fetch applications (truly silent fail - suppress all console errors)
      let appsData = { applications: [] }
      try {
        const appsRes = await fetch('/api/applications')
        if (appsRes.ok) {
          appsData = await appsRes.json()
        }
        // Silent - don't log anything for non-200 responses
      } catch (e) {
        // Silent - don't log anything
      }

      // Fetch job matches (silent fail)
      let matchesData = { count: 0 }
      try {
        const matchesRes = await fetch('/api/user/job-matches-count')
        if (matchesRes.ok) {
          matchesData = await matchesRes.json()
        }
      } catch (e) {
        console.log('⚠️ Dashboard: Job matches failed (non-critical)')
      }

      // Use calculated completion or fallback to default
      const completionPercentage = calculatedCompletion?.percentage ?? 20

      setStats({
        profile_completion: completionPercentage,
        has_resume: hasResume,
        applications_count: appsData.applications?.length || 0,
        job_matches_count: matchesData.count || 0,
      })
    } catch (error) {
      console.error('❌ Dashboard: Critical error fetching stats:', error)
      // Set default stats so dashboard doesn't break
      setStats({
        profile_completion: 20,
        has_resume: false,
        applications_count: 0,
        job_matches_count: 0,
      })
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || loadingStats || checkingAuth || !currentUserId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const completionSteps = [
    {
      key: 'profile',
      label: 'Complete Profile',
      completed: stats?.profile_completion === 100,
      href: '/profile'
    },
    {
      key: 'resume',
      label: 'Build Resume',
      completed: stats?.has_resume || false,
      href: '/resume'
    },
  ]

  const completedSteps = completionSteps.filter(s => s.completed).length
  const totalSteps = completionSteps.length

  // Get color scheme based on profile completion percentage
  const colors = getCompletionColor(stats?.profile_completion || 20)

  return (
    <>
      <div className="space-y-8">
        {/* Incomplete Profile Banner */}
        {stats && stats.profile_completion < 100 && showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative overflow-hidden rounded-xl border p-4",
              colors.border,
              colors.bg
            )}
          >
            <button
              onClick={() => {
                setShowBanner(false)
                localStorage.setItem('profile_banner_dismissed', 'true')
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className={cn("p-2 rounded-lg", colors.bg, colors.text)}>
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {profileCompletion?.encouragingMessage || "Let's complete your profile!"}
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  You're {100 - stats.profile_completion}% away from landing your dream job!
                  {profileCompletion?.nextStep && (
                    <span className="block mt-1">
                      <Sparkles className={cn("w-3 h-3 inline mr-1", colors.text)} />
                      <span className={cn("font-semibold", colors.text)}>
                        Next: {profileCompletion.nextStep}
                      </span>
                    </span>
                  )}
                </p>
                <Button
                  onClick={() => router.push('/profile')}
                  className={cn(
                    "border-none text-white",
                    stats.profile_completion < 25 ? "bg-red-500 hover:bg-red-600" :
                    stats.profile_completion < 50 ? "bg-orange-500 hover:bg-orange-600" :
                    stats.profile_completion < 75 ? "bg-yellow-500 hover:bg-yellow-600" :
                    "bg-cyan-500 hover:bg-cyan-600"
                  )}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Complete Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{candidate?.first_name || profile?.first_name || 'Candidate'}</span>! 👋
            </h1>
            <p className="mt-1 text-gray-400 text-sm sm:text-base">
              Here's your career progress overview
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Link href="/candidate/profile" className="flex-1 sm:flex-none">
              <Button variant="outline" className="btn-secondary w-full sm:w-auto min-h-[44px]">
                View Profile
              </Button>
            </Link>
            <Link href="/candidate/jobs" className="flex-1 sm:flex-none">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 border-none transition-all hover:scale-105 w-full sm:w-auto min-h-[44px]">
                Find Jobs
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Completion Hero Card */}
        <Link href="/candidate/profile">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-1 transition-all cursor-pointer",
              colors.border,
              colors.glow
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent opacity-50 animate-pulse" />
            <div className="relative bg-[#0B0B0D]/80 rounded-xl p-6 md:p-8 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("p-2 rounded-lg", colors.bg)}>
                      <Target className={cn("w-5 h-5", colors.text)} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white">Profile Completion</h2>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed max-w-md">
                    {profileCompletion?.encouragingMessage || "Complete your profile to unlock more opportunities!"}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className={cn("text-4xl sm:text-5xl font-black font-mono", colors.text)}>
                    {stats?.profile_completion || 20}%
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {profileCompletion?.completedFields || 2} of {profileCompletion?.totalFields || 16} fields
                  </p>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.profile_completion || 20}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    (stats?.profile_completion || 0) < 25 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                    (stats?.profile_completion || 0) < 50 ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
                    (stats?.profile_completion || 0) < 75 ? "bg-gradient-to-r from-yellow-500 to-cyan-500" :
                    (stats?.profile_completion || 0) < 100 ? "bg-gradient-to-r from-cyan-500 to-blue-500" :
                    "bg-gradient-to-r from-green-500 to-emerald-500"
                  )}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>
              </div>

              {/* Next Step */}
              {profileCompletion?.nextStep && (stats?.profile_completion || 0) < 100 && (
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className={cn("w-4 h-4", colors.text)} />
                  <span className={cn("font-semibold", colors.text)}>
                    Next: {profileCompletion.nextStep}
                  </span>
                  <ArrowRight className={cn("w-4 h-4 ml-auto", colors.text)} />
                </div>
              )}

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/10">
                {completionSteps.map((step) => (
                  <div
                    key={step.key}
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(step.href)
                    }}
                    className={cn(
                      "group relative p-3 rounded-xl border transition-all duration-300",
                      step.completed
                        ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
                        : "bg-white/5 border-white/10 hover:border-cyan-500/30 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-full transition-colors",
                        step.completed ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400 group-hover:text-cyan-400"
                      )}>
                        {step.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </div>
                      <p className={cn(
                        "font-medium text-sm transition-colors",
                        step.completed ? "text-green-400" : "text-gray-300 group-hover:text-white"
                      )}>
                        {step.label}
                      </p>
                      {!step.completed && <ArrowRight className="w-4 h-4 ml-auto text-gray-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Link>

        <style jsx global>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Applications */}
          <Link href="/candidate/applications" className="group">
            <div className="h-full relative overflow-hidden glass-card p-6 glass-card-hover hover:border-cyan-500/30 hover:shadow-glow-cyan">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium group-hover:text-cyan-400 transition-colors">Applications</h3>
                <Briefcase className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold font-mono text-white group-hover:text-cyan-50 transition-colors">{stats?.applications_count || 0}</span>
                <span className="text-sm text-gray-500 mb-1">Active</span>
              </div>
            </div>
          </Link>

          {/* Job Matches */}
          <Link href="/candidate/jobs" className="group">
            <div className="h-full relative overflow-hidden glass-card p-6 glass-card-hover hover:border-green-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium group-hover:text-green-400 transition-colors">Job Matches</h3>
                <TrendingUp className="w-5 h-5 text-gray-500 group-hover:text-green-400 transition-colors" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold font-mono text-white group-hover:text-green-50 transition-colors">{stats?.job_matches_count || 0}</span>
                <span className="text-sm text-gray-500 mb-1">New</span>
              </div>
            </div>
          </Link>

          {/* Resume Status */}
          <Link href="/candidate/resume" className="group">
            <div className="h-full relative overflow-hidden glass-card p-6 glass-card-hover hover:border-purple-500/30 hover:shadow-glow-purple">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium group-hover:text-purple-400 transition-colors">Resume</h3>
                <FileText className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(
                  "border-0 px-3 py-1",
                  stats?.has_resume ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                )}>
                  {stats?.has_resume ? 'Optimized' : 'Pending'}
                </Badge>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/candidate/jobs" className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-blue-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="p-3 rounded-lg bg-blue-500/20 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">Browse Jobs</h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Explore thousands of BPO opportunities.</p>
            </div>
          </Link>

          <Link href="/candidate/resume" className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-purple-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="p-3 rounded-lg bg-purple-500/20 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">AI Resume Builder</h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Create a professional resume in minutes.</p>
            </div>
          </Link>

        </div>

      </div>
    </>
  )
}

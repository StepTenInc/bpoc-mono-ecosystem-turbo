'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Filter,
  Loader2,
  Heart,
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Home,
  Sun,
  Moon,
  Zap,
  TrendingUp,
  Flame,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  slug: string
  company: string
  company_logo?: string
  industry?: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  salary_min?: number
  salary_max?: number
  currency: string
  work_arrangement: string
  work_type: string
  shift: string
  experience_level?: string
  skills: string[]
  posted_at: string
  match_score?: number
  match_reasons?: string[]
  match_concerns?: string[]
}

function getMatchColor(score: number): string {
  if (score >= 80) return 'text-green-400 bg-green-500/20'
  if (score >= 60) return 'text-cyan-400 bg-cyan-500/20'
  if (score >= 40) return 'text-yellow-400 bg-yellow-500/20'
  return 'text-gray-400 bg-gray-500/20'
}

function formatWorkArrangement(value: string): string {
  const map: Record<string, string> = {
    'remote': 'Remote',
    'onsite': 'On-site',
    'hybrid': 'Hybrid',
  }
  return map[value] || value
}

function formatShift(value: string): string {
  const map: Record<string, string> = {
    'day': 'Day Shift',
    'night': 'Night Shift',
    'flexible': 'Flexible',
  }
  return map[value] || value
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

export default function JobsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [generatingMatches, setGeneratingMatches] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [hasMatches, setHasMatches] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/candidate/jobs')
      const data = await res.json()
      if (data.jobs) {
        setJobs(data.jobs)
        setHasMatches(data.has_matches)
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateMatches = async () => {
    setGeneratingMatches(true)
    try {
      const res = await fetch('/api/candidate/matches/generate', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        // Refresh jobs to get match scores
        await fetchJobs()
      }
    } catch (err) {
      console.error('Error generating matches:', err)
    } finally {
      setGeneratingMatches(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Find Jobs</h1>
          <p className="text-gray-400 mt-2">
            {hasMatches 
              ? 'Jobs sorted by match score based on your profile'
              : 'Discover BPO opportunities matching your skills'
            }
          </p>
        </div>
        
        {user && !hasMatches && (
          <Button 
            onClick={generateMatches}
            disabled={generatingMatches}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {generatingMatches ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Matches
              </>
            )}
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
            placeholder="Search jobs, companies, or skills..."
          />
        </div>
        <Button variant="outline" className="border-white/10">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Results Count */}
      <p className="text-gray-400 text-sm">
        {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
      </p>

      {/* Jobs Grid - Vibrant Style */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredJobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
            <div className={`relative h-full overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-2 ${
              job.match_score && job.match_score >= 85 
                ? 'bg-gradient-to-br from-orange-500/10 via-red-500/5 to-purple-500/10 border-2 border-orange-500/30 shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_-5px_rgba(249,115,22,0.6)]'
                : job.match_score && job.match_score >= 70
                ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 border-2 border-cyan-500/30 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_-5px_rgba(6,182,212,0.5)]'
                : 'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]'
            }`}>
              
              {/* Glow overlay on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-1/2 h-24 bg-cyan-500/20 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-1/2 h-24 bg-purple-500/20 blur-3xl" />
              </div>

              {/* Hot Match Ribbon */}
              {job.match_score && job.match_score >= 85 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
              )}

              {/* Match Badge */}
              {job.match_score !== null && job.match_score !== undefined && (
                <div className="absolute top-4 right-4 z-10">
                  <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-sm ${
                    job.match_score >= 85 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50' 
                      : job.match_score >= 70 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50' 
                      : 'bg-white/10 text-gray-300'
                  }`}>
                    {job.match_score >= 85 ? (
                      <Flame className="h-4 w-4" />
                    ) : job.match_score >= 70 ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                    <span>{job.match_score}%</span>
                  </div>
                </div>
              )}

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                      job.match_score && job.match_score >= 85
                        ? 'bg-gradient-to-br from-orange-500/30 to-red-500/30 border-2 border-orange-500/40'
                        : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/20'
                    }`}>
                      {job.company_logo ? (
                        <img src={job.company_logo} alt="" className="h-9 w-9 object-contain" />
                      ) : (
                        <Building2 className={`h-7 w-7 ${job.match_score && job.match_score >= 85 ? 'text-orange-400' : 'text-cyan-400'}`} />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-[#0B0B0D] flex items-center justify-center shadow-lg shadow-green-500/50">
                      <BadgeCheck className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xl font-black transition-colors line-clamp-1 ${
                      job.match_score && job.match_score >= 85
                        ? 'text-white group-hover:text-orange-400'
                        : 'text-white group-hover:text-cyan-400'
                    }`}>
                      {job.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                      <span className="font-medium">{job.company}</span>
                      <span className="w-1 h-1 bg-cyan-500 rounded-full" />
                      <span className="text-gray-500">{timeAgo(job.posted_at)}</span>
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleSaveJob(job.id)
                    }}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      savedJobs.has(job.id) 
                        ? 'bg-gradient-to-r from-pink-500/30 to-red-500/30 text-pink-400 shadow-lg shadow-pink-500/30' 
                        : 'bg-white/5 text-gray-500 hover:bg-pink-500/20 hover:text-pink-400'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${savedJobs.has(job.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Salary - Big and Bold */}
                {(job.salary_min || job.salary_max) && (
                  <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-transparent border border-green-500/30 shadow-inner">
                    <p className="text-[10px] text-green-300 mb-1 uppercase tracking-widest font-bold">Monthly Salary</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                      ₱{job.salary_min?.toLocaleString()} - ₱{job.salary_max?.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Tags - Vibrant */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 shadow-sm">
                    {job.work_arrangement === 'remote' ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    {formatWorkArrangement(job.work_arrangement)}
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 shadow-sm">
                    {job.shift === 'day' ? <Sun className="h-4 w-4" /> : job.shift === 'night' ? <Moon className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    {formatShift(job.shift)}
                  </span>
                  {job.industry && (
                    <span className="inline-flex items-center px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-xs font-medium border border-white/10">
                      {job.industry}
                    </span>
                  )}
                </div>

                {/* Skills */}
                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400/80 text-xs font-medium border border-cyan-500/20">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="px-3 py-1.5 rounded-lg text-gray-500 text-xs font-medium">
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Match Reasons - Glowing */}
                {job.match_score !== null && job.match_score >= 70 && job.match_reasons?.length > 0 && (
                  <div className={`p-4 rounded-xl mb-4 ${
                    job.match_score >= 85 
                      ? 'bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20' 
                      : 'bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20'
                  }`}>
                    <p className={`text-[10px] mb-2 uppercase tracking-widest font-bold ${
                      job.match_score >= 85 ? 'text-orange-400' : 'text-cyan-400'
                    }`}>Why You Match</p>
                    <div className="space-y-2">
                      {job.match_reasons?.slice(0, 2).map((reason, idx) => (
                        <p key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${job.match_score >= 85 ? 'text-orange-400' : 'text-green-400'}`} />
                          <span>{reason}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer - CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Hiring Now</span>
                  </div>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group-hover:gap-3 ${
                    job.match_score && job.match_score >= 85
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50'
                  }`}>
                    View Role
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Jobs Found</h2>
            <p className="text-gray-400">
              {jobs.length === 0 
                ? 'No active jobs available at the moment. Check back soon!'
                : 'Try adjusting your search to find more opportunities.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

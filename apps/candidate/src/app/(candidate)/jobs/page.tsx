'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DollarSign
} from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  location: string
  work_setup: string
  shift: string
  salary_min?: number
  salary_max?: number
  posted_at: string
  description: string
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Customer Service Representative',
    company: 'ABC BPO Solutions',
    location: 'Makati City',
    work_setup: 'hybrid',
    shift: 'day',
    salary_min: 25000,
    salary_max: 35000,
    posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Looking for energetic CSRs to handle customer inquiries via phone and email.'
  },
  {
    id: '2',
    title: 'Technical Support Specialist',
    company: 'TechCorp Philippines',
    location: 'BGC, Taguig',
    work_setup: 'office',
    shift: 'night',
    salary_min: 30000,
    salary_max: 45000,
    posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Provide technical assistance to customers experiencing software issues.'
  },
  {
    id: '3',
    title: 'Virtual Assistant',
    company: 'Global Outsourcing Inc',
    location: 'Remote',
    work_setup: 'remote',
    shift: 'day',
    salary_min: 20000,
    salary_max: 30000,
    posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Administrative support for international clients, managing schedules and communications.'
  },
]

export default function JobsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => {
      setJobs(mockJobs)
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div>
        <h1 className="text-3xl font-bold text-white">Find Jobs</h1>
        <p className="text-gray-400 mt-2">
          Discover BPO opportunities matching your skills
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
            placeholder="Search jobs, companies, or locations..."
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

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card
            key={job.id}
            className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            <CardContent className="py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-cyan-500/20 flex-shrink-0">
                      <Building2 className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-gray-400">{job.company}</p>
                      
                      <div className="flex flex-wrap gap-3 mt-3">
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                          <Briefcase className="h-4 w-4" />
                          {job.work_setup.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                          <Clock className="h-4 w-4" />
                          {job.shift} shift
                        </div>
                      </div>

                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center gap-1.5 text-cyan-400 text-sm mt-2">
                          <DollarSign className="h-4 w-4" />
                          ₱{job.salary_min?.toLocaleString()} - ₱{job.salary_max?.toLocaleString()}/month
                        </div>
                      )}

                      <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSaveJob(job.id)
                    }}
                    variant="ghost"
                    size="sm"
                    className={savedJobs.has(job.id) ? 'text-red-400' : 'text-gray-400'}
                  >
                    <Heart className={`h-5 w-5 ${savedJobs.has(job.id) ? 'fill-current' : ''}`} />
                  </Button>
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    Apply Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Jobs Found</h2>
            <p className="text-gray-400">
              Try adjusting your search or filters to find more opportunities.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Building2,
  Loader2,
  FileText
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface Application {
  id: string
  status: string
  applied_at: string
  job: {
    id: string
    title: string
    company: string
    location: string
    work_setup: string
  }
  interview_scheduled_at?: string
}

const mockApplications: Application[] = [
  {
    id: '1',
    status: 'under_review',
    applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    job: {
      id: 'j1',
      title: 'Customer Service Representative',
      company: 'ABC BPO Solutions',
      location: 'Makati City',
      work_setup: 'hybrid',
    }
  },
  {
    id: '2',
    status: 'interview_scheduled',
    applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    interview_scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    job: {
      id: 'j2',
      title: 'Technical Support Specialist',
      company: 'TechCorp Philippines',
      location: 'BGC, Taguig',
      work_setup: 'office',
    }
  },
  {
    id: '3',
    status: 'rejected',
    applied_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    job: {
      id: 'j3',
      title: 'Virtual Assistant',
      company: 'Global Outsourcing Inc',
      location: 'Remote',
      work_setup: 'remote',
    }
  },
]

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted: { label: 'Submitted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: FileText },
  under_review: { label: 'Under Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  shortlisted: { label: 'Shortlisted', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: CheckCircle },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Calendar },
  interviewed: { label: 'Interviewed', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: CheckCircle },
  offered: { label: 'Offer Received', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  hired: { label: 'Hired', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  rejected: { label: 'Not Selected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle },
}

export default function ApplicationsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      setApplications(mockApplications)
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return !['rejected', 'withdrawn', 'hired'].includes(app.status)
    if (activeTab === 'completed') return ['rejected', 'withdrawn', 'hired'].includes(app.status)
    return true
  })

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
        <h1 className="text-3xl font-bold text-white">My Applications</h1>
        <p className="text-gray-400 mt-2">
          Track the status of your job applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-white">{applications.length}</p>
            <p className="text-gray-400 text-sm">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {applications.filter(a => a.status === 'under_review').length}
            </p>
            <p className="text-gray-400 text-sm">In Review</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-purple-400">
              {applications.filter(a => a.status === 'interview_scheduled').length}
            </p>
            <p className="text-gray-400 text-sm">Interviews</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {applications.filter(a => ['offered', 'hired'].includes(a.status)).length}
            </p>
            <p className="text-gray-400 text-sm">Offers</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredApplications.length > 0 ? (
            <div className="space-y-4">
              {filteredApplications.map((application) => {
                const status = statusConfig[application.status] || statusConfig.submitted
                const StatusIcon = status.icon
                
                return (
                  <Link key={application.id} href={`/applications/${application.id}`}>
                    <Card className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer">
                      <CardContent className="py-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-cyan-500/20 flex-shrink-0">
                              <Building2 className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {application.job.title}
                              </h3>
                              <p className="text-gray-400">{application.job.company}</p>
                              
                              <div className="flex flex-wrap gap-3 mt-3">
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                  <MapPin className="h-4 w-4" />
                                  {application.job.location}
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                  <Briefcase className="h-4 w-4" />
                                  {application.job.work_setup.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </div>
                              </div>

                              {application.interview_scheduled_at && (
                                <div className="flex items-center gap-2 mt-3 text-purple-400 text-sm">
                                  <Calendar className="h-4 w-4" />
                                  Interview: {format(new Date(application.interview_scheduled_at), 'MMM d, yyyy h:mm a')}
                                </div>
                              )}

                              <p className="text-gray-500 text-xs mt-3">
                                Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          <Badge className={`${status.color} border flex items-center gap-1.5`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No Applications</h2>
                <p className="text-gray-400 mb-6">
                  You haven't applied to any jobs yet.
                </p>
                <Link href="/jobs">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    Browse Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

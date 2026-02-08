'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, MapPin, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface CandidateApplicationCardProps {
  application: {
    id: string
    status: string
    applied_at?: string
    created_at?: string
    job?: {
      id: string
      title: string
      location?: string
      work_setup?: string
      employer?: {
        company_name?: string
      }
    }
    interview_scheduled_at?: string
    interview_time?: string
    interview_location?: string
  }
  onClick?: () => void
}

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  under_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  shortlisted: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  interview_scheduled: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  interviewed: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  offered: 'bg-green-500/20 text-green-400 border-green-500/30',
  hired: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  withdrawn: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function CandidateApplicationCard({ application, onClick }: CandidateApplicationCardProps) {
  const statusColor = statusColors[application.status] || statusColors.submitted
  const appliedDate = application.applied_at || application.created_at

  return (
    <Link href={`/applications/${application.id}`}>
      <Card 
        className="group cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                {application.job?.title || 'Unknown Position'}
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {application.job?.employer?.company_name || 'Unknown Company'}
              </p>
            </div>
            <Badge className={`${statusColor} border shrink-0`}>
              {application.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {application.job?.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{application.job.location}</span>
              </div>
            )}
            {application.job?.work_setup && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>{application.job.work_setup.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Applied {appliedDate ? format(new Date(appliedDate), 'MMM d, yyyy') : 'Recently'}</span>
            </div>
            {application.interview_scheduled_at && (
              <div className="flex items-center gap-1.5 text-purple-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Interview: {format(new Date(application.interview_scheduled_at), 'MMM d, h:mm a')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

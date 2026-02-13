'use client'

import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Video,
  Gift,
  Send,
  Eye,
  Star,
  Home,
  Sun,
  Moon,
  DollarSign,
  MapPin,
  BadgeCheck,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Download,
  ExternalLink,
  ChevronRight,
  Play,
  Award,
  Rocket,
  PartyPopper,
  Users,
  Phone,
  Mail,
  GraduationCap,
  FileVideo,
  FileAudio,
  ScrollText,
  UserCheck,
  Building,
  Handshake,
  ClipboardCheck,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  PenLine,
  ChevronDown,
  ChevronUp,
  Scale
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'

interface TimeProposal {
  id: string
  proposed_times: Array<{
    datetime_ph: string
    datetime_utc: string
  }>
  status: string
  proposed_by?: string
  created_at: string
}

interface Interview {
  id: string
  interview_type: string
  scheduled_at?: string
  scheduled_at_ph?: string
  scheduled_at_client_local?: string
  client_timezone?: string
  duration_minutes?: number
  location?: string
  meeting_link?: string
  status: string
  outcome?: string
  feedback?: string
  rating?: number
  interviewer_notes?: string
  created_at: string
  time_proposals?: TimeProposal[]
}

interface Offer {
  id: string
  salary: number
  currency?: string
  start_date: string
  status: string
  benefits?: string[]
  created_at: string
  notes?: string
}

interface Contract {
  contractId: string
  templateId: string
  templateName: string
  templateVersion: number
  generatedAt: string
  html: string // Full rendered HTML contract
  employer: { name: string; address: string; signatory?: string; signatoryTitle?: string }
  employee: { name: string; email: string; address?: string }
  position: { title: string; description: string; type: string }
  compensation: { salary: number; currency: string; salaryType: string; benefits: string[] }
  period: { startDate: string; probationPeriod: string }
  signatures: {
    candidate: { signed: boolean; signedAt?: string; signatoryName?: string }
    employer: { signed: boolean; signedBy?: string }
  }
  legalCompliance: { compliantWith: string; applicableLaws: string[] }
}

interface Application {
  id: string
  job_id: string
  status: string
  created_at: string
  updated_at: string
  released_to_client: boolean
  released_at?: string
  rejection_reason?: string
  recruiter_notes?: string
  jobs?: {
    id: string
    title: string
    description?: string
    salary_min?: number
    salary_max?: number
    currency?: string
    work_arrangement?: string
    shift?: string
    agency_clients?: {
      agencies?: { name: string }
      companies?: { name: string; industry?: string }
    }
  }
  calls?: Array<{
    id: string
    call_type: string
    call_title?: string
    status: string
    notes?: string
    share_with_candidate: boolean
    started_at?: string
    ended_at?: string
    duration_seconds?: number
    recordings?: Array<{
      id: string
      recording_url: string
      download_url?: string
      duration_seconds?: number
      shared_with_candidate: boolean
    }>
    transcripts?: Array<{
      id: string
      full_text?: string
      summary?: string
      key_points?: string[]
      shared_with_candidate: boolean
    }>
  }>
  interviews?: Interview[]
  offers?: Offer[]
}

// Real candidate journey stages
const journeyStages = [
  { key: 'under_review', label: 'Under Review', icon: Eye, description: 'Being reviewed by recruitment' },
  { key: 'shortlisted', label: 'Shortlisted', icon: Star, description: 'Approved, preparing for client' },
  { key: 'with_client', label: 'With Client', icon: Building, description: 'Profile shared with hiring company' },
  { key: 'interview', label: 'Interview', icon: Video, description: 'Interview stage' },
  { key: 'decision', label: 'Decision', icon: ClipboardCheck, description: 'Awaiting client decision' },
  { key: 'offer', label: 'Offer', icon: Gift, description: 'Offer received' },
  { key: 'accepted', label: 'Accepted', icon: Handshake, description: 'Offer accepted' },
]

const statusConfig: Record<string, { 
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: any
  description: string
  stage: number
  theme: 'cyan' | 'purple' | 'green' | 'yellow' | 'red' | 'gray'
}> = {
  submitted: { 
    label: 'Under Review', 
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    icon: Eye,
    description: 'Your application is being reviewed by our recruitment team. We\'ll update you once we\'ve assessed your profile.',
    stage: 1,
    theme: 'cyan'
  },
  under_review: { 
    label: 'Under Review', 
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    icon: Eye,
    description: 'Your application is being reviewed by our recruitment team. We\'ll update you once we\'ve assessed your profile.',
    stage: 1,
    theme: 'cyan'
  },
  shortlisted: { 
    label: 'Shortlisted', 
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    icon: Star,
    description: 'Great news! You\'ve been shortlisted. Our team is preparing your profile for client review.',
    stage: 2,
    theme: 'yellow'
  },
  released_to_client: { 
    label: 'With Client', 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: Building,
    description: 'Your profile has been shared with the hiring company. They\'re currently reviewing candidates.',
    stage: 3,
    theme: 'yellow'
  },
  interview_scheduled: { 
    label: 'Interview Scheduled', 
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    icon: Video,
    description: 'Your interview has been scheduled! Check the details below and prepare well.',
    stage: 4,
    theme: 'purple'
  },
  interviewed: { 
    label: 'Awaiting Decision', 
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/30',
    icon: ClipboardCheck,
    description: 'Interview completed! The client is reviewing all candidates and will make a decision soon.',
    stage: 5,
    theme: 'purple'
  },
  offer_sent: { 
    label: 'Offer Received', 
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    icon: Gift,
    description: 'Congratulations! You\'ve received a job offer. Review the details below and make your decision.',
    stage: 6,
    theme: 'green'
  },
  offer_accepted: { 
    label: 'Contract Pending', 
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    icon: PenLine,
    description: 'Great! You\'ve accepted the offer. Please review and sign your employment contract to finalize your hiring.',
    stage: 6,
    theme: 'yellow'
  },
  contract_signed: { 
    label: 'Contract Signed', 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: Handshake,
    description: 'Amazing! You\'ve signed your contract. Your onboarding journey begins now!',
    stage: 7,
    theme: 'green'
  },
  hired: { 
    label: 'Hired', 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: BadgeCheck,
    description: 'Welcome to the team! Head to Onboarding to complete your setup.',
    stage: 7,
    theme: 'green'
  },
  rejected: { 
    label: 'Not Selected', 
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: XCircle,
    description: 'Unfortunately, you weren\'t selected for this role. Don\'t give up - keep applying!',
    stage: -1,
    theme: 'red'
  },
  withdrawn: { 
    label: 'Withdrawn', 
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    icon: XCircle,
    description: 'You have withdrawn this application.',
    stage: -1,
    theme: 'gray'
  },
}

function getStageNumber(status: string, releasedToClient: boolean, interviews?: Interview[]): number {
  // Handle released_to_client flag
  if (releasedToClient && ['shortlisted', 'released_to_client'].includes(status)) {
    return 3 // With Client
  }
  
  // If interview_scheduled but interview date has passed → move to Decision stage
  if (status === 'interview_scheduled' && interviews && interviews.length > 0) {
    const latestInterview = interviews[interviews.length - 1]
    if (latestInterview.scheduled_at) {
      const interviewDate = new Date(latestInterview.scheduled_at)
      if (interviewDate < new Date()) {
        return 5 // Decision
      }
    }
  }
  
  return statusConfig[status]?.stage || 1
}

// Compute effective status (upgrades status when interview has passed)
function getEffectiveStatus(status: string, interviews?: Interview[]): string {
  if (status === 'interview_scheduled' && interviews && interviews.length > 0) {
    const latestInterview = interviews[interviews.length - 1]
    if (latestInterview.scheduled_at) {
      const interviewDate = new Date(latestInterview.scheduled_at)
      if (interviewDate < new Date()) {
        return 'interviewed' // Upgrade to "Awaiting Decision"
      }
    }
  }
  return status
}

function getThemeColors(theme: string) {
  switch (theme) {
    case 'green':
      return {
        border: 'border-2 border-green-500/40',
        borderColor: 'border-green-500/30',
        gradient: 'bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-cyan-500/10',
        glow: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]',
        accent: 'text-green-400',
        accentBg: 'bg-green-500/20',
        progressBar: 'bg-gradient-to-r from-green-500 to-emerald-500',
        button: 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30',
      }
    case 'purple':
      return {
        border: 'border-2 border-purple-500/40',
        borderColor: 'border-purple-500/30',
        gradient: 'bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-pink-500/10',
        glow: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)]',
        accent: 'text-purple-400',
        accentBg: 'bg-purple-500/20',
        progressBar: 'bg-gradient-to-r from-purple-500 to-pink-500',
        button: 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30',
      }
    case 'yellow':
      return {
        border: 'border-2 border-yellow-500/40',
        borderColor: 'border-yellow-500/30',
        gradient: 'bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-red-500/10',
        glow: 'shadow-[0_0_30px_-5px_rgba(234,179,8,0.4)]',
        accent: 'text-yellow-400',
        accentBg: 'bg-yellow-500/20',
        progressBar: 'bg-gradient-to-r from-yellow-500 to-orange-500',
        button: 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30',
      }
    case 'red':
      return {
        border: 'border border-red-500/30',
        borderColor: 'border-red-500/30',
        gradient: 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-pink-500/10',
        glow: '',
        accent: 'text-red-400',
        accentBg: 'bg-red-500/20',
        progressBar: 'bg-gradient-to-r from-red-500 to-rose-500',
        button: 'bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30',
      }
    case 'gray':
      return {
        border: 'border border-white/10',
        borderColor: 'border-white/10',
        gradient: 'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
        glow: '',
        accent: 'text-gray-400',
        accentBg: 'bg-gray-500/20',
        progressBar: 'bg-gradient-to-r from-gray-500 to-gray-600',
        button: 'bg-white/10 hover:bg-white/20',
      }
    default: // cyan
      return {
        border: 'border-2 border-cyan-500/30',
        borderColor: 'border-cyan-500/30',
        gradient: 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10',
        glow: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]',
        accent: 'text-cyan-400',
        accentBg: 'bg-cyan-500/20',
        progressBar: 'bg-gradient-to-r from-cyan-500 to-blue-500',
        button: 'bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/30',
      }
  }
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const applicationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<Application | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [contract, setContract] = useState<Contract | null>(null)
  const [contractLoading, setContractLoading] = useState(false)
  const [contractExpanded, setContractExpanded] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Epic confetti celebration
  const fireConfetti = useCallback(() => {
    setCelebrating(true)
    
    // Multiple bursts for epic effect
    const duration = 4000
    const end = Date.now() + duration

    const colors = ['#22c55e', '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899']

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      })
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()

    // Big center burst
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors
      })
    }, 500)

    // Another big burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.5 },
        colors: colors,
        scalar: 1.2
      })
    }, 1500)

    setTimeout(() => setCelebrating(false), duration)
  }, [])

  useEffect(() => {
    if (session?.access_token && applicationId) {
      fetchApplication()
    }
  }, [session?.access_token, applicationId])

  // Fire confetti if just hired (celebrating state)
  useEffect(() => {
    if (application && ['contract_signed', 'hired'].includes(application.status) && !celebrating) {
      // Small celebration on viewing hired status
      const hasSeenCelebration = sessionStorage.getItem(`celebrated-${applicationId}`)
      if (!hasSeenCelebration) {
        sessionStorage.setItem(`celebrated-${applicationId}`, 'true')
        fireConfetti()
      }
    }
  }, [application?.status, applicationId, fireConfetti, celebrating])

  // Fetch contract when offer is accepted
  useEffect(() => {
    if (application?.status === 'offer_accepted' && session?.access_token) {
      fetchContract()
    }
  }, [application?.status, session?.access_token])

  const fetchContract = async () => {
    setContractLoading(true)
    try {
      const res = await fetch(`/api/contracts/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setContract(data.contract)
        // Pre-fill signature name
        if (data.contract?.employee?.name) {
          setSignatureName(data.contract.employee.name)
        }
      }
    } catch (err) {
      console.error('Error fetching contract:', err)
    } finally {
      setContractLoading(false)
    }
  }

  const handleSignContract = async () => {
    if (!signatureName.trim()) {
      toast.error('Please enter your full legal name')
      return
    }
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    setSigning(true)
    try {
      const consentText = `I, ${signatureName}, hereby accept and agree to all terms and conditions stated in this employment contract. I understand that this constitutes a legally binding agreement under Philippine law (Republic Act 8792 - E-Commerce Act of 2000).`

      const res = await fetch(`/api/contracts/${applicationId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatoryName: signatureName,
          signatureMethod: 'typed_name',
          consentText,
        }),
      })

      if (res.ok) {
        // Update application to hired
        await fetch(`/api/candidate/applications/${applicationId}/complete-hiring`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        })

        // CELEBRATE!
        fireConfetti()
        toast.success('Contract signed! Welcome aboard!')
        fetchApplication()
        // Redirect to onboarding after celebration
        setTimeout(() => router.push('/onboarding'), 4500)
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to sign contract')
      }
    } catch (err) {
      toast.error('Failed to sign contract')
    } finally {
      setSigning(false)
    }
  }

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/candidate/applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Failed to load application')
        return
      }
      setApplication(data.application)
    } catch (err) {
      console.error('Error fetching application:', err)
      toast.error('Failed to load application')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this application? This cannot be undone.')) return
    
    setWithdrawing(true)
    try {
      const res = await fetch(`/api/candidate/applications/${applicationId}/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      if (res.ok) {
        toast.success('Application withdrawn')
        fetchApplication()
      } else {
        toast.error('Failed to withdraw application')
      }
    } catch (err) {
      toast.error('Failed to withdraw application')
    } finally {
      setWithdrawing(false)
    }
  }

  const handleAcceptOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/candidate/offers/${offerId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      if (res.ok) {
        toast.success('Offer accepted! Please sign your employment contract below.')
        fetchApplication() // This will trigger contract loading
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to accept offer')
      }
    } catch (err) {
      toast.error('Failed to accept offer')
    }
  }

  const handleDeclineOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to decline this offer?')) return
    
    try {
      const res = await fetch(`/api/candidate/offers/${offerId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      if (res.ok) {
        toast.success('Offer declined')
        fetchApplication()
      } else {
        toast.error('Failed to decline offer')
      }
    } catch (err) {
      toast.error('Failed to decline offer')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link href="/applications" className="inline-flex items-center text-gray-400 hover:text-cyan-400 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Link>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Application Not Found</h2>
          <p className="text-gray-400 mb-6">This application doesn't exist or you don't have access to view it.</p>
          <Link href="/applications">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600">
              View All Applications
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const job = application.jobs
  const company = job?.agency_clients?.agencies?.name || 'Company'
  const industry = job?.agency_clients?.companies?.industry
  
  // Use effective status (upgrades when interview has passed)
  const effectiveStatus = getEffectiveStatus(application.status, application.interviews)
  const statusInfo = statusConfig[effectiveStatus] || statusConfig.submitted
  const StatusIcon = statusInfo.icon
  const currentStage = getStageNumber(application.status, application.released_to_client, application.interviews)
  const theme = getThemeColors(statusInfo.theme)
  const isNegative = ['rejected', 'withdrawn'].includes(application.status)
  const isComplete = ['contract_signed', 'hired'].includes(application.status)
  const hasOffer = application.status === 'offer_sent'
  const needsContractSigning = application.status === 'offer_accepted'
  
  // Get shared calls/recordings
  const sharedCalls = application.calls?.filter(c => c.share_with_candidate) || []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/applications" className={`inline-flex items-center transition-colors text-gray-400 hover:${theme.accent}`}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Applications
      </Link>

      {/* Main Header Card */}
      <div className={`relative overflow-hidden rounded-2xl ${theme.gradient} ${theme.border} ${theme.glow}`}>
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${theme.progressBar}`} />

        <div className="p-6 md:p-8">
          {/* Status Badge and Title */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${theme.accentBg} border border-white/20`}>
                <Briefcase className={`h-8 w-8 ${theme.accent}`} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">{job?.title || 'Application'}</h1>
                <p className="text-gray-400 mt-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{company}</span>
                  {industry && (
                    <>
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.accentBg}`} />
                      <span className="text-gray-500">{industry}</span>
                    </>
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-lg ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`}>
              <StatusIcon className="h-6 w-6" />
              {statusInfo.label}
            </div>
          </div>

          {/* Status Description */}
          <div className={`p-4 rounded-xl mb-6 ${theme.accentBg} border border-white/10`}>
            <p className={`font-medium ${theme.accent}`}>
              {statusInfo.description}
            </p>
          </div>

          {/* Progress Tracker */}
          {!isNegative && (
            <div className="mb-6">
              <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-4">Your Journey</h3>
              <div className="relative">
                {/* Progress line container - positioned between icons */}
                <div className="absolute top-5 left-[calc(100%/14)] right-[calc(100%/14)] h-0.5 flex items-center">
                  <div className="w-full h-full bg-white/10 rounded-full relative">
                    <div 
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${theme.progressBar}`}
                      style={{ width: `${Math.max(0, Math.min(((currentStage - 1) / 6) * 100, 100))}%` }}
                    />
                  </div>
                </div>
                
                {/* Stage icons */}
                <div className="flex items-center justify-between relative">
                  {journeyStages.map((stage, idx) => {
                    const stageNum = idx + 1
                    const isComplete = currentStage > stageNum
                    const isCurrent = currentStage === stageNum
                    const StageIcon = stage.icon
                    
                    return (
                      <div key={stage.key} className="flex flex-col items-center z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-4 border-[#0B0B0D] ${
                          isComplete 
                            ? `${theme.button} text-white`
                            : isCurrent 
                            ? `${theme.button} text-white shadow-lg shadow-current`
                            : 'bg-[#1a1a1f] text-gray-500'
                        }`}>
                          {isComplete ? <CheckCircle className="h-5 w-5" /> : <StageIcon className="h-5 w-5" />}
                        </div>
                        <span className={`text-xs mt-2 font-medium text-center max-w-[60px] ${
                          isComplete || isCurrent ? theme.accent : 'text-gray-500'
                        }`}>
                          {stage.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/profile/resume">
              <Button variant="outline" className="border-white/20 hover:bg-white/10 font-medium">
                <FileText className="h-4 w-4 mr-2" />
                View Resume
              </Button>
            </Link>
            {!isNegative && !isComplete && !hasOffer && (
              <Button 
                variant="outline" 
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium"
                onClick={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Withdraw Application
              </Button>
            )}
            {isComplete && (
              <Link href="/onboarding">
                <Button className={`${theme.button} font-bold`}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Go to Onboarding
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Released to Client Notice */}
      {application.released_to_client && !['offer_sent', 'offer_accepted', 'hired', 'rejected'].includes(application.status) && (
        <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-2 border-orange-500/30 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <Building className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">Your Profile is With the Client</h3>
              <p className="text-gray-400">
                The hiring company is reviewing your profile along with other candidates. 
                {application.released_at && (
                  <span className="text-orange-400"> Shared on {format(new Date(application.released_at), 'MMM d, yyyy')}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Interviews */}
      {application.interviews && application.interviews.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-pink-500/10 border-2 border-purple-500/30 p-6">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            Interview Schedule
          </h2>
          <div className="space-y-4">
            {application.interviews.map((interview) => {
              const isPending = interview.status === 'pending_scheduling'
              const isScheduled = interview.status === 'scheduled'
              const isCompleted = ['completed', 'no_show', 'cancelled'].includes(interview.status)
              const hasProposedTime = interview.time_proposals && interview.time_proposals.length > 0
              
              return (
                <div key={interview.id} className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  {/* Interview Type Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/20">
                        <Video className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white capitalize">
                          {interview.interview_type?.replace(/_/g, ' ') || 'Interview'}
                        </h4>
                        {interview.duration_minutes && (
                          <p className="text-sm text-gray-400">
                            {interview.duration_minutes} minutes
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={`capitalize ${
                      isScheduled ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      isPending ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      isCompleted ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                      'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    }`}>
                      {interview.status?.replace(/_/g, ' ') || 'Pending'}
                    </Badge>
                  </div>

                  {/* Scheduled Time - Show in PHT */}
                  {isScheduled && interview.scheduled_at_ph && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30 mb-4">
                      <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold mb-1">Your Interview Time (Philippines)</p>
                      <p className="text-xl font-black text-white">{interview.scheduled_at_ph}</p>
                      {interview.client_timezone && (
                        <p className="text-sm text-gray-400 mt-1">
                          Client timezone: {interview.client_timezone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pending Proposed Time */}
                  {isPending && hasProposedTime && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 mb-4">
                      <p className="text-[10px] text-yellow-300 uppercase tracking-widest font-bold mb-2">Proposed Interview Time</p>
                      {interview.time_proposals?.map((proposal) => (
                        <div key={proposal.id}>
                          {proposal.proposed_times.map((time, idx) => (
                            <p key={idx} className="text-xl font-black text-white">{time.datetime_ph}</p>
                          ))}
                          <p className="text-sm text-yellow-400 mt-2 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Your recruiter will contact you to confirm this time
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Meeting Link - Show only when scheduled and close to time */}
                  {isScheduled && interview.meeting_link && (
                    <div className="flex gap-3 mt-4">
                      <a 
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                      >
                        <Video className="h-5 w-5" />
                        Join Interview
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}

                  {/* Completed Interview - Show feedback if available */}
                  {isCompleted && interview.feedback && (
                    <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-[10px] text-purple-300 uppercase tracking-widest font-bold mb-1">Interview Feedback</p>
                      <p className="text-gray-300 text-sm">{interview.feedback}</p>
                      {interview.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${star <= interview.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Interview Recordings Section */}
      {sharedCalls.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-pink-500/10 border-2 border-purple-500/30 p-6">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-400" />
            Interview Recordings & Notes
          </h2>
          <div className="space-y-4">
            {sharedCalls.map((call) => (
              <div key={call.id} className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white">{call.call_title || call.call_type || 'Interview'}</h4>
                    {call.started_at && (
                      <p className="text-sm text-gray-400">
                        {format(new Date(call.started_at), 'MMM d, yyyy \'at\' h:mm a')}
                        {call.duration_seconds && ` · ${Math.round(call.duration_seconds / 60)} minutes`}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 capitalize">
                    {call.status}
                  </Badge>
                </div>

                {/* Recruiter Notes */}
                {call.notes && (
                  <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-purple-300 uppercase tracking-widest font-bold mb-1">Recruiter Notes</p>
                    <p className="text-gray-300 text-sm">{call.notes}</p>
                  </div>
                )}

                {/* Recordings */}
                {call.recordings?.filter(r => r.shared_with_candidate).map((recording) => (
                  <div key={recording.id} className="flex items-center gap-3 mb-2">
                    <a 
                      href={recording.recording_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                    >
                      <FileVideo className="h-4 w-4" />
                      <span className="text-sm font-medium">Watch Recording</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {recording.download_url && (
                      <a 
                        href={recording.download_url}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-sm font-medium">Download</span>
                      </a>
                    )}
                  </div>
                ))}

                {/* Transcripts */}
                {call.transcripts?.filter(t => t.shared_with_candidate).map((transcript) => (
                  <div key={transcript.id} className="mt-3">
                    {transcript.summary && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-2">
                        <p className="text-[10px] text-purple-300 uppercase tracking-widest font-bold mb-1">Summary</p>
                        <p className="text-gray-300 text-sm">{transcript.summary}</p>
                      </div>
                    )}
                    {transcript.key_points && transcript.key_points.length > 0 && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-[10px] text-purple-300 uppercase tracking-widest font-bold mb-2">Key Points</p>
                        <ul className="space-y-1">
                          {transcript.key_points.map((point, idx) => (
                            <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offer Section */}
      {hasOffer && application.offers && application.offers.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-cyan-500/10 border-2 border-green-500/30 p-6">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-400" />
            Job Offer
          </h2>
          {application.offers.map((offer) => (
            <div key={offer.id} className="p-5 rounded-xl bg-green-500/10 border border-green-500/20">
              {/* Salary */}
              <div className="mb-4">
                <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold mb-1">Offered Salary</p>
                <p className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  {offer.currency === 'PHP' ? '₱' : offer.currency || '₱'}{offer.salary?.toLocaleString()}/month
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold mb-1">Start Date</p>
                  <p className="text-white font-bold">
                    {offer.start_date ? format(new Date(offer.start_date), 'MMMM d, yyyy') : 'To be confirmed'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold mb-1">Offer Status</p>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 capitalize">
                    {(offer.status === 'sent' || offer.status === 'viewed') ? 'Awaiting Your Response' : offer.status || 'Pending'}
                  </Badge>
                </div>
              </div>

              {/* Benefits */}
              {offer.benefits && offer.benefits.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold mb-2">Benefits Included</p>
                  <div className="flex flex-wrap gap-2">
                    {offer.benefits.map((benefit, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-sm border border-green-500/20">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {offer.notes && (
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold mb-1">Additional Notes</p>
                  <p className="text-gray-300 text-sm">{offer.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {(offer.status === 'pending' || offer.status === 'sent' || offer.status === 'viewed') && (
                <div className="flex gap-3 pt-4 border-t border-green-500/20">
                  <Button 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 font-bold flex-1"
                    onClick={() => handleAcceptOffer(offer.id)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Accept Offer
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white/20 text-gray-300 flex-1"
                    onClick={() => handleDeclineOffer(offer.id)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contract Signing Section - when offer accepted but not yet signed */}
      {needsContractSigning && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border-2 border-amber-500/30 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-amber-500/20">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Scale className="h-6 w-6 text-amber-400" />
              </div>
              Employment Contract
            </h2>
            <p className="text-gray-400 mt-2">
              Please review the full contract below and sign to confirm your employment.
            </p>
          </div>
          
          {contractLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
              <span className="ml-3 text-gray-400">Loading your employment contract...</span>
            </div>
          ) : contract ? (
            <div>
              {/* Contract Summary Bar */}
              <div className="p-4 bg-white/5 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Position:</span>
                    <span className="text-white font-bold">{contract.position?.title}</span>
                  </div>
                  <span className="text-gray-600">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Employer:</span>
                    <span className="text-white font-bold">{contract.employer?.name}</span>
                  </div>
                  <span className="text-gray-600">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Salary:</span>
                    <span className="text-green-400 font-bold">
                      {contract.compensation?.currency} {contract.compensation?.salary?.toLocaleString()}/month
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">DOLE Compliant</span>
                  </div>
                </div>
              </div>

              {/* Full Contract Toggle */}
              <div className="p-4 border-b border-white/10">
                <button
                  onClick={() => setContractExpanded(!contractExpanded)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-amber-400" />
                    <span className="font-bold text-white">
                      {contractExpanded ? 'Hide Full Contract' : 'Read Full Employment Contract'}
                    </span>
                  </div>
                  {contractExpanded ? (
                    <ChevronUp className="h-5 w-5 text-amber-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-amber-400" />
                  )}
                </button>
              </div>

              {/* Full Contract HTML */}
              {contractExpanded && contract.html && (
                <div className="p-6 bg-white border-b border-white/10">
                  <div 
                    className="contract-content prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: contract.html }}
                  />
                </div>
              )}

              {/* Signature Section */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <PenLine className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-white">Electronic Signature</h3>
                  <span className="text-xs text-gray-500">(R.A. 8792 - E-Commerce Act)</span>
                </div>

                {/* Legal Notice */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
                  <p className="text-amber-200">
                    By signing below, you acknowledge that you have read and understood the complete 
                    employment contract above, and you agree to be bound by all its terms and conditions.
                  </p>
                </div>

                {/* Signature Input */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Full Legal Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Enter your full legal name exactly as it appears on your ID"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      disabled={signing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="text"
                      value={format(new Date(), 'MMMM d, yyyy')}
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400"
                    />
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 cursor-pointer accent-amber-500 h-5 w-5"
                    disabled={signing}
                  />
                  <label htmlFor="agree-terms" className="text-sm text-gray-300 cursor-pointer leading-relaxed">
                    <span className="font-bold text-white">I confirm that:</span>
                    <ul className="mt-2 space-y-1 text-gray-400">
                      <li>I have read the complete employment contract above</li>
                      <li>I understand and agree to all terms and conditions</li>
                      <li>I am signing voluntarily and without coercion</li>
                      <li>This electronic signature constitutes my legal signature under R.A. 8792</li>
                    </ul>
                  </label>
                </div>

                {/* Sign Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold py-4 text-lg shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSignContract}
                  disabled={signing || !signatureName.trim() || !agreedToTerms}
                >
                  {signing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Signing Contract...
                    </>
                  ) : (
                    <>
                      <PenLine className="h-5 w-5 mr-2" />
                      Sign Employment Contract
                    </>
                  )}
                </Button>

                {!agreedToTerms && (
                  <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Please read the contract and check the agreement box to sign
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">Unable to load your employment contract.</p>
              <Button variant="outline" className="border-amber-500/30 text-amber-400" onClick={fetchContract}>
                <Loader2 className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Onboarding CTA - when offer accepted */}
      {isComplete && (
        <div className={`rounded-2xl bg-gradient-to-r from-emerald-500/20 via-green-500/10 to-cyan-500/20 border-2 border-emerald-500/30 p-8 text-center relative overflow-hidden ${celebrating ? 'animate-pulse' : ''}`}>
          {/* Animated background glow when celebrating */}
          {celebrating && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/30 to-cyan-500/20 animate-pulse" />
          )}
          <div className="relative z-10">
            <div className={`${celebrating ? 'animate-bounce' : ''}`}>
              <PartyPopper className="h-20 w-20 text-emerald-400 mx-auto mb-4" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              Congratulations!
            </h2>
            <p className="text-xl text-emerald-300 font-bold mb-2">You're Hired!</p>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Your application journey is complete. Head to Onboarding to sign your contract and complete your setup.
            </p>
            <Link href="/onboarding">
              <Button className="bg-gradient-to-r from-emerald-500 to-green-500 font-bold px-8 py-4 text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105">
                <Rocket className="h-6 w-6 mr-2" />
                Start Onboarding
                <ArrowRight className="h-6 w-6 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Job Details */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Briefcase className={`h-5 w-5 ${theme.accent}`} />
          Job Details
        </h2>
        
        {/* Salary */}
        {(job?.salary_min || job?.salary_max) && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-transparent border border-green-500/30 mb-4">
            <p className="text-[10px] text-green-300 mb-1 uppercase tracking-widest font-bold">Monthly Salary Range</p>
            <p className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              ₱{job.salary_min?.toLocaleString()} - ₱{job.salary_max?.toLocaleString()}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-3 mb-4">
          {job?.work_arrangement && (
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${theme.accentBg} ${theme.accent} ${theme.borderColor}`}>
              {job.work_arrangement === 'remote' ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              {job.work_arrangement === 'remote' ? 'Work From Home' : job.work_arrangement === 'hybrid' ? 'Hybrid' : 'Office-Based'}
            </span>
          )}
          {job?.shift && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 text-sm font-bold border border-purple-500/30">
              {job.shift === 'day' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {job.shift === 'day' ? 'Day Shift' : job.shift === 'night' ? 'Night Shift' : 'Flexible'}
            </span>
          )}
        </div>

        {/* Description */}
        {job?.description && (
          <div>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">About This Role</p>
            <p className="text-gray-300 leading-relaxed">{job.description}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Clock className={`h-5 w-5 ${theme.accent}`} />
          Application Timeline
        </h2>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-start gap-4">
            <div className={`w-4 h-4 rounded-full mt-1 ${theme.progressBar}`} />
            <div>
              <p className="text-white font-bold">{statusInfo.label}</p>
              <p className="text-gray-400 text-sm">
                {application.updated_at 
                  ? format(new Date(application.updated_at), 'MMM d, yyyy \'at\' h:mm a')
                  : 'Current'
                }
              </p>
            </div>
          </div>
          
          {/* Released to Client */}
          {application.released_to_client && application.released_at && (
            <div className="flex items-start gap-4 opacity-70">
              <div className="w-4 h-4 rounded-full mt-1 bg-orange-500" />
              <div>
                <p className="text-white font-medium">Released to Client</p>
                <p className="text-gray-400 text-sm">
                  {format(new Date(application.released_at), 'MMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
          )}
          
          {/* Application Submitted */}
          <div className="flex items-start gap-4 opacity-50">
            <div className="w-4 h-4 rounded-full mt-1 bg-blue-500" />
            <div>
              <p className="text-white font-medium">Application Submitted</p>
              <p className="text-gray-400 text-sm">
                {format(new Date(application.created_at), 'MMM d, yyyy \'at\' h:mm a')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason */}
      {application.status === 'rejected' && application.rejection_reason && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
          <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-red-400" />
            Feedback
          </h3>
          <p className="text-gray-300">{application.rejection_reason}</p>
        </div>
      )}

      {/* Help Section */}
      <div className={`rounded-2xl p-6 ${theme.gradient} border ${theme.border}`}>
        <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <MessageSquare className={`h-5 w-5 ${theme.accent}`} />
          Need Help?
        </h3>
        <p className="text-gray-400 mb-4">
          If you have questions about your application or need assistance, our recruitment team is here to help.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-white/20 hover:bg-white/10 font-medium">
            <Mail className="h-4 w-4 mr-2" />
            Contact Recruiter
          </Button>
          <Link href="/help">
            <Button variant="outline" className="border-white/20 hover:bg-white/10 font-medium">
              <Users className="h-4 w-4 mr-2" />
              FAQ & Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

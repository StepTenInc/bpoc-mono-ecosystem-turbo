'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/client/VideoPlayer';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  FileText,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Video,
  MessageSquare,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  AlertTriangle,
  Star,
  ExternalLink,
  Award,
  User,
  Gift,
  ThumbsUp,
  ThumbsDown,
  Send,
  Play,
  RefreshCw,
  Ban,
  AlertCircle,
  TrendingUp,
  X,
  Check,
  Building2,
  ClipboardCheck,
  BadgeCheck,
  CalendarCheck
} from 'lucide-react';

interface CounterOffer {
  id: string;
  requestedSalary: number;
  currency: string;
  message: string | null;
  employerResponse: string | null;
  responseType: string | null;
  status: string;
  createdAt: string;
  respondedAt: string | null;
}

interface PreScreen {
  id: string;
  title: string;
  type: string;
  date: string;
  endedAt: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
  recordingDuration: number | null;
  transcription: string | null;
  summary: string | null;
  notes: string | null;
}

interface Interview {
  id: string;
  scheduledAt: string;
  scheduledAtClientLocal?: string | null;
  duration: number;
  timezone: string;
  status: string;
  meetingLink: string | null;
  outcome: string | null;
  rating: number | null;
  notes: string | null;
}

interface Offer {
  id: string;
  salaryOffered: number;
  currency: string;
  startDate: string;
  benefits: string[] | null;
  additionalTerms: string | null;
  status: string;
  sentAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
  expiresAt: string;
  candidateResponse: string | null;
  rejectionReason: string | null;
  counterOffers: CounterOffer[];
}

interface OnboardingDocument {
  type: string;
  url: string;
}

interface Onboarding {
  id: string;
  candidateName: string;
  email: string;
  phone: string | null;
  completionPercent: number;
  isComplete: boolean;
  contractSigned: boolean;
  contractSignedAt: string | null;
  contractPdfUrl: string | null;
  employmentStarted: boolean;
  employmentStartDate: string | null;
  startDate: string | null;
  salary: number | null;
  position: string | null;
  workSchedule: string | null;
  checklist: {
    personalInfo: string;
    govId: string;
    education: string;
    medical: string;
    dataPrivacy: string;
    resume: string;
    signature: string;
    emergencyContact: string;
  };
  documents: OnboardingDocument[];
  createdAt: string;
  updatedAt: string;
}

interface CandidateProfile {
  candidate: {
    id: string;
    slug: string;
    fullName: string;
    firstName: string;
    lastName: string;
    headline: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
    bio: string | null;
    location: string | null;
  };
  profile: {
    workStatus: string | null;
    expectedSalary: {
      min: number | null;
      max: number | null;
    };
    preferredShift: string | null;
    yearsExperience: number | null;
    skills: Array<{
      name: string;
      proficiency: string;
      yearsExperience: number | null;
    }>;
    experience: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate: string | null;
      isCurrent: boolean;
      description: string | null;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string | null;
      startDate: string;
      endDate: string | null;
    }>;
  };
  resume: {
    url: string;
    filename: string;
    atsScore: number | null;
    contentScore: number | null;
  } | null;
  application: {
    id: string;
    status: string;
    appliedAt: string;
    releasedAt: string;
    clientDecision: 'accept' | 'reject' | null;
    clientDecisionAt: string | null;
    clientNotes: string | null;
    timeline: Array<{
      action: string;
      at: string;
      description: string;
    }>;
  };
  upcomingInterview: Interview | null;
  completedInterviews: Interview[];
  offers: Offer[];
  onboarding: Onboarding | null;
  preScreens: PreScreen[];
}

type TabType = 'overview' | 'experience' | 'prescreen' | 'timeline';

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const candidateId = params.id as string;

  const [data, setData] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showInterviewRequest, setShowInterviewRequest] = useState(false);
  const [expandedPreScreen, setExpandedPreScreen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectNotes, setShowRejectNotes] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  
  // New modals for complete workflow
  const [showSendOffer, setShowSendOffer] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackOutcome, setFeedbackOutcome] = useState<'passed' | 'failed' | 'needs_followup' | null>(null);
  
  // Offer form state
  const [offerSalary, setOfferSalary] = useState('');
  const [offerStartDate, setOfferStartDate] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  // Interview management modals
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancelInterview, setShowCancelInterview] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const [cancelReason, setCancelReason] = useState('');

  // Counter offer modal
  const [showCounterResponse, setShowCounterResponse] = useState(false);
  const [selectedCounterOffer, setSelectedCounterOffer] = useState<CounterOffer | null>(null);
  const [counterAction, setCounterAction] = useState<'accept' | 'reject' | 'new_offer'>('accept');
  const [counterNewSalary, setCounterNewSalary] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  // Withdraw offer modal
  const [showWithdrawOffer, setShowWithdrawOffer] = useState(false);
  const [selectedOfferToWithdraw, setSelectedOfferToWithdraw] = useState<Offer | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Document viewer
  const [showDocuments, setShowDocuments] = useState(false);

  // Refresh data helper
  const refreshData = async () => {
    const profileRes = await fetch(`/api/client/jobs/${token}/candidates/${candidateId}`);
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      setData(profileData);
    }
  };

  const handleDecision = async (decision: 'accept' | 'reject', notes?: string) => {
    if (!data) return;
    
    setActionLoading(decision);
    try {
      const res = await fetch(`/api/client/jobs/${token}/candidates/${data.application.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record decision');
      }

      setData({
        ...data,
        application: {
          ...data.application,
          clientDecision: decision,
          clientDecisionAt: new Date().toISOString(),
          clientNotes: notes || null,
          status: decision === 'accept' ? 'client_approved' : 'client_rejected',
        },
      });
      setShowRejectNotes(false);
      setRejectNotes('');
    } catch (_err: any) {
      alert(err.message || 'Failed to record decision');
    } finally {
      setActionLoading(null);
    }
  };

  // Reschedule interview
  const handleRescheduleInterview = async () => {
    if (!data?.upcomingInterview || !rescheduleDate || !rescheduleTime) {
      alert('Please select date and time');
      return;
    }

    setActionLoading('reschedule');
    try {
      const res = await fetch(`/api/client/interviews/${data.upcomingInterview.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newDate: rescheduleDate,
          newTime: rescheduleTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!res.ok) throw new Error('Failed to reschedule');
      
      alert('Interview rescheduled successfully!');
      setShowReschedule(false);
      setRescheduleDate('');
      setRescheduleTime('09:00');
      await refreshData();
    } catch (_err) {
      alert('Failed to reschedule interview');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel interview
  const handleCancelInterview = async () => {
    if (!data?.upcomingInterview) return;

    setActionLoading('cancel-interview');
    try {
      const res = await fetch(`/api/client/interviews/${data.upcomingInterview.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason: cancelReason }),
      });

      if (!res.ok) throw new Error('Failed to cancel');
      
      alert('Interview cancelled');
      setShowCancelInterview(false);
      setCancelReason('');
      await refreshData();
    } catch (_err) {
      alert('Failed to cancel interview');
    } finally {
      setActionLoading(null);
    }
  };

  // Withdraw offer
  const handleWithdrawOffer = async () => {
    if (!selectedOfferToWithdraw) return;

    setActionLoading('withdraw');
    try {
      const res = await fetch(`/api/client/offers/${selectedOfferToWithdraw.id}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason: withdrawReason }),
      });

      if (!res.ok) throw new Error('Failed to withdraw offer');
      
      alert('Offer withdrawn successfully');
      setShowWithdrawOffer(false);
      setSelectedOfferToWithdraw(null);
      setWithdrawReason('');
      await refreshData();
    } catch (_err) {
      alert('Failed to withdraw offer');
    } finally {
      setActionLoading(null);
    }
  };

  // Respond to counter offer
  const handleCounterResponse = async () => {
    if (!selectedCounterOffer) return;

    if (counterAction === 'new_offer' && !counterNewSalary) {
      alert('Please enter the new salary amount');
      return;
    }

    setActionLoading('counter-response');
    try {
      const res = await fetch(`/api/client/counter-offers/${selectedCounterOffer.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: counterAction,
          newSalary: counterAction === 'new_offer' ? parseFloat(counterNewSalary) : undefined,
          message: counterMessage || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to respond to counter offer');
      
      const actionText = counterAction === 'accept' ? 'accepted' : 
                         counterAction === 'reject' ? 'rejected' : 'countered';
      alert(`Counter offer ${actionText} successfully`);
      setShowCounterResponse(false);
      setSelectedCounterOffer(null);
      setCounterAction('accept');
      setCounterNewSalary('');
      setCounterMessage('');
      await refreshData();
    } catch (_err) {
      alert('Failed to respond to counter offer');
    } finally {
      setActionLoading(null);
    }
  };

  // Confirm employment started
  const handleConfirmEmploymentStarted = async () => {
    if (!data?.onboarding) return;

    setActionLoading('confirm-start');
    try {
      const res = await fetch(`/api/client/onboarding/${data.application.id}/confirm-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('Failed to confirm');
      
      alert('Employment start confirmed!');
      await refreshData();
    } catch (_err) {
      alert('Failed to confirm employment start');
    } finally {
      setActionLoading(null);
    }
  };

  // Send job offer
  const handleSendOffer = async () => {
    if (!data || !offerSalary || !offerStartDate) {
      alert('Please fill in salary and start date');
      return;
    }

    setActionLoading('send-offer');
    try {
      const res = await fetch('/api/client/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: data.application.id,
          salary: parseFloat(offerSalary),
          currency: 'PHP',
          startDate: offerStartDate,
          message: offerMessage || null,
          token,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send offer');
      }

      alert('Offer sent successfully!');
      setShowSendOffer(false);
      setOfferSalary('');
      setOfferStartDate('');
      setOfferMessage('');
      await refreshData();
    } catch (_err: any) {
      alert(err.message || 'Failed to send offer');
    } finally {
      setActionLoading(null);
    }
  };

  // Submit interview feedback
  const handleSubmitFeedback = async () => {
    if (!data?.upcomingInterview) {
      alert('No interview found');
      return;
    }

    setActionLoading('feedback');
    try {
      const res = await fetch('/api/client/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: data.upcomingInterview.id,
          applicationId: data.application.id,
          rating: feedbackRating || null,
          notes: feedbackNotes || null,
          outcome: feedbackOutcome,
          token,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      alert('Feedback submitted successfully!');
      setShowFeedback(false);
      setFeedbackRating(0);
      setFeedbackNotes('');
      setFeedbackOutcome(null);
      await refreshData();
    } catch (_err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setActionLoading(null);
    }
  };

  // Join interview video call
  const handleJoinInterview = () => {
    if (data?.upcomingInterview?.meetingLink) {
      window.open(data.upcomingInterview.meetingLink, '_blank');
    } else {
      alert('No meeting link available yet');
    }
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/client/jobs/${token}/candidates/${candidateId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load candidate profile');
        }
        const profileData = await res.json();
        setData(profileData);
      } catch (_err: any) {
        setError(err.message || 'Failed to load candidate profile');
      } finally {
        setLoading(false);
      }
    }

    if (token && candidateId) {
      fetchProfile();
    }
  }, [token, candidateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 text-purple-400 animate-spin relative" />
          </div>
          <p className="mt-6 text-gray-400 font-medium">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: User },
    { id: 'experience' as TabType, label: 'Experience', icon: Briefcase },
    { id: 'prescreen' as TabType, label: 'Pre-Screen', icon: Video, count: data.preScreens?.length || 0 },
    { id: 'timeline' as TabType, label: 'Timeline', icon: Clock },
  ];

  // Get latest offer with pending counter offer
  const latestOffer = data.offers.length > 0 ? data.offers[0] : null;
  const pendingCounterOffer = latestOffer?.counterOffers?.find(co => co.status === 'pending');

  // Helper to get offer status display
  const getOfferStatusDisplay = (offer: Offer) => {
    if (offer.status === 'sent' && !offer.viewedAt) return { label: 'Sent', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (offer.status === 'viewed' || (offer.status === 'sent' && offer.viewedAt)) return { label: 'Viewed', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    if (offer.status === 'accepted') return { label: 'Accepted', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (offer.status === 'rejected') return { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (offer.status === 'withdrawn') return { label: 'Withdrawn', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    if (offer.status === 'superseded') return { label: 'Superseded', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    return { label: offer.status, color: 'text-gray-400', bg: 'bg-gray-500/20' };
  };

  // Helper to get checklist item status
  const getChecklistStatus = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'approved') return { icon: CheckCircle, color: 'text-emerald-400', label: 'Approved' };
    if (s === 'submitted') return { icon: Clock, color: 'text-amber-400', label: 'Submitted' };
    if (s === 'rejected') return { icon: XCircle, color: 'text-red-400', label: 'Rejected' };
    return { icon: AlertCircle, color: 'text-gray-400', label: 'Pending' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">BPOC.io</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="border-b border-white/10 bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-purple-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {data.candidate.avatar ? (
                <img
                  src={data.candidate.avatar}
                  alt={data.candidate.fullName}
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-white/10 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border-2 border-white/10 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {data.candidate.fullName.charAt(0)}
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{data.candidate.fullName}</h1>
                {data.application.clientDecision && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                    data.application.clientDecision === 'accept'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {data.application.clientDecision === 'accept' ? (
                      <><CheckCircle className="h-3 w-3" /> Accepted</>
                    ) : (
                      <><XCircle className="h-3 w-3" /> Rejected</>
                    )}
                  </span>
                )}
              </div>
              
              {data.candidate.headline && (
                <p className="text-lg text-gray-300 mb-3">{data.candidate.headline}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {data.candidate.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-purple-400" />
                    {data.candidate.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  {data.candidate.email}
                </span>
                {data.candidate.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    {data.candidate.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons - Context-aware based on stage */}
            <div className="flex flex-col gap-2 w-full md:w-auto min-w-[200px]">
              {renderActionButtons()}
            </div>
          </div>
        </div>
      </div>

      {/* Offer Status Card - Show if there are active offers */}
      {latestOffer && ['sent', 'viewed', 'pending'].includes(latestOffer.status) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="h-6 w-6 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Active Offer</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOfferStatusDisplay(latestOffer).bg} ${getOfferStatusDisplay(latestOffer).color}`}>
                    {getOfferStatusDisplay(latestOffer).label}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-400">Salary</p>
                    <p className="text-lg font-bold text-white">₱{latestOffer.salaryOffered.toLocaleString()}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="text-white">{new Date(latestOffer.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sent</p>
                    <p className="text-white">{new Date(latestOffer.sentAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Expires</p>
                    <p className="text-white">{new Date(latestOffer.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {latestOffer.additionalTerms && (
                  <p className="text-sm text-gray-400 mt-3 italic">&quot;{latestOffer.additionalTerms}&quot;</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedOfferToWithdraw(latestOffer);
                  setShowWithdrawOffer(true);
                }}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm border border-red-500/30"
              >
                <Ban className="h-4 w-4 inline mr-1" />
                Withdraw
              </button>
            </div>

            {/* Counter Offer Alert */}
            {pendingCounterOffer && (
              <div className="mt-4 p-4 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-orange-400 font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Counter Offer Received
                    </p>
                    <p className="text-white text-lg font-bold mt-1">
                      Candidate requested: ₱{pendingCounterOffer.requestedSalary.toLocaleString()}/mo
                    </p>
                    <p className="text-sm text-gray-400">
                      (₱{(pendingCounterOffer.requestedSalary - latestOffer.salaryOffered).toLocaleString()} more than offered)
                    </p>
                    {pendingCounterOffer.message && (
                      <p className="text-sm text-gray-300 mt-2 italic">&quot;{pendingCounterOffer.message}&quot;</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCounterOffer(pendingCounterOffer);
                        setCounterAction('accept');
                        setShowCounterResponse(true);
                      }}
                      className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm border border-emerald-500/30"
                    >
                      <Check className="h-4 w-4 inline mr-1" />
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCounterOffer(pendingCounterOffer);
                        setCounterAction('reject');
                        setShowCounterResponse(true);
                      }}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm border border-red-500/30"
                    >
                      <X className="h-4 w-4 inline mr-1" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCounterOffer(pendingCounterOffer);
                        setCounterAction('new_offer');
                        setShowCounterResponse(true);
                      }}
                      className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm border border-blue-500/30"
                    >
                      <Send className="h-4 w-4 inline mr-1" />
                      Counter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboarding Progress Card - Show if hired/onboarding */}
      {data.onboarding && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-6 w-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Onboarding Progress</h3>
                {data.onboarding.isComplete && (
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    Complete
                  </span>
                )}
                {data.onboarding.employmentStarted && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                    Employed
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {data.onboarding.documents.length > 0 && (
                  <button
                    onClick={() => setShowDocuments(true)}
                    className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                  >
                    <FileText className="h-4 w-4 inline mr-1" />
                    View Documents ({data.onboarding.documents.length})
                  </button>
                )}
                {!data.onboarding.employmentStarted && data.onboarding.isComplete && (
                  <button
                    onClick={handleConfirmEmploymentStarted}
                    disabled={actionLoading === 'confirm-start'}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'confirm-start' ? (
                      <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
                    ) : (
                      <CalendarCheck className="h-4 w-4 inline mr-1" />
                    )}
                    Mark Employment Started
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">{data.onboarding.completionPercent}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${data.onboarding.completionPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.onboarding.checklist).map(([key, status]) => {
                const { icon: StatusIcon, color, label } = getChecklistStatus(status);
                const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                    <StatusIcon className={`h-5 w-5 ${color}`} />
                    <div>
                      <p className="text-white text-sm">{displayName}</p>
                      <p className={`text-xs ${color}`}>{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Employment Details */}
            {(data.onboarding.startDate || data.onboarding.salary || data.onboarding.position) && (
              <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.onboarding.position && (
                  <div>
                    <p className="text-xs text-gray-400">Position</p>
                    <p className="text-white">{data.onboarding.position}</p>
                  </div>
                )}
                {data.onboarding.salary && (
                  <div>
                    <p className="text-xs text-gray-400">Salary</p>
                    <p className="text-white">₱{data.onboarding.salary.toLocaleString()}/mo</p>
                  </div>
                )}
                {data.onboarding.startDate && (
                  <div>
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="text-white">{new Date(data.onboarding.startDate).toLocaleDateString()}</p>
                  </div>
                )}
                {data.onboarding.workSchedule && (
                  <div>
                    <p className="text-xs text-gray-400">Schedule</p>
                    <p className="text-white">{data.onboarding.workSchedule}</p>
                  </div>
                )}
              </div>
            )}

            {data.onboarding.contractSigned && (
              <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30 flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-400">Contract signed on {new Date(data.onboarding.contractSignedAt!).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Bio */}
                {data.candidate.bio && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-400" />
                      About
                    </h3>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{data.candidate.bio}</p>
                  </div>
                )}

                {/* Skills */}
                {data.profile.skills.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-cyan-400" />
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-gray-200 rounded-lg text-sm border border-white/10 hover:border-purple-500/30 transition-colors"
                        >
                          {skill.name}
                          {skill.yearsExperience && (
                            <span className="ml-1 text-gray-400">({skill.yearsExperience}y)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.profile.yearsExperience && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                      <Briefcase className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{data.profile.yearsExperience}</p>
                      <p className="text-xs text-gray-400">Years Experience</p>
                    </div>
                  )}
                  {data.profile.education.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                      <GraduationCap className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{data.profile.education.length}</p>
                      <p className="text-xs text-gray-400">Education</p>
                    </div>
                  )}
                  {data.resume?.atsScore && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                      <Award className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-400">{data.resume.atsScore}</p>
                      <p className="text-xs text-gray-400">ATS Score</p>
                    </div>
                  )}
                  {data.preScreens.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                      <Video className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{data.preScreens.length}</p>
                      <p className="text-xs text-gray-400">Pre-Screens</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <>
                {/* Work Experience */}
                {data.profile.experience.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-400" />
                      Work Experience
                    </h3>
                    <div className="space-y-6">
                      {data.profile.experience.map((exp, index) => (
                        <div key={index} className="relative pl-6 border-l-2 border-purple-500/30 hover:border-purple-500/50 transition-colors">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-500/30 border-2 border-purple-500" />
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h4 className="font-semibold text-white">{exp.title}</h4>
                            <p className="text-purple-400">{exp.company}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                            </p>
                            {exp.description && (
                              <p className="text-gray-300 mt-3 text-sm leading-relaxed">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {data.profile.education.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-cyan-400" />
                      Education
                    </h3>
                    <div className="space-y-4">
                      {data.profile.education.map((edu, index) => (
                        <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <h4 className="font-semibold text-white">{edu.degree}</h4>
                          <p className="text-cyan-400">{edu.institution}</p>
                          {edu.fieldOfStudy && (
                            <p className="text-sm text-gray-400">{edu.fieldOfStudy}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Pre-Screen Tab */}
            {activeTab === 'prescreen' && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Video className="h-5 w-5 text-amber-400" />
                    Pre-Screen Interviews
                  </h3>
                </div>
                
                {data.preScreens.length === 0 ? (
                  <div className="p-12 text-center">
                    <Video className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No pre-screen recordings available</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.preScreens.map((preScreen) => (
                      <div key={preScreen.id} className="p-5">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedPreScreen(
                            expandedPreScreen === preScreen.id ? null : preScreen.id
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                              <Video className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{preScreen.title}</h4>
                              <p className="text-sm text-gray-400">
                                {new Date(preScreen.date).toLocaleString()}
                                {preScreen.durationSeconds && (
                                  <span className="ml-2 text-gray-500">
                                    • {Math.floor(preScreen.durationSeconds / 60)} min
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {expandedPreScreen === preScreen.id ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>

                        {expandedPreScreen === preScreen.id && (
                          <div className="mt-6 space-y-6 pt-6 border-t border-white/10">
                            {/* Recording */}
                            {preScreen.recordingUrl && (
                              <div>
                                <h5 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                                  <Video className="h-4 w-4 text-purple-400" />
                                  Recording
                                </h5>
                                <div className="rounded-xl overflow-hidden border border-white/10">
                                  <VideoPlayer
                                    src={preScreen.recordingUrl}
                                    title={preScreen.title}
                                  />
                                </div>
                              </div>
                            )}

                            {/* AI Summary */}
                            {preScreen.summary && (
                              <div>
                                <h5 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                                  <Bot className="h-4 w-4 text-cyan-400" />
                                  AI Summary
                                </h5>
                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{preScreen.summary}</p>
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {preScreen.notes && (
                              <div>
                                <h5 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4 text-amber-400" />
                                  Recruiter Notes
                                </h5>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{preScreen.notes}</p>
                                </div>
                              </div>
                            )}

                            {/* Transcription */}
                            {preScreen.transcription && (
                              <div>
                                <h5 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  Full Transcript
                                </h5>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto">
                                  <p className="text-gray-400 text-sm whitespace-pre-wrap font-mono">
                                    {preScreen.transcription}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(preScreen.transcription || '');
                                    alert('Transcript copied!');
                                  }}
                                  className="mt-2 text-sm text-purple-400 hover:text-purple-300"
                                >
                                  Copy Transcript
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  Activity Timeline
                </h3>
                <div className="space-y-4">
                  {data.application.timeline.map((event, index) => (
                    <div key={index} className="relative pl-6 border-l-2 border-white/10">
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-purple-500" />
                      <div className="pb-4">
                        <p className="font-medium text-white">{event.action}</p>
                        <p className="text-sm text-gray-400">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resume Card */}
            {data.resume && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  Resume
                </h3>
                <a
                  href={data.resume.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Download className="h-4 w-4" />
                  Download Resume
                </a>
                {(data.resume.atsScore || data.resume.contentScore) && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {data.resume.atsScore && (
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{data.resume.atsScore}</p>
                        <p className="text-xs text-gray-400">ATS Score</p>
                      </div>
                    )}
                    {data.resume.contentScore && (
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-cyan-400">{data.resume.contentScore}</p>
                        <p className="text-xs text-gray-400">Content Score</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Interview */}
            {data.upcomingInterview && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  Upcoming Interview
                </h3>
                <p className="text-gray-300 mb-2">
                  {new Date(data.upcomingInterview.scheduledAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  Duration: {data.upcomingInterview.duration} minutes
                </p>
                
                {/* Meeting Link Status */}
                {data.upcomingInterview.meetingLink ? (
                  <a
                    href={data.upcomingInterview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm mb-4"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Join Meeting
                  </a>
                ) : (
                  <p className="text-amber-400 text-sm mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Awaiting meeting link
                  </p>
                )}

                {/* Interview Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500/20 text-blue-400 font-medium rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reschedule
                  </button>
                  <button
                    onClick={() => setShowCancelInterview(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                  >
                    <Ban className="h-4 w-4" />
                    Cancel Interview
                  </button>
                </div>
              </div>
            )}

            {/* Application Status */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                Application Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className="text-sm font-medium px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                    {data.application.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Applied</span>
                  <span className="text-gray-200">
                    {new Date(data.application.appliedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Released</span>
                  <span className="text-gray-200">
                    {new Date(data.application.releasedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Modals */}
      {renderModals()}

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Powered by BPOC.io</p>
                <p className="text-xs text-gray-500">The BPO Recruitment Platform</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} BPOC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );

  // Render action buttons based on status
  function renderActionButtons() {
    if (!data) return null;

    const status = data.application.status;
    const hasInterview = !!data.upcomingInterview;
    const interviewCompleted = data.upcomingInterview?.status === 'completed';
    const hasOffer = data.offers && data.offers.length > 0;
    const latestOffer = hasOffer ? data.offers[0] : null;
    
    // Stage: Already rejected
    if (data.application.clientDecision === 'reject') {
      return (
        <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-medium">Not Interested</p>
          <p className="text-sm text-gray-500 mt-1">Rejected on {new Date(data.application.clientDecisionAt!).toLocaleDateString()}</p>
        </div>
      );
    }
    
    // Stage: Employed
    if (status === 'employed' || data.onboarding?.employmentStarted) {
      return (
        <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <Building2 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <p className="text-purple-400 font-medium">Employed</p>
          <p className="text-sm text-gray-400 mt-1">Started {data.onboarding?.employmentStartDate ? new Date(data.onboarding.employmentStartDate).toLocaleDateString() : 'recently'}</p>
        </div>
      );
    }

    // Stage: Hired / Onboarding
    if (status === 'hired' || status === 'offer_accepted') {
      return (
        <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-emerald-400 font-medium">
            {status === 'hired' ? 'Hired!' : 'Offer Accepted!'}
          </p>
          {!data.onboarding && (
            <button
              onClick={async () => {
                setActionLoading('onboarding');
                try {
                  const res = await fetch('/api/client/onboarding/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ applicationId: data.application.id, token }),
                  });
                  if (!res.ok) throw new Error('Failed to start onboarding');
                  alert('Onboarding started!');
                  await refreshData();
                } catch (_err) {
                  alert('Failed to start onboarding');
                } finally {
                  setActionLoading(null);
                }
              }}
              disabled={actionLoading === 'onboarding'}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 font-medium rounded-lg hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 disabled:opacity-50"
            >
              {actionLoading === 'onboarding' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <User className="h-4 w-4" />
              )}
              Start Onboarding
            </button>
          )}
        </div>
      );
    }
    
    // Stage: Offer sent, waiting for response
    if (status === 'offer_sent' || status === 'offer_pending' || (latestOffer && ['sent', 'viewed'].includes(latestOffer.status))) {
      return (
        <div className="text-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <Gift className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          <p className="text-amber-400 font-medium">Offer Sent</p>
          <p className="text-sm text-gray-400 mt-1">
            ₱{latestOffer?.salaryOffered?.toLocaleString() || '---'}/month
          </p>
          <p className="text-xs text-gray-500 mt-1">Waiting for response</p>
        </div>
      );
    }
    
    // Stage: Interview completed - needs feedback or offer
    if (interviewCompleted || status === 'interviewed') {
      return (
        <>
          {!data.upcomingInterview?.outcome && (
            <button
              onClick={() => setShowFeedback(true)}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-500/20 text-blue-400 font-medium rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 border border-blue-500/30"
            >
              <MessageSquare className="h-4 w-4" />
              Leave Feedback
            </button>
          )}
          <button
            onClick={() => setShowSendOffer(true)}
            disabled={actionLoading !== null}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {actionLoading === 'send-offer' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Gift className="h-4 w-4" />
            )}
            Send Offer
          </button>
          <button
            onClick={() => setShowRejectNotes(true)}
            disabled={actionLoading !== null}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 border border-red-500/30"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </>
      );
    }
    
    // Stage: Interview scheduled - can join or cancel
    if (hasInterview && data.upcomingInterview?.status === 'scheduled') {
      const interviewDate = new Date(data.upcomingInterview.scheduledAt);
      const isToday = interviewDate.toDateString() === new Date().toDateString();
      const isPast = interviewDate < new Date();
      
      return (
        <>
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-2">
            <p className="text-sm text-purple-400 font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Interview Scheduled
            </p>
            <p className="text-white font-medium mt-1">
              {interviewDate.toLocaleDateString()} at {interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {(isToday || isPast) && data.upcomingInterview.meetingLink && (
            <button
              onClick={handleJoinInterview}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <Play className="h-4 w-4" />
              Join Interview
            </button>
          )}
          <button
            onClick={() => setShowFeedback(true)}
            disabled={actionLoading !== null}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-500/20 text-blue-400 font-medium rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 border border-blue-500/30"
          >
            <CheckCircle className="h-4 w-4" />
            Mark Complete & Leave Feedback
          </button>
        </>
      );
    }
    
    // Stage: Default - pre-interview, can schedule or reject
    return (
      <>
        <button
          onClick={() => setShowInterviewRequest(true)}
          disabled={actionLoading !== null}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Calendar className="h-4 w-4" />
          Schedule Interview
        </button>
        <button
          onClick={() => setShowRejectNotes(true)}
          disabled={actionLoading !== null}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 border border-red-500/30"
        >
          <XCircle className="h-4 w-4" />
          Not Interested
        </button>
      </>
    );
  }

  // Render all modals
  function renderModals() {
    if (!data) return null;

    return (
      <>
        {/* Reject Notes Modal */}
        {showRejectNotes && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4">Reject Candidate</h3>
              <p className="text-gray-400 mb-4">
                Please provide a reason for rejecting {data.candidate.fullName}:
              </p>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="e.g., Salary expectations too high, not the right fit..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectNotes(false);
                    setRejectNotes('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDecision('reject', rejectNotes)}
                  disabled={actionLoading !== null}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'reject' ? 'Processing...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Offer Modal */}
        {showSendOffer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-400" />
                Send Job Offer
              </h3>
              <p className="text-gray-400 mb-6">
                Send an offer to <span className="text-purple-400 font-medium">{data.candidate.fullName}</span>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Salary (PHP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="number"
                      value={offerSalary}
                      onChange={(e) => setOfferSalary(e.target.value)}
                      placeholder="50000"
                      className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={offerStartDate}
                    onChange={(e) => setOfferStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message / Additional Terms (Optional)
                  </label>
                  <textarea
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Any additional terms or welcome message..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSendOffer(false);
                    setOfferSalary('');
                    setOfferStartDate('');
                    setOfferMessage('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendOffer}
                  disabled={actionLoading === 'send-offer' || !offerSalary || !offerStartDate}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'send-offer' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Offer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interview Feedback Modal */}
        {showFeedback && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                Interview Feedback
              </h3>
              <p className="text-gray-400 mb-6">
                Record your feedback for <span className="text-purple-400 font-medium">{data.candidate.fullName}</span>
              </p>
              
              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`p-2 rounded-lg transition-colors ${
                          feedbackRating >= star
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-white/5 text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <Star className={`h-6 w-6 ${feedbackRating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Outcome */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Interview Outcome
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeedbackOutcome('passed')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                        feedbackOutcome === 'passed'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-emerald-500/30'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Passed
                    </button>
                    <button
                      onClick={() => setFeedbackOutcome('failed')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                        feedbackOutcome === 'failed'
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-red-500/30'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Failed
                    </button>
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Interview observations, strengths, areas of concern..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowFeedback(false);
                    setFeedbackRating(0);
                    setFeedbackNotes('');
                    setFeedbackOutcome(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={actionLoading === 'feedback'}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'feedback' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Interview Modal */}
        {showReschedule && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-400" />
                Reschedule Interview
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Time</label>
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 24 * 4 }, (_, i) => {
                      const hour = Math.floor(i / 4);
                      const minute = (i % 4) * 15;
                      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      const ampm = hour < 12 ? 'AM' : 'PM';
                      return (
                        <option key={time24} value={time24} className="bg-gray-900">
                          {hour12}:{minute.toString().padStart(2, '0')} {ampm}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowReschedule(false);
                    setRescheduleDate('');
                    setRescheduleTime('09:00');
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleInterview}
                  disabled={actionLoading === 'reschedule' || !rescheduleDate}
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'reschedule' ? 'Rescheduling...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Interview Modal */}
        {showCancelInterview && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-400" />
                Cancel Interview
              </h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to cancel this interview?
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Reason for cancellation (optional)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowCancelInterview(false);
                    setCancelReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Keep Interview
                </button>
                <button
                  onClick={handleCancelInterview}
                  disabled={actionLoading === 'cancel-interview'}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'cancel-interview' ? 'Cancelling...' : 'Cancel Interview'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Offer Modal */}
        {showWithdrawOffer && selectedOfferToWithdraw && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-400" />
                Withdraw Offer
              </h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to withdraw the offer of ₱{selectedOfferToWithdraw.salaryOffered.toLocaleString()}/month?
              </p>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                rows={3}
                placeholder="Reason for withdrawal (optional)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowWithdrawOffer(false);
                    setSelectedOfferToWithdraw(null);
                    setWithdrawReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Keep Offer
                </button>
                <button
                  onClick={handleWithdrawOffer}
                  disabled={actionLoading === 'withdraw'}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'withdraw' ? 'Withdrawing...' : 'Withdraw Offer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Counter Offer Response Modal */}
        {showCounterResponse && selectedCounterOffer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-400" />
                Respond to Counter Offer
              </h3>
              <p className="text-gray-400 mb-4">
                Candidate requested: <span className="text-white font-bold">₱{selectedCounterOffer.requestedSalary.toLocaleString()}/mo</span>
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCounterAction('accept')}
                    className={`flex-1 px-4 py-2.5 rounded-lg border transition-colors ${
                      counterAction === 'accept'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setCounterAction('reject')}
                    className={`flex-1 px-4 py-2.5 rounded-lg border transition-colors ${
                      counterAction === 'reject'
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setCounterAction('new_offer')}
                    className={`flex-1 px-4 py-2.5 rounded-lg border transition-colors ${
                      counterAction === 'new_offer'
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    Counter
                  </button>
                </div>

                {counterAction === 'new_offer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Your Counter (PHP/month)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="number"
                        value={counterNewSalary}
                        onChange={(e) => setCounterNewSalary(e.target.value)}
                        placeholder="55000"
                        className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message (optional)</label>
                  <textarea
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    rows={3}
                    placeholder="Additional message to the candidate..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCounterResponse(false);
                    setSelectedCounterOffer(null);
                    setCounterAction('accept');
                    setCounterNewSalary('');
                    setCounterMessage('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCounterResponse}
                  disabled={actionLoading === 'counter-response' || (counterAction === 'new_offer' && !counterNewSalary)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {actionLoading === 'counter-response' ? 'Processing...' : 'Submit Response'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents Modal */}
        {showDocuments && data.onboarding && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                Onboarding Documents
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.onboarding.documents.map((doc, index) => (
                  <a
                    key={index}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-white">{doc.type}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                ))}
              </div>
              <button
                onClick={() => setShowDocuments(false)}
                className="w-full mt-4 px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Interview Request Modal */}
        {showInterviewRequest && (
          <InterviewRequestModal
            candidateName={data.candidate.fullName}
            applicationId={data.application.id}
            token={token}
            onClose={() => setShowInterviewRequest(false)}
            onSuccess={refreshData}
          />
        )}
      </>
    );
  }
}

interface InterviewRequestModalProps {
  candidateName: string;
  applicationId: string;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Generate time options in 15-minute increments
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const display = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  return { value: time24, label: display };
});

function InterviewRequestModal({
  candidateName,
  applicationId,
  token,
  onClose,
  onSuccess,
}: InterviewRequestModalProps) {
  const [timeSlots, setTimeSlots] = useState<Array<{ date: string; time: string }>>([
    { date: '', time: '09:00' },
  ]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const addTimeSlot = () => {
    if (timeSlots.length < 5) {
      setTimeSlots([...timeSlots, { date: '', time: '09:00' }]);
    }
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index: number, field: 'date' | 'time', value: string) => {
    const updated = [...timeSlots];
    updated[index][field] = value;
    setTimeSlots(updated);
  };

  const handleSubmit = async () => {
    const validSlots = timeSlots.filter(slot => slot.date && slot.time);

    if (validSlots.length < 1) {
      alert('Please provide at least 1 time slot');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/client/interviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          applicationId,
          proposedTimes: validSlots.map(slot => `${slot.date}T${slot.time}`),
          message,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit interview request');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        onSuccess();
      }, 2000);
    } catch (_err) {
      alert('Failed to submit interview request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-400" />
              Request Interview
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </div>

          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Request Sent!</h3>
              <p className="text-gray-400">The recruiter will review your request and get back to you soon.</p>
            </div>
          ) : (
            <>
              <p className="text-gray-300 mb-6">
                Request an interview with <span className="text-purple-400 font-medium">{candidateName}</span>. Select your preferred time slots.
              </p>

              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-white">Preferred Time Slots</h3>
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateTimeSlot(index, 'date', e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <select
                      value={slot.time}
                      onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-gray-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {timeSlots.length > 1 && (
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {timeSlots.length < 5 && (
                  <button
                    onClick={addTimeSlot}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1"
                  >
                    <span>+</span> Add Another Option
                  </button>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Any additional information or requirements..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

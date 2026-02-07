'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Calendar,
    ChevronDown,
    ChevronUp,
    Clock,
    Eye,
    FileText,
    Gift,
    Lightbulb,
    MapPin,
    Rocket,
    Video,
    CheckCircle,
    ArrowRight,
    Briefcase,
    Sparkles,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/shared/ui/alert-dialog';
import { ApplicationPipelineTracker } from './ApplicationPipelineTracker';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/shared/ui/toast';
import { JobDetailsModal } from './JobDetailsModal';

interface CandidateApplicationCardProps {
    application: {
        id: string;
        jobId: string;
        jobTitle: string;
        company: string;
        status: string;
        appliedAt: string;
        salary?: { min: number; max: number; currency: string };
        workType?: string;
        workArrangement?: string;
        rejectionReason?: string;
        hasNewActivity?: boolean;
        releasedToClient?: boolean;
        releasedAt?: string | null;
    };
    onExpand?: (id: string) => void;
    onRefresh?: () => void;
    profileComplete?: boolean;
}

// Stage explanations for candidates
const STAGE_EXPLANATIONS: Record<string, {
    title: string;
    meaning: string;
    whatsNext: string;
    action?: { label: string; href: string; icon: React.ElementType };
    bgGradient: string;
    borderColor: string;
}> = {
    invited: {
        title: '✨ You\'re Invited to Apply',
        meaning: 'A recruiter invited you to apply for this role. Accept the invite to submit your application.',
        whatsNext: 'Click “Accept Invite” to confirm you want to apply. Once accepted, your application will move into review.',
        bgGradient: 'from-indigo-500/10 to-purple-500/10',
        borderColor: 'border-indigo-500/30'
    },
    submitted: {
        title: '📤 Application Received',
        meaning: 'Your application has been submitted successfully! The recruiter will review your profile and resume.',
        whatsNext: 'Make sure your profile is complete and your resume is up to date. Recruiters typically review applications within 2-3 business days.',
        action: { label: 'Complete Profile', href: '/candidate/profile', icon: FileText },
        bgGradient: 'from-gray-500/10 to-slate-500/10',
        borderColor: 'border-gray-500/30'
    },
    under_review: {
        title: '👀 Under Review',
        meaning: 'Great news! A recruiter is actively reviewing your application.',
        whatsNext: 'The recruiter is comparing candidates. Stay tuned for updates - you may be contacted for additional information.',
        bgGradient: 'from-cyan-500/10 to-blue-500/10',
        borderColor: 'border-cyan-500/30'
    },
    qualified: {
        title: '✅ Qualified',
        meaning: 'You meet the job requirements! The recruiter has confirmed you\'re a qualified candidate.',
        whatsNext: 'Your background is being verified. Once verified, you may be invited for an interview.',
        bgGradient: 'from-blue-500/10 to-indigo-500/10',
        borderColor: 'border-blue-500/30'
    },
    for_verification: {
        title: '🔍 Verification In Progress',
        meaning: 'Your credentials and background are being verified.',
        whatsNext: 'This usually takes 1-2 business days. Make sure all your information is accurate.',
        bgGradient: 'from-indigo-500/10 to-purple-500/10',
        borderColor: 'border-indigo-500/30'
    },
    verified: {
        title: '🛡️ Verified',
        meaning: 'Your background and credentials have been verified successfully!',
        whatsNext: 'You\'re now in the pool of verified candidates. The recruiter may contact you for an interview soon.',
        action: { label: 'Update Availability', href: '/candidate/settings', icon: Calendar },
        bgGradient: 'from-purple-500/10 to-violet-500/10',
        borderColor: 'border-purple-500/30'
    },
    shortlisted: {
        title: '⭐ Shortlisted',
        meaning: 'You\'ve been shortlisted! The recruiter has selected you as a top candidate.',
        whatsNext: 'An interview is likely coming up. Check your Interviews page regularly.',
        action: { label: 'View Interviews', href: '/candidate/interviews', icon: Video },
        bgGradient: 'from-violet-500/10 to-purple-500/10',
        borderColor: 'border-violet-500/30'
    },
    interview_scheduled: {
        title: '📹 Interview Scheduled',
        meaning: 'You have an interview scheduled! This is your chance to shine.',
        whatsNext: 'Check your Interviews page for the date, time, and meeting link. Prepare your questions!',
        action: { label: 'View Interview Details', href: '/candidate/interviews', icon: Video },
        bgGradient: 'from-orange-500/10 to-amber-500/10',
        borderColor: 'border-orange-500/30'
    },
    initial_interview: {
        title: '🎬 Interview Stage',
        meaning: 'You\'re in the interview stage of the hiring process.',
        whatsNext: 'Check your Interviews page for scheduled interviews and prepare thoroughly.',
        action: { label: 'View Interviews', href: '/candidate/interviews', icon: Video },
        bgGradient: 'from-orange-500/10 to-amber-500/10',
        borderColor: 'border-orange-500/30'
    },
    interviewed: {
        title: '✔️ Interview Completed',
        meaning: 'You\'ve completed the interview! The recruiter is evaluating all candidates.',
        whatsNext: 'Decisions are typically made within a week. You may be contacted for a follow-up interview or an offer.',
        bgGradient: 'from-blue-500/10 to-cyan-500/10',
        borderColor: 'border-blue-500/30'
    },
    passed: {
        title: '🏆 Passed',
        meaning: 'Congratulations! You\'ve passed the interview stage.',
        whatsNext: 'An offer may be coming your way soon! Check your Offers page regularly.',
        action: { label: 'View Offers', href: '/candidate/offers', icon: Gift },
        bgGradient: 'from-yellow-500/10 to-amber-500/10',
        borderColor: 'border-yellow-500/30'
    },
    offer_sent: {
        title: '🎁 Offer Received!',
        meaning: 'You have a job offer waiting for you! This is exciting news.',
        whatsNext: 'Review the offer details carefully and respond before it expires.',
        action: { label: 'Review Offer', href: '/candidate/offers', icon: Gift },
        bgGradient: 'from-emerald-500/10 to-green-500/10',
        borderColor: 'border-emerald-500/30'
    },
    hired: {
        title: '🎉 You\'re Hired!',
        meaning: 'Congratulations! You\'ve been hired for this position!',
        whatsNext: 'Check your Placement page for onboarding details and next steps.',
        action: { label: 'View Placement', href: '/candidate/placement', icon: Briefcase },
        bgGradient: 'from-emerald-500/10 to-teal-500/10',
        borderColor: 'border-emerald-500/30'
    },
    rejected: {
        title: '❌ Not Selected',
        meaning: 'Unfortunately, you weren\'t selected for this position.',
        whatsNext: 'Don\'t give up! There are many opportunities waiting. Browse more jobs and apply.',
        action: { label: 'Browse More Jobs', href: '/candidate/jobs', icon: Briefcase },
        bgGradient: 'from-red-500/10 to-rose-500/10',
        borderColor: 'border-red-500/30'
    }
};

const getTimeAgo = (date: string) => {
    const now = new Date();
    const applied = new Date(date);
    const diffDays = Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
};

const formatWorkArrangement = (arrangement?: string) => {
    if (!arrangement) return '';
    const formats: Record<string, string> = {
        'remote': 'Remote',
        'on-site': 'On-Site',
        'onsite': 'On-Site',
        'hybrid': 'Hybrid',
        'office': 'Office',
    };
    return formats[arrangement.toLowerCase()] || arrangement.charAt(0).toUpperCase() + arrangement.slice(1);
};

export function CandidateApplicationCard({ application, onExpand, onRefresh, profileComplete }: CandidateApplicationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [acceptingInvite, setAcceptingInvite] = useState(false);
    const [decliningInvite, setDecliningInvite] = useState(false);
    const [showJobModal, setShowJobModal] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const { session } = useAuth();

    const acceptInvite = async () => {
        if (!session?.access_token) {
            toast.error('Please sign in again.');
            return;
        }
        setAcceptingInvite(true);
        try {
            const res = await fetch(`/api/candidate/applications/${application.id}/accept-invite`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Invite accepted — application submitted');
                onRefresh?.();
            } else {
                toast.error(data?.error || 'Failed to accept invite');
            }
        } catch (e) {
            console.error('Failed to accept invite:', e);
            toast.error('Failed to accept invite');
        } finally {
            setAcceptingInvite(false);
        }
    };

    const declineInvite = async () => {
        if (!session?.access_token) {
            toast.error('Please sign in again.');
            return;
        }
        setDecliningInvite(true);
        try {
            const res = await fetch(`/api/candidate/applications/${application.id}/decline-invite`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Invite declined');
                onRefresh?.();
            } else {
                toast.error(data?.error || 'Failed to decline invite');
            }
        } catch (e) {
            console.error('Failed to decline invite:', e);
            toast.error('Failed to decline invite');
        } finally {
            setDecliningInvite(false);
        }
    };

    const handleWithdraw = async () => {
        if (!session?.access_token) {
            toast.error('Please sign in again.');
            return;
        }
        setWithdrawing(true);
        try {
            const res = await fetch(`/api/candidate/applications/${application.id}/withdraw`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Application withdrawn successfully');
                setShowWithdrawDialog(false);
                onRefresh?.();
            } else {
                toast.error(data?.error || 'Failed to withdraw application');
            }
        } catch (e) {
            console.error('Failed to withdraw application:', e);
            toast.error('Failed to withdraw application');
        } finally {
            setWithdrawing(false);
        }
    };

    const isReleasedToClient = !!application.releasedToClient;
    const stageInfo =
        isReleasedToClient && !['rejected', 'hired', 'withdrawn'].includes(application.status)
            ? {
                  title: '👔 Released to Client',
                  meaning:
                      'Your recruiter has shared your application with the client. The client can now review your profile and decide next steps.',
                  whatsNext:
                      'You may be invited to an interview or asked for more information. Keep an eye on your Interviews page and notifications.',
                  action: { label: 'View Interviews', href: '/candidate/interviews', icon: Video },
                  bgGradient: 'from-emerald-500/10 to-cyan-500/10',
                  borderColor: 'border-emerald-500/30',
              }
            : (STAGE_EXPLANATIONS[application.status] || STAGE_EXPLANATIONS.submitted);
    const isNegative = application.status === 'rejected';
    const isHired = application.status === 'hired';
    const isOffer = application.status === 'offer_sent';

    // Determine if application can be withdrawn
    const withdrawableStatuses = ['submitted', 'under_review', 'qualified', 'for_verification', 'verified', 'shortlisted'];
    const canWithdraw = withdrawableStatuses.includes(application.status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
        >
            <Card className={cn(
                "overflow-hidden transition-all duration-300",
                `bg-gradient-to-br ${stageInfo.bgGradient}`,
                stageInfo.borderColor,
                isHired && "ring-2 ring-emerald-500/50",
                isOffer && "ring-2 ring-emerald-500/30 animate-pulse",
                !isNegative && "hover:border-cyan-500/50"
            )}>
                <CardContent className="p-0">
                    {/* Header Section - Always Visible */}
                    <div className="p-6">
                        {/* Top Row: Company, Date, New Badge */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                    isHired ? "bg-emerald-500/20" : isOffer ? "bg-emerald-500/20" : "bg-white/10"
                                )}>
                                    <Building2 className={cn(
                                        "h-6 w-6",
                                        isHired || isOffer ? "text-emerald-400" : "text-cyan-400"
                                    )} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{application.jobTitle}</h3>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <span>{application.company}</span>
                                        {application.workArrangement && (
                                            <>
                                                <span>•</span>
                                                <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20 text-xs">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {formatWorkArrangement(application.workArrangement)}
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {application.hasNewActivity && (
                                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse">
                                        New Activity
                                    </Badge>
                                )}
                                {isReleasedToClient && (
                                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                                        Client Reviewing
                                    </Badge>
                                )}
                                <span className="text-gray-500 text-sm flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {getTimeAgo(application.appliedAt)}
                                </span>
                            </div>
                        </div>

                        {/* Pipeline Tracker */}
                        <div className="mb-4">
                            <ApplicationPipelineTracker
                                status={application.status}
                                showLabels={true}
                                size="sm"
                            />
                        </div>

                        {/* Status Title */}
                        <div className="flex items-center justify-between">
                            <h4 className="text-white font-semibold text-lg">{stageInfo.title}</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <>Less <ChevronUp className="h-4 w-4 ml-1" /></>
                                ) : (
                                    <>More <ChevronDown className="h-4 w-4 ml-1" /></>
                                )}
                            </Button>
                        </div>

                        {/* Rejection Reason Preview (visible without expanding) */}
                        {application.status === 'rejected' && application.rejectionReason && (
                            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-2">
                                    <Lightbulb className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="text-red-400 font-medium text-sm">Reason: </span>
                                        <span className="text-gray-300 text-sm">{application.rejectionReason}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Expanded Section */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="px-6 pb-6 space-y-4 border-t border-white/10 pt-4">
                                    {/* What This Means */}
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye className="h-4 w-4 text-cyan-400" />
                                            <span className="text-white font-medium">What This Means</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">{stageInfo.meaning}</p>
                                    </div>

                                    {/* What's Next */}
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Rocket className="h-4 w-4 text-cyan-400" />
                                            <span className="text-white font-medium">What&apos;s Next</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">{stageInfo.whatsNext}</p>
                                    </div>

                                    {/* Salary Info (if available) */}
                                    {application.salary && (
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-400">Salary Range:</span>
                                            <span className="text-white font-medium">
                                                {application.salary.currency} {application.salary.min.toLocaleString()} - {application.salary.max.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        {application.status === 'invited' && (
                                            <>
                                                <Button
                                                    onClick={acceptInvite}
                                                    disabled={acceptingInvite || decliningInvite}
                                                    className="text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                                                >
                                                    {acceptingInvite ? (
                                                        <>
                                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                            Accepting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-4 w-4 mr-2" />
                                                            Accept Invite
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={declineInvite}
                                                    disabled={decliningInvite || acceptingInvite}
                                                    variant="outline"
                                                    className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                                                >
                                                    {decliningInvite ? (
                                                        <>
                                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                                            Declining...
                                                        </>
                                                    ) : (
                                                        'Decline'
                                                    )}
                                                </Button>
                                            </>
                                        )}

                                        {stageInfo.action && (
                                            stageInfo.action.label === 'Complete Profile' && profileComplete ? (
                                                <Button
                                                    disabled
                                                    className="bg-emerald-500/20 text-emerald-400 cursor-not-allowed"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Profile Complete
                                                </Button>
                                            ) : (
                                                <Link href={stageInfo.action.href}>
                                                    <Button
                                                        className={cn(
                                                            "text-white",
                                                            isHired || isOffer
                                                                ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                                                                : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                                                        )}
                                                    >
                                                        {React.createElement(stageInfo.action.icon, { className: "h-4 w-4 mr-2" })}
                                                        {stageInfo.action.label}
                                                        <ArrowRight className="h-4 w-4 ml-2" />
                                                    </Button>
                                                </Link>
                                            )
                                        )}

                                        <Link href={`/candidate/applications/${application.id}`}>
                                            <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                                                <FileText className="h-4 w-4 mr-2" />
                                                View Shared Call Data
                                            </Button>
                                        </Link>

                                        <Button
                                            variant="outline"
                                            className="border-white/20 text-gray-300 hover:bg-white/10"
                                            onClick={() => setShowJobModal(true)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Job Details
                                        </Button>

                                        {/* Withdraw Application Button */}
                                        {canWithdraw && (
                                            <Button
                                                variant="outline"
                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                onClick={() => setShowWithdrawDialog(true)}
                                                disabled={withdrawing}
                                            >
                                                {withdrawing ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Withdrawing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                                        Withdraw Application
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Job Details Modal */}
            <JobDetailsModal
                jobId={application.jobId}
                isOpen={showJobModal}
                onClose={() => setShowJobModal(false)}
            />

            {/* Withdraw Confirmation Dialog */}
            <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                <AlertDialogContent className="bg-gray-900 border border-red-500/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Withdraw Application
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300 space-y-2">
                            <p>
                                Are you sure you want to withdraw your application for{' '}
                                <span className="font-semibold text-white">{application.jobTitle}</span> at{' '}
                                <span className="font-semibold text-white">{application.company}</span>?
                            </p>
                            <p className="text-red-400 font-medium">
                                This action cannot be undone.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className="bg-gray-800 text-white border-white/20 hover:bg-gray-700"
                            disabled={withdrawing}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 text-white hover:bg-red-600"
                            onClick={handleWithdraw}
                            disabled={withdrawing}
                        >
                            {withdrawing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Withdrawing...
                                </>
                            ) : (
                                'Yes, Withdraw'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}

export default CandidateApplicationCard;

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PartyPopper,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  Briefcase,
  MapPin,
  User,
  Star,
  Gift,
  Loader2,
  ExternalLink,
  Download,
  ArrowRight,
  Trophy,
  AlertCircle,
  CheckCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useToast } from '@/hooks/use-toast';

interface PlacementData {
  id: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  salary: number;
  salaryType: string;
  currency: string;
  startDate?: string;
  hiredAt: string;
  benefits?: string[];
  workArrangement?: string;
  shift?: string;
  contractUrl?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  startedStatus?: string | null;
  contractSigned?: boolean;
  offerAcceptanceDate?: string | null;
}

interface OnboardingTask {
  id: string;
  applicationId: string;
  jobTitle: string;
  company: string;
  taskType: string;
  title: string;
  description: string | null;
  isRequired: boolean;
  dueDate: string | null;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  createdAt: string;
}

interface OnboardingProgress {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  percentage: number;
}

export default function PlacementPage() {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [placement, setPlacement] = useState<PlacementData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confirmingDayOne, setConfirmingDayOne] = useState(false);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchPlacement = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/candidate/placement', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlacement(data.placement);

        // Trigger confetti on first view
        if (data.placement && !localStorage.getItem(`confetti_shown_${data.placement.id}`)) {
          setShowConfetti(true);
          localStorage.setItem(`confetti_shown_${data.placement.id}`, 'true');
        }
      }
    } catch (error) {
      console.error('Failed to fetch placement:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingTasks = async () => {
    if (!session?.access_token) return;

    try {
      setLoadingTasks(true);
      const response = await fetch('/api/candidate/onboarding/tasks', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingTasks(data.tasks || []);
        setOnboardingProgress(data.progress || null);
      }
    } catch (error) {
      console.error('Failed to fetch onboarding tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchPlacement();
    fetchOnboardingTasks();
  }, [session]);

  // Confetti effect
  useEffect(() => {
    if (showConfetti) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [showConfetti]);

  const handleConfirmDayOne = async () => {
    if (!session?.access_token) return;

    setConfirmingDayOne(true);

    try {
      const response = await fetch('/api/candidate/placement/confirm-day-one', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Day 1 Confirmed!',
          description: data.message || 'Congratulations on starting your new role!',
        });

        // Refresh placement data
        await fetchPlacement();

        // Trigger celebration confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        toast({
          title: 'Failed to confirm Day 1',
          description: data.error || 'Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to confirm Day 1:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while confirming Day 1.',
        variant: 'destructive',
      });
    } finally {
      setConfirmingDayOne(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-400">Loading placement details...</p>
        </div>
      </div>
    );
  }

  if (!placement) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Placement</h1>
          <p className="text-gray-400 mt-1">Track your successful job placement</p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Placement Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              When you accept a job offer and get hired, your placement details will appear here.
              Keep applying and good luck with your interviews!
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/candidate/jobs">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </Link>
              <Link href="/candidate/applications">
                <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                  <FileText className="h-4 w-4 mr-2" />
                  My Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatSalary = (amount: number, currency: string, type: string) => {
    const formatted = amount.toLocaleString();
    return `${currency} ${formatted}/${type}`;
  };

  return (
    <div className="space-y-8">
      {/* Celebration Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mb-4 shadow-lg shadow-emerald-500/30"
        >
          <PartyPopper className="h-10 w-10 text-white" />
        </motion.div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
          Congratulations! 🎉
        </h1>
        <p className="text-xl text-emerald-400">
          You've been hired at <span className="font-semibold">{placement.company}</span>
        </p>
      </motion.div>

      {/* Main Placement Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-cyan-500/10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <CardContent className="relative z-10 p-8">
          {/* Job Info */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
            {placement.companyLogo ? (
              <img 
                src={placement.companyLogo} 
                alt={placement.company}
                className="w-20 h-20 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center border border-white/10">
                <Building2 className="h-10 w-10 text-emerald-400" />
              </div>
            )}
            
            <div className="flex-1">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                HIRED
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{placement.jobTitle}</h2>
              <p className="text-gray-400 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {placement.company}
              </p>
            </div>

            {/* Salary Display */}
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">Your Salary</p>
              <p className="text-xl sm:text-3xl font-bold text-emerald-400">
                {formatSalary(placement.salary, placement.currency, placement.salaryType)}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
            {placement.startDate && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Calendar className="h-5 w-5 text-cyan-400 mb-2" />
                <p className="text-gray-400 text-sm">Start Date</p>
                <p className="text-white font-semibold">
                  {new Date(placement.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
            
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Clock className="h-5 w-5 text-purple-400 mb-2" />
              <p className="text-gray-400 text-sm">Hired On</p>
              <p className="text-white font-semibold">
                {new Date(placement.hiredAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            {placement.workArrangement && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <MapPin className="h-5 w-5 text-orange-400 mb-2" />
                <p className="text-gray-400 text-sm">Work Setup</p>
                <p className="text-white font-semibold capitalize">{placement.workArrangement}</p>
              </div>
            )}
            
            {placement.shift && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Clock className="h-5 w-5 text-yellow-400 mb-2" />
                <p className="text-gray-400 text-sm">Shift</p>
                <p className="text-white font-semibold capitalize">{placement.shift}</p>
              </div>
            )}
          </div>

          {/* Benefits */}
          {placement.benefits && placement.benefits.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-400" />
                Benefits Included
              </h3>
              <div className="flex flex-wrap gap-2">
                {placement.benefits.map((benefit, i) => (
                  <Badge key={i} className="bg-pink-500/10 text-pink-400 border-pink-500/30">
                    <Star className="h-3 w-3 mr-1" />
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status Display */}
          {placement.startedStatus && (
            <div className="mb-6">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCheck className="h-4 w-4 mr-1" />
                Day 1 Confirmed - Started on {placement.startDate ? new Date(placement.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'your start date'}
              </Badge>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            {/* Confirm Day One Button */}
            {placement.startDate && !placement.startedStatus && (
              <Button
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                onClick={handleConfirmDayOne}
                disabled={confirmingDayOne}
              >
                {confirmingDayOne ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Day 1
                  </>
                )}
              </Button>
            )}

            {placement.contractUrl && (
              <Button
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                onClick={() => window.open(placement.contractUrl, '_blank')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Contract
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            )}

            <Link href="/candidate/profile">
              <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                <User className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </motion.div>

      {/* Recruiter Info */}
      {placement.recruiterName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-400" />
                Your Recruiter
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
                  <User className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{placement.recruiterName}</p>
                  {placement.recruiterEmail && (
                    <a 
                      href={`mailto:${placement.recruiterEmail}`}
                      className="text-cyan-400 text-sm hover:underline"
                    >
                      {placement.recruiterEmail}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Onboarding Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Onboarding Checklist
              </h3>
              {onboardingProgress && onboardingProgress.total > 0 && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  {onboardingProgress.completed}/{onboardingProgress.total} Complete
                </Badge>
              )}
            </div>

            {loadingTasks ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mx-auto" />
                <p className="text-gray-400 text-sm mt-2">Loading tasks...</p>
              </div>
            ) : onboardingTasks.length > 0 ? (
              <>
                {/* Progress Bar */}
                {onboardingProgress && onboardingProgress.total > 0 && (
                  <div className="mb-4">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${onboardingProgress.percentage}%` }}
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      {onboardingProgress.percentage}% complete
                      {onboardingProgress.overdue > 0 && (
                        <span className="text-orange-400 ml-2">
                          ({onboardingProgress.overdue} overdue)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Task List */}
                <div className="space-y-3 mb-4">
                  {onboardingTasks.slice(0, 5).map((task) => {
                    const isCompleted = task.status === 'approved';
                    const isPending = ['pending', 'submitted'].includes(task.status);
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

                    return (
                      <div
                        key={task.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          isCompleted
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : isOverdue
                            ? 'bg-orange-500/10 border border-orange-500/20'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : isOverdue ? (
                          <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`font-medium ${
                                isCompleted
                                  ? 'text-emerald-400 line-through'
                                  : isOverdue
                                  ? 'text-orange-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              {task.title}
                              {task.isRequired && (
                                <span className="text-red-400 ml-1">*</span>
                              )}
                            </span>
                            {task.dueDate && !isCompleted && (
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View All Link */}
                <Link href="/candidate/onboarding">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white">
                    View All Onboarding Tasks
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No onboarding tasks yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Your recruiter will assign tasks as needed
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

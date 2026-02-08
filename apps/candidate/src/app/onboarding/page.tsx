'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  PenTool,
  CheckCircle,
  Calendar,
  Briefcase,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingTaskModal from '@/components/candidate/OnboardingTaskModal';
import { toast } from 'sonner'; // Assuming sonner is used for notifications

interface OnboardingTask {
  id: string;
  application_id: string;
  job_title: string;
  company: string;
  task_type: string;
  title: string;
  description?: string;
  is_required: boolean;
  due_date?: string;
  status: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  created_at: string;
}

interface Progress {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  percentage: number;
}

interface OnboardingStatus {
  employment_started: boolean;
  employment_start_date: string | null;
  start_date: string | null;
}

export default function OnboardingPage() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [progress, setProgress] = useState<Progress>({ total: 0, completed: 0, pending: 0, overdue: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [confirmingStart, setConfirmingStart] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [session]);

  const fetchTasks = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/candidate/onboarding/tasks', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTasks(data.tasks || []);
        setProgress(data.progress || { total: 0, completed: 0, pending: 0, overdue: 0, percentage: 0 });
        setOnboardingStatus(data.onboarding_status || null);
      } else {
        console.error('Failed to fetch tasks:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch onboarding tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmFirstDay = async () => {
    if (!session?.access_token) return;

    setConfirmingStart(true);
    try {
      const response = await fetch('/api/candidate/onboarding/confirm-start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Congratulations on your first day! Your recruiter has been notified.');
        await fetchTasks(); // Refresh to update status
      } else {
        toast.error(data.error || 'Failed to confirm first day');
      }
    } catch (error) {
      console.error('Failed to confirm first day:', error);
      toast.error('Failed to confirm first day');
    } finally {
      setConfirmingStart(false);
    }
  };

  const handleOpenTask = (task: OnboardingTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSubmit = async (taskId: string, data: any) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`/api/candidate/onboarding/tasks/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Task submitted successfully!');
        // Refresh tasks to show updated status
        await fetchTasks();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit task');
      }
    } catch (error: any) {
      console.error('Task submission error:', error);
      toast.error(error.message || 'Failed to submit task');
      throw error; // Re-throw to be caught by the modal
    }
  };

  const getTaskIcon = (task_type: string) => {
    switch (task_type) {
      case 'document_upload': return <Upload className="h-5 w-5" />;
      case 'form_fill': return <FileText className="h-5 w-5" />;
      case 'e_sign': return <PenTool className="h-5 w-5" />;
      case 'acknowledgment': return <CheckCircle className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string, due_date?: string) => {
    const isOverdue = due_date && new Date(due_date) < new Date() && status !== 'approved' && status !== 'submitted';

    if (isOverdue) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>;
    }

    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      submitted: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
      <Badge variant="outline" className={`${styles[status] || styles.pending} capitalize`}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Onboarding</h1>
          <p className="text-gray-400 mt-1">Complete your onboarding tasks</p>
        </div>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-500 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Onboarding Tasks</h3>
            <p className="text-gray-400">
              Once you accept a job offer, onboarding tasks will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Onboarding</h1>
        <p className="text-gray-400 mt-1">Complete your onboarding tasks to get started</p>
      </div>

      {/* Progress Overview - Design Polish: Gradient Card */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border-orange-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
              <p className="text-sm text-gray-400">
                {progress.completed} of {progress.total} tasks completed
              </p>
            </div>
            <div className="text-3xl font-bold font-mono text-orange-500">
              {progress.percentage}%
            </div>
          </div>

          <Progress
            value={progress.percentage}
            className="h-3 mb-6 bg-black/20"
            color="bg-gradient-to-r from-orange-500 to-cyan-500"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400">{progress.completed}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-cyan-400">{progress.pending}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-red-400">{progress.overdue}</div>
              <div className="text-xs text-gray-400">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-white">{progress.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
          </div>

          {/* Day One Confirmation Button */}
          {onboardingStatus && onboardingStatus.start_date && !onboardingStatus.employment_started && (
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">Ready to start your journey?</h4>
                    <p className="text-sm text-gray-300">
                      Confirm when you've completed your first day
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConfirmFirstDay}
                  disabled={confirmingStart}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  {confirmingStart ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      I've Completed My First Day
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Employment Started Confirmation */}
          {onboardingStatus && onboardingStatus.employment_started && (
            <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-white font-semibold">Employment Started</h4>
                  <p className="text-sm text-gray-300">
                    First day confirmed on {new Date(onboardingStatus.employment_start_date!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task, index) => {
          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'approved' && task.status !== 'submitted';

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`
                bg-white/5 
                border-white/10 
                hover:border-orange-500/30 
                transition-all 
                ${isOverdue ? 'border-red-500/30' : ''}
              `}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`
                      p-3 rounded-lg shrink-0
                      ${task.status === 'approved' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-orange-500/20 text-orange-400'}
                    `}>
                      {getTaskIcon(task.task_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2 flex-wrap">
                            {task.title}
                            {task.is_required && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs border-none">Required</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {task.job_title} at {task.company}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(task.status, task.due_date)}
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-300 mb-3">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                        {task.submitted_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Submitted {new Date(task.submitted_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {task.reviewer_notes && (
                        <div className="mt-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <p className="text-sm text-cyan-300">
                            <strong>Feedback:</strong> {task.reviewer_notes}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      {(task.status === 'pending' || task.status === 'rejected') && (
                        <div className="mt-4">
                          <Button
                            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
                            onClick={() => handleOpenTask(task)}
                          >
                            {task.status === 'rejected' ? 'Resubmit Task' : 'Complete Task'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Task Submission Modal */}
      {selectedTask && (
        <OnboardingTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={selectedTask}
          onSubmit={handleTaskSubmit}
        />
      )}
    </div>
  );
}

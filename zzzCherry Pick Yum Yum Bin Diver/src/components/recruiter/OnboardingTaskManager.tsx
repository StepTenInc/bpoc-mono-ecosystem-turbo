'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  FileText,
  Upload,
  PenTool,
  CheckCircle,
  Clock,
  Calendar,
  Loader2,
  Check,
  X,
  AlertCircle,
  Award,
  BookOpen,
  Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { Progress } from '@/components/shared/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';

interface OnboardingTask {
  id: string;
  applicationId: string;
  taskType: string;
  title: string;
  description: string | null;
  isRequired: boolean;
  dueDate: string | null;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  attachments: any;
  formData: any;
  createdAt: string;
}

interface OnboardingProgress {
  total: number;
  completed: number;
  pending: number;
  submitted: number;
  overdue: number;
  percentage: number;
}

interface OnboardingTaskManagerProps {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onTaskUpdated?: () => void;
}

const TASK_TYPES = [
  { value: 'document_upload', label: 'Document Upload', icon: Upload, description: 'Request file uploads (ID, certificates, etc.)' },
  { value: 'form_fill', label: 'Form Fill', icon: FileText, description: 'Online form to complete' },
  { value: 'e_sign', label: 'E-Signature', icon: PenTool, description: 'Electronic signature required' },
  { value: 'acknowledgment', label: 'Acknowledgment', icon: CheckCircle, description: 'Read and confirm (auto-approved)' },
  { value: 'training', label: 'Training', icon: BookOpen, description: 'Complete training module' },
  { value: 'information', label: 'Information', icon: Info, description: 'Read-only information (auto-approved)' },
];

export function OnboardingTaskManager({
  applicationId,
  candidateName,
  jobTitle,
  onTaskUpdated
}: OnboardingTaskManagerProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [progress, setProgress] = useState<OnboardingProgress>({
    total: 0,
    completed: 0,
    pending: 0,
    submitted: 0,
    overdue: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);

  // Create task form state
  const [taskType, setTaskType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [dueDate, setDueDate] = useState('');

  // Review task state
  const [reviewerNotes, setReviewerNotes] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [applicationId]);

  const fetchTasks = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch(
        `/api/recruiter/onboarding/tasks?applicationId=${applicationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': user?.id || '',
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setTasks(data.tasks || []);
        setProgress(data.progress || { total: 0, completed: 0, pending: 0, submitted: 0, overdue: 0, percentage: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskType || !title) {
      toast.error('Task type and title are required');
      return;
    }

    setActionLoading(true);
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/onboarding/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          applicationId,
          taskType,
          title,
          description: description || null,
          isRequired,
          dueDate: dueDate || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Task "${title}" created and sent to ${candidateName}!`);
        setShowCreateDialog(false);
        resetCreateForm();
        fetchTasks();
        onTaskUpdated?.();
      } else {
        toast.error(data.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewTask = async (status: 'approved' | 'rejected') => {
    if (!selectedTask) return;

    if (status === 'rejected' && !reviewerNotes) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/onboarding/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          status,
          reviewerNotes: status === 'rejected' ? reviewerNotes : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          status === 'approved'
            ? `Task approved! ${candidateName} has been notified.`
            : `Task rejected. ${candidateName} will see your feedback.`
        );
        setShowReviewDialog(false);
        setSelectedTask(null);
        setReviewerNotes('');
        fetchTasks();
        onTaskUpdated?.();
      } else {
        toast.error(data.error || 'Failed to review task');
      }
    } catch (error) {
      console.error('Failed to review task:', error);
      toast.error('Failed to review task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (progress.total === 0 || progress.completed < progress.total) {
      toast.error('Cannot mark complete. Some tasks are still pending.');
      return;
    }

    setActionLoading(true);
    try {
      const token = await getSessionToken();
      const response = await fetch(
        `/api/recruiter/onboarding/${applicationId}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': user?.id || '',
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(`Onboarding complete! ${candidateName} is ready for Day 1! 🎉`);
        onTaskUpdated?.();
      } else {
        toast.error(data.error || 'Failed to mark onboarding complete');
      }
    } catch (error) {
      console.error('Failed to mark complete:', error);
      toast.error('Failed to mark onboarding complete');
    } finally {
      setActionLoading(false);
    }
  };

  const resetCreateForm = () => {
    setTaskType('');
    setTitle('');
    setDescription('');
    setIsRequired(true);
    setDueDate('');
  };

  const openReviewDialog = (task: OnboardingTask) => {
    setSelectedTask(task);
    setShowReviewDialog(true);
  };

  const getTaskIcon = (type: string) => {
    const taskType = TASK_TYPES.find(t => t.value === type);
    const Icon = taskType?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string, dueDate?: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'approved';

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
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Onboarding Tasks</h3>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="bg-white/10 px-2 py-1 rounded text-sm text-white">{candidateName}</span>
              <span>•</span>
              <span className="text-sm">{jobTitle}</span>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Task
          </Button>
        </div>

        {/* Progress Card */}
        {tasks.length > 0 && (
          <Card className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-cyan-500/10 border-white/10 overflow-hidden relative">
             {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Onboarding Progress</h4>
                  <p className="text-gray-400">
                    <span className="text-white font-medium">{progress.completed}</span> of <span className="text-white font-medium">{progress.total}</span> tasks completed
                  </p>
                </div>
                <div className="text-center">
                   <div className="text-5xl font-bold text-white mb-2 tracking-tight">{progress.percentage}%</div>
                   <div className="w-full md:w-64 bg-white/10 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-cyan-500 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">{progress.completed}</div>
                  <div className="text-xs font-medium text-emerald-400/70 uppercase tracking-wide">Completed</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                  <div className="text-3xl font-bold text-amber-400 mb-1">{progress.pending}</div>
                  <div className="text-xs font-medium text-amber-400/70 uppercase tracking-wide">Pending</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
                  <div className="text-3xl font-bold text-cyan-400 mb-1">{progress.submitted}</div>
                  <div className="text-xs font-medium text-cyan-400/70 uppercase tracking-wide">Submitted</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                  <div className="text-3xl font-bold text-red-400 mb-1">{progress.overdue}</div>
                  <div className="text-xs font-medium text-red-400/70 uppercase tracking-wide">Overdue</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="text-3xl font-bold text-white mb-1">{progress.total}</div>
                  <div className="text-xs font-medium text-white/50 uppercase tracking-wide">Total Tasks</div>
                </div>
              </div>

              {progress.percentage === 100 && (
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
                  <Button
                    onClick={handleMarkComplete}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Award className="h-5 w-5 mr-2" />
                    )}
                    Mark Onboarding Complete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <Card className="bg-white/5 border-white/10 border-dashed hover:border-white/20 transition-colors">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Tasks Yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
                Get started by creating the first onboarding task for {candidateName} to complete before Day 1.
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-8 py-6 text-lg shadow-lg shadow-orange-500/20"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'approved';
              
              // Border color logic based on status
              let borderColorClass = 'border-l-gray-500/50';
              if (task.status === 'approved') borderColorClass = 'border-l-emerald-500';
              else if (task.status === 'submitted') borderColorClass = 'border-l-cyan-500';
              else if (task.status === 'rejected') borderColorClass = 'border-l-red-500';
              else if (isOverdue) borderColorClass = 'border-l-red-500';

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`
                    bg-white/5 border-y border-r border-white/10 border-l-4 ${borderColorClass}
                    hover:bg-white/[0.07] hover:translate-x-1 transition-all duration-200
                  `}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Icon */}
                        <div className={`
                          p-4 rounded-xl flex-shrink-0
                          ${task.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            task.status === 'submitted' ? 'bg-cyan-500/10 text-cyan-400' :
                            task.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                            'bg-white/10 text-white'}
                        `}>
                          {getTaskIcon(task.taskType)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-lg font-bold text-white">
                                  {task.title}
                                </h4>
                                {task.isRequired && (
                                  <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 uppercase tracking-wider">Required</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 font-medium capitalize">
                                {task.taskType.replace(/_/g, ' ')} Task
                              </p>
                            </div>
                            {getStatusBadge(task.status, task.dueDate)}
                          </div>

                          {task.description && (
                            <p className="text-sm text-gray-300 mb-4 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mt-auto">
                            {task.dueDate && (
                              <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-400 font-medium' : ''}`}>
                                <Calendar className="h-4 w-4" />
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                {isOverdue && <span className="text-xs bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Overdue</span>}
                              </div>
                            )}
                            {task.submittedAt && (
                              <div className="flex items-center gap-2 text-cyan-400">
                                <CheckCircle className="h-4 w-4" />
                                <span>Submitted: {new Date(task.submittedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Review Actions for Submitted Tasks */}
                          {task.status === 'submitted' && (
                            <div className="mt-6 flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => openReviewDialog(task)}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Review Submission
                              </Button>
                            </div>
                          )}

                          {/* Reviewer Feedback */}
                          {task.reviewerNotes && task.status === 'rejected' && (
                            <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-red-400 mb-1">Changes Requested:</p>
                                  <p className="text-sm text-gray-300">{task.reviewerNotes}</p>
                                </div>
                              </div>
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
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#0F1419] border-white/10 text-gray-300 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Create Onboarding Task
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new task for {candidateName} to complete
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Task Type */}
            <div className="space-y-2">
              <Label className="text-gray-300">Task Type *</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0f] border-white/10">
                  {TASK_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-400">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Upload Government ID"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/5 border-white/10 text-white min-h-[80px]"
                placeholder="Provide details about what the candidate needs to do..."
              />
            </div>

            {/* Due Date & Required */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due-date" className="text-gray-300">Due Date (Optional)</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Priority</Label>
                <div className="flex items-center gap-4 h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isRequired}
                      onChange={() => setIsRequired(true)}
                      className="text-orange-500"
                    />
                    <span className="text-sm text-gray-300">Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isRequired}
                      onChange={() => setIsRequired(false)}
                      className="text-orange-500"
                    />
                    <span className="text-sm text-gray-300">Optional</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowCreateDialog(false);
                  resetCreateForm();
                }}
                variant="outline"
                className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                disabled={actionLoading || !taskType || !title}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Task Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-[#0F1419] border-white/10 text-gray-300 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-500" />
              Review Task Submission
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 mt-4">
              {/* Task Info */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Task Type:</p>
                    <p className="text-white capitalize">{selectedTask.taskType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Submitted:</p>
                    <p className="text-white">
                      {selectedTask.submittedAt
                        ? new Date(selectedTask.submittedAt).toLocaleDateString()
                        : 'Not submitted'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submission Data */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Uploaded Files:</Label>
                  <div className="space-y-2">
                    {selectedTask.attachments.map((file: any, index: number) => (
                      <a
                        key={index}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors"
                      >
                        <Upload className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm text-cyan-400 hover:text-cyan-300">
                          {file.fileName}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedTask.formData && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Form Data:</Label>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedTask.formData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Reviewer Notes */}
              <div className="space-y-2">
                <Label htmlFor="reviewer-notes" className="text-gray-300">
                  Feedback (Required for rejection)
                </Label>
                <Textarea
                  id="reviewer-notes"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="bg-white/5 border-white/10 text-white min-h-[100px]"
                  placeholder="Provide feedback to the candidate..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleReviewTask('approved')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  onClick={() => handleReviewTask('rejected')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={actionLoading || !reviewerNotes}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Request Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

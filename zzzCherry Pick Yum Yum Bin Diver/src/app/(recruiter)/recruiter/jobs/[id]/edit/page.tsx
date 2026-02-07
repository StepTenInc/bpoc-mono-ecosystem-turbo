'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import {
  Briefcase,
  ArrowLeft,
  Loader2,
  DollarSign,
  Building2,
  Save,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [] as string[],
    responsibilities: [] as string[],
    benefits: [] as string[],
    skills: [] as string[],
    salaryMin: '',
    salaryMax: '',
    currency: 'PHP',
    workType: 'full_time',
    workArrangement: 'remote',
    shift: 'day',
    experienceLevel: 'mid_level',
    status: 'active',
  });

  useEffect(() => {
    if (user?.id && jobId) {
      fetchJob();
    }
  }, [user?.id, jobId]);

  const fetchJob = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.job) {
        setJob(data.job);
        setFormData({
          title: data.job.title || '',
          description: data.job.description || '',
          requirements: data.job.requirements || [],
          responsibilities: data.job.responsibilities || [],
          benefits: data.job.benefits || [],
          skills: data.job.skills || [],
          salaryMin: data.job.salary_min?.toString() || '',
          salaryMax: data.job.salary_max?.toString() || '',
          currency: data.job.currency || 'PHP',
          workType: data.job.work_type || 'full_time',
          workArrangement: data.job.work_arrangement || 'remote',
          shift: data.job.shift || 'day',
          experienceLevel: data.job.experience_level || 'mid_level',
          status: data.job.status || 'active',
        });
      } else {
        toast.error('Job not found');
        router.push('/recruiter/jobs');
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          ...formData,
          salary_min: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salary_max: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        }),
      });

      if (response.ok) {
        toast.success('Job updated successfully');
        router.push('/recruiter/jobs');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update job');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/recruiter/jobs" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit Job</h1>
          <p className="text-gray-400 mt-1">Update your job posting details</p>
        </div>
        {job?.clientName && (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            <Building2 className="h-3 w-3 mr-1" />
            {job.clientName}
          </Badge>
        )}
      </div>

      {/* Status */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Job Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {['active', 'paused', 'closed', 'draft'].map((status) => (
              <button
                key={status}
                onClick={() => setFormData(f => ({ ...f, status }))}
                className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                  formData.status === status
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-orange-400" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Job Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Requirements</label>
              <textarea
                value={formData.requirements.join('\n')}
                onChange={(e) => setFormData(f => ({ 
                  ...f, 
                  requirements: e.target.value.split('\n').filter(r => r.trim()) 
                }))}
                placeholder="One per line"
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 resize-none text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Responsibilities</label>
              <textarea
                value={formData.responsibilities.join('\n')}
                onChange={(e) => setFormData(f => ({ 
                  ...f, 
                  responsibilities: e.target.value.split('\n').filter(r => r.trim()) 
                }))}
                placeholder="One per line"
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 resize-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Skills (comma separated)</label>
            <Input
              value={formData.skills.join(', ')}
              onChange={(e) => setFormData(f => ({ 
                ...f, 
                skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
              }))}
              placeholder="e.g. Communication, Excel, Customer Service"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-400" />
            Compensation & Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Min Salary</label>
              <Input
                type="number"
                value={formData.salaryMin}
                onChange={(e) => setFormData(f => ({ ...f, salaryMin: e.target.value }))}
                placeholder="30000"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Max Salary</label>
              <Input
                type="number"
                value={formData.salaryMax}
                onChange={(e) => setFormData(f => ({ ...f, salaryMax: e.target.value }))}
                placeholder="50000"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(f => ({ ...f, currency: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Work Type</label>
              <select
                value={formData.workType}
                onChange={(e) => setFormData(f => ({ ...f, workType: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Work Arrangement</label>
              <select
                value={formData.workArrangement}
                onChange={(e) => setFormData(f => ({ ...f, workArrangement: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Shift</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData(f => ({ ...f, shift: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="day">Day Shift</option>
                <option value="night">Night Shift</option>
                <option value="both">Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Experience Level</label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData(f => ({ ...f, experienceLevel: e.target.value }))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="entry_level">Entry Level</option>
                <option value="mid_level">Mid Level</option>
                <option value="senior_level">Senior</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Benefits (comma separated)</label>
            <Input
              value={formData.benefits.join(', ')}
              onChange={(e) => setFormData(f => ({ 
                ...f, 
                benefits: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
              }))}
              placeholder="e.g. HMO, Paid Leave, WFH Setup"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/recruiter/jobs')}
          className="flex-1 border-white/10 text-gray-400"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Briefcase, Calendar, MapPin, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/AuthContext';

const formatStatus = (status?: string) => {
  if (!status) return 'Submitted';
  const formats: Record<string, string> = {
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'for_verification': 'For Verification',
    'verified': 'Verified',
    'qualified': 'Qualified',
    'shortlisted': 'Shortlisted',
    'interview_scheduled': 'Interview Scheduled',
    'initial_interview': 'Initial Interview',
    'interviewed': 'Interviewed',
    'passed': 'Passed',
    'offer_sent': 'Offer Sent',
    'hired': 'Hired',
    'rejected': 'Rejected',
    'withdrawn': 'Withdrawn',
    'invited': 'Invited',
  };
  return formats[status.toLowerCase()] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  under_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  shortlisted: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  interview_scheduled: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  interviewed: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  offer_sent: 'bg-green-500/20 text-green-400 border-green-500/30',
  hired: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  withdrawn: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function CandidateApplicationDetailPage() {
  const params = useParams();
  const applicationId = params.id as string;
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      if (!session?.access_token || !applicationId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/candidate/applications/${applicationId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error || 'Failed to load application');
          setApplication(null);
          return;
        }
        setApplication(data.application);
      } catch (e) {
        console.error('Failed to load candidate application:', e);
        toast.error('Failed to load application');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [session?.access_token, applicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Link href="/applications" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Link>
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Application Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-400 text-sm">
            This application does not exist or you don't have access to view it.
          </CardContent>
        </Card>
      </div>
    );
  }

  const job = application.jobs as any;
  const agencyClient = job?.agency_clients;
  const company = agencyClient?.agencies?.name || agencyClient?.companies?.name || 'Company';
  const statusColor = statusColors[application.status] || statusColors.submitted;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/applications" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Link>
        <Badge className={`${statusColor} border`}>
          {formatStatus(application.status)}
        </Badge>
      </div>

      {/* Main Info Card */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Briefcase className="h-5 w-5 text-cyan-400" />
            </div>
            {job?.title || 'Application'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-gray-500 text-xs uppercase tracking-wide">Company</div>
              <div className="text-white font-medium">{company}</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-500 text-xs uppercase tracking-wide">Applied On</div>
              <div className="text-white font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {application.created_at ? new Date(application.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
            {job?.location && (
              <div className="space-y-1">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Location</div>
                <div className="text-white font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {job.location}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
            <Link href="/interviews">
              <Button variant="outline" className="border-white/10 hover:bg-white/5">
                <Clock className="h-4 w-4 mr-2" />
                View Interviews
              </Button>
            </Link>
            <Link href="/resume">
              <Button variant="outline" className="border-white/10 hover:bg-white/5">
                <FileText className="h-4 w-4 mr-2" />
                View Resume
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <div>
                <p className="text-white font-medium">Application Submitted</p>
                <p className="text-gray-400 text-sm">
                  {application.created_at ? new Date(application.created_at).toLocaleString() : 'Recently'}
                </p>
              </div>
            </div>
            {application.status !== 'submitted' && (
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div>
                  <p className="text-white font-medium">{formatStatus(application.status)}</p>
                  <p className="text-gray-400 text-sm">Current status</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

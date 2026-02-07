'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { toast } from '@/components/shared/ui/toast';
import { useAuth } from '@/contexts/AuthContext';
import { CallArtifacts, type CallArtifactRoom } from '@/components/shared/application/CallArtifacts';

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
        <Link href="/candidate/applications" className="inline-flex items-center text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Link>
        <Card className="mt-4 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Application could not be loaded</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-400 text-sm">
            This usually means the application does not exist or is not yours.
          </CardContent>
        </Card>
      </div>
    );
  }

  const job = application.jobs as any;
  const agencyClient = job?.agency_clients;
  const company = agencyClient?.agencies?.name || agencyClient?.companies?.name || 'Company';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/candidate/applications" className="inline-flex items-center text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Link>
        <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10">
          {formatStatus(application.status)}
        </Badge>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-cyan-400" />
            {job?.title || 'Application'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div>
                <div className="text-gray-400 text-xs">Company</div>
                <div className="text-white/90">{company}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Applied</div>
                <div className="text-white/90">{application.created_at ? new Date(application.created_at).toLocaleString() : '—'}</div>
              </div>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto">
              <Link href="/candidate/interviews">
                <Button variant="outline" className="border-white/10 w-full sm:w-auto min-h-[44px]">
                  View Interviews
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <CallArtifacts rooms={(application.calls || []) as CallArtifactRoom[]} />
    </div>
  );
}



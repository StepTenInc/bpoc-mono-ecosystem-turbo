'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Briefcase,
  Clock,
  Eye,
  Loader2,
  ExternalLink,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import Link from 'next/link';

interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/admin/applications?status=${statusFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      invited: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      submitted: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      under_review: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      shortlisted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      interview_scheduled: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      interviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      offer_pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      offer_sent: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      offer_accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      hired: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      withdrawn: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return (
      <Badge variant="outline" className={`${styles[status] || styles.submitted} capitalize`}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const filteredApps = applications.filter(app =>
    (app.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count by status
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Applications</h1>
          <p className="text-gray-400 mt-1">Monitor job applications across all agencies</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
          <Eye className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-400">View Only</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { key: 'submitted', label: 'New' },
          { key: 'under_review', label: 'Reviewing' },
          { key: 'shortlisted', label: 'Shortlisted' },
          { key: 'interview_scheduled', label: 'Interviewing' },
          { key: 'offer_sent', label: 'Offers Sent' },
          { key: 'hired', label: 'Hired' }
        ].map(({ key, label }) => (
          <Card key={key} className="bg-white/5 border-white/10">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-white">
                {statusCounts[key] || 0}
              </p>
              <p className="text-gray-400 text-xs">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview_scheduled">Interview Scheduled</option>
          <option value="interviewed">Interviewed</option>
          <option value="offer_sent">Offer Sent</option>
          <option value="offer_accepted">Offer Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Applications Yet</h3>
            <p className="text-gray-400">Applications will appear here when candidates apply to jobs.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={app.candidateAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-600 text-white text-sm">
                          {app.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-white font-medium">{app.candidateName}</h3>
                        <p className="text-gray-400 text-sm">{app.candidateEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Briefcase className="h-4 w-4" />
                          <span>{app.jobTitle}</span>
                        </div>
                        <p className="text-gray-500 text-xs">{app.company}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(app.status)}
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* View details link */}
                      <Link 
                        href={`/admin/applications/${app.id}`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/5">
        <p>Application status changes are managed by recruiters in the Agency Portal</p>
      </div>
    </div>
  );
}

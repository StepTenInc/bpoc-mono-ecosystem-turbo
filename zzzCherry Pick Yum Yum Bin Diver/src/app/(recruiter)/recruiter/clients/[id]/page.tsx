'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  Briefcase,
  Loader2,
  Save,
  Plus,
  Edit,
  X,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';

interface ClientDetail {
  id: string;
  status: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  notes: string;
  createdAt: string;
  totalApplicants?: number;
  activeJobCount?: number;
  placementCount?: number;
  lastActivityAt?: string;
  company: {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string;
    logoUrl: string;
    website: string;
    industry: string;
    companySize: string;
    description: string;
  } | null;
  jobs: {
    id: string;
    title: string;
    status: string;
    applicantsCount: number;
    createdAt: string;
  }[];
}

function formatTimeAgo(dateStr?: string) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [formData, setFormData] = useState({
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    notes: '',
    status: 'active',
  });

  useEffect(() => {
    if (user?.id && clientId) {
      fetchClient();
    }
  }, [user?.id, clientId]);

  const fetchClient = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.client) {
        setClient(data.client);
        setFormData({
          primaryContactName: data.client.primaryContactName || '',
          primaryContactEmail: data.client.primaryContactEmail || '',
          primaryContactPhone: data.client.primaryContactPhone || '',
          notes: data.client.notes || '',
          status: data.client.status || 'active',
        });
      } else {
        toast.error('Client not found');
        router.push('/recruiter/clients');
      }
    } catch (error) {
      console.error('Failed to fetch client:', error);
      toast.error('Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getSessionToken();
      const response = await fetch(`/api/recruiter/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Client updated successfully');
        setEditing(false);
        fetchClient();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update client');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return <Badge variant="outline" className={styles[status] || styles.active}>{status}</Badge>;
  };

  const getJobStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      paused: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      draft: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return <Badge variant="outline" className={`${styles[status] || styles.active} capitalize`}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/recruiter/clients" className="inline-flex items-center text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
        <div className="flex gap-2">
          {!editing ? (
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
              className="border-white/10 text-gray-400 hover:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="border-white/10 text-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Company Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 rounded-xl">
                <AvatarImage src={client.company?.logoUrl} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-2xl rounded-xl">
                  {client.company?.name?.substring(0, 2).toUpperCase() || 'CO'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white">{client.company?.name}</h1>
                    {client.company?.industry && (
                      <p className="text-gray-400 text-lg mt-1">{client.company.industry}</p>
                    )}
                  </div>
                  {editing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  ) : (
                    getStatusBadge(client.status)
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  {client.company?.email && (
                    <span className="flex items-center gap-2 text-gray-400">
                      <Mail className="h-4 w-4" />
                      {client.company.email}
                    </span>
                  )}
                  {client.company?.phone && (
                    <span className="flex items-center gap-2 text-gray-400">
                      <Phone className="h-4 w-4" />
                      {client.company.phone}
                    </span>
                  )}
                  {client.company?.website && (
                    <a 
                      href={client.company.website.startsWith('http') ? client.company.website : `https://${client.company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-orange-400 hover:text-orange-300"
                    >
                      <Globe className="h-4 w-4" />
                      {client.company.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-2xl font-bold text-white">{client.jobs?.length || 0}</p>
                    <p className="text-gray-400 text-sm">Total Jobs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">
                      {client.activeJobCount ?? (client.jobs?.filter(j => j.status === 'active').length || 0)}
                    </p>
                    <p className="text-gray-400 text-sm">Active Jobs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">
                      {client.totalApplicants ?? (client.jobs?.reduce((acc, j) => acc + (j.applicantsCount || 0), 0) || 0)}
                    </p>
                    <p className="text-gray-400 text-sm">Total Applicants</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">
                      {client.placementCount ?? 0}
                    </p>
                    <p className="text-gray-400 text-sm">Placements</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10">
                    Last activity: {formatTimeAgo(client.lastActivityAt || client.createdAt)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Jobs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-orange-400" />
                  Jobs
                </CardTitle>
                <Link href={`/recruiter/jobs/create?clientId=${client.id}`}>
                  <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-600">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Job
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {client.jobs && client.jobs.length > 0 ? (
                  <div className="space-y-3">
                    {client.jobs.map((job) => (
                      <Link key={job.id} href={`/recruiter/jobs/${job.id}/edit`}>
                        <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-medium">{job.title}</h4>
                              <p className="text-gray-400 text-sm">
                                {job.applicantsCount || 0} applicants • Posted {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {getJobStatusBadge(job.status)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No jobs yet</p>
                    <Link href={`/recruiter/jobs/create?clientId=${client.id}`}>
                      <Button size="sm" className="mt-3 bg-gradient-to-r from-orange-500 to-amber-600">
                        <Plus className="h-4 w-4 mr-1" />
                        Create First Job
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Company About */}
          {client.company?.description && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 whitespace-pre-wrap">{client.company.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                    rows={4}
                    placeholder="Add notes about this client..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
                  />
                ) : (
                  <p className="text-gray-300">
                    {client.notes || 'No notes added yet.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Primary Contact */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-400" />
                  Primary Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Name</label>
                      <Input
                        value={formData.primaryContactName}
                        onChange={(e) => setFormData(f => ({ ...f, primaryContactName: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Email</label>
                      <Input
                        value={formData.primaryContactEmail}
                        onChange={(e) => setFormData(f => ({ ...f, primaryContactEmail: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Phone</label>
                      <Input
                        value={formData.primaryContactPhone}
                        onChange={(e) => setFormData(f => ({ ...f, primaryContactPhone: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {client.primaryContactName && (
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-white">{client.primaryContactName}</span>
                      </div>
                    )}
                    {client.primaryContactEmail && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${client.primaryContactEmail}`} className="text-orange-400 hover:text-orange-300">
                          {client.primaryContactEmail}
                        </a>
                      </div>
                    )}
                    {client.primaryContactPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${client.primaryContactPhone}`} className="text-white">
                          {client.primaryContactPhone}
                        </a>
                      </div>
                    )}
                    {!client.primaryContactName && !client.primaryContactEmail && !client.primaryContactPhone && (
                      <p className="text-gray-400">No contact information</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Client ID */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <p className="text-gray-400 text-sm mb-1">Client ID</p>
                <p className="text-white font-mono text-sm break-all">{client.id}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


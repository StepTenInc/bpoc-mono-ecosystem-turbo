'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Plus, Search, Loader2, Briefcase, Mail, Phone, 
  Globe, Users, X, CheckCircle, ExternalLink, Grid3X3, List,
  Clock, TrendingUp, AlertCircle, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';
import Link from 'next/link';

interface Client {
  id: string;
  status: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  notes: string;
  createdAt: string;
  lastContactAt?: string;
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
  } | null;
  jobCount: number;
  activeJobCount?: number;
  placementCount?: number;
}

type ViewMode = 'grid' | 'list';

export default function ClientsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [canManageClients, setCanManageClients] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [verificationStatus, setVerificationStatus] = useState<string>('verified');
  
  // Slide-out drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newClient, setNewClient] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    companyIndustry: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    notes: '',
    clientTimezone: 'Australia/Sydney',
  });

  // Common timezones for dropdown
  const TIMEZONE_OPTIONS = [
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
    { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEST/AEDT)' },
    { value: 'Australia/Brisbane', label: 'Australia/Brisbane (AEST)' },
    { value: 'America/New_York', label: 'America/New York (ET)' },
    { value: 'America/Los_Angeles', label: 'America/Los Angeles (PT)' },
    { value: 'America/Chicago', label: 'America/Chicago (CT)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    { value: 'Asia/Manila', label: 'Asia/Manila (PHT)' },
    { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT)' },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchClients();
      fetchVerificationStatus();
    }
  }, [user?.id]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/recruiter/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await response.json();
      if (response.ok && data.recruiter) {
        setVerificationStatus(data.recruiter.verificationStatus || 'verified');
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setClients(data.clients || []);
        setCanManageClients(data.permissions?.canManageClients || false);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    setAdding(true);
    toast.loading('🔍 AI is verifying company online...', { id: 'verifying-client' });
    
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(newClient),
      });

      toast.dismiss('verifying-client');
      if (response.ok) {
        const data = await response.json();
        // Show verification feedback
        if (data.verificationStatus === 'verified') {
          toast.success(`✅ ${newClient.companyName} added — Company verified online!`);
        } else if (data.verificationStatus === 'suspicious') {
          toast.error(`⚠️ ${newClient.companyName} added but flagged — No online presence found. Please verify manually.`);
        } else {
          toast.success(`${newClient.companyName} added — ${data.verificationSummary || 'Limited online info found'}`);
        }
        setShowDrawer(false);
        setNewClient({
          companyName: '',
          companyEmail: '',
          companyPhone: '',
          companyWebsite: '',
          companyIndustry: '',
          primaryContactName: '',
          primaryContactEmail: '',
          primaryContactPhone: '',
          notes: '',
          clientTimezone: 'Australia/Sydney',
        });
        fetchClients();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add client');
      }
    } catch (error) {
      console.error('Add client error:', error);
      toast.error('Failed to add client');
    } finally {
      setAdding(false);
    }
  };

  const filteredClients = clients.filter(c => 
    (c.company?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company?.industry || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return <Badge variant="outline" className={styles[status] || styles.active}>{status}</Badge>;
  };

  const getClientHealth = (client: Client) => {
    const activeJobs = client.activeJobCount || 0;
    const placements = client.placementCount || 0;
    const hasPrimaryContact = !!(client.primaryContactEmail || client.primaryContactPhone || client.primaryContactName);
    const lastContact = client.lastContactAt || client.createdAt;
    const daysSinceContact = Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000);
    const reasons: string[] = [];
    if (client.status === 'active' && activeJobs === 0) reasons.push('No active jobs');
    if (client.status === 'active' && !hasPrimaryContact) reasons.push('Missing contact');
    if (client.status === 'active' && daysSinceContact >= 14) reasons.push(`No activity ${daysSinceContact}d`);
    
    if (activeJobs > 0 && placements > 0) {
      return { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', reasons: [] as string[] };
    } else if (activeJobs > 0) {
      return { label: 'Active', color: 'text-cyan-400', bg: 'bg-cyan-500/10', reasons: reasons.filter(r => r !== 'No active jobs') };
    } else if (client.status === 'active') {
      return { label: 'Needs Attention', color: 'text-amber-400', bg: 'bg-amber-500/10', reasons: reasons.length ? reasons : ['No active jobs'] };
    }
    return { label: 'Inactive', color: 'text-gray-400', bg: 'bg-gray-500/10', reasons: [] as string[] };
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  // Stats
  const totalJobs = clients.reduce((acc, c) => acc + c.jobCount, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-gray-400 mt-1">Manage your agency&apos;s client companies</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          {canManageClients && (
            verificationStatus === 'verified' ? (
              <Button
                onClick={() => setShowDrawer(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            ) : (
              <Button
                disabled
                className="bg-gray-500/20 cursor-not-allowed opacity-50"
                title="Complete verification to add clients"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            )
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{clients.length}</p>
              <p className="text-gray-400 text-sm">Total Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeClients}</p>
              <p className="text-gray-400 text-sm">Active Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalJobs}</p>
              <p className="text-gray-400 text-sm">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {clients.filter(c => c.placementCount && c.placementCount > 0).length}
              </p>
              <p className="text-gray-400 text-sm">With Placements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search clients by name or industry..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="pl-10 bg-white/5 border-white/10 text-white" 
        />
      </div>

      {/* Clients List/Grid */}
      {filteredClients.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Clients Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Clients are the companies you recruit for. Each client gets their own dashboard 
              where they can view jobs, track candidates, and see who you&apos;ve released to them.
            </p>
            
            {/* Why add clients explainer */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 max-w-md mx-auto text-left">
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                Why add clients?
              </h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-gray-300">Jobs are attached to clients</strong> — organize and filter by who you&apos;re recruiting for</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-gray-300">Client Portal access</strong> — clients get their own dashboard with a unique login code</span>
                </li>
                <li className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-gray-300">Release candidates</strong> — when ready, release candidates to the client for their review</span>
                </li>
              </ul>
            </div>
            {canManageClients && (
              verificationStatus === 'verified' ? (
                <Button onClick={() => setShowDrawer(true)} className="bg-gradient-to-r from-orange-500 to-amber-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Client
                </Button>
              ) : (
                <Button
                  disabled
                  className="bg-gray-500/20 cursor-not-allowed opacity-50"
                  title="Complete verification to add clients"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client (Verification Required)
                </Button>
              )
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, i) => {
            const health = getClientHealth(client);
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link href={`/recruiter/clients/${client.id}`}>
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-all h-full cursor-pointer group overflow-hidden relative">
                    {/* Glassmorphism hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-12 w-12 rounded-xl">
                          <AvatarImage src={client.company?.logoUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl">
                            {client.company?.name?.substring(0, 2).toUpperCase() || 'CO'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate group-hover:text-orange-400 transition-colors">
                            {client.company?.name}
                          </h3>
                          {client.company?.industry && (
                            <p className="text-gray-400 text-sm truncate">{client.company.industry}</p>
                          )}
                        </div>
                        {getStatusBadge(client.status)}
                      </div>

                      {/* Health Indicator */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${health.bg} mb-4`}>
                        {health.label === 'Needs Attention' ? (
                          <AlertCircle className={`h-4 w-4 ${health.color}`} />
                        ) : (
                          <CheckCircle className={`h-4 w-4 ${health.color}`} />
                        )}
                        <span className={`text-sm font-medium ${health.color}`}>{health.label}</span>
                      </div>
                      {health.reasons?.length ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {health.reasons.slice(0, 3).map((r) => (
                            <Badge
                              key={r}
                              variant="outline"
                              className="bg-white/5 text-gray-300 border-white/10 text-xs"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      <div className="space-y-2 text-sm mb-4">
                        {client.company?.website && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Globe className="h-4 w-4" />
                            <span className="truncate">{client.company.website.replace(/^https?:\/\//, '')}</span>
                          </div>
                        )}
                        {client.primaryContactName && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>{client.primaryContactName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Last contact: {formatTimeAgo(client.lastContactAt || client.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-400">
                            <span className="text-white font-semibold">{client.jobCount}</span> jobs
                          </span>
                          {client.placementCount !== undefined && client.placementCount > 0 && (
                            <span className="text-emerald-400">
                              <span className="font-semibold">{client.placementCount}</span> placed
                            </span>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          {filteredClients.map((client, i) => {
            const health = getClientHealth(client);
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link href={`/recruiter/clients/${client.id}`}>
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-all cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 rounded-lg">
                          <AvatarImage src={client.company?.logoUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-lg text-sm">
                            {client.company?.name?.substring(0, 2).toUpperCase() || 'CO'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-semibold truncate group-hover:text-orange-400 transition-colors">
                              {client.company?.name}
                            </h3>
                            {getStatusBadge(client.status)}
                            <Badge variant="outline" className={`${health.bg} ${health.color} border-transparent`}>
                              {health.label}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm truncate">
                            {client.company?.industry} • {client.primaryContactName || 'No contact'}
                          </p>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-white font-semibold">{client.jobCount}</p>
                            <p className="text-gray-500 text-xs">Jobs</p>
                          </div>
                          <div className="text-center">
                            <p className="text-emerald-400 font-semibold">{client.placementCount || 0}</p>
                            <p className="text-gray-500 text-xs">Placed</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/recruiter/jobs/create?clientId=${client.id}`;
                            }}
                            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Job
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowDrawer(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#0a0a0f] border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Client</h2>
                  <p className="text-gray-400 text-sm mt-1">Clients can view their jobs and candidates via their own portal</p>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Info callout */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <p className="text-orange-300 text-sm">
                    💡 Once added, this client will get a unique portal link where they can track their jobs and view released candidates.
                  </p>
                </div>

                {/* Company Info */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-400" />
                    Company Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Company Name *</label>
                      <Input 
                        value={newClient.companyName}
                        onChange={(e) => setNewClient(c => ({ ...c, companyName: e.target.value }))}
                        placeholder="Acme Corporation"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Email</label>
                        <Input 
                          value={newClient.companyEmail}
                          onChange={(e) => setNewClient(c => ({ ...c, companyEmail: e.target.value }))}
                          placeholder="contact@company.com"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Phone</label>
                        <Input 
                          value={newClient.companyPhone}
                          onChange={(e) => setNewClient(c => ({ ...c, companyPhone: e.target.value }))}
                          placeholder="+63 XXX XXX XXXX"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Website</label>
                      <Input 
                        value={newClient.companyWebsite}
                        onChange={(e) => setNewClient(c => ({ ...c, companyWebsite: e.target.value }))}
                        placeholder="https://company.com"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Industry</label>
                      <Input 
                        value={newClient.companyIndustry}
                        onChange={(e) => setNewClient(c => ({ ...c, companyIndustry: e.target.value }))}
                        placeholder="e.g. Technology, Healthcare, Finance"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Client Timezone *</label>
                      <select
                        value={newClient.clientTimezone}
                        onChange={(e) => setNewClient(c => ({ ...c, clientTimezone: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      >
                        {TIMEZONE_OPTIONS.map(tz => (
                          <option key={tz.value} value={tz.value} className="bg-gray-900">
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Used for scheduling interviews in the client&apos;s local time</p>
                    </div>
                  </div>
                </div>

                {/* Primary Contact */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                    Primary Contact
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Contact Name</label>
                      <Input 
                        value={newClient.primaryContactName}
                        onChange={(e) => setNewClient(c => ({ ...c, primaryContactName: e.target.value }))}
                        placeholder="John Doe"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Contact Email</label>
                        <Input 
                          value={newClient.primaryContactEmail}
                          onChange={(e) => setNewClient(c => ({ ...c, primaryContactEmail: e.target.value }))}
                          placeholder="john@company.com"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Contact Phone</label>
                        <Input 
                          value={newClient.primaryContactPhone}
                          onChange={(e) => setNewClient(c => ({ ...c, primaryContactPhone: e.target.value }))}
                          placeholder="+63 XXX XXX XXXX"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Notes</label>
                  <textarea 
                    value={newClient.notes}
                    onChange={(e) => setNewClient(c => ({ ...c, notes: e.target.value }))}
                    placeholder="Any additional notes about this client..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                  />
                </div>
              </div>

              {/* Fixed footer */}
              <div className="sticky bottom-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10 p-6 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 border-white/10 text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddClient}
                  disabled={adding || !newClient.companyName.trim()}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

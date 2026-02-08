'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Building2,
  Mail,
  AlertCircle,
  Square,
  CheckSquare,
  Trash2,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { toast } from '@/components/shared/ui/toast';

interface Recruiter {
  id: string;
  userId: string;
  email: string;
  agencyId: string;
  agencyName: string;
  agencyLogo?: string;
  status: 'pending' | 'verified' | 'rejected';
  verificationStatus: string;
  isActive: boolean;
  createdAt: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  lastSignInAt?: string;
  agency?: {
    tinNumber?: string;
    dtiCertificateUrl?: string;
    businessPermitUrl?: string;
    secRegistrationUrl?: string;
    documentsUploadedAt?: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  active: number;
}

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, rejected: 0, active: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  useEffect(() => {
    fetchRecruiters();
  }, [statusFilter]);

  const fetchRecruiters = async () => {
    try {
      const response = await fetch(`/api/admin/recruiters?status=${statusFilter}`);
      const data = await response.json();

      if (response.ok) {
        setRecruiters(data.recruiters || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch recruiters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (recruiterId: string, action: 'verify' | 'reject', reason?: string) => {
    setActionLoading(recruiterId);
    try {
      const response = await fetch(`/api/admin/recruiters/${recruiterId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchRecruiters();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      toast.error('Failed to process verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Approve ${selectedIds.size} recruiter(s)?`)) return;

    setBulkLoading(true);
    try {
      const response = await fetch('/api/admin/recruiters/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterIds: Array.from(selectedIds),
          action: 'verify',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Successfully approved ${selectedIds.size} recruiter(s)`);
        setSelectedIds(new Set());
        fetchRecruiters();
      } else {
        toast.error(data.error || 'Bulk approval failed');
      }
    } catch (error) {
      toast.error('Failed to process bulk approval');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;

    if (!bulkRejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setBulkLoading(true);
    try {
      const response = await fetch('/api/admin/recruiters/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterIds: Array.from(selectedIds),
          action: 'reject',
          reason: bulkRejectReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Successfully rejected ${selectedIds.size} recruiter(s)`);
        setSelectedIds(new Set());
        setShowBulkRejectModal(false);
        setBulkRejectReason('');
        fetchRecruiters();
      } else {
        toast.error(data.error || 'Bulk rejection failed');
      }
    } catch (error) {
      toast.error('Failed to process bulk rejection');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === recruiters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recruiters.map((r) => r.id)));
    }
  };

  const toggleSelectRecruiter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string, hasDocuments: boolean = false) => {
    // Determine display based on status
    const statusConfig: Record<string, { icon: any; style: string; text: string }> = {
      verified: {
        icon: CheckCircle,
        style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        text: 'Verified',
      },
      rejected: {
        icon: XCircle,
        style: 'bg-red-500/20 text-red-400 border-red-500/30',
        text: 'Rejected',
      },
      pending_documents: {
        icon: Clock,
        style: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        text: hasDocuments ? 'Ready for Review' : 'Awaiting Documents',
      },
      pending_admin_review: {
        icon: AlertCircle,
        style: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        text: 'Ready for Review',
      },
      pending_authorization_head: {
        icon: Clock,
        style: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        text: 'Awaiting Auth Head',
      },
    };

    const config = statusConfig[status] || {
      icon: Clock,
      style: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      text: status.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    };

    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.style}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Recruiter Verification</h1>
          <p className="text-gray-400 mt-1">Review and verify recruiter applications</p>
        </div>
        <Button
          onClick={() => fetchRecruiters()}
          variant="outline"
          size="sm"
          disabled={loading}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-white/5 border-white/10' },
          { label: 'Pending', value: stats.pending, color: 'bg-orange-500/5 border-orange-500/20', highlight: true },
          { label: 'Verified', value: stats.verified, color: 'bg-emerald-500/5 border-emerald-500/20' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-500/5 border-red-500/20' },
          { label: 'Active', value: stats.active, color: 'bg-cyan-500/5 border-cyan-500/20' },
        ].map((stat) => (
          <Card key={stat.label} className={stat.color}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                </div>
                {stat.highlight && stat.value > 0 && (
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['pending', 'verified', 'rejected', 'all'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? '' : 'bg-white/5 border-white/10 text-white'}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {statusFilter === 'pending' && recruiters.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSelectAll}
              className="bg-white/5 border-white/10 text-gray-400"
            >
              {selectedIds.size === recruiters.length ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Select All
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-0 z-10"
          >
            <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <CheckSquare className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedIds.size} recruiter(s) selected</p>
                      <p className="text-gray-400 text-sm">Bulk actions available</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleBulkApprove}
                      disabled={bulkLoading}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {bulkLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Selected
                    </Button>
                    <Button
                      onClick={() => setShowBulkRejectModal(true)}
                      disabled={bulkLoading}
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Selected
                    </Button>
                    <Button
                      onClick={() => setSelectedIds(new Set())}
                      variant="ghost"
                      className="text-gray-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recruiters List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading recruiters...</p>
        </div>
      ) : recruiters.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Recruiters Found</h3>
            <p className="text-gray-400">No {statusFilter !== 'all' ? statusFilter : ''} recruiters at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recruiters.map((recruiter, index) => {
            const isSelected = selectedIds.has(recruiter.id);
            const canSelect = statusFilter === 'pending' && recruiter.status === 'pending';

            return (
              <motion.div
                key={recruiter.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className={`border-white/10 transition-all ${
                  recruiter.status === 'pending' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5'
                } ${isSelected ? 'ring-2 ring-cyan-500/50 bg-cyan-500/10' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Selection Checkbox */}
                      {canSelect && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSelectRecruiter(recruiter.id);
                          }}
                          className="flex-shrink-0 mt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-cyan-400" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400 hover:text-cyan-400 transition-colors" />
                          )}
                        </button>
                      )}

                      {/* Recruiter Info */}
                      <Link href={`/admin/recruiters/${recruiter.id}`} className="flex-1 flex items-start justify-between hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={recruiter.agencyLogo} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                              {recruiter.agencyName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-medium">{recruiter.email}</h3>
                              {getStatusBadge(
                                recruiter.verificationStatus || recruiter.status,
                                !!(recruiter.agency?.tinNumber &&
                                   recruiter.agency?.dtiCertificateUrl &&
                                   recruiter.agency?.businessPermitUrl &&
                                   recruiter.agency?.secRegistrationUrl)
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Building2 className="h-4 w-4" />
                              <span>{recruiter.agencyName}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-gray-500 text-xs">
                                Applied {new Date(recruiter.createdAt).toLocaleDateString()}
                              </p>
                              {recruiter.agency?.documentsUploadedAt && (
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Docs Ready
                                </Badge>
                              )}
                            </div>
                            {recruiter.rejectionReason && (
                              <p className="text-red-400 text-xs mt-1">
                                Rejection reason: {recruiter.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Individual Actions */}
                      {recruiter.status === 'pending' && !isSelected && (
                        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleVerification(recruiter.id, 'verify');
                            }}
                            disabled={actionLoading === recruiter.id}
                          >
                            {actionLoading === recruiter.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const reason = prompt('Rejection reason (optional):');
                              handleVerification(recruiter.id, 'reject', reason || undefined);
                            }}
                            disabled={actionLoading === recruiter.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bulk Reject Modal */}
      <AnimatePresence>
        {showBulkRejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121217] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Reject {selectedIds.size} Recruiter(s)</h3>
                  <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-gray-400 text-sm mb-2 block">Rejection Reason *</label>
                <textarea
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
                  placeholder="e.g., Invalid business documents, expired permits, etc."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleBulkReject}
                  disabled={bulkLoading || !bulkRejectReason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Confirm Rejection
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowBulkRejectModal(false);
                    setBulkRejectReason('');
                  }}
                  variant="ghost"
                  className="flex-1"
                  disabled={bulkLoading}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

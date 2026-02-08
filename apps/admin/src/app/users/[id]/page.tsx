'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Ban,
  CheckCircle,
  Trash2,
  Loader2,
  FileText,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from '@/components/shared/ui/toast';
import Link from 'next/link';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setActivity(data.activity);
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: 'ban' | 'unban' | 'delete') => {
    const confirmMessage =
      action === 'ban' ? 'Are you sure you want to ban this user?' :
      action === 'unban' ? 'Are you sure you want to unban this user?' :
      'Are you sure you want to delete this user? This action cannot be undone.';

    if (!confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchUserDetails();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (error) {
      toast.error('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  const candidate = Array.isArray(user.candidates) ? user.candidates[0] : user.candidates;
  const recruiter = Array.isArray(user.agency_recruiters) ? user.agency_recruiters[0] : user.agency_recruiters;
  const bpocUser = Array.isArray(user.bpoc_users) ? user.bpoc_users[0] : user.bpoc_users;

  const userType = bpocUser ? 'admin' : recruiter ? 'recruiter' : candidate ? 'candidate' : 'unknown';
  const isBanned = user.banned_until && new Date(user.banned_until) > new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* User Profile Card */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={candidate?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-600 text-white text-2xl">
                  {(candidate?.first_name || user.email)?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {candidate ? `${candidate.first_name} ${candidate.last_name}` : user.email?.split('@')[0]}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">{user.email}</span>
                </div>
                {candidate?.phone && (
                  <p className="text-gray-400 text-sm mt-1">{candidate.phone}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isBanned ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => handleUserAction('ban')}
                  disabled={actionLoading}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  onClick={() => handleUserAction('unban')}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Unban User
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleUserAction('delete')}
                disabled={actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-gray-500 text-sm">User Type</p>
              <Badge className="mt-1 capitalize">{userType}</Badge>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <Badge className="mt-1" variant={isBanned ? 'destructive' : 'default'}>
                {isBanned ? 'Banned' : candidate?.status || 'Active'}
              </Badge>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Joined</p>
              <p className="text-white mt-1">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Last Sign In</p>
              <p className="text-white mt-1">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info & Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recruiter Info */}
        {recruiter && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recruiter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-gray-500 text-sm">Agency</p>
                <Link
                  href={`/admin/agencies/${recruiter.agency?.id}`}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {recruiter.agency?.name || 'Unknown'}
                </Link>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Verification Status</p>
                <Badge className="mt-1" variant={recruiter.is_verified ? 'default' : 'secondary'}>
                  {recruiter.is_verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Active Status</p>
                <Badge className="mt-1" variant={recruiter.is_active ? 'default' : 'destructive'}>
                  {recruiter.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity */}
        {activity && activity.applicationCount > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-cyan-400" />
                Recent Applications ({activity.applicationCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.applications.slice(0, 5).map((app: any) => (
                <div key={app.id} className="p-3 bg-white/5 rounded-lg">
                  <p className="text-white text-sm font-medium">{app.job?.title || 'Unknown Job'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge className="text-xs">{app.status}</Badge>
                    <span className="text-gray-500 text-xs">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin Notes */}
      {notes.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              Admin Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white font-medium">{note.admin_name}</p>
                  <span className="text-gray-500 text-xs">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{note.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

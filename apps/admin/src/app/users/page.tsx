'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  UserCircle,
  Shield,
  Briefcase,
  Ban,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  userType: 'candidate' | 'recruiter' | 'admin' | 'unknown';
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  createdAt: string;
  lastSignInAt?: string;
  metadata: Record<string, any>;
}

interface Stats {
  total: number;
  candidates: number;
  recruiters: number;
  admins: number;
  active: number;
  suspended: number;
  banned: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    candidates: 0,
    recruiters: 0,
    admins: 0,
    active: 0,
    suspended: 0,
    banned: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?search=${searchQuery}&userType=${userTypeFilter}&status=${statusFilter}`
      );
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userTypeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'candidate': return <UserCircle className="h-4 w-4 text-cyan-400" />;
      case 'recruiter': return <Briefcase className="h-4 w-4 text-purple-400" />;
      case 'admin': return <Shield className="h-4 w-4 text-red-400" />;
      default: return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      suspended: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      banned: 'bg-red-500/20 text-red-400 border-red-500/30',
      deleted: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return (
      <Badge variant="outline" className={styles[status] || styles.active}>
        {status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'banned' && <Ban className="h-3 w-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  const getUserTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      candidate: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      recruiter: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <Badge variant="outline" className={styles[type] || 'bg-white/5 text-gray-400 border-white/10'}>
        {getUserTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage all platform users, view activity, and control access</p>
        </div>
        <Button
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          onClick={() => {
            window.location.href = `/api/admin/export/users?userType=${userTypeFilter}&status=${statusFilter}`;
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-7 gap-3">
        {[
          { label: 'Total Users', value: stats.total, color: 'bg-white/5 border-white/10' },
          { label: 'Candidates', value: stats.candidates, color: 'bg-cyan-500/5 border-cyan-500/20' },
          { label: 'Recruiters', value: stats.recruiters, color: 'bg-purple-500/5 border-purple-500/20' },
          { label: 'Admins', value: stats.admins, color: 'bg-red-500/5 border-red-500/20' },
          { label: 'Active', value: stats.active, color: 'bg-emerald-500/5 border-emerald-500/20' },
          { label: 'Suspended', value: stats.suspended, color: 'bg-orange-500/5 border-orange-500/20' },
          { label: 'Banned', value: stats.banned, color: 'bg-red-500/5 border-red-500/20' },
        ].map((stat) => (
          <Card key={stat.label} className={stat.color}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, agency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="all">All Types</option>
          <option value="candidate">Candidates</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Users Found</h3>
            <p className="text-gray-400">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-600 text-white">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate">{user.name}</h3>
                          {getUserTypeBadge(user.userType)}
                          {getStatusBadge(user.status)}
                        </div>
                        <p className="text-gray-400 text-sm truncate">{user.email}</p>
                        {user.userType === 'recruiter' && user.metadata.agencyName && (
                          <p className="text-gray-500 text-xs mt-1">
                            Agency: <span className="text-purple-400">{user.metadata.agencyName}</span>
                            {user.metadata.isVerified && (
                              <CheckCircle className="inline h-3 w-3 ml-1 text-emerald-400" />
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="text-right">
                        <p className="text-xs">Joined</p>
                        <p className="text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      {user.lastSignInAt && (
                        <div className="text-right">
                          <p className="text-xs">Last Sign In</p>
                          <p className="text-white">{new Date(user.lastSignInAt).toLocaleDateString()}</p>
                        </div>
                      )}
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
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
    </div>
  );
}

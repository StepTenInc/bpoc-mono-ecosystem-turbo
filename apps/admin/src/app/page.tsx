'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  href?: string;
  color: 'cyan' | 'purple' | 'emerald' | 'orange' | 'red';
}

const StatCard = ({ title, value, change, icon: Icon, href, color }: StatCardProps) => {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
  };

  const content = (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClasses[color]} p-6 transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-xl md:text-3xl font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(change)}% from last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-white/5`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].split(' ').pop()}`} />
        </div>
      </div>
      {href && (
        <div className="absolute bottom-3 right-3">
          <ArrowUpRight className="h-4 w-4 text-gray-500" />
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

interface ActivityItem {
  id: string;
  type: 'signup' | 'application' | 'interview' | 'offer' | 'job';
  message: string;
  time: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalAgencies: 0,
    activeJobs: 0,
    pendingApplications: 0,
    scheduledInterviews: 0,
    pendingOffers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<Array<{ type: string; severity: 'warning' | 'error' | 'info'; message: string; count: number; href: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        const data = await response.json();
        
        if (response.ok) {
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
          setAlerts(data.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'signup': return <Users className="h-4 w-4 text-cyan-400" />;
      case 'application': return <FileText className="h-4 w-4 text-purple-400" />;
      case 'interview': return <Calendar className="h-4 w-4 text-orange-400" />;
      case 'offer': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'job': return <Briefcase className="h-4 w-4 text-red-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome to the BPOC Admin Panel</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const styles = {
              error: 'bg-red-500/10 border-red-500/30 text-red-400',
              warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
              info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
            };
            const icons = {
              error: AlertCircle,
              warning: ShieldAlert,
              info: AlertTriangle,
            };
            const Icon = icons[alert.severity];
            return (
              <Link key={i} href={alert.href}>
                <div className={`${styles[alert.severity]} border rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 font-medium text-sm">{alert.message}</span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <StatCard
          title="Total Candidates"
          value={stats.totalCandidates.toLocaleString()}
          change={12}
          icon={Users}
          href="/admin/candidates"
          color="cyan"
        />
        <StatCard
          title="Agencies"
          value={stats.totalAgencies}
          change={5}
          icon={Building2}
          href="/admin/agencies"
          color="purple"
        />
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          change={-3}
          icon={Briefcase}
          href="/admin/jobs"
          color="emerald"
        />
        <StatCard
          title="Applications"
          value={stats.pendingApplications}
          change={18}
          icon={FileText}
          href="/admin/applications"
          color="orange"
        />
        <StatCard
          title="Interviews"
          value={stats.scheduledInterviews}
          icon={Calendar}
          href="/admin/interviews"
          color="red"
        />
        <StatCard
          title="Pending Offers"
          value={stats.pendingOffers}
          icon={CheckCircle}
          href="/admin/offers"
          color="cyan"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-white/5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{activity.message}</p>
                      <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/admin/jobs?action=new"
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all text-white"
              >
                <Briefcase className="h-5 w-5 text-red-400" />
                <span>Post New Job</span>
              </Link>
              <Link
                href="/admin/candidates"
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition-all text-white"
              >
                <Users className="h-5 w-5 text-cyan-400" />
                <span>View Candidates</span>
              </Link>
              <Link
                href="/admin/interviews"
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 border border-transparent transition-all text-white"
              >
                <Calendar className="h-5 w-5 text-orange-400" />
                <span>Manage Interviews</span>
              </Link>
              <Link
                href="/admin/applications?status=pending"
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent transition-all text-white"
              >
                <AlertCircle className="h-5 w-5 text-purple-400" />
                <span>Review Applications</span>
              </Link>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">API Status</span>
                <span className="flex items-center gap-2 text-emerald-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Database</span>
                <span className="flex items-center gap-2 text-emerald-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Last Backup</span>
                <span className="text-gray-400 text-sm">2 hours ago</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}


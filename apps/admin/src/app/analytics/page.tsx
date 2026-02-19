'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  FileText,
  Target,
  Trophy,
  Calendar,
  Loader2,
  Download,
  Filter,
  ChevronDown,
  Building2,
  UserCheck,
  Award,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import { getSessionToken } from '@/lib/auth-helpers';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface OverviewData {
  totalCandidates: number;
  totalApplications: number;
  applicationsThisMonth: number;
  totalJobs: number;
  jobsThisMonth: number;
  totalPlacements: number;
  successRate: number;
  avgTimeToHire: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
  dropoff: number;
}

interface FunnelData {
  funnel: FunnelStage[];
  overallConversionRate: number;
}

interface TimeSeriesPoint {
  date: string;
  applications: number;
  placements: number;
  label: string;
}

interface TopPerformersData {
  topJobsByApplications: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    agency: string;
    applications: number;
    placements: number;
  }>;
  topJobsByPlacements: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    agency: string;
    applications: number;
    placements: number;
  }>;
  topRecruitersByPlacements: Array<{
    recruiterId: string;
    recruiterName: string;
    placements: number;
  }>;
  topAgenciesByActivity: Array<{
    agencyId: string;
    agencyName: string;
    jobs: number;
    applications: number;
    placements: number;
    totalActivity: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformersData | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    fetchAllAnalytics();
  }, [period]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const token = await getSessionToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [overviewRes, funnelRes, timeSeriesRes, topPerformersRes] = await Promise.all([
        fetch(`/api/analytics/overview?period=${period}`, { headers }),
        fetch(`/api/analytics/funnel?period=${period}`, { headers }),
        fetch(`/api/analytics/time-series?period=${period}`, { headers }),
        fetch(`/api/analytics/top-performers?period=${period}`, { headers }),
      ]);

      const [overviewData, funnelData, timeSeriesData, topPerformersData] = await Promise.all([
        overviewRes.json(),
        funnelRes.json(),
        timeSeriesRes.json(),
        topPerformersRes.json(),
      ]);

      setOverview(overviewData);
      setFunnel(funnelData);
      setTimeSeries(timeSeriesData.timeSeries || []);
      setTopPerformers(topPerformersData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async (type: 'applications' | 'placements' | 'recruiters') => {
    setExportingCSV(true);
    try {
      const token = await getSessionToken();

      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      if (type === 'applications' && topPerformers) {
        data = topPerformers.topJobsByApplications;
        filename = 'top-jobs-by-applications.csv';
        headers = ['Job Title', 'Company', 'Agency', 'Applications', 'Placements'];
      } else if (type === 'placements' && topPerformers) {
        data = topPerformers.topJobsByPlacements;
        filename = 'top-jobs-by-placements.csv';
        headers = ['Job Title', 'Company', 'Agency', 'Applications', 'Placements'];
      } else if (type === 'recruiters' && topPerformers) {
        data = topPerformers.topRecruitersByPlacements;
        filename = 'top-recruiters-by-placements.csv';
        headers = ['Recruiter Name', 'Placements'];
      }

      // Generate CSV
      let csvContent = headers.join(',') + '\n';

      if (type === 'applications' || type === 'placements') {
        data.forEach(item => {
          csvContent += `"${item.jobTitle}","${item.company}","${item.agency}",${item.applications},${item.placements}\n`;
        });
      } else if (type === 'recruiters') {
        data.forEach(item => {
          csvContent += `"${item.recruiterName}",${item.placements}\n`;
        });
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setExportingCSV(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case '7': return 'Last 7 Days';
      case '30': return 'Last 30 Days';
      case '90': return 'Last 90 Days';
      case 'all': return 'All Time';
      default: return 'Last 30 Days';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const FUNNEL_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Comprehensive recruitment metrics and insights</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10">
                <Calendar className="h-4 w-4 mr-2" />
                {getPeriodLabel()}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0f] border-white/10">
              <DropdownMenuItem onClick={() => setPeriod('7')} className="text-gray-300 hover:text-white cursor-pointer">Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('30')} className="text-gray-300 hover:text-white cursor-pointer">Last 30 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('90')} className="text-gray-300 hover:text-white cursor-pointer">Last 90 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('all')} className="text-gray-300 hover:text-white cursor-pointer">All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40" disabled={exportingCSV}>
                <Download className="h-4 w-4 mr-2" />
                {exportingCSV ? 'Exporting...' : 'Export CSV'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0f] border-white/10">
              <DropdownMenuItem onClick={() => exportToCSV('applications')} className="text-gray-300 hover:text-white cursor-pointer">Top Jobs (Applications)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('placements')} className="text-gray-300 hover:text-white cursor-pointer">Top Jobs (Placements)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('recruiters')} className="text-gray-300 hover:text-white cursor-pointer">Top Recruiters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          icon={Users}
          label="Total Candidates"
          value={overview?.totalCandidates || 0}
          color="from-cyan-500/20 to-blue-600/10"
          iconColor="text-cyan-400"
          borderColor="border-cyan-500/30"
        />
        <MetricCard
          icon={FileText}
          label="Applications (This Month)"
          value={overview?.applicationsThisMonth || 0}
          color="from-purple-500/20 to-pink-600/10"
          iconColor="text-purple-400"
          borderColor="border-purple-500/30"
          subtitle={`${overview?.totalApplications || 0} total`}
        />
        <MetricCard
          icon={Briefcase}
          label="Jobs (This Month)"
          value={overview?.jobsThisMonth || 0}
          color="from-orange-500/20 to-amber-600/10"
          iconColor="text-orange-400"
          borderColor="border-orange-500/30"
          subtitle={`${overview?.totalJobs || 0} total`}
        />
        <MetricCard
          icon={Trophy}
          label="Total Placements (Hired)"
          value={overview?.totalPlacements || 0}
          color="from-emerald-500/20 to-green-600/10"
          iconColor="text-emerald-400"
          borderColor="border-emerald-500/30"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/20">
                <Target className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-4xl font-bold text-white">{overview?.successRate || 0}%</p>
                <p className="text-gray-400 mt-1">Success Rate (Hired / Applications)</p>
              </div>
            </div>
            {overview && overview.successRate > 0 && (
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Calendar className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <p className="text-4xl font-bold text-white">{overview?.avgTimeToHire || 0}</p>
                <p className="text-gray-400 mt-1">Average Time to Hire (Days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            Recruitment Funnel
            {funnel && (
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {funnel.overallConversionRate}% Overall Conversion
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {funnel && funnel.funnel.length > 0 ? (
            <div className="space-y-4">
              {funnel.funnel.map((stage, index) => (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-20 md:w-32 text-right flex-shrink-0">
                      <p className="text-xs md:text-sm font-medium text-gray-400">{stage.stage}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="relative h-10 md:h-12 bg-white/5 rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.conversionRate}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-full flex items-center px-4"
                          style={{
                            background: `linear-gradient(to right, ${FUNNEL_COLORS[index]}, ${FUNNEL_COLORS[index]}99)`,
                          }}
                        >
                          <span className="text-white font-bold text-sm">{stage.count}</span>
                        </motion.div>
                      </div>
                    </div>
                    <div className="w-24 text-left">
                      <p className="text-sm font-medium text-white">{stage.conversionRate}%</p>
                      {stage.dropoff > 0 && (
                        <p className="text-xs text-gray-500">-{stage.dropoff} dropped</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500">No funnel data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Applications Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="label"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-400" />
              Placements Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="label"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="placements"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Jobs by Applications */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-cyan-400" />
              Top 10 Jobs by Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topPerformers && topPerformers.topJobsByApplications.length > 0 ? (
              <div className="divide-y divide-white/10">
                {topPerformers.topJobsByApplications.map((job, index) => (
                  <div key={job.jobId} className="p-4 hover:bg-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">{job.jobTitle}</p>
                        <p className="text-sm text-gray-400">{job.company}</p>
                        <p className="text-xs text-gray-500">{job.agency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-cyan-400">{job.applications}</p>
                        <p className="text-xs text-gray-500">{job.placements} placed</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Jobs by Placements */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-400" />
              Top 10 Jobs by Placements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topPerformers && topPerformers.topJobsByPlacements.length > 0 ? (
              <div className="divide-y divide-white/10">
                {topPerformers.topJobsByPlacements.map((job, index) => (
                  <div key={job.jobId} className="p-4 hover:bg-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">{job.jobTitle}</p>
                        <p className="text-sm text-gray-400">{job.company}</p>
                        <p className="text-xs text-gray-500">{job.agency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">{job.placements}</p>
                        <p className="text-xs text-gray-500">{job.applications} apps</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Recruiters */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-400" />
              Top 10 Recruiters by Placements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topPerformers && topPerformers.topRecruitersByPlacements.length > 0 ? (
              <div className="divide-y divide-white/10">
                {topPerformers.topRecruitersByPlacements.map((recruiter, index) => (
                  <div key={recruiter.recruiterId} className="p-4 hover:bg-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-amber-600/20 text-amber-500' :
                          'bg-white/10 text-gray-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <p className="font-medium text-white">{recruiter.recruiterName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-400">{recruiter.placements}</p>
                        <p className="text-xs text-gray-500">placements</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Agencies */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-400" />
              Top 10 Agencies by Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topPerformers && topPerformers.topAgenciesByActivity.length > 0 ? (
              <div className="divide-y divide-white/10">
                {topPerformers.topAgenciesByActivity.map((agency, index) => (
                  <div key={agency.agencyId} className="p-4 hover:bg-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">{agency.agencyName}</p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          <span>{agency.jobs} jobs</span>
                          <span>{agency.applications} apps</span>
                          <span>{agency.placements} placed</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-400">{agency.totalActivity}</p>
                        <p className="text-xs text-gray-500">activity</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  iconColor: string;
  borderColor: string;
  subtitle?: string;
}

function MetricCard({ icon: Icon, label, value, color, iconColor, borderColor, subtitle }: MetricCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`relative overflow-hidden bg-gradient-to-br ${color} ${borderColor} hover:border-opacity-70 transition-all group`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="relative z-10 p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Icon className={`h-6 w-6 md:h-8 md:w-8 ${iconColor}`} />
          </div>
          <p className="text-2xl md:text-4xl font-bold text-white">{value}</p>
          <p className="text-gray-400 mt-1 text-xs md:text-base">{label}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Users,
  CheckCircle,
  MousePointerClick,
  XCircle,
  MailX,
  Loader2
} from 'lucide-react';

interface Analytics {
  overview: {
    totalContacts: number;
    registeredContacts: number;
    validEmails: number;
    unsubscribed: number;
    totalEmailsSent: number;
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
  };
  emailStats: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalFailed: number;
    deliveryRate: string;
    openRate: string;
    clickRate: string;
    bounceRate: string;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    sent_count: number;
    opened_count: number;
    clicked_count: number;
  }>;
  recentActivity: Array<{
    id: string;
    event_type: string;
    to_email: string;
    created_at: string;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/outbound/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load analytics</p>
      </div>
    );
  }

  const overviewStats = [
    {
      label: 'Total Contacts',
      value: analytics.overview.totalContacts.toLocaleString(),
      change: null,
      icon: Users,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Total Emails Sent',
      value: analytics.overview.totalEmailsSent.toLocaleString(),
      change: null,
      icon: Mail,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Registered Users',
      value: analytics.overview.registeredContacts.toLocaleString(),
      change: `${((analytics.overview.registeredContacts / analytics.overview.totalContacts) * 100).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Unsubscribed',
      value: analytics.overview.unsubscribed.toLocaleString(),
      change: `${((analytics.overview.unsubscribed / analytics.overview.totalContacts) * 100).toFixed(1)}%`,
      icon: MailX,
      color: 'from-gray-500 to-gray-600',
    },
  ];

  const performanceStats = [
    {
      label: 'Delivery Rate',
      value: `${analytics.emailStats.deliveryRate}%`,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Open Rate',
      value: `${analytics.emailStats.openRate}%`,
      icon: Mail,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Click Rate',
      value: `${analytics.emailStats.clickRate}%`,
      icon: MousePointerClick,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      label: 'Bounce Rate',
      value: `${analytics.emailStats.bounceRate}%`,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Email Analytics</h1>
        <p className="text-gray-400">Detailed performance metrics and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <span>{stat.change} of total</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-6">Email Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {performanceStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className={`w-16 h-16 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-300">{analytics.emailStats.totalSent.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Total Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{analytics.emailStats.totalOpened.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Opened</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{analytics.emailStats.totalClicked.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Clicked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{analytics.emailStats.totalBounced.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Bounced</p>
          </div>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center">
          <p className="text-3xl font-bold text-white">{analytics.overview.totalCampaigns}</p>
          <p className="text-gray-400 mt-2">Total Campaigns</p>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center">
          <p className="text-3xl font-bold text-yellow-400">{analytics.overview.activeCampaigns}</p>
          <p className="text-gray-400 mt-2">Active Campaigns</p>
        </div>
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center">
          <p className="text-3xl font-bold text-green-400">{analytics.overview.completedCampaigns}</p>
          <p className="text-gray-400 mt-2">Completed</p>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Top Performing Campaigns</h2>
        {analytics.topCampaigns && analytics.topCampaigns.length > 0 ? (
          <div className="space-y-3">
            {analytics.topCampaigns.slice(0, 5).map((campaign, index) => {
              const openRate = campaign.sent_count > 0 ? (campaign.opened_count / campaign.sent_count) * 100 : 0;
              const clickRate = campaign.sent_count > 0 ? (campaign.clicked_count / campaign.sent_count) * 100 : 0;

              return (
                <div key={campaign.id} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{campaign.name}</p>
                    <p className="text-sm text-gray-400">
                      {campaign.sent_count.toLocaleString()} sent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-400">{openRate.toFixed(1)}% opens</p>
                    <p className="text-sm text-purple-400">{clickRate.toFixed(1)}% clicks</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-6">No campaigns yet</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analytics.recentActivity.map((activity) => {
              const eventConfig: Record<string, { label: string; color: string; icon: any }> = {
                sent: { label: 'Email Sent', color: 'text-blue-400', icon: Mail },
                delivered: { label: 'Delivered', color: 'text-green-400', icon: CheckCircle },
                opened: { label: 'Email Opened', color: 'text-purple-400', icon: Mail },
                clicked: { label: 'Link Clicked', color: 'text-cyan-400', icon: MousePointerClick },
                bounced: { label: 'Bounced', color: 'text-red-400', icon: XCircle },
                unsubscribed: { label: 'Unsubscribed', color: 'text-gray-400', icon: MailX },
              };

              const config = eventConfig[activity.event_type] || eventConfig.sent;
              const Icon = config.icon;

              return (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  <span className="text-sm text-gray-400">{activity.to_email}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(activity.created_at).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-6">No recent activity</p>
        )}
      </div>
    </div>
  );
}

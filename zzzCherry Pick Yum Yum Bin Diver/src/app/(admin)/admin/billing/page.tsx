'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Trophy,
  Calendar,
  Download,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      const response = await fetch(`/api/admin/billing/revenue?period=${period}`);
      const result = await response.json();
      if (response.ok) setData(result);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const summary = data?.summary || { totalPlacements: 0, totalRevenue: 0, avgCommissionPerPlacement: 0 };
  const monthlyTrend = data?.monthlyTrend || [];
  const revenueByAgency = data?.revenueByAgency || [];
  const recentPlacements = data?.recentPlacements || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Revenue & Billing</h1>
          <p className="text-gray-400 mt-1">Track placement commissions and revenue metrics</p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10">
                <Calendar className="h-4 w-4 mr-2" />
                {period === 'month' ? 'This Month' : period === 'quarter' ? 'This Quarter' : period === 'year' ? 'This Year' : 'All Time'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0f] border-white/10">
              <DropdownMenuItem onClick={() => setPeriod('month')} className="text-gray-300 hover:text-white cursor-pointer">This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('quarter')} className="text-gray-300 hover:text-white cursor-pointer">This Quarter</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('year')} className="text-gray-300 hover:text-white cursor-pointer">This Year</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('all')} className="text-gray-300 hover:text-white cursor-pointer">All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
            onClick={() => {
              window.location.href = `/api/admin/export/revenue?period=${period}`;
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-600/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-4xl font-bold text-white">{formatCurrency(summary.totalRevenue)}</p>
            <p className="text-gray-400 mt-1">Total Commission Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-green-600/10 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-4xl font-bold text-white">{summary.totalPlacements}</p>
            <p className="text-gray-400 mt-1">Successful Placements</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-cyan-400" />
            </div>
            <p className="text-4xl font-bold text-white">{formatCurrency(summary.avgCommissionPerPlacement)}</p>
            <p className="text-gray-400 mt-1">Avg. Commission Per Placement</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No revenue data yet</p>
                  <p className="text-gray-600 text-sm mt-1">Data will appear here when placements are made</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placements Trend */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Placements by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Bar dataKey="placements" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No placements yet</p>
                  <p className="text-gray-600 text-sm mt-1">Placement data will appear here over time</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agency Revenue & Recent Placements */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Agencies by Revenue */}
        <div className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-cyan-400" />
                Revenue by Agency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenueByAgency.slice(0, 5).map((agency: any, i: number) => (
                  <motion.div
                    key={agency.agencyId || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        i === 1 ? 'bg-gray-400/20 text-gray-300' :
                        i === 2 ? 'bg-amber-600/20 text-amber-500' :
                        'bg-white/10 text-gray-400'
                      }`}>
                        #{i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{agency.agencyName}</p>
                        <p className="text-sm text-gray-500">{agency.placements} placements</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-400">{formatCurrency(agency.totalCommission)}</p>
                      <p className="text-xs text-gray-500">Avg: {formatCurrency(agency.avgCommission)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Placements */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Recent Placements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPlacements.slice(0, 5).map((placement: any, i: number) => (
                <motion.div
                  key={placement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 bg-white/5 rounded-lg"
                >
                  <p className="font-medium text-white text-sm">{placement.candidateName}</p>
                  <p className="text-xs text-gray-400 mt-1">{placement.jobTitle}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{placement.agencyName}</span>
                    <span className="text-sm font-medium text-emerald-400">
                      {formatCurrency(placement.commission)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

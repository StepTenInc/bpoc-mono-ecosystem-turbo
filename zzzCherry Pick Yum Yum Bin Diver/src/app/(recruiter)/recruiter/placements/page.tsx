'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Search, Calendar, DollarSign, Building2, User, Loader2,
  CheckCircle, Clock, FileText, Briefcase, PartyPopper, 
  TrendingUp, Award, ChevronRight, Download, Crown, Medal, Send
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { CelebrationEffect } from '@/components/shared/ui/celebration-effect';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/shared/ui/toast';

interface Placement {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  salary: number;
  currency: string;
  startDate?: string;
  status: string;
  hiredAt: string;
  applicationId: string;
  offerId: string;
  recruiterId?: string;
  recruiterName?: string;
}

interface LeaderboardEntry {
  recruiterId: string;
  recruiterName: string;
  recruiterAvatar?: string;
  placementCount: number;
  totalRevenue: number;
}

export default function PlacementsPage() {
  const { user } = useAuth();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [newPlacementId, setNewPlacementId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchPlacements();
  }, [user?.id]);

  // Check for new placements to celebrate
  useEffect(() => {
    const lastSeenCount = parseInt(localStorage.getItem('last-placement-count') || '0');
    if (placements.length > lastSeenCount && lastSeenCount > 0) {
      setShowCelebration(true);
      setNewPlacementId(placements[0]?.id || null);
      localStorage.setItem('last-placement-count', String(placements.length));
    } else if (placements.length > 0) {
      localStorage.setItem('last-placement-count', String(placements.length));
    }
  }, [placements]);

  const fetchPlacements = async () => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/placements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
        }
      });
      const data = await response.json();
      if (response.ok) setPlacements(data.placements || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendContract = async (applicationId: string, candidateName: string) => {
    try {
      const token = await getSessionToken();
      const response = await fetch('/api/recruiter/send-contract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user?.id || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ applicationId })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Contract sent to ${candidateName}!`);
        fetchPlacements(); // Refresh to show updated status
      } else {
        toast.error(data.error || 'Failed to send contract');
      }
    } catch (error) {
      console.error('Failed to send contract:', error);
      toast.error('Failed to send contract');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'PHP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const hired = new Date(date);
    const diffDays = Math.floor((now.getTime() - hired.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const exportToCSV = () => {
    const headers = ['Candidate', 'Job Title', 'Client', 'Salary', 'Currency', 'Start Date', 'Hired Date'];
    const rows = placements.map(p => [
      p.candidateName,
      p.jobTitle,
      p.clientName,
      p.salary,
      p.currency,
      p.startDate || '',
      p.hiredAt,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Placements exported to CSV');
  };

  const filtered = placements.filter(p =>
    (p.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.clientName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalPlacements = placements.length;
  const thisMonth = placements.filter(p => {
    const hired = new Date(p.hiredAt);
    const now = new Date();
    return hired.getMonth() === now.getMonth() && hired.getFullYear() === now.getFullYear();
  }).length;
  const totalRevenue = placements.reduce((acc, p) => acc + (p.salary || 0), 0);
  const avgSalary = totalPlacements > 0 ? totalRevenue / totalPlacements : 0;

  // Generate leaderboard from placements
  const leaderboard: LeaderboardEntry[] = Object.values(
    placements.reduce((acc, p) => {
      const id = p.recruiterId || 'unknown';
      if (!acc[id]) {
        acc[id] = {
          recruiterId: id,
          recruiterName: p.recruiterName || 'You',
          placementCount: 0,
          totalRevenue: 0,
        };
      }
      acc[id].placementCount++;
      acc[id].totalRevenue += p.salary || 0;
      return acc;
    }, {} as Record<string, LeaderboardEntry>)
  ).sort((a, b) => b.placementCount - a.placementCount);

  return (
    <div className="space-y-6">
      {/* Celebration Effect */}
      <CelebrationEffect 
        trigger={showCelebration} 
        onComplete={() => setShowCelebration(false)}
        particleCount={80}
        duration={4000}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            Placements
          </h1>
          <p className="text-gray-400 mt-1">Track successful hires and celebrate wins 🎉</p>
        </div>
        <Button
          onClick={exportToCSV}
          variant="outline"
          className="border-white/10 text-gray-400 hover:text-white"
          disabled={placements.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 backdrop-blur-xl border-yellow-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Total
                </Badge>
              </div>
              <p className="text-3xl font-bold text-white">{totalPlacements}</p>
              <p className="text-gray-400 text-sm">Placements</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 backdrop-blur-xl border-emerald-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  This Month
                </Badge>
              </div>
              <p className="text-3xl font-bold text-white">{thisMonth}</p>
              <p className="text-gray-400 text-sm">New Hires</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-xl border-purple-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-purple-400" />
                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Revenue
                </Badge>
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(totalRevenue, 'PHP')}</p>
              <p className="text-gray-400 text-sm">Total Salaries</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 backdrop-blur-xl border-cyan-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-6 w-6 text-cyan-400" />
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  Average
                </Badge>
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(avgSalary, 'PHP')}</p>
              <p className="text-gray-400 text-sm">Avg. Salary</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                Top Recruiters Leaderboard
              </h2>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div
                    key={entry.recruiterId}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                      index === 1 ? 'bg-gray-500/10 border border-gray-500/30' :
                      index === 2 ? 'bg-amber-700/10 border border-amber-700/30' :
                      'bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-600 text-black' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      {index === 0 ? <Crown className="h-4 w-4" /> :
                       index < 3 ? <Medal className="h-4 w-4" /> :
                       index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.recruiterAvatar} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                        {entry.recruiterName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-white font-medium">{entry.recruiterName}</p>
                      <p className="text-gray-400 text-sm">{entry.placementCount} placements</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">{formatCurrency(entry.totalRevenue, 'PHP')}</p>
                      <p className="text-gray-500 text-xs">Total revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search placements..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="pl-10 bg-white/5 border-white/10 text-white" 
        />
      </div>

      {/* Placements List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-orange-400 animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-12 text-center">
            <PartyPopper className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Placements Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              When candidates accept offers and get hired, they'll appear here.
              Keep sending those offers!
            </p>
            <Link href="/recruiter/offers">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
                View Pending Offers
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((placement, i) => {
              const isNew = placement.id === newPlacementId;
              
              return (
                <motion.div
                  key={placement.id}
                  initial={{ opacity: 0, y: 20, scale: isNew ? 1.02 : 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className={`
                    bg-white/5 backdrop-blur-xl border-white/10 
                    hover:border-emerald-500/30 transition-all overflow-hidden
                    ${isNew ? 'ring-2 ring-yellow-500/50 bg-yellow-500/5' : ''}
                  `}>
                    {/* New badge */}
                    {isNew && (
                      <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-3 py-1 text-center">
                        🎉 NEW PLACEMENT!
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <div className="flex items-start gap-5">
                        {/* Avatar with badge */}
                        <div className="relative">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={placement.candidateAvatar} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xl">
                              {placement.candidateName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                            <CheckCircle className="h-4 w-4 text-black" />
                          </div>
                        </div>

                        {/* Main Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-white">{placement.candidateName}</h3>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Hired!
                                </Badge>
                              </div>
                              <p className="text-lg text-orange-400">{placement.jobTitle}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">
                                {formatCurrency(placement.salary, placement.currency)}
                              </p>
                              <p className="text-gray-400 text-sm">per month</p>
                            </div>
                          </div>

                          {/* Details Row */}
                          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Building2 className="h-4 w-4" />
                              <span>{placement.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>Hired {getTimeAgo(placement.hiredAt)}</span>
                            </div>
                            {placement.startDate && (
                              <div className="flex items-center gap-2 text-emerald-400">
                                <Clock className="h-4 w-4" />
                                <span>Starts {new Date(placement.startDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 mt-4">
                            <Link href={`/recruiter/talent/${placement.candidateId}`}>
                              <Button size="sm" variant="outline" className="border-white/10 text-gray-400 hover:text-white">
                                <User className="h-4 w-4 mr-1" />
                                Profile
                              </Button>
                            </Link>
                            <Link href={`/recruiter/clients/${placement.clientId}`}>
                              <Button size="sm" variant="outline" className="border-white/10 text-gray-400 hover:text-white">
                                <Building2 className="h-4 w-4 mr-1" />
                                Client
                              </Button>
                            </Link>
                            <Link href={`/recruiter/contracts/${placement.applicationId}`}>
                              <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                                <FileText className="h-4 w-4 mr-1" />
                                View Contract
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                              onClick={() => sendContract(placement.applicationId, placement.candidateName)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send Contract
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

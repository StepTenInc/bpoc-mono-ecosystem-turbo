'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Users,
  MapPin,
  Briefcase,
  Star,
  Eye,
  Mail,
  FileText,
  Loader2,
  ChevronDown,
  X,
  Video,
  Brain,
  Sparkles,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  SlidersHorizontal,
  Zap,
  Award,
  Clock,
  Target,
  Download,
} from 'lucide-react';
import { VideoCallButton } from '@/components/video';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import Link from 'next/link';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  experienceYears?: number;
  skills: string[];
  hasResume: boolean;
  hasAiAnalysis: boolean;
  matchScore?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  lastActive?: string;
}

const skillOptions = [
  'Virtual Assistant', 'Customer Service', 'Data Entry', 'Social Media',
  'Bookkeeping', 'Project Management', 'Sales', 'Marketing',
  'Real Estate', 'E-commerce', 'Healthcare', 'Travel'
];

export default function TalentPoolPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [savedCandidates, setSavedCandidates] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'experience'>('match');
  const [filters, setFilters] = useState({
    experienceMin: '',
    experienceMax: '',
    hasResume: false,
    hasAiAnalysis: false,
  });

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (selectedSkills.length) params.set('skills', selectedSkills.join(','));
        if (filters.hasResume) params.set('hasResume', 'true');
        if (filters.hasAiAnalysis) params.set('hasAiAnalysis', 'true');

        const response = await fetch(`/api/recruiter/talent?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setCandidates(data.candidates || []);
        }
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedSkills, filters]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleSave = (candidateId: string) => {
    setSavedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const getSortedCandidates = () => {
    const sorted = [...candidates];
    switch (sortBy) {
      case 'match':
        return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      case 'recent':
        return sorted; // Already sorted by recent
      case 'experience':
        return sorted.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
      default:
        return sorted;
    }
  };

  const sortedCandidates = getSortedCandidates();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Talent Pool
          </motion.h1>
          <motion.p
            className="text-gray-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Discover pre-vetted candidates with AI-powered matching
          </motion.p>
        </div>
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="border-white/10 text-gray-400 hover:text-white"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {viewMode === 'grid' ? 'List' : 'Grid'} View
          </Button>
        </motion.div>
      </div>

      {/* AI Suggestions Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-purple-500/10 backdrop-blur-xl border-purple-500/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  AI-Powered Matching
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Zap className="h-3 w-3 mr-1" />
                    Beta
                  </Badge>
                </h3>
                <p className="text-gray-400 text-sm">
                  Our AI analyzes skills, experience, and personality traits to find your perfect match
                </p>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25">
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, skills, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 bg-white/5 border-white/10 text-white text-lg placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`min-w-[140px] border-white/10 transition-all ${
                  showFilters
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                    : 'text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white min-w-[160px] focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="match">Best Match</option>
                <option value="recent">Recently Added</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>

            {/* Quick Skill Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {skillOptions.map((skill) => (
                <motion.button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedSkills.includes(skill)
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/20'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {skill}
                </motion.button>
              ))}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-white/10 overflow-hidden"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2 font-medium">Min Experience</label>
                      <Input
                        type="number"
                        placeholder="0 years"
                        value={filters.experienceMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, experienceMin: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2 font-medium">Max Experience</label>
                      <Input
                        type="number"
                        placeholder="10+ years"
                        value={filters.experienceMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, experienceMax: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.hasResume}
                          onChange={(e) => setFilters(prev => ({ ...prev, hasResume: e.target.checked }))}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-orange-500 checked:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">Has Resume</span>
                      </label>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.hasAiAnalysis}
                          onChange={(e) => setFilters(prev => ({ ...prev, hasAiAnalysis: e.target.checked }))}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-orange-500 checked:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">AI Analyzed</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filters */}
            {selectedSkills.length > 0 && (
              <div className="flex items-center gap-2 pt-4 border-t border-white/10 mt-4">
                <span className="text-gray-400 text-sm font-medium">Active filters:</span>
                {selectedSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="bg-orange-500/10 text-orange-400 border-orange-500/30 group cursor-pointer hover:bg-orange-500/20 transition-all"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                    <X className="h-3 w-3 ml-1 group-hover:text-orange-300" />
                  </Badge>
                ))}
                <button
                  onClick={() => setSelectedSkills([])}
                  className="text-gray-500 text-sm hover:text-white transition-colors ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <motion.p
          className="text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching talent pool...
            </span>
          ) : (
            <>
              <span className="text-white font-semibold">{sortedCandidates.length}</span> candidates found
              {selectedSkills.length > 0 && (
                <span className="text-gray-500"> • Filtered by {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''}</span>
              )}
            </>
          )}
        </motion.p>
        {savedCandidates.size > 0 && (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <BookmarkCheck className="h-3 w-3 mr-1" />
            {savedCandidates.size} saved
          </Badge>
        )}
      </div>

      {/* Candidates Grid/List */}
      {loading ? (
        <div className="text-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Loader2 className="h-12 w-12 text-orange-400" />
          </motion.div>
          <p className="text-gray-400 mt-4">Searching talent pool with AI...</p>
        </div>
      ) : sortedCandidates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-16 text-center">
              <div className="relative mx-auto mb-6 w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl" />
                <div className="relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full p-6 border border-cyan-500/20">
                  <Users className="h-12 w-12 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Candidates Found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Try adjusting your search criteria or filters to find more candidates
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSkills([]);
                    setFilters({
                      experienceMin: '',
                      experienceMax: '',
                      hasResume: false,
                      hasAiAnalysis: false,
                    });
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {sortedCandidates.map((candidate, index) => {
            const isSaved = savedCandidates.has(candidate.id);

            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-all h-full group overflow-hidden relative">
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <CardContent className="p-6 relative z-10">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <Link href={`/recruiter/talent/${candidate.id}`}>
                        <Avatar className="h-16 w-16 cursor-pointer hover:ring-4 hover:ring-orange-500/30 transition-all">
                          <AvatarImage src={candidate.avatarUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-xl font-semibold">
                            {candidate.firstName[0]}{candidate.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/recruiter/talent/${candidate.id}`}>
                          <h3 className="text-white font-semibold text-lg group-hover:text-orange-400 transition-colors truncate">
                            {candidate.firstName} {candidate.lastName}
                          </h3>
                        </Link>
                        <p className="text-gray-400 text-sm truncate">{candidate.headline || 'Candidate'}</p>
                        {candidate.isNew && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-1">
                            <Sparkles className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {candidate.matchScore && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            {candidate.matchScore}% Match
                          </Badge>
                        )}
                        <button
                          onClick={() => toggleSave(candidate.id)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-4 w-4 text-purple-400" />
                          ) : (
                            <Bookmark className="h-4 w-4 text-gray-400 group-hover:text-purple-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {candidate.location && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <MapPin className="h-4 w-4 text-cyan-400" />
                          <span>{candidate.location}</span>
                        </div>
                      )}
                      {candidate.experienceYears && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Briefcase className="h-4 w-4 text-blue-400" />
                          <span>{candidate.experienceYears} years experience</span>
                        </div>
                      )}
                      {candidate.lastActive && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Clock className="h-4 w-4 text-green-400" />
                          <span>Active {candidate.lastActive}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {candidate.skills.slice(0, 4).map((skill, idx) => (
                        <Badge
                          key={`${candidate.id}-skill-${idx}`}
                          variant="outline"
                          className="bg-white/5 text-gray-300 border-white/20 text-xs hover:bg-white/10 transition-all"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 4 && (
                        <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/20 text-xs">
                          +{candidate.skills.length - 4}
                        </Badge>
                      )}
                    </div>

                    {/* Verification Badges */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {candidate.hasResume && (
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Resume
                        </Badge>
                      )}
                      {candidate.hasAiAnalysis && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Verified
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/recruiter/talent/${candidate.id}`} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/20"
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          View Profile
                        </Button>
                      </Link>
                      <VideoCallButton
                        candidateUserId={candidate.id}
                        candidateName={`${candidate.firstName} ${candidate.lastName}`}
                        candidateEmail={candidate.email}
                        candidateAvatar={candidate.avatarUrl}
                        variant="icon"
                        context="talent_pool"
                      />
                      <a href={`mailto:${candidate.email}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-gray-400 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

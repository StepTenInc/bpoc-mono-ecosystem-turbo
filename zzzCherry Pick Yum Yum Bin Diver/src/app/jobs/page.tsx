'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/shared/layout/Header';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Eye,
  ChevronRight,
  Sparkles,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  agency: string;
  workType: string;
  workArrangement: string;
  shift: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  skills: string[];
  createdAt: string;
  views: number;
  applicantsCount: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs/public?limit=12');
        const data = await response.json();
        if (response.ok && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const formatSalary = (job: Job) => {
    if (job.salaryMin && job.salaryMax) {
      return `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) {
      return `${job.currency} ${job.salaryMin.toLocaleString()}+`;
    }
    return 'Competitive';
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute inset-0 cyber-grid opacity-[0.03]" />
      </div>

      <Header />

      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">100% Real Jobs · Verified Agencies</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="gradient-text">BPO Jobs</span> in the Philippines
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
              Real positions from verified BPO agencies. Every job you see here is active and hiring.
              <br className="hidden md:block" />
              <span className="text-white font-semibold">Create a free account to apply.</span>
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button
                size="lg"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('openSignupModal'));
                  }
                }}
                className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 border-0"
              >
                Create Free Account <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Link href="/try-resume-builder">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 border-white/20 hover:bg-white/10">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Try Free Resume Analyzer
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-1">
                  {jobs.length}+
                </div>
                <div className="text-gray-400 text-sm">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-1">
                  <TrendingUp className="w-8 h-8 inline-block" />
                </div>
                <div className="text-gray-400 text-sm">Hiring Now</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-1">
                  <Zap className="w-8 h-8 inline-block" />
                </div>
                <div className="text-gray-400 text-sm">Fast Hiring Process</div>
              </div>
            </div>
          </motion.div>

          {/* Jobs Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No jobs available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/jobs/${job.id}`}>
                    <Card className="group h-full bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl">
                      <div className="h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="mb-4">
                          <h3 className="text-xl font-black text-white mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all leading-tight">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 w-fit">
                            <Building2 className="h-4 w-4 text-cyan-400" />
                            <span className="text-white font-semibold text-sm">{job.agency}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                            <MapPin className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                            <span className="capitalize text-xs text-gray-300 font-semibold">{job.workArrangement}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                            <Clock className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                            <span className="capitalize text-xs text-gray-300 font-semibold">{job.shift} Shift</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                            <Briefcase className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                            <span className="capitalize text-xs text-gray-300 font-semibold">{job.workType.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                            <Users className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                            <span className="capitalize text-xs text-gray-300 font-semibold text-[11px]">{job.experienceLevel?.replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills?.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs font-bold px-3 py-1">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills?.length > 3 && (
                            <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 text-xs font-bold px-3 py-1">
                              +{job.skills.length - 3} more
                            </Badge>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Salary Range</p>
                              <p className="text-lg font-black text-emerald-400">{formatSalary(job)}</p>
                              <p className="text-xs text-gray-500">per month</p>
                            </div>
                            <div className="flex flex-col gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1.5 justify-end">
                                <Eye className="h-3.5 w-3.5" />
                                <span className="font-semibold">{job.views || 0} views</span>
                              </span>
                              <span className="flex items-center gap-1.5 justify-end">
                                <Users className="h-3.5 w-3.5" />
                                <span className="font-semibold">{job.applicantsCount || 0} applicants</span>
                              </span>
                            </div>
                          </div>

                          {/* Posted time */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">Posted {getTimeAgo(job.createdAt)}</p>
                            <div className="flex items-center gap-1 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-bold">View Details</span>
                              <ChevronRight className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-20 max-w-3xl mx-auto"
          >
            <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent backdrop-blur-md p-10 md:p-12 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />

              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Ready to Apply?
                </h2>
                <p className="text-lg text-gray-300">
                  Create your free account to apply to any of these positions. Build your profile with our AI resume builder and get matched to jobs automatically.
                </p>

                <Button
                  size="lg"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('openSignupModal'));
                    }
                  }}
                  className="h-14 px-10 text-lg rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg"
                >
                  Get Started Free <ChevronRight className="ml-2 w-5 h-5" />
                </Button>

                <p className="text-sm text-gray-500">
                  No credit card required · 100% free · Takes under 2 minutes
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

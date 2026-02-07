'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Users,
  Eye,
  Star,
  Shield,
  ChevronRight,
  Sparkles,
  UserPlus,
  Zap,
  TrendingUp,
  Target,
  Award,
  Rocket
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import Header from '@/components/shared/layout/Header';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  company: string;
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

interface JobDetailClientProps {
  jobId: string;
}

export default function JobDetailClient({ jobId }: JobDetailClientProps) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/public/${jobId}`);
        const data = await response.json();

        if (response.ok && data.job) {
          setJob(data.job);
        } else {
          router.push('/jobs');
        }
      } catch (error) {
        console.error('Failed to fetch job:', error);
        router.push('/jobs');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, router]);

  const formatSalary = () => {
    if (!job) return 'Competitive';
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

  // Generate Job Schema markup for SEO
  const generateJobSchema = () => {
    if (!job) return null;

    const validThrough = new Date();
    validThrough.setDate(validThrough.getDate() + 30);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description,
      identifier: {
        '@type': 'PropertyValue',
        name: 'BPOC.IO',
        value: job.id
      },
      datePosted: job.createdAt,
      validThrough: validThrough.toISOString(),
      employmentType: job.workType.toUpperCase().replace('_', '_'),
      hiringOrganization: {
        '@type': 'Organization',
        name: 'BPOC.IO - BPO Careers Philippines',
        sameAs: 'https://www.bpoc.io',
        logo: 'https://www.bpoc.io/images/536272983_122107788842977640_5462108951149244384_n.jpg'
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'PH',
          addressRegion: 'Metro Manila',
          addressLocality: 'Philippines'
        }
      },
      ...(job.workArrangement === 'remote' && {
        jobLocationType: 'TELECOMMUTE'
      }),
      ...(job.salaryMin && {
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: job.currency,
          value: {
            '@type': 'QuantitativeValue',
            value: job.salaryMin,
            minValue: job.salaryMin,
            ...(job.salaryMax && { maxValue: job.salaryMax }),
            unitText: 'MONTH'
          }
        }
      }),
      ...(job.skills && job.skills.length > 0 && {
        skills: job.skills.join(', ')
      }),
      ...(job.requirements && job.requirements.length > 0 && {
        qualifications: job.requirements.join('. ')
      }),
      ...(job.responsibilities && job.responsibilities.length > 0 && {
        responsibilities: job.responsibilities.join('. ')
      }),
      industry: 'BPO, Customer Service, Business Process Outsourcing',
      occupationalCategory: 'Business Process Outsourcing',
      workHours: job.shift === 'day' ? 'Day Shift' : job.shift === 'night' ? 'Night Shift' : 'Flexible Shift',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'Philippines'
      },
      jobBenefits: job.benefits?.join(', ') || 'Competitive benefits package'
    };

    return schema;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] overflow-x-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        </div>
        <Header />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const jobSchema = generateJobSchema();

  return (
    <>
      {/* Job Schema JSON-LD for SEO */}
      {jobSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
        />
      )}

      <div className="min-h-screen bg-[#0B0B0D] overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-emerald-500/3 via-transparent to-purple-500/3 rounded-full blur-[100px]" />
          <div className="absolute inset-0 cyber-grid opacity-[0.03]" />
        </div>

        <Header />

        <div className="pt-24 pb-20 relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-8 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to All Jobs</span>
            </motion.button>

            {/* Verified Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-bold text-sm tracking-wide">VERIFIED JOB · REAL AGENCY</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 space-y-8"
              >
                {/* Hero Header */}
                <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent opacity-50" />
                  <div className="h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />

                  <div className="relative p-8 md:p-10">
                    {/* Title Section */}
                    <div className="mb-8">
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                        {job.title}
                      </h1>

                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                          <Building2 className="h-5 w-5 text-cyan-400" />
                          <span className="text-white font-bold">{job.agency}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Posted {getTimeAgo(job.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">{job.views || 0} views</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">{job.applicantsCount || 0} applicants</span>
                        </div>
                      </div>

                      {/* Salary Highlight */}
                      <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                        <DollarSign className="h-6 w-6 text-emerald-400" />
                        <div>
                          <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-1">Salary Range</p>
                          <p className="text-2xl font-black text-emerald-400">{formatSalary()}</p>
                          <p className="text-xs text-emerald-300/70">per month</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="h-4 w-4 text-cyan-400" />
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Type</p>
                        </div>
                        <p className="text-white font-bold capitalize">{job.workType?.replace('_', ' ')}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-purple-400" />
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Location</p>
                        </div>
                        <p className="text-white font-bold capitalize">{job.workArrangement}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-orange-500/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-orange-400" />
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Shift</p>
                        </div>
                        <p className="text-white font-bold capitalize">{job.shift} Shift</p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Level</p>
                        </div>
                        <p className="text-white font-bold capitalize text-sm">{job.experienceLevel?.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Required Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill, index) => (
                            <motion.div
                              key={skill}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 px-4 py-1.5 text-sm font-bold">
                                {skill}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white">About This Role</h2>
                  </div>
                  <div className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                    {job.description}
                  </div>
                </motion.div>

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-white">Requirements</h2>
                    </div>
                    <ul className="space-y-4">
                      {job.requirements.map((req, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          className="flex items-start gap-4 text-gray-300 text-lg group"
                        >
                          <div className="mt-1 w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                            <CheckCircle className="h-4 w-4 text-cyan-400" />
                          </div>
                          <span className="leading-relaxed">{req}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-white">Responsibilities</h2>
                    </div>
                    <ul className="space-y-4">
                      {job.responsibilities.map((resp, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="flex items-start gap-4 text-gray-300 text-lg group"
                        >
                          <div className="mt-1 w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                            <ChevronRight className="h-4 w-4 text-purple-400" />
                          </div>
                          <span className="leading-relaxed">{resp}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 backdrop-blur-xl p-8"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-white">Benefits & Perks</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {job.benefits.map((benefit, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + i * 0.03 }}
                          className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors group"
                        >
                          <Star className="h-5 w-5 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-emerald-300 font-semibold">{benefit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Sticky Sidebar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* CTA Card - Sign Up to Apply */}
                <div className="sticky top-24 space-y-6">
                  <div className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-emerald-500/10 backdrop-blur-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-transparent" />
                    <div className="h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />

                    <div className="relative p-8">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 mb-4">
                          <Rocket className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Ready to Apply?</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Create your free account to apply to this job and unlock AI-powered career tools
                        </p>
                      </div>

                      <Button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new Event('openSignupModal'));
                          }
                        }}
                        className="w-full h-16 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500 hover:from-cyan-400 hover:via-purple-400 hover:to-emerald-400 text-white font-black text-lg rounded-2xl shadow-lg shadow-cyan-500/25 border-0 group"
                      >
                        <UserPlus className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                        Sign Up to Apply
                        <ChevronRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
                      </Button>

                      <div className="mt-6 p-5 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-center text-white text-sm font-bold mb-4">
                          What you'll get:
                        </p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center gap-3 text-gray-300">
                            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                              <Zap className="h-3 w-3 text-cyan-400" />
                            </div>
                            <span className="font-semibold">Apply to this job instantly</span>
                          </li>
                          <li className="flex items-center gap-3 text-gray-300">
                            <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="h-3 w-3 text-purple-400" />
                            </div>
                            <span className="font-semibold">AI resume builder & analyzer</span>
                          </li>
                          <li className="flex items-center gap-3 text-gray-300">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                              <Target className="h-3 w-3 text-emerald-400" />
                            </div>
                            <span className="font-semibold">Smart job matching algorithm</span>
                          </li>
                          <li className="flex items-center gap-3 text-gray-300">
                            <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="h-3 w-3 text-orange-400" />
                            </div>
                            <span className="font-semibold">Track all your applications</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                          100% free · No credit card required · Takes 2 minutes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Agency Info */}
                  <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
                    <h3 className="text-lg font-black text-white mb-4">About the Agency</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{job.agency}</p>
                        <p className="text-gray-400 text-sm">BPO Agency Partner</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <p className="text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <Shield className="h-4 w-4" />
                        VERIFIED & TRUSTED PARTNER
                      </p>
                    </div>
                  </div>

                  {/* Try Free Resume Analyzer */}
                  <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-xl p-6">
                    <div className="text-center mb-4">
                      <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                      <h3 className="text-lg font-black text-white mb-2">Not Ready Yet?</h3>
                      <p className="text-gray-400 text-sm">
                        Try our free AI resume analyzer first
                      </p>
                    </div>
                    <Link href="/try-resume-builder">
                      <Button variant="outline" className="w-full h-14 border-2 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50 text-white font-bold rounded-2xl">
                        <Sparkles className="h-5 w-5 mr-2" />
                        Analyze My Resume
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

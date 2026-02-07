'use client';

import { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import {
  FileText,
  ArrowRight,
  UserPlus,
  Rocket,
  CheckCircle2,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface StickySidebarCTAProps {
  className?: string;
}

export default function StickySidebarCTA({ className = '' }: StickySidebarCTAProps) {
  const [activeCard, setActiveCard] = useState<'resume' | 'signup'>('resume');

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Card Switcher Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <button
            onClick={() => setActiveCard('resume')}
            className={`
              flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300
              ${activeCard === 'resume'
                ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Resume
            </span>
          </button>
          <button
            onClick={() => setActiveCard('signup')}
            className={`
              flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300
              ${activeCard === 'signup'
                ? 'bg-gradient-to-r from-purple-500/20 to-purple-500/10 text-purple-400 shadow-lg shadow-purple-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <Rocket className="w-4 h-4" />
              Get Hired
            </span>
          </button>
        </div>

        {/* Card Content */}
        <AnimatePresence mode="wait">
          {activeCard === 'resume' ? (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ResumeCard />
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SignUpCard />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-2xl font-bold text-cyan-400">15k+</p>
            <p className="text-xs text-gray-500 mt-1">Resumes Built</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-2xl font-bold text-purple-400">92%</p>
            <p className="text-xs text-gray-500 mt-1">Interview Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Resume Builder CTA Card
function ResumeCard() {
  return (
    <div className="relative p-6 rounded-2xl overflow-hidden group">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent" />
      <div className="absolute inset-0 bg-[#0B0B0D]/80 backdrop-blur-xl" />
      <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl" />

      {/* Animated Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Decorative Icon */}
      <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <FileText className="w-20 h-20 text-cyan-400 rotate-12" />
      </div>

      <div className="relative z-10">
        {/* Icon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">AI-Powered</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          Resume not passing?
        </h3>

        <p className="text-gray-400 text-sm mb-5 leading-relaxed">
          Our AI Resume Builder beats the ATS filters used by BPO companies. Get a "hired-ready" resume in minutes.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['ATS-Optimized', 'BPO-Focused', 'Free'].map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-medium text-cyan-300/80 bg-cyan-500/10 rounded-md border border-cyan-500/10"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link href="/resume-builder">
          <Button
            className="w-full h-11 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-bold shadow-[0_4px_20px_-4px_rgba(6,182,212,0.5)] hover:shadow-[0_4px_25px_-4px_rgba(6,182,212,0.6)] transition-all duration-300 rounded-xl"
          >
            Build My Resume Free
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Sign Up CTA Card
function SignUpCard() {
  const features = [
    'Direct access to top BPO employers',
    'One-click application to 100+ jobs',
    'Salary transparency on all listings'
  ];

  return (
    <div className="relative p-6 rounded-2xl overflow-hidden group">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-transparent" />
      <div className="absolute inset-0 bg-[#0B0B0D]/80 backdrop-blur-xl" />
      <div className="absolute inset-0 border border-purple-500/20 rounded-2xl" />

      {/* Animated Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        {/* Icon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
          <Rocket className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Career Boost</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-4 tracking-tight">
          Get Hired Faster
        </h3>

        <ul className="space-y-3 mb-5">
          {features.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
              <div className="mt-0.5 p-0.5 rounded-full bg-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              </div>
              <span className="flex-1 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <Link href="/auth/signup">
          <Button
            variant="outline"
            className="w-full h-11 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-white hover:border-purple-500/50 transition-all duration-300 rounded-xl font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Free Account
          </Button>
        </Link>

        <p className="text-center text-xs text-gray-600 mt-3">
          No credit card required
        </p>
      </div>
    </div>
  );
}

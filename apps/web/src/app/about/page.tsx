'use client';

import { motion } from 'framer-motion';
import Header from '@/components/shared/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import {
  TrendingUp,
  Cpu,
  Zap,
  DollarSign,
  Clock,
  Users,
  Target,
  AlertTriangle,
  Rocket,
  BarChart3
} from 'lucide-react';

const problems = [
  {
    icon: AlertTriangle,
    title: 'Traditional Job Sites Are Broken',
    description: 'Indeed, Jobstreet, and legacy platforms create inefficiencies, slow hiring, and waste recruiter time with unqualified candidates.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  {
    icon: Clock,
    title: 'Slow Hiring Costs Money',
    description: 'Manual screening, endless resume reviews, and delayed processes mean lost revenue and unfilled seats.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Users,
    title: 'Candidates Left in the Dark',
    description: 'No updates, no feedback, no value. Candidates abandon applications because the experience is terrible.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  }
];

const solutions = [
  {
    icon: Cpu,
    title: 'AI-Powered Candidate Matching',
    description: 'Our AI scores every candidate 0-100% against job requirements. No more resume pile digging.',
    impact: 'Save 10+ hours/week per recruiter',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Zap,
    title: 'Automated Screening & Vetting',
    description: 'AI resume analysis, video screening with transcripts, and automated workflows eliminate manual grunt work.',
    impact: '75% faster time-to-hire',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Pipeline Management',
    description: 'Drag-and-drop candidates through stages. Track everything. No spreadsheets, no chaos.',
    impact: 'Manage 3x more candidates',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: DollarSign,
    title: 'Lower Cost Per Hire',
    description: 'Reduce reliance on expensive job boards, headhunters, and manual processes. AI does the heavy lifting.',
    impact: 'Cut hiring costs 40-60%',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0D] overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200">

      {/* Background Ambience */}
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
            className="text-center mb-20 relative"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 1.5 }}
              className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl border border-cyan-500/30 flex items-center justify-center backdrop-blur-sm relative"
            >
              <Cpu className="h-10 w-10 text-cyan-400 animate-pulse" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              About <span className="gradient-text">BPOC</span>
            </h1>

            <p className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto mb-6 font-semibold">
              BPO Careers: Streamlining Recruitment with AI
            </p>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We're not here to "empower" anyone with fluffy buzzwords.<br className="hidden md:block" />
              We're here to <span className="text-white font-semibold">save the BPO industry</span> from slow, costly, broken hiring processes.
            </p>
          </motion.div>

          {/* The Problem Section */}
          <div className="mb-24 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-300 font-semibold">The Industry Is Broken</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">The Problem</h2>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                Traditional BPO recruitment is expensive, slow, and frustrating for everyone involved.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {problems.map((problem, index) => (
                <motion.div
                  key={problem.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="h-full p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${problem.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

                    <div className="relative z-10">
                      <div className={`w-12 h-12 rounded-lg ${problem.bgColor} flex items-center justify-center mb-4`}>
                        <problem.icon className={`w-6 h-6 ${problem.color}`} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{problem.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Origin Story */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24 max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md p-8 md:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-blue-400" />
                  <span className="text-blue-400 font-mono text-sm tracking-wider uppercase">Origin Story</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  From Messenger Bots to <span className="text-blue-400">AI-First Platform</span>
                </h2>

                <div className="space-y-4 text-gray-300 leading-relaxed text-lg">
                  <p>
                    <span className="text-white font-semibold">BPOC (BPO Careers)</span> started as an idea to use <span className="text-white font-medium">Facebook Messenger chatbots</span> with targeted ads to streamline candidate attraction. We saw how traditional job sites like Indeed and Jobstreet created friction, confusion, and wasted time.
                  </p>
                  <p>
                    As AI technology evolved, we pivoted. Why limit ourselves to chatbots when we could build a <span className="text-white font-medium">100% AI-powered platform</span> that streamlines the <span className="underline decoration-blue-400">entire recruitment lifecycle</span>?
                  </p>
                  <p>
                    Today, BPOC is a full-stack solution for <span className="text-cyan-400 font-medium">candidates</span>, <span className="text-purple-400 font-medium">recruiters</span>, and <span className="text-emerald-400 font-medium">BPOs</span>.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* The Vision */}
          <div className="mb-24 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                <Target className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">Where We're Going</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">The Vision</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-4">
                <span className="text-white font-bold">Thousands of candidates</span> across the Philippines applying.<br />
                <span className="text-white font-bold">Thousands of candidates</span> getting hired every month.<br />
                <span className="text-white font-bold">BPOs</span> saving massive costs while hiring faster than ever.
              </p>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                We're building the infrastructure that makes the BPO industry unstoppable. Recruiters spend less time on manual work. Candidates get real updates and real value. BPOs hire better people, faster, for less money.
              </p>
            </div>
          </div>

          {/* AI Solutions */}
          <div className="mb-24 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
                <Rocket className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-300 font-semibold">AI-Powered Solutions</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How We Fix It</h2>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                AI tools that eliminate manual work, accelerate hiring, and reduce costs across the board.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {solutions.map((solution, index) => (
                <motion.div
                  key={solution.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="h-full p-8 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${solution.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

                    <div className="relative z-10">
                      <div className={`w-14 h-14 rounded-lg ${solution.bgColor} flex items-center justify-center mb-4 border border-white/10`}>
                        <solution.icon className={`w-7 h-7 ${solution.color}`} />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{solution.title}</h3>
                      <p className="text-gray-400 leading-relaxed mb-4">
                        {solution.description}
                      </p>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${solution.bgColor} border border-white/10`}>
                        <BarChart3 className={`w-4 h-4 ${solution.color}`} />
                        <span className={`${solution.color} font-semibold text-sm`}>{solution.impact}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mission Statement */}
          <div className="mb-24 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent backdrop-blur-md p-10 md:p-16 overflow-hidden text-center"
            >
              <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />

              <div className="relative z-10 space-y-6">
                <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-pulse" />

                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  The Mission
                </h2>

                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-medium">
                  Provide better service to <span className="text-cyan-400 font-bold">candidates</span>, <span className="text-purple-400 font-bold">recruiters</span>, and <span className="text-emerald-400 font-bold">BPOs</span> through AI-powered streamlining. Faster hiring. Lower costs. Better outcomes.
                </p>

                <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                  Every feature we build solves a real problem in the BPO industry—from broken resume screening to lack of candidate updates. We use AI to eliminate inefficiency at every step.
                </p>
              </div>
            </motion.div>
          </div>

          {/* The Warning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center py-16 max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-8">
              <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
              <span className="text-red-300 font-bold text-lg">Industry Warning</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Adapt or Get Left Behind
            </h2>

            <p className="text-2xl text-gray-300 mb-6 font-semibold">
              Use AI before AI uses you.
            </p>

            <p className="text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
              The BPO industry is under threat from companies that refuse to modernize. Slow hiring, high costs, and poor candidate experience are no longer acceptable. AI isn't optional—it's survival.
            </p>

            <p className="text-lg text-cyan-400 mt-8 font-semibold">
              The future of BPO recruitment is here. Are you in?
            </p>
          </motion.div>

        </div>
      </div>

      {/* Footer is provided by layout's ClientConditionalFooter */}
    </div>
  );
}

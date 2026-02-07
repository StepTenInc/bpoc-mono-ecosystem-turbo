'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select'
import { CheckCircle, XCircle, BookOpen, Clock, Target, TrendingUp, ArrowRight, Award, Sparkles } from 'lucide-react'
import Header from '@/components/shared/layout/Header'

// Hardcoded job requirements (can move to DB later)
const JOB_REQUIREMENTS = {
  'Customer Service Representative': {
    required: ['Customer Service', 'Communication', 'Problem Solving', 'Computer Literacy', 'Email Etiquette'],
    preferred: ['Typing 40+ WPM', 'CRM Software', 'Active Listening'],
    timeline: '2-3 months',
    learningResources: {
      'Customer Service': 'https://www.youtube.com/results?search_query=customer+service+training',
      'Communication': 'https://www.coursera.org/courses?query=communication%20skills',
      'Problem Solving': 'https://www.youtube.com/results?search_query=problem+solving+skills',
      'Computer Literacy': 'https://www.youtube.com/results?search_query=basic+computer+skills',
      'Email Etiquette': 'https://www.youtube.com/results?search_query=email+writing+professional',
      'Typing 40+ WPM': 'https://www.typingtest.com/',
      'CRM Software': 'https://www.youtube.com/results?search_query=crm+software+tutorial',
      'Active Listening': 'https://www.youtube.com/results?search_query=active+listening+skills'
    }
  },
  'Technical Support Representative': {
    required: ['Technical Troubleshooting', 'Customer Service', 'IT Knowledge', 'Communication', 'Problem Solving'],
    preferred: ['Ticketing Systems', 'Remote Desktop Tools', 'Hardware Knowledge'],
    timeline: '3-4 months',
    learningResources: {
      'Technical Troubleshooting': 'https://www.youtube.com/results?search_query=technical+troubleshooting+training',
      'Customer Service': 'https://www.youtube.com/results?search_query=customer+service+training',
      'IT Knowledge': 'https://www.coursera.org/courses?query=it%20fundamentals',
      'Communication': 'https://www.coursera.org/courses?query=communication%20skills',
      'Problem Solving': 'https://www.youtube.com/results?search_query=problem+solving+skills',
      'Ticketing Systems': 'https://www.youtube.com/results?search_query=help+desk+ticketing+system',
      'Remote Desktop Tools': 'https://www.youtube.com/results?search_query=remote+desktop+support',
      'Hardware Knowledge': 'https://www.youtube.com/results?search_query=computer+hardware+basics'
    }
  },
  'Team Leader': {
    required: ['Team Management', 'Coaching & Mentoring', 'Performance Monitoring', 'Reporting', 'Conflict Resolution'],
    preferred: ['Training Delivery', 'Data Analysis', 'Process Improvement'],
    timeline: '6-8 months',
    learningResources: {
      'Team Management': 'https://www.coursera.org/courses?query=team%20management',
      'Coaching & Mentoring': 'https://www.youtube.com/results?search_query=coaching+and+mentoring+skills',
      'Performance Monitoring': 'https://www.youtube.com/results?search_query=performance+monitoring+kpi',
      'Reporting': 'https://www.youtube.com/results?search_query=business+reporting+excel',
      'Conflict Resolution': 'https://www.coursera.org/courses?query=conflict%20resolution',
      'Training Delivery': 'https://www.youtube.com/results?search_query=train+the+trainer',
      'Data Analysis': 'https://www.coursera.org/courses?query=data%20analysis',
      'Process Improvement': 'https://www.youtube.com/results?search_query=process+improvement+techniques'
    }
  },
  'Quality Analyst': {
    required: ['Quality Monitoring', 'Data Analysis', 'Feedback & Coaching', 'Excel Skills', 'Attention to Detail'],
    preferred: ['Reporting Tools', 'Call Calibration', 'Documentation'],
    timeline: '3-5 months',
    learningResources: {
      'Quality Monitoring': 'https://www.youtube.com/results?search_query=quality+assurance+call+center',
      'Data Analysis': 'https://www.coursera.org/courses?query=data%20analysis',
      'Feedback & Coaching': 'https://www.youtube.com/results?search_query=giving+feedback+coaching',
      'Excel Skills': 'https://www.youtube.com/results?search_query=excel+for+beginners',
      'Attention to Detail': 'https://www.youtube.com/results?search_query=attention+to+detail+training',
      'Reporting Tools': 'https://www.youtube.com/results?search_query=power+bi+tutorial',
      'Call Calibration': 'https://www.youtube.com/results?search_query=call+calibration+qa',
      'Documentation': 'https://www.youtube.com/results?search_query=documentation+best+practices'
    }
  },
  'Account Manager': {
    required: ['Client Relationship Management', 'Account Planning', 'Negotiation', 'Sales', 'Strategic Thinking'],
    preferred: ['Contract Management', 'Revenue Growth', 'Cross-selling'],
    timeline: '8-12 months',
    learningResources: {
      'Client Relationship Management': 'https://www.coursera.org/courses?query=client%20relationship%20management',
      'Account Planning': 'https://www.youtube.com/results?search_query=account+planning+strategy',
      'Negotiation': 'https://www.coursera.org/courses?query=negotiation%20skills',
      'Sales': 'https://www.youtube.com/results?search_query=sales+training',
      'Strategic Thinking': 'https://www.coursera.org/courses?query=strategic%20thinking',
      'Contract Management': 'https://www.youtube.com/results?search_query=contract+management',
      'Revenue Growth': 'https://www.youtube.com/results?search_query=revenue+growth+strategies',
      'Cross-selling': 'https://www.youtube.com/results?search_query=cross+selling+techniques'
    }
  },
  'Operations Manager': {
    required: ['Operations Management', 'Budget Planning', 'Team Leadership', 'Process Optimization', 'Strategic Planning'],
    preferred: ['Six Sigma', 'Project Management', 'Change Management'],
    timeline: '12+ months',
    learningResources: {
      'Operations Management': 'https://www.coursera.org/courses?query=operations%20management',
      'Budget Planning': 'https://www.youtube.com/results?search_query=budget+planning+management',
      'Team Leadership': 'https://www.coursera.org/courses?query=team%20leadership',
      'Process Optimization': 'https://www.youtube.com/results?search_query=process+optimization',
      'Strategic Planning': 'https://www.coursera.org/courses?query=strategic%20planning',
      'Six Sigma': 'https://www.coursera.org/courses?query=six%20sigma',
      'Project Management': 'https://www.coursera.org/courses?query=project%20management',
      'Change Management': 'https://www.youtube.com/results?search_query=change+management'
    }
  }
}

// Sample current skills (in real app, this would come from user's profile)
const SAMPLE_CURRENT_SKILLS = [
  'Customer Service',
  'Communication',
  'Computer Literacy',
  'Email Etiquette',
  'Problem Solving'
]

export default function SkillsGapPage() {
  const [targetPosition, setTargetPosition] = useState('')
  const [currentSkills, setCurrentSkills] = useState<string[]>(SAMPLE_CURRENT_SKILLS)
  const [showResults, setShowResults] = useState(false)

  const analyzeGap = () => {
    setShowResults(true)
  }

  const jobData = targetPosition ? JOB_REQUIREMENTS[targetPosition as keyof typeof JOB_REQUIREMENTS] : null

  const missingRequired = jobData ? jobData.required.filter(skill => !currentSkills.includes(skill)) : []
  const hasRequired = jobData ? jobData.required.filter(skill => currentSkills.includes(skill)) : []
  const missingPreferred = jobData ? jobData.preferred.filter(skill => !currentSkills.includes(skill)) : []
  const hasPreferred = jobData ? jobData.preferred.filter(skill => currentSkills.includes(skill)) : []

  const readinessScore = jobData
    ? Math.round((hasRequired.length / jobData.required.length) * 100)
    : 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-400', stroke: '#10b981', bg: 'from-green-500/10', border: 'border-green-500/30' }
    if (score >= 50) return { text: 'text-orange-400', stroke: '#fb923c', bg: 'from-orange-500/10', border: 'border-orange-500/30' }
    return { text: 'text-red-400', stroke: '#f87171', bg: 'from-red-500/10', border: 'border-red-500/30' }
  }

  const scoreColor = getScoreColor(readinessScore)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-rose-950 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[150px]" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30">
            <TrendingUp className="w-5 h-5 mr-2 inline" />
            Career Path Analyzer
          </Badge>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(239,68,68,0.5)]">
              Skills Gap
            </span>
            <br />
            <span className="text-white drop-shadow-[0_0_40px_rgba(239,68,68,0.2)]">Analyzer</span>
          </h1>

          <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
            Find exactly what skills you need for your dream BPO job
          </p>
        </motion.div>

        {/* 2-Column Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-gray-800/50 hover:border-red-500/70 transition-all duration-500 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_90px_-15px_rgba(239,68,68,0.4)]"
          >
            {/* Gradient glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6 text-red-400 flex items-center gap-3">
                <Target className="w-8 h-8" />
                Target Position
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">
                    What position do you want?
                  </label>
                  <Select value={targetPosition} onValueChange={setTargetPosition}>
                    <SelectTrigger className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white hover:border-red-500/50 focus:border-red-500/70 transition-all">
                      <SelectValue placeholder="Select target position" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      {Object.keys(JOB_REQUIREMENTS).map(pos => (
                        <SelectItem key={pos} value={pos} className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-gray-800 pt-6">
                  <p className="text-sm font-bold mb-3 text-gray-300">Your Current Skills:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentSkills.map((skill, i) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-300 rounded-full text-xs font-semibold"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 In the real app, these come from your profile
                  </p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={analyzeGap}
                    disabled={!targetPosition}
                    className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:shadow-[0_0_60px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:cursor-not-allowed border-0 text-white font-bold text-lg py-6 rounded-2xl transition-all duration-300"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Analyze Skills Gap
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right: Results */}
          {showResults && jobData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-red-500/70 shadow-[0_30px_90px_-15px_rgba(239,68,68,0.5)]"
            >
              {/* Gradient glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-3xl" />

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

              <div className="relative z-10 space-y-8">
                {/* Circular Readiness Gauge */}
                <div className="text-center">
                  <div className="relative w-48 h-48 mx-auto mb-6">
                    {/* Background Circle */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="16"
                        fill="none"
                      />
                      {/* Animated Progress Circle */}
                      <motion.circle
                        cx="100"
                        cy="100"
                        r="80"
                        stroke={scoreColor.stroke}
                        strokeWidth="16"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 502" }}
                        animate={{ strokeDasharray: `${(readinessScore / 100) * 502} 502` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    {/* Score Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className={`text-6xl font-black ${scoreColor.text} drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]`}
                      >
                        {readinessScore}%
                      </motion.div>
                      <div className="text-sm text-gray-400 font-semibold mt-1">Ready</div>
                    </div>
                  </div>
                  <div className="text-xl text-gray-300 font-semibold mb-2">Job Readiness Score</div>
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Timeline: {jobData.timeline}</span>
                  </div>
                </div>

                {/* Skills You Have */}
                {hasRequired.length > 0 && (
                  <div className="bg-green-500/5 p-6 rounded-2xl border border-green-500/30">
                    <h3 className="font-black text-green-400 mb-4 flex items-center gap-2 text-lg">
                      <CheckCircle className="w-6 h-6" />
                      Skills You Have ({hasRequired.length}/{jobData.required.length} required)
                    </h3>
                    <ul className="space-y-3">
                      {hasRequired.map((skill, i) => (
                        <motion.li
                          key={skill}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-gray-300 flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          {skill}
                        </motion.li>
                      ))}
                      {hasPreferred.map((skill, i) => (
                        <motion.li
                          key={skill}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (hasRequired.length + i) * 0.1 }}
                          className="text-gray-300 flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                          {skill} <span className="text-xs text-green-400">(bonus)</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Skills Missing */}
                {missingRequired.length > 0 && (
                  <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/30">
                    <h3 className="font-black text-red-400 mb-4 flex items-center gap-2 text-lg">
                      <XCircle className="w-6 h-6" />
                      Required Skills You Need
                    </h3>
                    <ul className="space-y-3">
                      {missingRequired.map((skill, i) => (
                        <motion.li
                          key={skill}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-gray-300 flex items-center gap-2"
                        >
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          {skill}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preferred Skills Missing */}
                {missingPreferred.length > 0 && (
                  <div className="bg-orange-500/5 p-6 rounded-2xl border border-orange-500/30">
                    <h3 className="font-black text-orange-400 mb-4 flex items-center gap-2 text-lg">
                      <Target className="w-6 h-6" />
                      Bonus Skills (Stand Out)
                    </h3>
                    <ul className="space-y-3">
                      {missingPreferred.map((skill, i) => (
                        <motion.li
                          key={skill}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-gray-300 flex items-center gap-2"
                        >
                          <Target className="w-5 h-5 text-orange-400 flex-shrink-0" />
                          {skill}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-gray-800/50 flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <Target className="w-24 h-24 mx-auto text-gray-700" />
                <p className="text-2xl text-gray-500 font-semibold">Select your target position to see what skills you need</p>
                <p className="text-sm text-gray-600 max-w-md">
                  We'll analyze your current skills and show you exactly what to learn
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Learning Path */}
        <AnimatePresence>
          {showResults && jobData && missingRequired.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 max-w-6xl mx-auto relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-purple-500/50 hover:border-purple-500/70 transition-all duration-500 shadow-[0_20px_70px_-15px_rgba(168,85,247,0.3)]"
            >
              {/* Gradient glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <BookOpen className="w-8 h-8 text-purple-400" />
                  <h2 className="text-3xl font-black text-purple-400">Your Learning Path</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Required Skills Learning */}
                  <div>
                    <h3 className="font-black text-red-400 mb-6 text-xl flex items-center gap-2">
                      <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-sm">Priority</span>
                      Learn These First
                    </h3>
                    <div className="space-y-4">
                      {missingRequired.map((skill, i) => (
                        <motion.div
                          key={skill}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-black/50 border-l-4 border-red-500 pl-6 pr-4 py-4 rounded-r-xl hover:bg-black/70 transition-all"
                        >
                          <div className="font-bold text-white mb-2">{skill}</div>
                          <a
                            href={jobData.learningResources[skill as keyof typeof jobData.learningResources]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-red-400 hover:text-red-300 hover:underline flex items-center gap-2 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                            Free learning resources →
                          </a>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Skills Learning */}
                  <div>
                    <h3 className="font-black text-orange-400 mb-6 text-xl flex items-center gap-2">
                      <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm">Bonus</span>
                      Learn These Next
                    </h3>
                    <div className="space-y-4">
                      {missingPreferred.map((skill, i) => (
                        <motion.div
                          key={skill}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (missingRequired.length + i) * 0.1 }}
                          className="bg-black/50 border-l-4 border-orange-500 pl-6 pr-4 py-4 rounded-r-xl hover:bg-black/70 transition-all"
                        >
                          <div className="font-bold text-white mb-2">{skill}</div>
                          <a
                            href={jobData.learningResources[skill as keyof typeof jobData.learningResources]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-2 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                            Free learning resources →
                          </a>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Plan */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 rounded-2xl border border-purple-500/30">
                  <h4 className="font-black text-purple-300 mb-4 text-xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    Your Action Plan:
                  </h4>
                  <ol className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-black">1.</span>
                      <span>Focus on the <span className="font-bold text-red-400">{missingRequired.length} required skills</span> first (2-4 weeks each)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-black">2.</span>
                      <span>Use free resources to learn at your own pace</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-black">3.</span>
                      <span>Practice what you learn with real examples</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-black">4.</span>
                      <span>Add <span className="font-bold text-orange-400">bonus skills</span> to stand out from other candidates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 font-black">5.</span>
                      <span>Come back to update your profile and track progress</span>
                    </li>
                  </ol>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Celebration */}
        <AnimatePresence>
          {showResults && jobData && missingRequired.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 max-w-4xl mx-auto relative bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-3xl p-16 border-2 border-green-500/70 shadow-[0_30px_90px_-15px_rgba(34,197,94,0.6)] overflow-hidden"
            >
              {/* Celebration background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px]"
              />

              <div className="relative z-10 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, type: "spring" }}
                >
                  <Award className="w-32 h-32 mx-auto text-green-400 drop-shadow-[0_0_40px_rgba(34,197,94,0.8)]" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(34,197,94,0.6)]"
                >
                  You're Ready to Apply! 🎉
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
                >
                  You have all the required skills for this position. Consider learning the bonus skills to stand out even more!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-[0_0_60px_rgba(34,197,94,0.4)] border-0 text-white font-black text-xl px-12 py-8 rounded-2xl">
                    Browse {targetPosition} Jobs
                    <ArrowRight className="ml-3 w-6 h-6" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  )
}

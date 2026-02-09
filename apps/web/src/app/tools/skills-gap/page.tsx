'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Card, CardContent } from '@/components/shared/ui/card'
import { Label } from '@/components/shared/ui/label'
import { 
  Target, CheckCircle, XCircle, BookOpen, Clock, TrendingUp,
  ArrowRight, ExternalLink, ThumbsUp, ThumbsDown, Facebook,
  Sparkles, Award, Zap, GraduationCap, Play, ChevronRight
} from 'lucide-react'
import Header from '@/components/shared/layout/Header'

// Skills database by role
const ROLE_SKILLS = {
  'csr-voice': {
    name: 'Customer Service Rep (Voice)',
    required: ['Communication Skills', 'Active Listening', 'Problem Solving', 'Computer Basics', 'Typing 35+ WPM', 'Email Etiquette'],
    preferred: ['CRM Software', 'Multitasking', 'Empathy', 'Conflict Resolution'],
    timeline: '2-3 months'
  },
  'csr-nonvoice': {
    name: 'Customer Service Rep (Non-Voice)',
    required: ['Written Communication', 'Grammar & Spelling', 'Typing 40+ WPM', 'Email Etiquette', 'Computer Basics'],
    preferred: ['Chat Support', 'CRM Software', 'Time Management', 'Multitasking'],
    timeline: '1-2 months'
  },
  'tech-support': {
    name: 'Technical Support Rep',
    required: ['Technical Troubleshooting', 'Communication Skills', 'Computer Hardware Basics', 'Software Knowledge', 'Problem Solving'],
    preferred: ['Networking Basics', 'Remote Desktop Tools', 'Ticketing Systems', 'Documentation'],
    timeline: '3-4 months'
  },
  'team-leader': {
    name: 'Team Leader / Supervisor',
    required: ['Team Management', 'Coaching & Mentoring', 'Performance Monitoring', 'Excel & Reporting', 'Conflict Resolution'],
    preferred: ['Training Delivery', 'Data Analysis', 'Process Improvement', 'Workforce Planning'],
    timeline: '6-8 months'
  },
  'qa': {
    name: 'Quality Analyst',
    required: ['Quality Frameworks', 'Attention to Detail', 'Feedback Delivery', 'Excel Skills', 'Documentation'],
    preferred: ['Data Analysis', 'Call Calibration', 'Root Cause Analysis', 'Reporting Tools'],
    timeline: '3-5 months'
  },
  'trainer': {
    name: 'Trainer',
    required: ['Training Delivery', 'Communication Skills', 'Presentation Skills', 'Content Development', 'Product Knowledge'],
    preferred: ['Adult Learning Principles', 'Assessment Design', 'LMS Tools', 'Coaching'],
    timeline: '4-6 months'
  },
  'wfm': {
    name: 'Workforce Management',
    required: ['Excel Advanced', 'Scheduling', 'Forecasting', 'Data Analysis', 'Attention to Detail'],
    preferred: ['WFM Tools (Aspect, NICE)', 'SQL Basics', 'Reporting', 'Capacity Planning'],
    timeline: '4-6 months'
  },
  'sales': {
    name: 'Sales Representative',
    required: ['Persuasion Skills', 'Objection Handling', 'Product Knowledge', 'Communication', 'Closing Techniques'],
    preferred: ['CRM Software', 'Upselling', 'Pipeline Management', 'Negotiation'],
    timeline: '2-3 months'
  }
}

// Learning resources for each skill
const SKILL_RESOURCES: Record<string, { name: string; url: string; type: 'video' | 'course' | 'practice' }[]> = {
  'Communication Skills': [
    { name: 'Communication Skills - Coursera', url: 'https://www.coursera.org/courses?query=communication%20skills', type: 'course' },
    { name: 'Effective Communication - YouTube', url: 'https://www.youtube.com/results?search_query=effective+communication+skills+training', type: 'video' }
  ],
  'Active Listening': [
    { name: 'Active Listening Skills - YouTube', url: 'https://www.youtube.com/results?search_query=active+listening+skills+training', type: 'video' }
  ],
  'Problem Solving': [
    { name: 'Problem Solving - Coursera', url: 'https://www.coursera.org/courses?query=problem%20solving', type: 'course' },
    { name: 'Critical Thinking - YouTube', url: 'https://www.youtube.com/results?search_query=problem+solving+skills+training', type: 'video' }
  ],
  'Computer Basics': [
    { name: 'Computer Basics - GCFGlobal', url: 'https://edu.gcfglobal.org/en/computerbasics/', type: 'course' },
    { name: 'Basic Computer Skills - YouTube', url: 'https://www.youtube.com/results?search_query=basic+computer+skills+tutorial', type: 'video' }
  ],
  'Typing 35+ WPM': [
    { name: 'TypingTest.com - Practice', url: 'https://www.typingtest.com/', type: 'practice' },
    { name: 'Keybr.com - Learn Touch Typing', url: 'https://www.keybr.com/', type: 'practice' },
    { name: 'Typing.com - Free Course', url: 'https://www.typing.com/', type: 'course' }
  ],
  'Typing 40+ WPM': [
    { name: 'TypingTest.com - Practice', url: 'https://www.typingtest.com/', type: 'practice' },
    { name: 'Keybr.com - Learn Touch Typing', url: 'https://www.keybr.com/', type: 'practice' }
  ],
  'Email Etiquette': [
    { name: 'Professional Email Writing - YouTube', url: 'https://www.youtube.com/results?search_query=professional+email+writing+tutorial', type: 'video' }
  ],
  'CRM Software': [
    { name: 'Salesforce Trailhead (Free)', url: 'https://trailhead.salesforce.com/', type: 'course' },
    { name: 'Zendesk Training - YouTube', url: 'https://www.youtube.com/results?search_query=zendesk+tutorial+beginner', type: 'video' }
  ],
  'Technical Troubleshooting': [
    { name: 'IT Troubleshooting - Professor Messer', url: 'https://www.professormesser.com/', type: 'video' },
    { name: 'CompTIA A+ Basics - YouTube', url: 'https://www.youtube.com/results?search_query=comptia+a%2B+troubleshooting', type: 'video' }
  ],
  'Excel Skills': [
    { name: 'Excel Easy - Free Tutorials', url: 'https://www.excel-easy.com/', type: 'course' },
    { name: 'Excel for Beginners - YouTube', url: 'https://www.youtube.com/results?search_query=excel+tutorial+beginners', type: 'video' }
  ],
  'Excel Advanced': [
    { name: 'Excel Advanced - Coursera', url: 'https://www.coursera.org/courses?query=excel%20advanced', type: 'course' },
    { name: 'Excel VLOOKUP, Pivot Tables - YouTube', url: 'https://www.youtube.com/results?search_query=excel+advanced+pivot+tables+vlookup', type: 'video' }
  ],
  'Team Management': [
    { name: 'Team Management - Coursera', url: 'https://www.coursera.org/courses?query=team%20management', type: 'course' },
    { name: 'Leadership Skills - YouTube', url: 'https://www.youtube.com/results?search_query=team+management+skills+training', type: 'video' }
  ],
  'Coaching & Mentoring': [
    { name: 'Coaching Skills - YouTube', url: 'https://www.youtube.com/results?search_query=coaching+and+mentoring+skills', type: 'video' }
  ],
  'Data Analysis': [
    { name: 'Google Data Analytics (Free)', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', type: 'course' },
    { name: 'Data Analysis - YouTube', url: 'https://www.youtube.com/results?search_query=data+analysis+for+beginners', type: 'video' }
  ],
  'Training Delivery': [
    { name: 'Train the Trainer - YouTube', url: 'https://www.youtube.com/results?search_query=train+the+trainer+course', type: 'video' }
  ],
  'Written Communication': [
    { name: 'Business Writing - Coursera', url: 'https://www.coursera.org/courses?query=business%20writing', type: 'course' }
  ],
  'Grammar & Spelling': [
    { name: 'Grammarly Blog - Tips', url: 'https://www.grammarly.com/blog/', type: 'course' },
    { name: 'English Grammar - YouTube', url: 'https://www.youtube.com/results?search_query=english+grammar+lessons', type: 'video' }
  ]
}

// Default resources for skills not in our database
const DEFAULT_RESOURCES = [
  { name: 'Search on YouTube', url: 'https://www.youtube.com/', type: 'video' as const },
  { name: 'Search on Coursera', url: 'https://www.coursera.org/', type: 'course' as const }
]

export default function SkillsGapPage() {
  const [currentRole, setCurrentRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [currentSkills, setCurrentSkills] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)
  const [rated, setRated] = useState<'up' | 'down' | null>(null)

  const targetRoleData = targetRole ? ROLE_SKILLS[targetRole as keyof typeof ROLE_SKILLS] : null
  const allTargetSkills = targetRoleData ? [...targetRoleData.required, ...targetRoleData.preferred] : []

  const toggleSkill = (skill: string) => {
    setCurrentSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const analyzeGap = () => {
    if (!targetRoleData) return

    const missingRequired = targetRoleData.required.filter(s => !currentSkills.includes(s))
    const missingPreferred = targetRoleData.preferred.filter(s => !currentSkills.includes(s))
    const hasRequired = targetRoleData.required.filter(s => currentSkills.includes(s))
    const hasPreferred = targetRoleData.preferred.filter(s => currentSkills.includes(s))

    const readinessScore = Math.round(
      ((hasRequired.length / targetRoleData.required.length) * 70) +
      ((hasPreferred.length / targetRoleData.preferred.length) * 30)
    )

    // Build learning roadmap
    const roadmap = [
      ...missingRequired.map(skill => ({
        skill,
        priority: 'Required',
        resources: SKILL_RESOURCES[skill] || DEFAULT_RESOURCES,
        estimatedTime: '1-2 weeks'
      })),
      ...missingPreferred.map(skill => ({
        skill,
        priority: 'Preferred',
        resources: SKILL_RESOURCES[skill] || DEFAULT_RESOURCES,
        estimatedTime: '1-2 weeks'
      }))
    ]

    setResult({
      readinessScore,
      targetRole: targetRoleData.name,
      timeline: targetRoleData.timeline,
      hasRequired,
      hasPreferred,
      missingRequired,
      missingPreferred,
      roadmap
    })
  }

  const shareOnFacebook = () => {
    if (!result) return
    const text = encodeURIComponent(`I'm ${result.readinessScore}% ready to become a ${result.targetRole}! 🎯 Found my skill gaps with this free tool:`)
    const url = encodeURIComponent('https://bpoc.io/tools/skills-gap')
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank')
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-black to-amber-950 opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[150px]" />

        <div className="relative z-10 container mx-auto px-4 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-300">
              <Target className="w-5 h-5 mr-2 inline" />
              Career Development Tool
            </Badge>

            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Skills Gap
              </span>
              <br />
              <span className="text-white">Analyzer</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover what skills you need and get a free learning roadmap to your dream BPO role.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Target Role */}
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <Label className="text-white mb-4 block text-lg">What role do you want?</Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {Object.entries(ROLE_SKILLS).map(([id, data]) => (
                          <button
                            key={id}
                            onClick={() => { setTargetRole(id); setCurrentSkills([]); }}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              targetRole === id
                                ? 'border-orange-500 bg-orange-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="text-white font-medium">{data.name}</div>
                            <div className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {data.timeline} to learn
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Skills */}
                  {targetRole && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <Label className="text-white mb-2 block text-lg">Which skills do you already have?</Label>
                          <p className="text-gray-500 text-sm mb-4">Select all that apply - be honest!</p>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="text-orange-400 text-sm font-medium mb-2">Required Skills</div>
                              <div className="flex flex-wrap gap-2">
                                {targetRoleData?.required.map(skill => (
                                  <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                                      currentSkills.includes(skill)
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                                    }`}
                                  >
                                    {currentSkills.includes(skill) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                    {skill}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="text-amber-400 text-sm font-medium mb-2">Preferred Skills</div>
                              <div className="flex flex-wrap gap-2">
                                {targetRoleData?.preferred.map(skill => (
                                  <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                                      currentSkills.includes(skill)
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                                    }`}
                                  >
                                    {currentSkills.includes(skill) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                    {skill}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={analyzeGap}
                            className="w-full mt-6 py-6 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                          >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Analyze My Skills Gap
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Readiness Score */}
                  <Card className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/30">
                    <CardContent className="p-8 text-center">
                      <div className="relative inline-block mb-4">
                        <svg className="w-32 h-32">
                          <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                          <circle 
                            cx="64" cy="64" r="56" fill="none" 
                            stroke={result.readinessScore >= 70 ? '#22c55e' : result.readinessScore >= 40 ? '#eab308' : '#f97316'}
                            strokeWidth="8" 
                            strokeDasharray={`${result.readinessScore * 3.52} 352`}
                            strokeLinecap="round"
                            transform="rotate(-90 64 64)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-black text-orange-400">{result.readinessScore}%</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {result.readinessScore >= 70 ? 'Almost Ready! 🎉' : 
                         result.readinessScore >= 40 ? 'Good Progress!' : 
                         'Let\'s Build Your Skills 💪'}
                      </h2>
                      <p className="text-gray-400">
                        for <span className="text-orange-400 font-semibold">{result.targetRole}</span>
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Estimated learning time: {result.timeline}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills Summary */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card className="bg-green-500/10 border-green-500/30">
                      <CardContent className="p-4">
                        <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" /> Skills You Have
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {[...result.hasRequired, ...result.hasPreferred].map((skill: string) => (
                            <Badge key={skill} className="bg-green-500/20 text-green-400 border-0">
                              {skill}
                            </Badge>
                          ))}
                          {result.hasRequired.length === 0 && result.hasPreferred.length === 0 && (
                            <span className="text-gray-500 text-sm">None selected</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-red-500/10 border-red-500/30">
                      <CardContent className="p-4">
                        <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                          <XCircle className="w-5 h-5" /> Skills to Learn
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {[...result.missingRequired, ...result.missingPreferred].slice(0, 8).map((skill: string) => (
                            <Badge key={skill} className="bg-red-500/20 text-red-400 border-0">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Learning Roadmap */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-orange-400" />
                        Your Learning Roadmap
                      </h3>
                      
                      <div className="space-y-4">
                        {result.roadmap.slice(0, 6).map((item: any, i: number) => (
                          <div key={i} className="p-4 bg-white/5 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                                  {i + 1}
                                </div>
                                <span className="text-white font-medium">{item.skill}</span>
                              </div>
                              <Badge className={item.priority === 'Required' ? 'bg-red-500/20 text-red-400 border-0' : 'bg-yellow-500/20 text-yellow-400 border-0'}>
                                {item.priority}
                              </Badge>
                            </div>
                            
                            <div className="ml-8 flex flex-wrap gap-2">
                              {item.resources.map((res: any, j: number) => (
                                <a
                                  key={j}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  {res.type === 'video' && <Play className="w-3 h-3" />}
                                  {res.type === 'course' && <BookOpen className="w-3 h-3" />}
                                  {res.type === 'practice' && <Zap className="w-3 h-3" />}
                                  {res.name}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => { setResult(null); setTargetRole(''); setCurrentSkills([]); }}
                      variant="outline"
                      className="flex-1 border-white/10 text-white hover:bg-white/5"
                    >
                      ← Try Another Role
                    </Button>
                    <Button
                      onClick={shareOnFacebook}
                      className="flex-1 bg-[#1877f2] hover:bg-[#166fe5]"
                    >
                      <Facebook className="w-4 h-4 mr-2" /> Share My Progress
                    </Button>
                  </div>

                  {/* Rating */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Was this helpful?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRated('up')}
                            className={`p-2 rounded-lg ${rated === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}
                          >
                            <ThumbsUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setRated('down')}
                            className={`p-2 rounded-lg ${rated === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}
                          >
                            <ThumbsDown className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <p className="text-gray-500 mb-4">Ready to apply your skills?</p>
            <Button 
              asChild
              variant="outline" 
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            >
              <a href="/jobs">
                Find Jobs That Match <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  )
}

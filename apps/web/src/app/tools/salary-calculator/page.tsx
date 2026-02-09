'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Card, CardContent } from '@/components/shared/ui/card'
import { Label } from '@/components/shared/ui/label'
import { 
  DollarSign, TrendingUp, MapPin, Briefcase, ArrowRight, Award,
  Clock, Moon, Building2, GraduationCap, Zap, ThumbsUp, ThumbsDown,
  Facebook, MessageCircle, Share2, ChevronRight, Info, Sparkles
} from 'lucide-react'
import Header from '@/components/shared/layout/Header'

// BPO Salary Data (2024-2025 Philippine Market)
const ROLES = {
  'csr-voice': { 
    name: 'Customer Service Rep (Voice)', 
    base: { min: 18000, max: 28000 },
    desc: 'Phone-based customer support'
  },
  'csr-nonvoice': { 
    name: 'Customer Service Rep (Non-Voice)', 
    base: { min: 16000, max: 25000 },
    desc: 'Email/chat support'
  },
  'tech-support': { 
    name: 'Technical Support Rep', 
    base: { min: 22000, max: 35000 },
    desc: 'IT/tech troubleshooting'
  },
  'sales': { 
    name: 'Sales Representative', 
    base: { min: 20000, max: 40000 },
    desc: 'Outbound sales + commissions'
  },
  'team-leader': { 
    name: 'Team Leader / Supervisor', 
    base: { min: 35000, max: 55000 },
    desc: 'Manages 10-20 agents'
  },
  'qa': { 
    name: 'Quality Analyst', 
    base: { min: 28000, max: 45000 },
    desc: 'Call monitoring & feedback'
  },
  'trainer': { 
    name: 'Trainer', 
    base: { min: 35000, max: 50000 },
    desc: 'New hire training'
  },
  'wfm': { 
    name: 'Workforce Management', 
    base: { min: 40000, max: 65000 },
    desc: 'Scheduling & forecasting'
  },
  'ops-manager': { 
    name: 'Operations Manager', 
    base: { min: 70000, max: 120000 },
    desc: 'Manages multiple teams'
  },
  'account-manager': { 
    name: 'Account Manager', 
    base: { min: 60000, max: 100000 },
    desc: 'Client relationship management'
  },
}

const LOCATIONS = [
  { id: 'manila', name: 'Metro Manila (BGC, Makati, Ortigas)', modifier: 1.0 },
  { id: 'cebu', name: 'Cebu IT Park', modifier: 0.92 },
  { id: 'clark', name: 'Clark / Pampanga', modifier: 0.90 },
  { id: 'davao', name: 'Davao', modifier: 0.88 },
  { id: 'iloilo', name: 'Iloilo', modifier: 0.85 },
  { id: 'provinces', name: 'Other Provinces', modifier: 0.82 },
]

const ACCOUNTS = [
  { id: 'general', name: 'General / Retail', modifier: 1.0 },
  { id: 'telco', name: 'Telco (Globe, PLDT, etc)', modifier: 1.05 },
  { id: 'tech', name: 'Tech / Software', modifier: 1.10 },
  { id: 'finance', name: 'Banking / Finance', modifier: 1.15 },
  { id: 'healthcare', name: 'Healthcare / Insurance', modifier: 1.20 },
]

const SHIFTS = [
  { id: 'day', name: 'Day Shift (6AM-6PM)', modifier: 1.0 },
  { id: 'mid', name: 'Mid Shift (2PM-12AM)', modifier: 1.05 },
  { id: 'night', name: 'Night/Graveyard (10PM-8AM)', modifier: 1.15 },
]

const ENGLISH_LEVELS = [
  { id: 'basic', name: 'Basic', modifier: 0.95 },
  { id: 'conversational', name: 'Conversational', modifier: 1.0 },
  { id: 'fluent', name: 'Fluent', modifier: 1.08 },
  { id: 'native', name: 'Native-like / IELTS 7+', modifier: 1.15 },
]

export default function SalaryCalculatorPage() {
  const [role, setRole] = useState('')
  const [experience, setExperience] = useState(0)
  const [location, setLocation] = useState('')
  const [account, setAccount] = useState('')
  const [shift, setShift] = useState('')
  const [englishLevel, setEnglishLevel] = useState('')
  const [typingSpeed, setTypingSpeed] = useState(40)
  const [hasCertifications, setHasCertifications] = useState(false)
  
  const [result, setResult] = useState<any>(null)
  const [rated, setRated] = useState<'up' | 'down' | null>(null)

  const calculateSalary = () => {
    if (!role || !location || !shift || !englishLevel) return
    
    const roleData = ROLES[role as keyof typeof ROLES]
    const locationData = LOCATIONS.find(l => l.id === location)!
    const accountData = ACCOUNTS.find(a => a.id === account) || ACCOUNTS[0]
    const shiftData = SHIFTS.find(s => s.id === shift)!
    const englishData = ENGLISH_LEVELS.find(e => e.id === englishLevel)!

    let minSalary = roleData.base.min
    let maxSalary = roleData.base.max

    // Experience bonus: +5% per year, capped at 50%
    const expBonus = Math.min(experience * 0.05, 0.5)
    minSalary *= (1 + expBonus)
    maxSalary *= (1 + expBonus)

    // Location modifier
    minSalary *= locationData.modifier
    maxSalary *= locationData.modifier

    // Account type modifier
    minSalary *= accountData.modifier
    maxSalary *= accountData.modifier

    // Shift modifier
    minSalary *= shiftData.modifier
    maxSalary *= shiftData.modifier

    // English level modifier
    minSalary *= englishData.modifier
    maxSalary *= englishData.modifier

    // Typing speed bonus (for CSR/tech roles)
    if (['csr-voice', 'csr-nonvoice', 'tech-support'].includes(role)) {
      if (typingSpeed >= 60) {
        minSalary *= 1.05
        maxSalary *= 1.05
      } else if (typingSpeed >= 50) {
        minSalary *= 1.02
        maxSalary *= 1.02
      }
    }

    // Certifications bonus
    if (hasCertifications) {
      minSalary *= 1.08
      maxSalary *= 1.08
    }

    const midSalary = (minSalary + maxSalary) / 2
    const marketMid = (roleData.base.min + roleData.base.max) / 2

    // Calculate breakdown
    const breakdown = []
    if (expBonus > 0) breakdown.push({ label: `${experience}yr experience`, value: `+${Math.round(expBonus * 100)}%` })
    if (locationData.modifier !== 1) breakdown.push({ label: locationData.name.split(' ')[0], value: `${locationData.modifier > 1 ? '+' : ''}${Math.round((locationData.modifier - 1) * 100)}%` })
    if (accountData.modifier !== 1) breakdown.push({ label: accountData.name.split(' ')[0], value: `+${Math.round((accountData.modifier - 1) * 100)}%` })
    if (shiftData.modifier !== 1) breakdown.push({ label: 'Night differential', value: `+${Math.round((shiftData.modifier - 1) * 100)}%` })
    if (englishData.modifier !== 1) breakdown.push({ label: englishData.name.split(' ')[0] + ' English', value: `${englishData.modifier > 1 ? '+' : ''}${Math.round((englishData.modifier - 1) * 100)}%` })
    if (typingSpeed >= 50) breakdown.push({ label: `${typingSpeed} WPM typing`, value: `+${typingSpeed >= 60 ? 5 : 2}%` })
    if (hasCertifications) breakdown.push({ label: 'Certifications', value: '+8%' })

    setResult({
      min: Math.round(minSalary),
      max: Math.round(maxSalary),
      mid: Math.round(midSalary),
      marketMid: Math.round(marketMid),
      percentile: midSalary > marketMid ? Math.min(Math.round(50 + ((midSalary - marketMid) / marketMid) * 100), 95) : Math.max(Math.round(50 - ((marketMid - midSalary) / marketMid) * 100), 10),
      breakdown,
      tips: generateTips(role, experience, englishLevel, typingSpeed, hasCertifications, shift)
    })
  }

  const generateTips = (role: string, exp: number, english: string, typing: number, certs: boolean, shift: string) => {
    const tips = []
    if (english !== 'native' && english !== 'fluent') {
      tips.push({ text: 'Improve English to Fluent/IELTS 7+', impact: '+8-15% salary' })
    }
    if (typing < 50 && ['csr-voice', 'csr-nonvoice', 'tech-support'].includes(role)) {
      tips.push({ text: 'Increase typing speed to 50+ WPM', impact: '+2-5% salary' })
    }
    if (!certs) {
      tips.push({ text: 'Get TESDA NC II or industry certs', impact: '+8% salary' })
    }
    if (shift === 'day') {
      tips.push({ text: 'Consider night shift for premium pay', impact: '+15% salary' })
    }
    if (exp < 2) {
      tips.push({ text: 'Stay 1-2 years to level up', impact: '+10% salary' })
    }
    return tips.slice(0, 3)
  }

  const isValid = role && location && shift && englishLevel

  const shareOnFacebook = () => {
    if (!result) return
    const roleData = ROLES[role as keyof typeof ROLES]
    const text = encodeURIComponent(`💰 I calculated my BPO salary potential: ₱${result.min.toLocaleString()} - ₱${result.max.toLocaleString()} for ${roleData.name}! Check yours:`)
    const url = encodeURIComponent('https://bpoc.io/tools/salary-calculator')
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400')
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-black to-emerald-950 opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />

        <div className="relative z-10 container mx-auto px-4 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300">
              <DollarSign className="w-5 h-5 mr-2 inline" />
              2025 Philippine BPO Market Data
            </Badge>

            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                BPO Salary
              </span>
              <br />
              <span className="text-white">Calculator</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Know your worth. Calculate what you should be earning based on your experience, location, and skills.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardContent className="p-6 md:p-8 space-y-6">
                      {/* Role Selection */}
                      <div>
                        <Label className="text-white mb-3 block text-lg">What role are you targeting?</Label>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {Object.entries(ROLES).map(([id, data]) => (
                            <button
                              key={id}
                              onClick={() => setRole(id)}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                role === id
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              }`}
                            >
                              <div className="text-white font-medium">{data.name}</div>
                              <div className="text-gray-500 text-sm">{data.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Experience Slider */}
                      <div>
                        <Label className="text-white mb-3 block text-lg">Years of BPO Experience</Label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={experience}
                            onChange={e => setExperience(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                          />
                          <div className="w-20 text-center">
                            <span className="text-2xl font-bold text-green-400">{experience}</span>
                            <span className="text-gray-500 text-sm ml-1">years</span>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <Label className="text-white mb-3 block text-lg">Location</Label>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {LOCATIONS.map(loc => (
                            <button
                              key={loc.id}
                              onClick={() => setLocation(loc.id)}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                location === loc.id
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-white text-sm">{loc.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Account Type */}
                      <div>
                        <Label className="text-white mb-3 block text-lg">Account Type</Label>
                        <div className="flex flex-wrap gap-2">
                          {ACCOUNTS.map(acc => (
                            <button
                              key={acc.id}
                              onClick={() => setAccount(acc.id)}
                              className={`px-4 py-2 rounded-lg border transition-all ${
                                account === acc.id
                                  ? 'border-green-500 bg-green-500/10 text-green-400'
                                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                              }`}
                            >
                              {acc.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shift */}
                      <div>
                        <Label className="text-white mb-3 block text-lg">Shift Preference</Label>
                        <div className="grid sm:grid-cols-3 gap-2">
                          {SHIFTS.map(s => (
                            <button
                              key={s.id}
                              onClick={() => setShift(s.id)}
                              className={`p-3 rounded-lg border text-center transition-all ${
                                shift === s.id
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              }`}
                            >
                              {s.id === 'night' && <Moon className="w-4 h-4 mx-auto mb-1 text-yellow-400" />}
                              <div className="text-white text-sm">{s.name.split(' ')[0]}</div>
                              <div className="text-gray-500 text-xs">{s.name.match(/\(.*\)/)?.[0]}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* English Level */}
                      <div>
                        <Label className="text-white mb-3 block text-lg">English Proficiency</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ENGLISH_LEVELS.map(eng => (
                            <button
                              key={eng.id}
                              onClick={() => setEnglishLevel(eng.id)}
                              className={`p-3 rounded-lg border text-center transition-all ${
                                englishLevel === eng.id
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-white/10 bg-white/5 hover:border-white/20'
                              }`}
                            >
                              <div className="text-white text-sm">{eng.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Typing Speed & Certs */}
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-white mb-3 block">Typing Speed (WPM)</Label>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="20"
                              max="80"
                              value={typingSpeed}
                              onChange={e => setTypingSpeed(parseInt(e.target.value))}
                              className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                            <span className="text-green-400 font-bold">{typingSpeed}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-white mb-3 block">Certifications?</Label>
                          <button
                            onClick={() => setHasCertifications(!hasCertifications)}
                            className={`px-4 py-2 rounded-lg border transition-all ${
                              hasCertifications
                                ? 'border-green-500 bg-green-500/10 text-green-400'
                                : 'border-white/10 bg-white/5 text-gray-300'
                            }`}
                          >
                            {hasCertifications ? '✓ Yes (TESDA, IELTS, etc)' : 'No certifications'}
                          </button>
                        </div>
                      </div>

                      {/* Calculate Button */}
                      <Button
                        onClick={calculateSalary}
                        disabled={!isValid}
                        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Calculate My Salary
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Main Result */}
                  <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-8 text-center relative">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
                      
                      <h2 className="text-lg text-gray-400 mb-2">Your Estimated Salary Range</h2>
                      <div className="text-5xl md:text-6xl font-black text-white mb-2">
                        ₱{result.min.toLocaleString()} - ₱{result.max.toLocaleString()}
                      </div>
                      <p className="text-green-400 text-lg">per month</p>

                      <div className="mt-6 flex items-center justify-center gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">₱{result.mid.toLocaleString()}</div>
                          <div className="text-gray-500 text-sm">Your Average</div>
                        </div>
                        <div className="w-px h-12 bg-white/20" />
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-500">₱{result.marketMid.toLocaleString()}</div>
                          <div className="text-gray-500 text-sm">Market Average</div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <Badge className={`px-4 py-2 ${result.percentile > 50 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                          <TrendingUp className="w-4 h-4 mr-1 inline" />
                          Top {100 - result.percentile}% of earners in this role
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Breakdown */}
                  {result.breakdown.length > 0 && (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Info className="w-5 h-5 text-green-400" />
                          Salary Breakdown
                        </h3>
                        <div className="space-y-2">
                          {result.breakdown.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                              <span className="text-gray-400">{item.label}</span>
                              <span className={item.value.startsWith('+') ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tips */}
                  {result.tips.length > 0 && (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="p-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          How to Increase Your Salary
                        </h3>
                        <div className="space-y-3">
                          {result.tips.map((tip: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <ChevronRight className="w-5 h-5 text-green-400 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-white">{tip.text}</span>
                              </div>
                              <Badge className="bg-green-500/20 text-green-400 border-0">{tip.impact}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => setResult(null)}
                      variant="outline"
                      className="flex-1 border-white/10 text-white hover:bg-white/5"
                    >
                      ← Recalculate
                    </Button>
                    <Button
                      onClick={shareOnFacebook}
                      className="flex-1 bg-[#1877f2] hover:bg-[#166fe5]"
                    >
                      <Facebook className="w-4 h-4 mr-2" /> Share Results
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
                            className={`p-2 rounded-lg transition-colors ${rated === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                          >
                            <ThumbsUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setRated('down')}
                            className={`p-2 rounded-lg transition-colors ${rated === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
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

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <p className="text-gray-500 mb-4">Ready to find jobs that match your salary expectations?</p>
            <Button 
              asChild
              variant="outline" 
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <a href="/jobs">
                Browse BPO Jobs <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  )
}

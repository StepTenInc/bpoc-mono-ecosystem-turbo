'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select'
import { TrendingUp, MapPin, Briefcase, DollarSign, ArrowRight, Award } from 'lucide-react'
import Header from '@/components/shared/layout/Header'

// Simple salary data (hardcoded for now - you can move to DB later)
const SALARY_DATA: Record<string, { min: number, max: number }> = {
  'Customer Service Representative': { min: 18000, max: 25000 },
  'Technical Support Representative': { min: 20000, max: 28000 },
  'Team Leader': { min: 30000, max: 45000 },
  'Quality Analyst': { min: 22000, max: 32000 },
  'Account Manager': { min: 50000, max: 80000 },
  'Operations Manager': { min: 60000, max: 100000 }
}

export default function SalaryCalculatorPage() {
  const [position, setPosition] = useState('')
  const [experience, setExperience] = useState('')
  const [location, setLocation] = useState('')
  const [englishLevel, setEnglishLevel] = useState('')
  const [result, setResult] = useState<any>(null)

  const calculateSalary = () => {
    const baseData = SALARY_DATA[position] || { min: 18000, max: 25000 }
    let min = baseData.min
    let max = baseData.max

    // Experience bonus: +5% per year
    const expYears = parseInt(experience) || 0
    min += min * 0.05 * expYears
    max += max * 0.05 * expYears

    // Location bonus (Manila is base, provinces -10%)
    if (location === 'Provinces') {
      min *= 0.9
      max *= 0.9
    }

    // English level bonus
    if (englishLevel === 'Fluent') {
      min *= 1.10
      max *= 1.10
    } else if (englishLevel === 'Conversational') {
      min *= 1.05
      max *= 1.05
    }

    const marketAvg = (baseData.min + baseData.max) / 2
    const yourAvg = (min + max) / 2

    setResult({
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(yourAvg),
      marketAvg: Math.round(marketAvg),
      comparison: yourAvg > marketAvg ? 'above' : yourAvg < marketAvg ? 'below' : 'at'
    })
  }

  const canCalculate = position && experience && location && englishLevel

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-black to-emerald-950 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[150px]" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30">
            <DollarSign className="w-5 h-5 mr-2 inline" />
            Updated 2026 • Career Roadmap
          </Badge>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(34,197,94,0.5)]">
              BPO Salary
            </span>
            <br />
            <span className="text-white drop-shadow-[0_0_40px_rgba(34,197,94,0.2)]">Calculator</span>
          </h1>

          <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
            Know your worth in the job market
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
            className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-gray-800/50 hover:border-green-500/70 transition-all duration-500 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_90px_-15px_rgba(34,197,94,0.4)]"
          >
            {/* Gradient glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6 text-green-400">Your Details</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Position</label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white hover:border-green-500/50 focus:border-green-500/70 transition-all">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      {Object.keys(SALARY_DATA).map(pos => (
                        <SelectItem key={pos} value={pos} className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Years of Experience</label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white hover:border-green-500/50 focus:border-green-500/70 transition-all">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      <SelectItem value="0" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">0-1 years</SelectItem>
                      <SelectItem value="1" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">1-2 years</SelectItem>
                      <SelectItem value="2" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">2-3 years</SelectItem>
                      <SelectItem value="3" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">3-5 years</SelectItem>
                      <SelectItem value="5" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Location</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white hover:border-green-500/50 focus:border-green-500/70 transition-all">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      <SelectItem value="Metro Manila" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Metro Manila</SelectItem>
                      <SelectItem value="Cebu" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Cebu</SelectItem>
                      <SelectItem value="Davao" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Davao</SelectItem>
                      <SelectItem value="Provinces" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Other Provinces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">English Level</label>
                  <Select value={englishLevel} onValueChange={setEnglishLevel}>
                    <SelectTrigger className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white hover:border-green-500/50 focus:border-green-500/70 transition-all">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white rounded-xl">
                      <SelectItem value="Basic" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Basic</SelectItem>
                      <SelectItem value="Conversational" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Conversational</SelectItem>
                      <SelectItem value="Fluent" className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">Fluent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={calculateSalary}
                    disabled={!canCalculate}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] disabled:opacity-50 disabled:cursor-not-allowed border-0 text-white font-bold text-lg py-6 rounded-2xl transition-all duration-300"
                  >
                    Calculate Salary 💰
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right: Results */}
          {result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-green-500/70 shadow-[0_30px_90px_-15px_rgba(34,197,94,0.5)]"
            >
              {/* Gradient glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl" />

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

              <div className="relative z-10 space-y-8">
                <div className="text-center">
                  <DollarSign className="w-20 h-20 mx-auto mb-6 text-green-400" />
                  <div className="text-7xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(34,197,94,0.6)] mb-3">
                    ₱{result.min.toLocaleString()} - {result.max.toLocaleString()}
                  </div>
                  <div className="text-xl text-gray-400 font-semibold">per month</div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/50 p-6 rounded-2xl border border-green-500/30">
                    <div className="text-sm text-gray-400 mb-2 font-semibold">Your Average</div>
                    <div className="text-3xl font-black text-green-400">₱{result.avg.toLocaleString()}</div>
                  </div>
                  <div className="bg-black/50 p-6 rounded-2xl border border-gray-800">
                    <div className="text-sm text-gray-400 mb-2 font-semibold">Market Average</div>
                    <div className="text-3xl font-black text-gray-300">₱{result.marketAvg.toLocaleString()}</div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border-2 ${
                  result.comparison === 'above' ? 'bg-green-500/10 border-green-500/50' :
                  result.comparison === 'below' ? 'bg-orange-500/10 border-orange-500/50' :
                  'bg-blue-500/10 border-blue-500/50'
                }`}>
                  <p className={`font-bold text-lg ${
                    result.comparison === 'above' ? 'text-green-400' :
                    result.comparison === 'below' ? 'text-orange-400' :
                    'text-blue-400'
                  }`}>
                    {result.comparison === 'above' && '🎉 You\'re above market rate!'}
                    {result.comparison === 'below' && '💡 You\'re below market rate'}
                    {result.comparison === 'at' && '✅ You\'re at market rate'}
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-emerald-300 text-lg mb-4">💡 How to increase your salary:</p>
                  {englishLevel !== 'Fluent' && (
                    <div className="flex items-start gap-3 p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                      <TrendingUp className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-300">
                        <span className="font-bold text-green-400">Improve English to Fluent:</span> +10% salary (+₱{Math.round(result.avg * 0.1).toLocaleString()}/month)
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                    <Award className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300">
                      <span className="font-bold text-purple-400">Get certified skills:</span> Stand out to recruiters with verified certificates
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                    <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300">
                      <span className="font-bold text-blue-400">Work in Metro Manila:</span> Higher salary opportunities in major cities
                    </div>
                  </div>
                </div>
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
                <DollarSign className="w-24 h-24 mx-auto text-gray-700" />
                <p className="text-2xl text-gray-500 font-semibold">Fill in your details to see your salary estimate</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

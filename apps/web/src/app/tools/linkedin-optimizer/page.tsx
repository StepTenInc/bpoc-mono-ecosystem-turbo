'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Textarea } from '@/components/shared/ui/textarea'
import { Loader2, CheckCircle, XCircle, Lightbulb, Linkedin, Sparkles, ArrowRight } from 'lucide-react'
import Header from '@/components/shared/layout/Header'

export default function LinkedInOptimizerPage() {
  const [profileText, setProfileText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const analyzeProfile = async () => {
    setLoading(true)

    // Simple analysis (can add AI later)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Fake delay

    const wordCount = profileText.split(/\s+/).length
    const hasHeadline = profileText.toLowerCase().includes('customer service') || profileText.toLowerCase().includes('bpo')
    const hasEmail = profileText.includes('@')
    const hasPhone = /\+?\d{10,}/.test(profileText)

    const score = Math.min(100,
      (wordCount > 50 ? 30 : wordCount > 20 ? 15 : 0) +
      (hasHeadline ? 30 : 0) +
      (hasEmail ? 20 : 0) +
      (hasPhone ? 20 : 0)
    )

    setResult({
      score,
      strengths: [
        ...(hasHeadline ? ['Clear job title/headline'] : []),
        ...(hasEmail ? ['Contact information included'] : []),
        ...(wordCount > 50 ? ['Detailed profile'] : [])
      ],
      weaknesses: [
        ...(!hasHeadline ? ['No clear job title or headline'] : []),
        ...(!hasEmail ? ['Missing email address'] : []),
        ...(wordCount < 50 ? ['Profile too short - add more detail'] : []),
        ...(!hasPhone ? ['No phone number'] : [])
      ],
      suggestions: [
        'Add specific BPO skills: Customer Service, Technical Support, etc.',
        'Include your WPM typing speed if > 40',
        'Mention years of experience in headline',
        'Add education and certifications',
        'Use keywords: BPO, Call Center, Customer Experience'
      ]
    })

    setLoading(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return { text: 'text-green-400', stroke: '#10b981', bg: 'from-green-500/10', border: 'border-green-500/30' }
    if (score >= 40) return { text: 'text-orange-400', stroke: '#fb923c', bg: 'from-orange-500/10', border: 'border-orange-500/30' }
    return { text: 'text-red-400', stroke: '#f87171', bg: 'from-red-500/10', border: 'border-red-500/30' }
  }

  const scoreColor = result ? getScoreColor(result.score) : null

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-black to-indigo-950 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30">
            <Sparkles className="w-5 h-5 mr-2 inline" />
            AI-Powered Analysis
          </Badge>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(59,130,246,0.5)]">
              LinkedIn Profile
            </span>
            <br />
            <span className="text-white drop-shadow-[0_0_40px_rgba(59,130,246,0.2)]">Optimizer</span>
          </h1>

          <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
            Get instant AI tips to stand out to BPO recruiters
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
            className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-gray-800/50 hover:border-blue-500/70 transition-all duration-500 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_90px_-15px_rgba(59,130,246,0.4)]"
          >
            {/* Gradient glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6 text-blue-400 flex items-center gap-3">
                <Linkedin className="w-8 h-8" />
                Your Profile
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">
                    Paste Your LinkedIn Profile Text
                  </label>
                  <Textarea
                    placeholder="Paste your LinkedIn profile here... Include your headline, about section, experience, and skills."
                    value={profileText}
                    onChange={(e) => setProfileText(e.target.value)}
                    className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:border-blue-500/70 focus:outline-none focus:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all resize-none min-h-[300px]"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Tip: Copy all sections from your LinkedIn profile for best results
                  </p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={analyzeProfile}
                    disabled={!profileText || loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed border-0 text-white font-bold text-lg py-6 rounded-2xl transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Analyze Profile
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
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
              className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-blue-500/70 shadow-[0_30px_90px_-15px_rgba(59,130,246,0.5)]"
            >
              {/* Gradient glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl" />

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

              <div className="relative z-10 space-y-8">
                {/* Circular Score Gauge */}
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
                        stroke={scoreColor?.stroke}
                        strokeWidth="16"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 502" }}
                        animate={{ strokeDasharray: `${(result.score / 100) * 502} 502` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    {/* Score Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className={`text-6xl font-black ${scoreColor?.text} drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]`}
                      >
                        {result.score}
                      </motion.div>
                      <div className="text-sm text-gray-400 font-semibold">/ 100</div>
                    </div>
                  </div>
                  <div className="text-xl text-gray-300 font-semibold">Profile Strength Score</div>
                </div>

                {/* Strengths */}
                {result.strengths.length > 0 && (
                  <div className="bg-green-500/5 p-6 rounded-2xl border border-green-500/30">
                    <h3 className="font-black text-green-400 mb-4 flex items-center gap-2 text-lg">
                      <CheckCircle className="w-6 h-6" />
                      Strengths
                    </h3>
                    <ul className="space-y-3">
                      {result.strengths.map((s: string, i: number) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-gray-300 flex items-start gap-2"
                        >
                          <span className="text-green-400 mt-0.5">✓</span>
                          {s}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {result.weaknesses.length > 0 && (
                  <div className={`p-6 rounded-2xl border ${scoreColor?.bg} ${scoreColor?.border}`}>
                    <h3 className={`font-black ${scoreColor?.text} mb-4 flex items-center gap-2 text-lg`}>
                      <XCircle className="w-6 h-6" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-3">
                      {result.weaknesses.map((w: string, i: number) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-gray-300 flex items-start gap-2"
                        >
                          <span className={scoreColor?.text}>✗</span>
                          {w}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                <div className="bg-purple-500/5 p-6 rounded-2xl border border-purple-500/30">
                  <h3 className="font-black text-purple-400 mb-4 flex items-center gap-2 text-lg">
                    <Lightbulb className="w-6 h-6" />
                    AI Suggestions
                  </h3>
                  <ul className="space-y-3">
                    {result.suggestions.map((s: string, i: number) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-gray-300 flex items-start gap-2 text-sm"
                      >
                        <span className="text-purple-400 mt-0.5">💡</span>
                        {s}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tip */}
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl border border-blue-500/30">
                  <p className="font-black text-blue-300 mb-2 text-lg">🚀 Pro Tip:</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Add "Verified 50+ WPM" from our typing test to stand out to BPO recruiters! Get certified for just ₱50.
                  </p>
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
                <Linkedin className="w-24 h-24 mx-auto text-gray-700" />
                <p className="text-2xl text-gray-500 font-semibold">Paste your profile and analyze to get AI tips</p>
                <p className="text-sm text-gray-600 max-w-md">
                  Our AI will analyze your profile and give you actionable tips to get more recruiter views
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

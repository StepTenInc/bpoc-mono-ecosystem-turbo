'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Badge } from '@/components/shared/ui/badge'
import { Copy, Check, ArrowRight, Mail, Users, Sparkles, Trophy, Crown, Share2, Heart, Star, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Header from '@/components/shared/layout/Header'

export default function EmailSignaturePage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    phone: '',
    email: '',
    company: ''
  })
  const [copied, setCopied] = useState(false)

  const generateSignature = () => {
    return `
<table style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 400px;">
  <tr>
    <td style="padding: 10px 0;">
      <div style="font-size: 18px; font-weight: bold; color: #06b6d4;">${formData.name || '[Your Name]'}</div>
      <div style="color: #666; margin-top: 4px;">${formData.title || '[Job Title]'}</div>
      ${formData.company ? `<div style="color: #666; margin-top: 2px;">${formData.company}</div>` : ''}
      <div style="margin-top: 12px; line-height: 1.6;">
        ${formData.phone ? `<div>📞 ${formData.phone}</div>` : ''}
        ${formData.email ? `<div>📧 <a href="mailto:${formData.email}" style="color: #06b6d4; text-decoration: none;">${formData.email}</a></div>` : ''}
        <div style="margin-top: 8px; font-size: 11px; color: #999;">
          Powered by <a href="https://bpocareers.io" style="color: #06b6d4; text-decoration: none;">BPO Careers</a>
        </div>
      </div>
    </td>
  </tr>
</table>
    `.trim()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSignature())
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Email signature copied to clipboard. Paste it in your email settings."
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const isFormValid = formData.name && formData.email

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-pink-950 opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px]" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* DESIGN MOCKUP: Live Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-6 mb-8"
        >
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-full px-6 py-2 backdrop-blur-sm">
            <span className="text-purple-300 text-sm font-bold">
              <Users className="w-4 h-4 inline mr-2" />
              1,234 signatures created today
            </span>
          </div>
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-full px-6 py-2 backdrop-blur-sm relative group">
            <span className="text-pink-300 text-sm font-bold">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              98% get hired faster
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 border border-pink-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-2xl">
                💡 DESIGN IDEA: Real stats from platform
              </div>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30">
            <Mail className="w-5 h-5 mr-2 inline" />
            Free Tool
          </Badge>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(168,85,247,0.4)]">
              Email Signature
            </span>
            <br />
            <span className="text-white drop-shadow-[0_0_40px_rgba(168,85,247,0.2)]">Generator</span>
          </h1>

          <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
            Professional signatures for Gmail & Outlook in seconds
          </p>

          {/* DESIGN MOCKUP: Social Proof */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="flex -space-x-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-black flex items-center justify-center text-xs font-bold">
                  {i}
                </div>
              ))}
            </div>
            <span className="text-gray-400 text-sm">
              Join 12,847 professionals with <span className="text-purple-400 font-bold">stunning signatures</span>
            </span>
          </div>
        </motion.div>

        {/* 2-Column Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-gray-800/50 hover:border-purple-500/70 transition-all duration-500 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_90px_-15px_rgba(168,85,247,0.4)]"
          >
            {/* Gradient glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

            {/* DESIGN MOCKUP: Progress indicator */}
            <div className="absolute top-4 right-4 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-1 text-xs font-bold text-purple-300 relative group/progress">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {isFormValid ? '100% Complete' : '40% Complete'}
              {/* Tooltip */}
              <div className="absolute top-full right-0 mt-2 opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 border border-purple-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-2xl">
                  💡 DESIGN IDEA: Progress gamification
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-6 text-purple-400">Your Details</h2>

              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-bold mb-2 text-gray-300">Full Name *</label>
                  <Input
                    placeholder="Juan Dela Cruz"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:border-purple-500/70 focus:outline-none focus:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all"
                  />
                  {formData.name && (
                    <div className="absolute right-3 top-11 text-green-400">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Job Title *</label>
                  <Input
                    placeholder="Customer Service Representative"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:border-purple-500/70 focus:outline-none focus:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Company</label>
                  <Input
                    placeholder="Company Name (Optional)"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:border-purple-500/70 focus:outline-none focus:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Phone Number</label>
                  <Input
                    placeholder="+63 917 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:border-purple-500/70 focus:outline-none focus:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Email *</label>
                  <Input
                    type="email"
                    placeholder="juan@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-black/50 border-2 border-gray-800 rounded-xl p-4 text-white placeholder-gray-500 focus:border-purple-500/70 focus:outline-none focus:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all"
                  />
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={copyToClipboard}
                    disabled={!isFormValid}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:cursor-not-allowed border-0 text-white font-bold text-lg py-6 rounded-2xl transition-all duration-300"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copy Signature
                      </>
                    )}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>

                {/* DESIGN MOCKUP: Quick templates */}
                <div className="pt-4 border-t border-gray-800 relative group/templates">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Quick Templates:</span>
                    <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-300 text-xs">
                      NEW
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Modern', 'Classic', 'Bold'].map((template) => (
                      <button
                        key={template}
                        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-3 text-xs font-semibold text-purple-300 hover:border-purple-500/50 hover:bg-purple-500/20 transition-all"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover/templates:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 border border-purple-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-2xl">
                      💡 DESIGN IDEA: Pre-made templates library
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="relative group bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-10 border-2 border-gray-800/50 hover:border-pink-500/70 transition-all duration-500 shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_90px_-15px_rgba(236,72,153,0.4)]"
          >
            {/* Gradient glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-3xl" />

            {/* DESIGN MOCKUP: Share/Like buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-pink-500/20 border border-pink-500/30 rounded-full p-2 hover:bg-pink-500/30 transition-all relative group/share">
                <Share2 className="w-4 h-4 text-pink-300" />
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 opacity-0 group-hover/share:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 border border-pink-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-2xl">
                    💡 IDEA: Share on LinkedIn
                  </div>
                </div>
              </button>
              <button className="bg-pink-500/20 border border-pink-500/30 rounded-full p-2 hover:bg-pink-500/30 transition-all relative group/like">
                <Heart className="w-4 h-4 text-pink-300" />
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 opacity-0 group-hover/like:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 border border-pink-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-2xl">
                    💡 IDEA: Save to favorites
                  </div>
                </div>
              </button>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black text-pink-400">Preview</h2>
                {/* DESIGN MOCKUP: Quality score */}
                {isFormValid && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1 relative group/score"
                  >
                    <Star className="w-4 h-4 text-green-400 fill-green-400" />
                    <span className="text-green-400 text-sm font-bold">Professional</span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover/score:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-gray-900 border border-green-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-2xl">
                        💡 DESIGN IDEA: AI quality scorer
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div
                className="bg-white border-2 border-gray-800 rounded-2xl p-6 mb-6 shadow-inner"
                dangerouslySetInnerHTML={{ __html: generateSignature() }}
              />

              <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/30">
                <p className="font-bold text-purple-300 mb-3 text-lg">📧 How to add to Gmail:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                  <li>Click "Copy Signature" button</li>
                  <li>Open Gmail Settings → See all settings</li>
                  <li>Scroll to "Signature" section</li>
                  <li>Click "+ Create new"</li>
                  <li>Press Ctrl+V (Cmd+V on Mac) to paste</li>
                </ol>
              </div>

              {/* DESIGN MOCKUP: Next steps CTA */}
              <div className="mt-6 p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl relative group/nextsteps">
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-pink-300 text-sm mb-1">Next: Build your resume!</p>
                    <p className="text-gray-400 text-xs">Complete your profile to get 3x more job matches</p>
                  </div>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover/nextsteps:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 border border-pink-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-2xl">
                    💡 DESIGN IDEA: Cross-sell other tools
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* DESIGN MOCKUP: Achievement unlock */}
        {copied && (
          <motion.div
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0 }}
            className="fixed bottom-8 right-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl p-6 backdrop-blur-xl shadow-2xl max-w-sm relative group/achievement"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-black text-yellow-400 text-lg">Achievement Unlocked!</p>
                <p className="text-gray-300 text-sm">Signature Creator</p>
                <p className="text-gray-400 text-xs">+10 XP</p>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 opacity-0 group-hover/achievement:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 border border-yellow-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-2xl">
                💡 DESIGN IDEA: Gamification with XP/badges
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/shared/ui/card'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { Mail, Keyboard, Calculator, Linkedin, Target, ArrowRight, Sparkles, Users, Trophy } from 'lucide-react'
import Header from '@/components/shared/layout/Header'

const TOOLS = [
  {
    id: 'email-signature',
    title: 'Email Signature Generator',
    description: 'Create professional email signatures with your photo. Works with Gmail & Outlook.',
    icon: Mail,
    gradient: 'from-purple-500 to-cyan-500',
    href: '/tools/email-signature',
    popular: false
  },
  {
    id: 'salary-calculator',
    title: 'BPO Salary Calculator',
    description: 'Find out what you should be earning based on your experience, location, and skills.',
    icon: Calculator,
    gradient: 'from-green-500 to-emerald-500',
    href: '/tools/salary-calculator',
    popular: true
  },
  {
    id: 'linkedin-optimizer',
    title: 'LinkedIn Profile Optimizer',
    description: 'Get specific tips to make your profile stand out to BPO recruiters.',
    icon: Linkedin,
    gradient: 'from-blue-500 to-indigo-500',
    href: '/tools/linkedin-optimizer',
    popular: false
  },
  {
    id: 'skills-gap',
    title: 'Skills Gap Analyzer',
    description: 'Discover what skills you need and get a free learning roadmap to your dream role.',
    icon: Target,
    gradient: 'from-orange-500 to-amber-500',
    href: '/tools/skills-gap',
    popular: false
  },
  {
    id: 'typing-test',
    title: 'Typing Speed Test',
    description: 'Test your WPM and accuracy. Most BPO jobs require 35-40+ WPM.',
    icon: Keyboard,
    gradient: 'from-yellow-500 to-orange-500',
    href: '/tools/typing-test',
    popular: true
  }
]

export default function ToolsPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-black to-purple-950 opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />

        <div className="relative z-10 container mx-auto px-4 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30 text-cyan-300">
              <Sparkles className="w-5 h-5 mr-2 inline" />
              100% Free • No Login Required
            </Badge>

            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Free Career Tools
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to land your dream BPO job. Built for Filipino professionals.
            </p>
          </motion.div>

          {/* Tools Grid */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {TOOLS.map((tool, i) => {
                const Icon = tool.icon
                return (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <Link href={tool.href}>
                      <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer h-full overflow-hidden relative">
                        {tool.popular && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              <Trophy className="w-3 h-3 mr-1" /> Popular
                            </Badge>
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                            {tool.title}
                          </h2>
                          <p className="text-gray-400 mb-4">
                            {tool.description}
                          </p>
                          <div className="flex items-center text-cyan-400 font-medium">
                            Try it free <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            >
              {[
                { value: '5', label: 'Free Tools' },
                { value: '100%', label: 'Free Forever' },
                { value: '<2 min', label: 'Average Time' },
                { value: 'No', label: 'Login Required' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Find Your Dream Job?</h2>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                These tools are just the start. Create a free account to get personalized job matches and AI-powered career guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                  <Link href="/register">
                    Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/10 text-white hover:bg-white/5">
                  <Link href="/jobs">
                    Browse Jobs
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}

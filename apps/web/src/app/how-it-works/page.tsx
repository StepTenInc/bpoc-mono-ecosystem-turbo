'use client';

import { motion } from 'framer-motion';
import Header from '@/components/shared/layout/Header';
import Footer from '@/components/shared/layout/Footer';
import { Button } from '@/components/shared/ui/button';
import {
  UserPlus,
  FileEdit,
  FileText,
  LayoutDashboard,
  Target,
  Download,
  Briefcase,
  Video,
  Bell,
  Users,
  Handshake,
  DollarSign,
  CheckCircle,
  Upload,
  Award,
  ArrowRight,
  Sparkles,
  Rocket
} from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    id: 1,
    title: 'Sign Up',
    description: 'Create your free BPOC account in under 2 minutes.',
    icon: UserPlus,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'group-hover:border-cyan-500/50',
    details: [
      'Quick email verification',
      'No credit card required',
      'Instant access to platform'
    ]
  },
  {
    id: 2,
    title: 'Complete Your Profile',
    description: 'Build a comprehensive profile with auto-save.',
    icon: FileEdit,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'group-hover:border-purple-500/50',
    details: [
      'Personal info & location',
      'Work preferences & salary expectations',
      'Social links & portfolio',
      'Real-time completion tracking (16 fields)'
    ]
  },
  {
    id: 3,
    title: 'Build Your AI Resume',
    description: 'Create an ATS-optimized resume with AI assistance.',
    icon: FileText,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'group-hover:border-pink-500/50',
    details: [
      'Upload existing resume or start fresh',
      'AI analysis with 4-score breakdown',
      'Real-time preview & editing',
      'Export, save & share'
    ]
  },
  {
    id: 4,
    title: 'Access Your Dashboard',
    description: 'Track everything from one central hub.',
    icon: LayoutDashboard,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'group-hover:border-orange-500/50',
    details: [
      'Profile completion progress',
      'Application tracking',
      'Job matches overview',
      'Quick actions & notifications'
    ]
  },
  {
    id: 5,
    title: 'Get AI Job Matches',
    description: 'Our AI matches you to perfect BPO roles.',
    icon: Target,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'group-hover:border-emerald-500/50',
    details: [
      '0-100% match scoring per job',
      'Skills, salary & experience matching',
      '"Why You Match" AI insights',
      'Advanced filtering & sorting'
    ]
  },
  {
    id: 6,
    title: 'Share Your Resume',
    description: 'Download, save, and share your professional resume.',
    icon: Download,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'group-hover:border-blue-500/50',
    details: [
      'Export as PDF with templates',
      'Shareable profile links',
      'Save multiple versions',
      'One-click apply with resume'
    ]
  },
  {
    id: 7,
    title: 'Apply to Real Jobs',
    description: 'One-click applications to verified BPO positions.',
    icon: Briefcase,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'group-hover:border-indigo-500/50',
    details: [
      'Apply with one click',
      'Track application status',
      'Accept/decline invitations',
      'Real jobs from real companies'
    ]
  },
  {
    id: 8,
    title: 'Video Screening',
    description: 'Get vetted by professional recruiters via video call.',
    icon: Video,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'group-hover:border-violet-500/50',
    details: [
      'Pre-screen & multiple round interviews',
      'Recorded calls with AI transcripts',
      'Professional recruiter feedback',
      'Call notes & ratings'
    ]
  },
  {
    id: 9,
    title: 'Real-Time Updates',
    description: 'Stay informed throughout your application journey.',
    icon: Bell,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'group-hover:border-amber-500/50',
    details: [
      'Instant status notifications',
      'Interview reminders',
      'Application pipeline tracker',
      'Email & in-app alerts'
    ]
  },
  {
    id: 10,
    title: 'Meet Real Clients',
    description: 'Recruiters release you to actual hiring companies.',
    icon: Users,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'group-hover:border-rose-500/50',
    details: [
      'Vetted by recruiters first',
      'Shared with real employers',
      'Client feedback visible',
      'No fake job postings'
    ]
  },
  {
    id: 11,
    title: 'Client Video Interviews',
    description: 'Sit in on video interviews with actual clients.',
    icon: Handshake,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'group-hover:border-teal-500/50',
    details: [
      'Direct employer interviews',
      'Scheduled with countdown timers',
      'Join meeting links provided',
      'Interview outcome tracking'
    ]
  },
  {
    id: 12,
    title: 'Receive Job Offers',
    description: 'Get formal offers with full details and benefits.',
    icon: DollarSign,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'group-hover:border-green-500/50',
    details: [
      'Salary & benefits breakdown',
      'Start date & work arrangement',
      'Offer expiration tracking',
      'Full terms & conditions'
    ]
  },
  {
    id: 13,
    title: 'Negotiate Offers',
    description: 'Make counter-offers and negotiate your terms.',
    icon: CheckCircle,
    color: 'text-lime-400',
    bgColor: 'bg-lime-500/10',
    borderColor: 'group-hover:border-lime-500/50',
    details: [
      'Counter-offer system',
      'Real-time negotiation tracking',
      'Percentage increase calculator',
      'Employer responses visible'
    ]
  },
  {
    id: 14,
    title: 'Accept Your Offer',
    description: 'Confirm your acceptance and move to onboarding.',
    icon: Rocket,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'group-hover:border-yellow-500/50',
    details: [
      'One-click acceptance',
      'Contract generation',
      'Digital signatures',
      'Automatic onboarding activation'
    ]
  },
  {
    id: 15,
    title: 'Complete Onboarding',
    description: 'Upload documents and complete Philippines 201 file.',
    icon: Upload,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'group-hover:border-cyan-500/50',
    details: [
      'Government IDs (SSS, TIN, PhilHealth, Pag-IBIG)',
      'Medical clearance & education docs',
      'Data privacy consent & e-signature',
      '8-step wizard with auto-save'
    ]
  },
  {
    id: 16,
    title: 'Start Day One',
    description: 'Confirm your first day and begin your new career.',
    icon: Award,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'group-hover:border-purple-500/50',
    details: [
      'Placement congratulations page',
      'Confirm Day 1 button',
      'Contract access & download',
      'Full preparation checklist'
    ]
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0D] overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200">

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute inset-0 cyber-grid opacity-[0.03]" />
      </div>

      <Header />

      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 1.5 }}
              className="inline-flex items-center justify-center p-3 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-gray-300">End-to-End Recruitment Journey</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              How <span className="gradient-text">BPOC.IO</span> Works
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              From creating your profile to starting Day 1 at your dream BPO job.<br className="hidden md:block" />
              Our AI-powered platform guides you through every single step.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">100% Real Jobs · No Fake Postings · Verified Employers</span>
            </div>
          </motion.div>

          {/* Steps Timeline */}
          <div className="relative max-w-6xl mx-auto">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/50 via-emerald-500/50 to-yellow-500/50 transform -translate-x-1/2" />

            <div className="space-y-12 md:space-y-20 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Step Content */}
                  <div className="flex-1 w-full">
                    <div className={`group p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 ${step.borderColor} transition-all duration-300 relative overflow-hidden`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-xl ${step.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/10`}>
                            <step.icon className={`w-7 h-7 ${step.color}`} />
                          </div>
                          <span className="text-6xl font-bold text-white/5 font-mono absolute right-4 top-4">{step.id < 10 ? `0${step.id}` : step.id}</span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-gray-400 mb-6 leading-relaxed">{step.description}</p>

                        <div className="space-y-3">
                          {step.details.map((detail, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                              <CheckCircle className={`w-4 h-4 ${step.color} mt-0.5 flex-shrink-0`} />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Dot */}
                  <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#0B0B0D] border-2 border-white/20 shadow-[0_0_0_8px_rgba(255,255,255,0.05)]">
                    <div className={`w-3 h-3 rounded-full ${step.bgColor.replace('/10', '')} animate-pulse`} />
                  </div>

                  {/* Empty space for alignment */}
                  <div className="flex-1 w-full hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mt-32 mb-12"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-8">
              <Rocket className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-semibold">Join Thousands of Candidates Already Hired</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Start Your <span className="gradient-text">BPO Career?</span>
            </h2>

            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Try our free AI resume analyzer and see how you rank against other candidates
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/try-resume-builder">
                <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 border-0">
                  Try Free Resume Analyzer <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('openSignupModal'));
                  }
                }}
                className="h-16 px-10 text-lg rounded-full border-2 border-white/20 hover:bg-white/10 hover:border-white/40"
              >
                Create Free Account <UserPlus className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              No credit card required · 100% free · Start in under 2 minutes
            </p>
          </motion.div>

        </div>
      </div>

      <Footer />
    </div>
  );
}

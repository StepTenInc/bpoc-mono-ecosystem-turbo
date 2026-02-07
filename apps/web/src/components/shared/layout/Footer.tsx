"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Facebook, Github, Send, ArrowRight, ShieldCheck, Globe, Zap, Star, Heart } from 'lucide-react'
import { AnimatedLogo } from '@/components/shared/ui/AnimatedLogo'
import { Button } from '@/components/shared/ui/button'

export default function Footer() {
  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/bpoc.io", label: "Facebook", color: "hover:text-blue-500 hover:border-blue-500/50" }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <footer className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-black">

      {/* Decorative Top Border with Animated Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-2 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-xl"
      />

      {/* Ambient Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.08, 0.05]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px]"
        />
        {/* Cyber Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:linear-gradient(180deg,transparent,white,transparent)]" />
      </div>

      <div className="container mx-auto relative z-10">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16"
        >

          {/* Brand Column - Enhanced */}
          <div className="md:col-span-4 space-y-8">
            <Link href="/" className="flex items-center space-x-3 group w-fit">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative w-14 h-14 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 overflow-hidden group-hover:border-cyan-500/30 transition-all shadow-lg shadow-black/50">
                  <AnimatedLogo />
                </div>
              </motion.div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                  BPOC.IO
                </span>
                <span className="text-[10px] tracking-[0.2em] text-cyan-500/80 font-mono uppercase">System Online</span>
              </div>
            </Link>

            <p className="text-gray-400 leading-relaxed text-sm max-w-sm">
              The next-generation recruitment ecosystem powered by AI. Connecting elite Filipino talent with global opportunities for perfect skill and culture alignment.
            </p>

            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Follow Us</span>
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 transition-all duration-300 group hover:bg-gradient-to-br hover:from-blue-500/30 hover:to-blue-600/30 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]`}
                  >
                    <social.icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-semibold text-white">5.0</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                <span className="font-medium">Made in 🇵🇭</span>
              </div>
            </div>
          </div>

          {/* Links Columns - Enhanced */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-10 lg:gap-14">

            {/* Column 1 - Platform */}
            <motion.div variants={itemVariants} className="space-y-5">
              <h4 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full" />
                Platform
              </h4>
              <ul className="space-y-3.5">
                {[
                  { label: "Free Resume Analyzer", href: "/try-resume-builder" },
                  { label: "Insights", href: "/insights" },
                  { label: "How It Works", href: "/how-it-works" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-cyan-400 transition-all duration-200 text-sm flex items-center gap-2.5 group">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(0,217,255,0.6)] transition-all duration-200"
                        whileHover={{ scale: 1.5 }}
                      />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Column 2 - Company */}
            <motion.div variants={itemVariants} className="space-y-5">
              <h4 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-600 rounded-full" />
                Company
              </h4>
              <ul className="space-y-3.5">
                {[
                  { label: "About Us", href: "/about" },
                  { label: "Contact Support", href: "/contact-support" },
                  { label: "For Agencies", href: "/recruiter/signup" },
                  { label: "Partners", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-purple-400 transition-all duration-200 text-sm flex items-center gap-2.5 group">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-200"
                        whileHover={{ scale: 1.5 }}
                      />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Column 3 - Legal */}
            <motion.div variants={itemVariants} className="space-y-5">
              <h4 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-gradient-to-b from-green-400 to-emerald-600 rounded-full" />
                Legal
              </h4>
              <ul className="space-y-3.5">
                {[
                  { label: "Privacy Policy", href: "/privacy-policy" },
                  { label: "Terms & Conditions", href: "/terms-and-conditions" },
                  { label: "Cookie Policy", href: "/cookie-policy" },
                  { label: "Data Security", href: "/data-security" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-green-400 transition-all duration-200 text-sm flex items-center gap-2.5 group">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-green-400 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.6)] transition-all duration-200"
                        whileHover={{ scale: 1.5 }}
                      />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Column 4 - BPOC Ecosystem */}
            <motion.div variants={itemVariants} className="space-y-5">
              <h4 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-gradient-to-b from-pink-400 to-red-600 rounded-full" />
                BPOC Ecosystem
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <div className="flex flex-col gap-1.5 group">
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-pink-400 group-hover:shadow-[0_0_8px_rgba(244,114,182,0.6)] transition-all duration-200"
                        whileHover={{ scale: 1.5 }}
                      />
                      <span className="text-gray-400 group-hover:text-pink-400 transition-all duration-200 text-sm flex items-center gap-2">
                        🎮 BPOC.games
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 font-semibold uppercase tracking-wide">
                          Coming Soon
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 ml-4 leading-relaxed">
                      Career skill testing games
                    </p>
                  </div>
                </li>
                <li>
                  <div className="flex flex-col gap-1.5 group">
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-pink-400 group-hover:shadow-[0_0_8px_rgba(244,114,182,0.6)] transition-all duration-200"
                        whileHover={{ scale: 1.5 }}
                      />
                      <span className="text-gray-400 group-hover:text-pink-400 transition-all duration-200 text-sm flex items-center gap-2">
                        📚 BPOC.courses
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 font-semibold uppercase tracking-wide">
                          Coming Soon
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 ml-4 leading-relaxed">
                      AI tools, APIs, automation, admin skills
                    </p>
                  </div>
                </li>
              </ul>
            </motion.div>

          </div>
        </motion.div>

        {/* Bottom Bar - Enhanced */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-gray-500 text-sm font-medium">
              &copy; {new Date().getFullYear()} BPOC.IO. All rights reserved.
            </p>
            <motion.div
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center gap-2 text-xs text-gray-600 bg-white/5 px-4 py-2 rounded-full border border-white/5"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
              />
              <span className="font-mono font-semibold">All Systems Operational</span>
            </motion.div>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/recruiter" className="text-xs font-mono text-gray-500 hover:text-cyan-400 transition-all duration-200 flex items-center gap-2 group">
              <motion.span
                className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"
                initial={{ x: -5 }}
                whileHover={{ x: 0 }}
              >
                &gt;
              </motion.span>
              <span className="tracking-wide">RECRUITER_LOGIN</span>
            </Link>
            <Link href="/admin" className="text-xs font-mono text-gray-500 hover:text-purple-400 transition-all duration-200 flex items-center gap-2 group">
              <motion.span
                className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400"
                initial={{ x: -5 }}
                whileHover={{ x: 0 }}
              >
                &gt;
              </motion.span>
              <span className="tracking-wide">ADMIN_ACCESS</span>
            </Link>
          </div>
        </motion.div>

        {/* Built with Love Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-gray-600 flex items-center justify-center gap-2">
            Built with <Heart className="w-3 h-3 text-red-400 fill-red-400 animate-pulse" /> for Filipino BPO professionals
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

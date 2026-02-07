"use client"

import { motion } from 'framer-motion'
import { Building2, Globe, Shield, Zap, Cpu, Network } from 'lucide-react'

const partners = [
  { name: "TechFlow BPO", icon: Cpu },
  { name: "GlobalConnect", icon: Globe },
  { name: "SecureStaff", icon: Shield },
  { name: "RapidScale", icon: Zap },
  { name: "Nexus Solutions", icon: Network },
  { name: "Elite Support", icon: Building2 },
  // Duplicate for seamless loop
  { name: "TechFlow BPO", icon: Cpu },
  { name: "GlobalConnect", icon: Globe },
  { name: "SecureStaff", icon: Shield },
  { name: "RapidScale", icon: Zap },
  { name: "Nexus Solutions", icon: Network },
  { name: "Elite Support", icon: Building2 },
]

export default function TrustedPartners() {
  return (
    <div className="py-12 border-y border-white/5 bg-black/40 backdrop-blur-sm relative overflow-hidden">
      <div className="container mx-auto px-4 mb-8 text-center">
        <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Trusted by Next-Gen Agencies</p>
      </div>

      <div className="flex overflow-hidden relative group">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0B0B0D] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0B0B0D] to-transparent z-10" />
        
        <motion.div 
          className="flex gap-16 items-center whitespace-nowrap"
          animate={{ x: [0, -1000] }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {[...partners, ...partners].map((partner, i) => (
            <div key={i} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-default group/item">
              <partner.icon className="w-8 h-8 text-gray-400 group-hover/item:text-cyan-400 transition-colors" />
              <span className="text-xl font-bold text-gray-400 group-hover/item:text-white transition-colors">{partner.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}


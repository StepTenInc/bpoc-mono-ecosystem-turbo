'use client';

import { Button } from '@/components/shared/ui/button';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ResumeBuilderCTA() {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <FileText className="w-24 h-24 text-cyan-400 rotate-12" />
      </div>
      
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 border border-cyan-500/30">
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          Resume not passing?
        </h3>
        
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Our AI Resume Builder is designed to beat the ATS filters used by BPO companies. Get a "hired-ready" resume in minutes.
        </p>
        
        <Link href="/resume-builder">
          <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.6)] transition-all">
            Build My Resume Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
      
      {/* Animated Border Gradient */}
      <div className="absolute inset-0 border border-cyan-500/0 group-hover:border-cyan-500/30 rounded-2xl transition-all duration-500 pointer-events-none" />
    </motion.div>
  );
}













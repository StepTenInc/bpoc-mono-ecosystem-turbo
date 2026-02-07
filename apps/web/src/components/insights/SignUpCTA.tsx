'use client';

import { Button } from '@/components/shared/ui/button';
import { UserPlus, Rocket, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SignUpCTA() {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 backdrop-blur-md relative overflow-hidden group"
    >
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-purple-400" />
          Get Hired Faster
        </h3>
        
        <ul className="space-y-3 mb-6">
          {[
            'Direct access to top BPO employers',
            'One-click application',
            'Salary transparency'
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        
        <Link href="/auth/signup">
          <Button variant="outline" className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-white hover:border-purple-500/50 transition-all">
            <UserPlus className="w-4 h-4 mr-2" />
            Create Free Account
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}













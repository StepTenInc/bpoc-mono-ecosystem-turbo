'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: 'cyan' | 'orange' | 'green' | 'red' | 'amber' | 'gray';
  delay?: number;
  subtitle?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  color = 'gray',
  delay = 0,
  subtitle
}: StatsCardProps) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    gray: 'bg-white/5 border-white/10 text-white'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`
        backdrop-blur-sm border rounded-xl p-6
        ${colorClasses[color]}
        hover:bg-white/10 transition-colors duration-200
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={`text-sm ${color === 'gray' ? 'text-white/70' : ''}`}>
          {label}
        </p>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-xs opacity-70 mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}


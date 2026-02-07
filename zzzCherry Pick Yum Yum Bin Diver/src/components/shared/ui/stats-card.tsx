'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string; // Tailwind gradient classes e.g., "from-orange-500 to-amber-500"
  href?: string;
  badge?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  delay?: number;
  format?: 'number' | 'currency' | 'percentage';
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * end);
      
      if (current !== countRef.current) {
        countRef.current = current;
        setCount(current);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  href,
  badge,
  trend,
  loading = false,
  delay = 0,
  format = 'number',
}: StatsCardProps) {
  const animatedValue = useAnimatedCounter(loading ? 0 : value, 1200);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `₱${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const content = (
    <Card className="relative overflow-hidden bg-white/5 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-all duration-300 group cursor-pointer">
      {/* Glassmorphism hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-white tabular-nums">
                {loading ? (
                  <span className="h-8 w-16 bg-white/10 rounded animate-pulse inline-block" />
                ) : (
                  formatValue(animatedValue)
                )}
              </p>
              {trend && !loading && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${
                  trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {trend.isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {badge && (
              <span className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                {badge}
              </span>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {href && (
          <div className="mt-4 flex items-center text-gray-400 text-sm group-hover:text-orange-400 transition-colors">
            <span>View details</span>
            <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
    >
      {href ? <Link href={href}>{content}</Link> : content}
    </motion.div>
  );
}

export default StatsCard;









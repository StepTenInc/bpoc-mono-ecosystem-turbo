'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: {
    x: number;
    y: number;
  };
}

interface CelebrationEffectProps {
  trigger: boolean;
  duration?: number; // Duration in ms
  particleCount?: number;
  colors?: string[];
  spread?: number; // Spread angle in degrees
  origin?: { x: number; y: number }; // Origin point (0-1 range)
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  '#f97316', // orange-500
  '#fbbf24', // amber-400
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#ffffff', // white
];

export function CelebrationEffect({
  trigger,
  duration = 3000,
  particleCount = 50,
  colors = DEFAULT_COLORS,
  spread = 90,
  origin = { x: 0.5, y: 0.3 },
  onComplete,
}: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(false);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const spreadRad = (spread * Math.PI) / 180;
    const startAngle = -Math.PI / 2 - spreadRad / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = startAngle + Math.random() * spreadRad;
      const velocity = 5 + Math.random() * 10;
      
      newParticles.push({
        id: i,
        x: origin.x * 100,
        y: origin.y * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
        },
      });
    }
    
    return newParticles;
  }, [particleCount, colors, spread, origin]);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      setParticles(createParticles());
      
      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, isActive, duration, createParticles, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              x: `calc(${particle.x}vw + ${particle.velocity.x * 40}px)`,
              y: `calc(${particle.y}vh + ${particle.velocity.y * 40 + 200}px)`,
              opacity: 0,
              scale: 0.5,
              rotate: particle.rotation + 360,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: duration / 1000,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              boxShadow: `0 0 ${particle.size}px ${particle.color}40`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Simple sparkle burst effect
export function SparkleEffect({
  trigger,
  x,
  y,
}: {
  trigger: boolean;
  x: number;
  y: number;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setActive(true);
      const timer = setTimeout(() => setActive(false), 600);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!active) return null;

  return (
    <div 
      className="fixed pointer-events-none z-[9999]"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{ 
            scale: [0, 1, 0],
            x: Math.cos((i * Math.PI * 2) / 8) * 30,
            y: Math.sin((i * Math.PI * 2) / 8) * 30,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full bg-yellow-400"
          style={{
            boxShadow: '0 0 8px #fbbf24',
          }}
        />
      ))}
    </div>
  );
}

// Success check animation
export function SuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-8 h-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path d="M5 12l5 5L20 7" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CelebrationEffect;









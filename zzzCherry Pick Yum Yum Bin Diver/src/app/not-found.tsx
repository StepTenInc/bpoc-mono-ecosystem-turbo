'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import {
  Home,
  FileText,
  Zap,
  Users,
  Briefcase,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Info,
  Lightbulb,
  Skull,
  Eye,
  Flame
} from 'lucide-react';

export default function NotFound() {
  const [rotation, setRotation] = useState(180);
  const [isSpinning, setIsSpinning] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [confusionLevel, setConfusionLevel] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{ left: number; top: number; delay: number }>>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [chaosLevel, setChaosLevel] = useState(1);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [matrixRain, setMatrixRain] = useState<Array<{ x: number; delay: number; duration: number }>>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Generate MASSIVE particle system - 100 particles
    setParticles(
      Array.from({ length: 100 }, (_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: i * 0.05,
      }))
    );

    // Generate matrix rain columns
    setMatrixRain(
      Array.from({ length: 30 }, (_, i) => ({
        x: (i / 30) * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
      }))
    );

    // INTENSE glitch
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 100);
    }, 2000);

    // Rapid confusion increase
    const confusionInterval = setInterval(() => {
      setConfusionLevel((prev) => (prev + 3) % 360);
    }, 20);

    // Chaos level increases over time
    const chaosInterval = setInterval(() => {
      setChaosLevel((prev) => Math.min(prev + 0.1, 10));
    }, 1000);

    return () => {
      clearInterval(glitchInterval);
      clearInterval(confusionInterval);
      clearInterval(chaosInterval);
    };
  }, []);

  const tryToRotate = () => {
    setIsSpinning(true);
    setAttemptCount((prev) => prev + 1);

    // More violent fake rotation each time
    const violence = attemptCount * 5;
    const fakeRotation = 180 + (Math.random() * violence * 2 - violence);
    setRotation(fakeRotation);

    setTimeout(() => {
      setRotation(180);
      setIsSpinning(false);
      // Increase chaos on each failed attempt
      setChaosLevel((prev) => Math.min(prev + 0.5, 10));
    }, 600);
  };

  const generateConfusionImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setImageError(null);
    setGenerationProgress(0);

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 5, 90));
    }, 200);

    try {
      // MEME-WORTHY CHAOS PROMPT ENGINEERING!
      const memeStyles = [
        'in the style of a cursed meme with distorted proportions and exaggerated expressions',
        'as an unhinged cartoon with wild eyes and chaotic energy like a fever dream',
        'like a deep fried meme with oversaturated colors and maximum chaos',
        'as a surreal cartoon nightmare with impossible physics and trippy visuals',
        'in the style of adult swim bumpers - abstract, weird, and oddly hilarious',
        'like a youtube thumbnail clickbait on steroids with shocked face and explosion effects',
        'as if drawn by a caffeinated cartoonist having a mental breakdown',
        'in maximalist meme art style with every pixel screaming for attention'
      ];

      const chaosElements = [
        'Reality is melting like Salvador Dali met a glitch artist.',
        'Physics have left the chat. Gravity is crying.',
        'The universe is buffering at 404% capacity.',
        'Existence.exe has stopped responding.',
        'Time and space are arguing in the background.',
        'The simulation is running on Windows Vista.',
        'Quantum mechanics gave up and went home.',
        'The matrix is rebooting with dial-up internet.'
      ];

      const visualChaos = [
        'Neon cyan, electric purple, hot pink, and toxic green colors clashing violently.',
        'Glitch effects, screen tearing, VHS distortion, and digital artifacts everywhere.',
        'Exaggerated cartoon proportions, bug eyes, and unhinged facial expressions.',
        'Floating random objects, impossible geometry, and recursive loops.',
        'Lightning bolts, explosion effects, spiral backgrounds, and motion lines going crazy.',
        'Pixelated chaos, chromatic aberration, and reality fragmenting into geometric shards.',
        'Surreal dreamscape with melting textures and warped perspectives.',
        'Maximum saturation, bloom effects, and lens flares on everything.'
      ];

      const randomMemeStyle = memeStyles[Math.floor(Math.random() * memeStyles.length)];
      const randomChaosElement = chaosElements[Math.floor(Math.random() * chaosElements.length)];
      const randomVisualChaos = visualChaos[Math.floor(Math.random() * visualChaos.length)];

      // TRANSFORM THEIR BORING INPUT INTO ABSOLUTE MEME GOLD
      const memefiedPrompt = `${imagePrompt} ${randomMemeStyle}. ${randomChaosElement} ${randomVisualChaos} Ultra chaotic cartoon meme energy. Make it UNHINGED. Add comic sans text saying "404" somewhere. BPO office worker losing their mind in the digital void. Professional chaos meets internet culture. This is NOT a normal image. This is a MEME MASTERPIECE. Maximum cartoon insanity. Make people laugh and question reality simultaneously.`;

      console.log('🎨 MEME PROMPT:', memefiedPrompt);

      const response = await fetch('/api/admin/insights/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: memefiedPrompt,
          title: '404 Meme Chaos',
          style: 'illustration', // Changed to illustration for more cartoon vibes
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setGenerationProgress(100);
        setTimeout(() => {
          setGeneratedImageUrl(data.imageUrl);
        }, 300);
      } else {
        setImageError(data.error || 'Image generation failed. Our AI might be as confused as you are!');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setImageError('Connection error. The chaos is too strong!');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGeneratingImage(false);
        setGenerationProgress(0);
      }, 500);
    }
  };

  // Public pages only (no auth required)
  const sitemap = [
    { name: 'Home', url: '/', icon: Home, description: 'Start fresh' },
    { name: 'How It Works', url: '/#how-it-works', icon: Info, description: 'Learn the process' },
    { name: 'Resume Builder', url: '/try-resume-builder', icon: FileText, description: 'Build your resume' },
    { name: 'Free Tools', url: '/#tools', icon: Zap, description: 'Use our tools' },
    { name: 'Jobs Board', url: '/jobs', icon: Briefcase, description: 'Browse openings' },
    { name: 'Insights', url: '/insights', icon: Lightbulb, description: 'Read articles' },
    { name: 'Sign Up (Candidate)', url: '/candidate/signup', icon: Users, description: 'Join as candidate' },
    { name: 'Sign Up (Recruiter)', url: '/recruiter/signup', icon: Briefcase, description: 'Post jobs' },
  ];

  const errorMessages = [
    'GRAVITY REVERSED',
    'REALITY MALFUNCTION',
    'DIMENSION BREACH',
    'CHAOS DETECTED',
    'ERROR IN THE MATRIX',
    'PHYSICS OFFLINE',
    'TIMELINE CORRUPTED',
    'VOID ENCOUNTERED'
  ];

  const chaosDescriptions = [
    'Calm',
    'Mild Confusion',
    'Disoriented',
    'Very Confused',
    'Highly Unstable',
    'Critical Chaos',
    'Reality Bending',
    'Existential Crisis',
    'Maximum Disorder',
    'SINGULARITY'
  ];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        transform: `rotate(${rotation}deg) scale(${1 + (chaosLevel - 1) * 0.01})`,
        transition: isSpinning
          ? 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          : 'transform 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        filter: `hue-rotate(${confusionLevel}deg) saturate(${1 + chaosLevel * 0.1})`,
      }}
    >
      {/* Base black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Matrix rain effect */}
      {mounted && matrixRain.map((col, i) => (
        <motion.div
          key={`matrix-${i}`}
          className="absolute top-0 w-0.5 h-screen opacity-20"
          style={{
            left: `${col.x}%`,
            background: 'linear-gradient(to bottom, transparent, #06b6d4, transparent)',
          }}
          animate={{
            y: ['-100%', '100%'],
          }}
          transition={{
            duration: col.duration,
            repeat: Infinity,
            delay: col.delay,
            ease: 'linear',
          }}
        />
      ))}

      {/* Intense animated gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(circle at 20% 50%, rgba(6, 182, 212, ${0.3 + chaosLevel * 0.05}) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, ${0.3 + chaosLevel * 0.05}) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(236, 72, 153, ${0.2 + chaosLevel * 0.05}) 0%, transparent 50%)`,
            `radial-gradient(circle at 80% 20%, rgba(6, 182, 212, ${0.3 + chaosLevel * 0.05}) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(168, 85, 247, ${0.3 + chaosLevel * 0.05}) 0%, transparent 50%), radial-gradient(circle at 50% 60%, rgba(236, 72, 153, ${0.2 + chaosLevel * 0.05}) 0%, transparent 50%)`,
            `radial-gradient(circle at 50% 80%, rgba(6, 182, 212, ${0.3 + chaosLevel * 0.05}) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(168, 85, 247, ${0.3 + chaosLevel * 0.05}) 0%, transparent 50%), radial-gradient(circle at 20% 50%, rgba(236, 72, 153, ${0.2 + chaosLevel * 0.05}) 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 8 / chaosLevel,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Mega glitch overlay */}
      <AnimatePresence>
        {glitchActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.9, 0, 0.7, 0],
              x: [-20, 20, -15, 15, -10, 10, 0],
              scaleX: [1, 1.02, 0.98, 1.01, 1],
              filter: [
                'hue-rotate(0deg) contrast(1)',
                'hue-rotate(90deg) contrast(1.5)',
                'hue-rotate(180deg) contrast(1)',
                'hue-rotate(270deg) contrast(1.5)',
                'hue-rotate(360deg) contrast(1)',
              ],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 via-purple-500/40 to-pink-500/40 mix-blend-difference"
          />
        )}
      </AnimatePresence>

      {/* Massive floating orbs - MORE INTENSE */}
      <motion.div
        animate={{
          scale: [1, 1.5 * chaosLevel * 0.2, 1],
          opacity: [0.3, 0.7, 0.3],
          x: [0, 150 * chaosLevel * 0.1, 0],
          y: [0, -150 * chaosLevel * 0.1, 0],
        }}
        transition={{
          duration: 8 / Math.max(chaosLevel * 0.5, 1),
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-cyan-500 rounded-full blur-[250px]"
      />
      <motion.div
        animate={{
          scale: [1.5 * chaosLevel * 0.2, 1, 1.5 * chaosLevel * 0.2],
          opacity: [0.3, 0.7, 0.3],
          x: [0, -150 * chaosLevel * 0.1, 0],
          y: [0, 150 * chaosLevel * 0.1, 0],
        }}
        transition={{
          duration: 10 / Math.max(chaosLevel * 0.5, 1),
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-0 right-0 w-[1000px] h-[1000px] bg-purple-600 rounded-full blur-[250px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.4 * chaosLevel * 0.2, 1],
          opacity: [0.2, 0.6, 0.2],
          rotate: [0, 360],
        }}
        transition={{
          duration: 12 / Math.max(chaosLevel * 0.5, 1),
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-pink-500 rounded-full blur-[220px]"
      />

      {/* MASSIVE particle system - 100 particles */}
      {mounted &&
        particles.map((particle, i) => {
          const colors = ['#06b6d4', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${2 + (i % 4)}px`,
                height: `${2 + (i % 4)}px`,
                background: colors[i % colors.length],
              }}
              animate={{
                y: [0, -300 * chaosLevel * 0.15, 0],
                x: [
                  (i % 2 === 0 ? -80 : 80) * chaosLevel * 0.1,
                  (i % 2 === 0 ? 80 : -80) * chaosLevel * 0.1,
                  (i % 2 === 0 ? -80 : 80) * chaosLevel * 0.1
                ],
                opacity: [0, 1, 0],
                scale: [0, 2.5 + chaosLevel * 0.2, 0],
                rotate: [0, 720],
              }}
              transition={{
                duration: 5 + (i % 5),
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut',
              }}
            />
          );
        })}

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        {/* Chaos meter */}
        <motion.div
          className="fixed top-4 right-4 z-50"
          animate={{
            scale: chaosLevel > 5 ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: chaosLevel > 5 ? Infinity : 0,
          }}
        >
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl rounded-2xl p-4 border-2 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <p className="text-xs text-gray-400 mb-2">Chaos Level</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {chaosLevel.toFixed(1)}
              </div>
              <div className="text-xs text-red-400 font-bold">
                {chaosDescriptions[Math.min(Math.floor(chaosLevel), 9)]}
              </div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
                animate={{
                  width: `${(chaosLevel / 10) * 100}%`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Pulsing Alert Badge */}
        <motion.div
          className="flex justify-center mb-8"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          <Badge className="text-lg md:text-xl px-6 md:px-8 py-3 md:py-4 bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 mr-3 inline animate-pulse" />
            SYSTEM ANOMALY DETECTED
          </Badge>
        </motion.div>

        {/* Massive 404 */}
        <motion.div
          className="text-center mb-12"
          animate={glitchActive ? {
            x: [-30, 30, -20, 20, 0],
            y: [0, 15, -15, 10, -10, 0],
            skewX: [0, 5, -5, 0],
          } : {}}
        >
          <motion.div
            className="text-[15rem] md:text-[25rem] lg:text-[35rem] font-black leading-none mb-6"
            style={{
              background: 'linear-gradient(to right, #06b6d4, #a855f7, #ec4899, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 80px rgba(6, 182, 212, 0.9))',
            }}
            animate={{
              filter: [
                `drop-shadow(0 0 ${80 + chaosLevel * 10}px rgba(6, 182, 212, 0.9))`,
                `drop-shadow(0 0 ${100 + chaosLevel * 10}px rgba(168, 85, 247, 0.9))`,
                `drop-shadow(0 0 ${80 + chaosLevel * 10}px rgba(236, 72, 153, 0.9))`,
                `drop-shadow(0 0 ${80 + chaosLevel * 10}px rgba(6, 182, 212, 0.9))`,
              ],
              scale: [1, 1 + chaosLevel * 0.01, 1],
            }}
            transition={{
              filter: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 2, repeat: Infinity },
            }}
          >
            404
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-black mb-6 leading-tight px-4"
            animate={{
              opacity: [1, 0.5, 1],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(6,182,212,0.6)]">
              {errorMessages[Math.floor(confusionLevel / 45) % errorMessages.length]}
            </span>
          </motion.h1>

          <motion.p
            className="text-2xl md:text-3xl text-gray-300 font-light mb-3 px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Page Not Found
          </motion.p>

          <motion.p
            className="text-lg md:text-xl text-cyan-400 font-bold px-4"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
            }}
          >
            Warning: Physics engine offline • Rotation: {rotation.toFixed(0)}°
          </motion.p>
        </motion.div>

        {/* AI Image Generator - WITH INSANE PRELOADER */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto mb-16 px-4"
        >
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.3)]">
            <div className="flex items-center justify-center gap-3 mb-6">
              <ImageIcon className="w-8 h-8 text-purple-400" />
              <h3 className="text-2xl md:text-3xl font-black text-white text-center">AI Meme Generator</h3>
              <Sparkles className="w-8 h-8 text-pink-400" />
            </div>
            <p className="text-gray-300 text-center mb-2 text-sm md:text-base">
              Describe your confusion and we'll turn it into MEME CHAOS
            </p>
            <motion.p
              className="text-cyan-400 text-center mb-6 text-xs md:text-sm font-bold"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            >
              Pro tip: You're typing upside down. Also, AI will make it WILD.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && generateConfusionImage()}
                placeholder="e.g., 'My brain broke' or 'screaming internally' or 'reality glitching'"
                className="flex-1 bg-black/50 border-2 border-purple-500/30 rounded-xl px-4 md:px-6 py-3 md:py-4 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm md:text-base"
                disabled={isGeneratingImage}
              />
              <Button
                onClick={generateConfusionImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 border-0 shadow-[0_0_40px_rgba(168,85,247,0.4)] font-black rounded-xl text-sm md:text-base"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {/* INSANE PRELOADER */}
            <AnimatePresence>
              {isGeneratingImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-black/50 p-12 mb-6"
                >
                  <div className="flex flex-col items-center justify-center">
                    {/* Spinning chaos icons */}
                    <div className="relative w-32 h-32 mb-8">
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Skull className="w-16 h-16 text-red-400" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      >
                        <Eye className="w-12 h-12 text-cyan-400" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Flame className="w-8 h-8 text-orange-400" />
                      </motion.div>
                    </div>

                    {/* Chaos text */}
                    <motion.p
                      className="text-2xl font-black text-white mb-4"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    >
                      MANIFESTING CHAOS...
                    </motion.p>

                    {/* Progress bar */}
                    <div className="w-full max-w-md">
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"
                          animate={{
                            width: `${generationProgress}%`,
                            backgroundPosition: ['0% 50%', '100% 50%'],
                          }}
                          transition={{
                            width: { duration: 0.3 },
                            backgroundPosition: { duration: 1, repeat: Infinity, ease: 'linear' },
                          }}
                          style={{
                            backgroundSize: '200% 100%',
                          }}
                        />
                      </div>
                      <p className="text-center text-sm text-gray-400">
                        {generationProgress}% - Reality distortion in progress
                      </p>
                    </div>

                    {/* Glitchy loading messages */}
                    <motion.div
                      className="mt-6 text-center"
                      animate={{
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <p className="text-xs text-purple-400 font-mono">
                        {['Bending reality...', 'Corrupting pixels...', 'Injecting chaos...', 'Warping dimensions...'][Math.floor(generationProgress / 25) % 4]}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generated image */}
            {generatedImageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)]"
              >
                <img src={generatedImageUrl} alt="Generated confusion art" className="w-full" />
              </motion.div>
            )}

            {/* Error message */}
            {imageError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm text-center"
              >
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                {imageError}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Interactive Rotation Control */}
        <div className="flex flex-col items-center mb-16 px-4">
          <motion.div
            className="bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-8 md:p-12 border-2 border-cyan-500/30 max-w-2xl w-full backdrop-blur-xl"
            whileHover={{ scale: 1.01 }}
            animate={{
              boxShadow: [
                '0 0 60px rgba(6, 182, 212, 0.3)',
                '0 0 80px rgba(168, 85, 247, 0.4)',
                '0 0 60px rgba(6, 182, 212, 0.3)',
              ],
            }}
            transition={{
              boxShadow: { duration: 3, repeat: Infinity },
            }}
          >
            <div className="text-center mb-8">
              <motion.div
                animate={{
                  rotate: confusionLevel * chaosLevel,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  rotate: { duration: 0.02, ease: 'linear' },
                  scale: { duration: 2, repeat: Infinity },
                }}
              >
                <RefreshCw className="w-20 h-20 md:w-24 md:h-24 mx-auto text-cyan-400 mb-6" />
              </motion.div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
                Attempt to Fix Orientation
              </h3>
              <p className="text-gray-400 text-base md:text-lg mb-6">
                Current rotation: <span className="text-cyan-400 font-bold">{rotation.toFixed(1)}°</span>
              </p>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-600"
                  animate={{
                    width: [`${confusionLevel % 100}%`],
                  }}
                  transition={{ duration: 0.02 }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Confusion Level: <span className="text-red-400 font-bold">{confusionLevel % 100}%</span>
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={tryToRotate}
                size="lg"
                className="w-full text-xl md:text-2xl py-6 md:py-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0 shadow-[0_0_60px_rgba(6,182,212,0.5)] hover:shadow-[0_0_100px_rgba(6,182,212,0.8)] font-black rounded-2xl group"
                disabled={isSpinning}
              >
                <RotateCw className={`w-6 h-6 md:w-8 md:h-8 mr-3 ${isSpinning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                {isSpinning ? 'CALIBRATING...' : 'FIX ORIENTATION'}
              </Button>
            </motion.div>

            <AnimatePresence>
              {attemptCount > 0 && !isSpinning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 text-center"
                >
                  <p className="text-red-400 font-bold text-base md:text-lg">
                    ERROR: Rotation failed ({attemptCount} attempt{attemptCount > 1 ? 's' : ''})
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {attemptCount >= 3 ? 'Maybe try using a link below instead?' : 'Try again?'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Public Escape Routes - UPDATED */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-7xl mx-auto px-4"
        >
          <div className="text-center mb-12 md:mb-16">
            <Badge className="mb-6 text-base md:text-lg px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30">
              <Zap className="w-5 h-5 mr-2 inline" />
              Public Access Routes
            </Badge>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Get Back on{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(6,182,212,0.4)]">
                Track
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-400">
              You wandered into the void. Pick a portal below to return.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {sitemap.map((link, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.08 }}
              >
                <Link href={link.url}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                    className="relative group h-full"
                  >
                    <div className="relative h-full bg-gradient-to-br from-gray-900/90 to-black rounded-3xl p-6 md:p-8 border-2 border-gray-800/50 group-hover:border-cyan-500/70 transition-all duration-500 overflow-hidden shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] group-hover:shadow-[0_30px_90px_-15px_rgba(6,182,212,0.4)]">
                      <motion.div
                        className="absolute -inset-[3px] rounded-3xl bg-gradient-to-r from-cyan-500 to-purple-600 opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-500 -z-10"
                      />

                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 border border-cyan-500/30 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all duration-300"
                      >
                        <link.icon className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
                      </motion.div>

                      <h3 className="text-xl md:text-2xl font-black mb-2 group-hover:text-cyan-400 transition-colors leading-tight">
                        {link.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">{link.description}</p>

                      <div className="flex items-center text-cyan-400 text-sm font-bold group-hover:text-cyan-300 transition-colors">
                        Go Here
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer chaos indicator - FIXED Z-INDEX */}
        <motion.div
          className="relative z-20 text-center mt-20 md:mt-32 px-4"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <div className="inline-block bg-gradient-to-r from-red-900/90 to-orange-900/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 border-2 border-red-500/50 shadow-[0_0_60px_rgba(239,68,68,0.4)]">
            <p className="text-lg md:text-xl text-white font-black mb-2">ERROR CODE: UPSIDE_DOWN_404</p>
            <p className="text-red-300 text-sm md:text-base font-bold">Status: Reality matrix destabilized</p>
            <p className="text-gray-300 text-xs md:text-sm mt-4 font-mono">
              Made with Claude Code • Gravity: {rotation.toFixed(0)}° • Chaos: {chaosLevel.toFixed(1)} • Sanity: {100 - (confusionLevel % 100)}%
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

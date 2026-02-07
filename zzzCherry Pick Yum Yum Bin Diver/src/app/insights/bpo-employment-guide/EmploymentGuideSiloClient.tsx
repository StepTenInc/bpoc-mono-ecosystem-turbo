'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useAnimation } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  Calendar, ArrowRight, Clock, PlayCircle, ChevronLeft, ChevronRight,
  ArrowLeft, FileText, User, Eye,
  ChevronDown, ChevronUp, BookOpen, TrendingUp, Users,
  Zap, Target, Sparkles, Video, Shield, Scale,
  Gavel, ScrollText, DollarSign, Briefcase, Heart
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';
import StickySidebarCTA from '@/components/insights/StickySidebarCTA';
import SignUpCTA from '@/components/insights/SignUpCTA';

interface EmploymentGuideSiloClientProps {
  silo: any;
  pillarPost: any;
  articles: any[];
  pagination: any;
  relatedSilos: any[];
}

// Blue color for employment guide silo
const siloColor = '#3B82F6';

const sanitizeHeadings = (content: string) => {
  return content.replace(/^# (?!#)/gm, '## ');
};

const MarkdownComponents: any = {
  h1: ({ node, ...props }: any) => (
    <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-12 mb-6 tracking-tight" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <div className="mt-8 md:mt-16 mb-4 md:mb-8 group">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white border-b border-white/10 pb-3 md:pb-4 flex items-center gap-2 md:gap-3 relative pl-3 md:pl-0" {...props}>
        <span className="absolute left-0 md:-left-6 top-1 w-1 h-6 md:h-8 rounded-full opacity-100 shadow-lg bg-blue-400" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          {props.children}
        </span>
      </h2>
    </div>
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400 mt-6 md:mt-10 mb-3 md:mb-4 tracking-wide flex items-center gap-2" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-300 leading-relaxed mb-4 md:mb-6 text-[15px] md:text-lg font-light tracking-wide" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="space-y-3 md:space-y-4 my-4 md:my-6 p-4 md:p-6 rounded-xl border border-blue-500/30 bg-white/5 shadow-inner backdrop-blur-sm" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="flex items-start gap-3 text-gray-300 group transition-colors duration-200 hover:text-white">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 shadow-lg" />
      <span className="flex-1 leading-relaxed">{props.children}</span>
    </li>
  ),
  blockquote: ({ node, ...props }: any) => (
    <div className="flex items-start gap-4 border-l-4 border-blue-400 p-5 rounded-r-xl my-6 bg-blue-500/10">
      <p className="text-gray-200 text-base leading-relaxed m-0">{props.children}</p>
    </div>
  ),
  a: ({ node, ...props }: any) => (
    <a className="font-medium transition-colors text-blue-400 underline underline-offset-4 decoration-2 decoration-blue-500/50 hover:decoration-blue-400" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />
  ),
};

const calculateReadingTime = (article: any): string => {
  const wordCount = article.word_count || 
    (article.content ? article.content.split(/\s+/).length : 1250);
  const readingTime = Math.ceil(wordCount / 250);
  return `${readingTime} min read`;
};

function ArticleCard({ article, index }: { article: any; index: number }) {
  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroImage = article.hero_url || article.content_image0;
  const readingTime = calculateReadingTime(article);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.23, 1, 0.320, 1], type: "spring", stiffness: 100 }}
      className="flex-shrink-0 w-[85vw] sm:w-[340px] md:w-[380px] h-full"
    >
      <Link href={`/insights/bpo-employment-guide/${article.slug}`} className="h-full block group">
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full flex flex-col relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl shadow-2xl hover:border-blue-400/50 hover:shadow-[0_20px_70px_-10px_rgba(59,130,246,0.3)]"
        >
          <div className="h-48 w-full relative overflow-hidden">
            {hasVideo ? (
              <video src={article.video_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : heroImage ? (
              <img src={heroImage} alt={article.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-indigo-900/20">
                <Shield className="w-20 h-20 text-blue-500/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/60 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
            {hasVideo && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.1 + 0.5, type: "spring" }} className="absolute top-4 right-4">
                <Badge className="bg-blue-500/30 backdrop-blur-md border-blue-400/50 text-blue-200 shadow-lg">
                  <PlayCircle className="w-3 h-3 mr-1" />Video
                </Badge>
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 10 }} whileHover={{ opacity: 1, y: 0 }} className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 text-xs text-blue-300">
                  <Shield className="w-3 h-3" />
                  <span>Employment Guide • {readingTime}</span>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <motion.h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors line-clamp-2" whileHover={{ x: 4 }}>
              {article.title}
            </motion.h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
              {article.description?.substring(0, 120) || ''}...
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-blue-500/20">
              <motion.div className="flex items-center gap-2" whileHover={{ x: 4 }}>
                <Image src="/Chat Agent/Ate Yna.png" alt="Ate Yna" width={24} height={24} className="rounded-full ring-2 ring-blue-500/30" />
                <span className="text-xs text-gray-500 font-medium">Ate Yna</span>
              </motion.div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                  <Clock className="w-3 h-3" />{readingTime}
                </div>
                <span className="bg-white/5 px-2 py-1 rounded-md">
                  {format(new Date(article.published_at || article.created_at), 'MMM d')}
                </span>
              </div>
            </div>
          </div>
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100" initial={{ x: '-100%' }} whileHover={{ x: '100%' }} transition={{ duration: 0.8, ease: "easeInOut" }} />
        </motion.div>
      </Link>
    </motion.div>
  );
}

function ArticleCarousel({ articles }: { articles: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef(null);
  const isInView = useInView(carouselRef, { once: true });
  const dragX = useMotionValue(0);
  const controls = useAnimation();
  const cardWidth = 400;
  const maxIndex = Math.max(0, articles.length - 3);

  useEffect(() => {
    if (!isAutoPlaying || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isPaused, maxIndex]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handleDragEnd = () => {
    const x = dragX.get();
    const threshold = cardWidth / 3;
    if (x > threshold && currentIndex > 0) setCurrentIndex(prev => prev - 1);
    else if (x < -threshold && currentIndex < maxIndex) setCurrentIndex(prev => prev + 1);
    controls.start({ x: 0 });
  };

  const goToSlide = (index: number) => { setCurrentIndex(index); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 5000); };
  const goToPrevious = () => { setCurrentIndex(prev => Math.max(0, prev - 1)); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 3000); };
  const goToNext = () => { setCurrentIndex(prev => Math.min(maxIndex, prev + 1)); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 3000); };

  return (
    <motion.div ref={carouselRef} initial={{ opacity: 0, y: 60 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="relative" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <motion.div className="flex items-center justify-between mb-8" initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.6 }}>
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ rotate: 5, scale: 1.1 }} className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-2xl flex items-center justify-center border border-blue-400/30">
            <Shield className="w-6 h-6 text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">Employment & Legal Guides</h2>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Know your rights and workplace regulations</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <motion.button onClick={goToPrevious} disabled={currentIndex === 0} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button onClick={goToNext} disabled={currentIndex === maxIndex} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm">
            <ChevronRight className="w-5 h-5" />
          </motion.button>
          <motion.div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <motion.div animate={{ rotate: isAutoPlaying && !isPaused ? 360 : 0 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs text-gray-500">Auto</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div ref={scrollRef} className="flex gap-4 md:gap-6 overflow-x-auto md:overflow-hidden cursor-grab active:cursor-grabbing snap-x snap-mandatory md:snap-none pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0" drag="x" dragConstraints={{ left: -maxIndex * cardWidth, right: 0 }} dragElastic={0.1} style={{ x: dragX }} onDragEnd={handleDragEnd} animate={controls}>
        {articles.map((article, index) => (
          <ArticleCard key={article.id} article={article} index={index} />
        ))}
      </motion.div>

      <motion.div className="flex justify-center gap-2 mt-8" initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6 }}>
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <motion.button key={index} onClick={() => goToSlide(index)} className={`relative overflow-hidden rounded-full transition-all duration-300 ${index === currentIndex ? 'w-8 h-2 bg-blue-400 shadow-[0_0_20px_-5px_rgba(59,130,246,0.8)]' : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'}`} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
            {index === currentIndex && <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-indigo-400" layoutId="activeIndicatorEG" transition={{ type: "spring", stiffness: 500, damping: 50 }} />}
          </motion.button>
        ))}
      </motion.div>

      {isAutoPlaying && !isPaused && (
        <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden rounded-full">
          <motion.div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 4, ease: "linear", repeat: Infinity }} />
        </motion.div>
      )}
    </motion.div>
  );
}

function SiloCard({ silo, index }: { silo: any; index: number }) {
  const getSiloIcon = (slug: string) => {
    const iconMap: Record<string, any> = {
      'bpo-company-reviews': Briefcase,
      'salary-compensation': DollarSign,
      'interview-tips': Target,
      'work-life-balance': Heart,
      'bpo-career-growth': TrendingUp,
      'bpo-jobs': Users,
      'training-and-certifications': Zap,
      default: Shield
    };
    return iconMap[slug] || iconMap.default;
  };
  const Icon = getSiloIcon(silo.slug);

  return (
    <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.8, type: "spring", stiffness: 100 }} viewport={{ once: true }} whileHover={{ y: -8 }} className="h-full">
      <Link href={`/insights/${silo.slug}`} className="block h-full group">
        <motion.div className="relative p-8 rounded-3xl h-full overflow-hidden border border-white/10 bg-gradient-to-br from-blue-500/10 via-white/5 to-transparent backdrop-blur-xl shadow-xl group-hover:border-blue-400/50 group-hover:shadow-[0_20px_60px_-10px_rgba(59,130,246,0.4)]" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
          <div className="relative z-10">
            <motion.div className="mb-6" whileHover={{ rotate: 5, scale: 1.1 }}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-400/30">
                <Icon className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors mb-3">{silo.name}</h3>
            <p className="text-gray-400 text-sm line-clamp-4 mb-6 leading-relaxed">{silo.description}</p>
            <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300">
              <span>Explore insights</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function EmploymentGuideSiloClient({ silo, pillarPost, articles, pagination, relatedSilos }: EmploymentGuideSiloClientProps) {
  const [showFullPillar, setShowFullPillar] = useState(false);
  const { scrollY } = useScroll();
  const heroRef = useRef(null);
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);
  const pillarRef = useRef(null);
  const relatedRef = useRef(null);
  const ctaRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isPillarInView = useInView(pillarRef, { once: true, margin: "-100px" });
  const isRelatedInView = useInView(relatedRef, { once: true, margin: "-100px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-100px" });

  const getPreviewContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    return paragraphs.slice(0, 3).join('\n\n');
  };
  const pillarPreview = pillarPost?.content ? getPreviewContent(pillarPost.content) : '';

  return (
    <div className="overflow-x-hidden selection:bg-blue-500/20 selection:text-blue-200 font-sans min-h-screen bg-[#0B0B0D]">
      <Header />

      {/* Background effects — employment guide theme with blue/indigo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div className="absolute top-[-20%] left-1/3 w-[800px] h-[800px] bg-blue-500/8 rounded-full blur-[150px]" animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/6 rounded-full blur-[120px]" animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <motion.div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-sky-500/5 rounded-full blur-[140px]" animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }} />
        
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 bg-blue-400/20 rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }} transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4, ease: "easeInOut" }} />
          ))}
        </div>

        <motion.div className="absolute top-[15%] left-[15%] text-blue-400/20" animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <Shield size={40} />
        </motion.div>
        <motion.div className="absolute top-[15%] right-[15%] text-indigo-400/20" animate={{ y: [0, 15, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>
          <Scale size={35} />
        </motion.div>
      </div>

      <div className="relative z-10">
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-2 text-sm text-gray-500 mb-8">
              <Link href="/insights" className="hover:text-white transition-colors flex items-center gap-1 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Insights
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-400 font-semibold">Employment Guide</span>
            </motion.div>
          </div>
        </div>

        <motion.section ref={heroRef} style={{ y: heroY, opacity: heroOpacity }} className="relative min-h-[85vh] flex items-center overflow-hidden">
          <AnimatePresence>
            {pillarPost && (pillarPost.video_url || pillarPost.hero_url) && (
              <motion.div initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute inset-0 z-0">
                {pillarPost.hero_type === 'video' && pillarPost.video_url ? (
                  <video src={pillarPost.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : pillarPost.hero_url ? (
                  <img src={pillarPost.hero_url} alt={pillarPost.title} className="w-full h-full object-cover" />
                ) : null}
                <motion.div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/80 to-[#0B0B0D]/60" animate={{ opacity: [0.8, 0.9, 0.8] }} transition={{ duration: 4, repeat: Infinity }} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 60 }} animate={isHeroInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.8 }}>
                <motion.div initial={{ scale: 0, rotate: -10 }} animate={isHeroInView ? { scale: 1, rotate: 0 } : {}} transition={{ delay: 0.5, type: "spring", stiffness: 200 }}>
                  <Badge className="mb-6 md:mb-8 bg-blue-500/20 text-blue-300 border-blue-400/40 text-sm md:text-lg px-4 py-2 md:px-8 md:py-3 shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)]">
                    <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                    Employment Guide Hub
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 ml-2 md:ml-3" />
                  </Badge>
                </motion.div>

                <motion.h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black mb-6 md:mb-8 tracking-tight" initial={{ opacity: 0, y: 40 }} animate={isHeroInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6, duration: 0.8 }}>
                  <span className="text-white">Know Your</span>
                  <br />
                  <motion.span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-500" animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} style={{ backgroundSize: "200% 200%" }}>
                    Rights.
                  </motion.span>
                </motion.h1>

                <motion.p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-10 max-w-4xl leading-relaxed" initial={{ opacity: 0, y: 30 }} animate={isHeroInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8, duration: 0.8 }}>
                  Comprehensive guides on Philippine labor law, BPO employment contracts, and workplace regulations.
                  <span className="text-blue-400 font-semibold"> Protect your career.</span>
                </motion.p>

                <motion.div className="flex flex-wrap items-center gap-6 text-lg" initial={{ opacity: 0, y: 30 }} animate={isHeroInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1, duration: 0.8 }}>
                  <motion.div className="flex items-center gap-2 md:gap-3 bg-blue-500/20 px-4 py-2 md:px-8 md:py-4 rounded-full border border-blue-500/30 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)]" whileHover={{ scale: 1.05, y: -2 }}>
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-bold text-xl">{pagination.total}</span>
                    <span className="text-gray-400">guides</span>
                  </motion.div>
                  <motion.div className="flex items-center gap-3 text-gray-400" initial={{ opacity: 0, x: -20 }} animate={isHeroInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.4, duration: 0.6 }}>
                    <Calendar className="w-5 h-5" />
                    <span>Updated Feb 2026</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {articles.length > 0 && (
            <section className="mb-24">
              <ArticleCarousel articles={articles} />
            </section>
          )}

          <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
            {pillarPost && (
              <motion.section ref={pillarRef} initial={{ opacity: 0, y: 60 }} animate={isPillarInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="relative">
                <motion.div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 via-white/5 to-transparent backdrop-blur-xl overflow-hidden shadow-2xl" whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
                  <div className="p-4 md:p-8 border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <motion.div className="flex items-center gap-4 mb-6" whileHover={{ x: 4 }}>
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-400/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
                            <BookOpen className="w-6 h-6 text-blue-400" />
                          </div>
                          <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/40 px-4 py-2">
                            <Sparkles className="w-4 h-4 mr-2" />
                            The Complete Employment Guide
                          </Badge>
                        </motion.div>
                        <motion.h2 className="text-3xl md:text-4xl font-black text-white mb-3" whileHover={{ x: 4 }}>{pillarPost.title}</motion.h2>
                        <p className="text-gray-400">Everything you need to navigate BPO employment</p>
                      </div>
                      <motion.button onClick={() => setShowFullPillar(!showFullPillar)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-blue-400 hover:text-white transition-all backdrop-blur-sm">
                        <motion.div animate={{ rotate: showFullPillar ? 180 : 0 }} transition={{ duration: 0.3 }}>
                          <ChevronDown className="w-6 h-6" />
                        </motion.div>
                      </motion.button>
                    </div>
                  </div>
                  <div className="p-4 md:p-8">
                    <motion.div animate={{ height: showFullPillar ? "auto" : "400px" }} transition={{ duration: 0.5, ease: "easeInOut" }} className="relative overflow-hidden">
                      <div className="prose prose-invert prose-lg max-w-none">
                        {showFullPillar && (pillarPost.content_part1 || pillarPost.content_part2 || pillarPost.content_part3) ? (
                          <>
                            {pillarPost.content_image0 && <figure className="my-8 rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl"><img src={pillarPost.content_image0} alt={`${pillarPost.title} - Introduction`} className="w-full h-auto object-cover" loading="lazy" /></figure>}
                            {pillarPost.content_part1 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{sanitizeHeadings(pillarPost.content_part1)}</ReactMarkdown>}
                            {pillarPost.content_image1 && <figure className="my-12 rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl"><img src={pillarPost.content_image1} alt={`${pillarPost.title} - Main content`} className="w-full h-auto object-cover" loading="lazy" /></figure>}
                            {pillarPost.content_part2 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{sanitizeHeadings(pillarPost.content_part2)}</ReactMarkdown>}
                            {pillarPost.content_image2 && <figure className="my-12 rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl"><img src={pillarPost.content_image2} alt={`${pillarPost.title} - Conclusion`} className="w-full h-auto object-cover" loading="lazy" /></figure>}
                            {pillarPost.content_part3 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{sanitizeHeadings(pillarPost.content_part3)}</ReactMarkdown>}
                          </>
                        ) : (
                          <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{sanitizeHeadings(showFullPillar ? pillarPost.content : pillarPreview)}</ReactMarkdown>
                        )}
                      </div>
                      <AnimatePresence>
                        {!showFullPillar && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/80 to-transparent pointer-events-none" />}
                      </AnimatePresence>
                    </motion.div>
                    <AnimatePresence>
                      {!showFullPillar && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mt-8 text-center">
                          <motion.button onClick={() => setShowFullPillar(true)} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="group px-8 py-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded-2xl transition-all backdrop-blur-sm shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] font-semibold">
                            <span className="flex items-center gap-2">Read the complete guide <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>↓</motion.div></span>
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.section>
            )}

            <div className="lg:sticky lg:top-24 self-start">
              <div className="space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                <StickySidebarCTA />
                <motion.div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl" whileHover={{ y: -4 }}>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-blue-400" />
                    Employment Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Legal Guides</span>
                      <span className="text-blue-400 font-bold">{pagination.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Focus Area</span>
                      <span className="text-white font-bold text-sm">PH Labor Law</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Last Updated</span>
                      <span className="text-white text-sm">Feb 2026</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {relatedSilos.length > 0 && (
            <motion.section ref={relatedRef} initial={{ opacity: 0, y: 80 }} animate={isRelatedInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mt-24 mb-16">
              <div className="mb-12 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white flex items-center justify-center gap-4 mb-4">
                  <motion.div whileHover={{ rotate: 15 }} className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-400/30">
                    <TrendingUp className="w-7 h-7 text-blue-400" />
                  </motion.div>
                  You May Also Like
                </h2>
                <p className="text-gray-500 text-lg">Explore other career insights and guides</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedSilos.slice(0, 4).map((related, index) => (
                  <SiloCard key={related.id} silo={related} index={index} />
                ))}
              </div>
            </motion.section>
          )}

          <motion.section ref={ctaRef} initial={{ opacity: 0, y: 80 }} animate={isCtaInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-16">
            <motion.div className="max-w-4xl mx-auto text-center relative" whileHover={{ y: -8 }} transition={{ duration: 0.4 }}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-3xl" />
              <div className="relative p-6 md:p-12 rounded-2xl md:rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 via-white/5 to-transparent backdrop-blur-xl">
                <motion.h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 md:mb-6" initial={{ opacity: 0, y: 30 }} animate={isCtaInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}>
                  Ready to navigate BPO employment with confidence?
                </motion.h2>
                <motion.p className="text-gray-400 text-base md:text-xl mb-6 md:mb-10 max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={isCtaInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
                  Join thousands of professionals who know their rights and workplace protections
                </motion.p>
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={isCtaInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.6, type: "spring", stiffness: 200 }}>
                  <SignUpCTA />
                </motion.div>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }
      `}</style>
    </div>
  );
}

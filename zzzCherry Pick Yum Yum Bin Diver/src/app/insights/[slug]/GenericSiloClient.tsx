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
  ArrowLeft, FileText, User, Heart, BookOpen, TrendingUp, Users,
  Zap, Target, Sparkles, DollarSign, Shield, Briefcase, Building2,
  ChevronDown, Coffee, Leaf, Scale, Award, GraduationCap,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';
import StickySidebarCTA from '@/components/insights/StickySidebarCTA';
import SignUpCTA from '@/components/insights/SignUpCTA';

interface GenericSiloClientProps {
  silo: any;
  pillarPost: any;
  articles: any[];
  pagination: any;
  relatedSilos: any[];
}

// Map silo icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Heart, TrendingUp, DollarSign, Target, Shield, Briefcase, Building2,
  Zap, Award, GraduationCap, Users, BookOpen, Coffee, Leaf, Scale,
  FileText, Sparkles,
};

// Default color palettes for silos
const colorPalettes: Record<string, { primary: string; gradient: string; bgGlow: string; border: string; text: string; hoverShadow: string }> = {
  '#F43F5E': { primary: 'rose', gradient: 'from-rose-400 via-pink-400 to-fuchsia-500', bgGlow: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-400', hoverShadow: 'rgba(244,63,94,0.3)' },
  '#8B5CF6': { primary: 'violet', gradient: 'from-violet-400 via-purple-400 to-fuchsia-500', bgGlow: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-400', hoverShadow: 'rgba(139,92,246,0.3)' },
  '#10B981': { primary: 'emerald', gradient: 'from-emerald-400 via-green-400 to-teal-500', bgGlow: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400', hoverShadow: 'rgba(16,185,129,0.3)' },
  '#3B82F6': { primary: 'blue', gradient: 'from-blue-400 via-cyan-400 to-indigo-500', bgGlow: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400', hoverShadow: 'rgba(59,130,246,0.3)' },
  '#F59E0B': { primary: 'amber', gradient: 'from-amber-400 via-orange-400 to-yellow-500', bgGlow: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-400', hoverShadow: 'rgba(245,158,11,0.3)' },
  '#06B6D4': { primary: 'cyan', gradient: 'from-cyan-400 via-teal-400 to-blue-500', bgGlow: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-400', hoverShadow: 'rgba(6,182,212,0.3)' },
  '#EF4444': { primary: 'red', gradient: 'from-red-400 via-rose-400 to-pink-500', bgGlow: 'bg-red-500', border: 'border-red-500', text: 'text-red-400', hoverShadow: 'rgba(239,68,68,0.3)' },
  '#EC4899': { primary: 'pink', gradient: 'from-pink-400 via-rose-400 to-fuchsia-500', bgGlow: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-400', hoverShadow: 'rgba(236,72,153,0.3)' },
};

// Fallback palette
const defaultPalette = colorPalettes['#06B6D4'];

function getColorClasses(siloColor: string) {
  return colorPalettes[siloColor] || defaultPalette;
}

// Sanitize heading levels
const sanitizeHeadings = (content: string) => content.replace(/^# (?!#)/gm, '## ');

function createMarkdownComponents(accentColor: string) {
  const c = getColorClasses(accentColor);
  return {
    h1: ({ node, ...props }: any) => (
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-12 mb-6 tracking-tight" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <div className="mt-8 md:mt-16 mb-4 md:mb-8 group">
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold text-white border-b border-white/10 pb-3 md:pb-4 flex items-center gap-2 md:gap-3 relative pl-3 md:pl-0`} {...props}>
          <span className={`absolute left-0 md:-left-6 top-1 w-1 h-6 md:h-8 rounded-full opacity-100 shadow-lg ${c.bgGlow}/40`} />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{props.children}</span>
        </h2>
      </div>
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${c.text} mt-6 md:mt-10 mb-3 md:mb-4 tracking-wide flex items-center gap-2`} {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p className="text-gray-300 leading-relaxed mb-4 md:mb-6 text-[15px] md:text-lg font-light tracking-wide" {...props} />
    ),
    ul: ({ node, ...props }: any) => (
      <ul className={`space-y-3 md:space-y-4 my-4 md:my-6 p-4 md:p-6 rounded-xl ${c.border}/30 border bg-white/5 shadow-inner backdrop-blur-sm`} {...props} />
    ),
    li: ({ node, ...props }: any) => (
      <li className="flex items-start gap-3 text-gray-300 group transition-colors duration-200 hover:text-white">
        <span className={`mt-2 w-1.5 h-1.5 rounded-full ${c.bgGlow}/40 shrink-0 shadow-lg`} />
        <span className="flex-1 leading-relaxed">{props.children}</span>
      </li>
    ),
    blockquote: ({ node, ...props }: any) => (
      <div className={`flex items-start gap-4 border-l-4 ${c.border}/40 p-5 rounded-r-xl my-6 ${c.bgGlow}/10`}>
        <p className="text-gray-200 text-base leading-relaxed m-0">{props.children}</p>
      </div>
    ),
    a: ({ node, ...props }: any) => (
      <a className={`font-medium transition-colors ${c.text} underline underline-offset-4 decoration-2 hover:text-white`} {...props} />
    ),
    strong: ({ node, ...props }: any) => (
      <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />
    ),
  } as any;
}

// Calculate reading time
const calculateReadingTime = (article: any): string => {
  const wordCount = article.word_count || (article.content ? article.content.split(/\s+/).length : 1250);
  return `${Math.ceil(wordCount / 250)} min read`;
};

// Article Card
function ArticleCard({ article, index, siloSlug, accentColor }: { article: any; index: number; siloSlug: string; accentColor: string }) {
  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroImage = article.hero_url || article.content_image0;
  const readingTime = calculateReadingTime(article);
  const c = getColorClasses(accentColor);
  const SiloIcon = iconMap[article.silo_icon] || Heart;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.8, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.8, type: "spring", stiffness: 100 }} className="flex-shrink-0 w-[85vw] sm:w-[340px] md:w-[380px] h-full">
      <Link href={`/insights/${siloSlug}/${article.slug}`} className="h-full block group">
        <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.4 }} className={`h-full flex flex-col relative overflow-hidden rounded-3xl ${c.border}/20 border bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl shadow-2xl hover:${c.border}/50`}>
          <div className="h-48 w-full relative overflow-hidden">
            {hasVideo ? (
              <video src={article.video_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : heroImage ? (
              <img src={heroImage} alt={article.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${c.bgGlow}/10 to-transparent`}>
                <FileText className={`w-20 h-20 ${c.text}/40`} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/60 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
            {hasVideo && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4">
                <Badge className={`${c.bgGlow}/30 backdrop-blur-md ${c.border}/50 ${c.text} shadow-lg`}>
                  <PlayCircle className="w-3 h-3 mr-1" /> Video
                </Badge>
              </motion.div>
            )}
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <motion.h3 className={`text-xl font-bold text-white mb-3 group-hover:${c.text} transition-colors line-clamp-2`} whileHover={{ x: 4 }}>
              {article.title}
            </motion.h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
              {article.description?.substring(0, 120) || ''}...
            </p>
            <div className={`flex items-center justify-between mt-auto pt-4 border-t ${c.border}/20`}>
              <div className="flex items-center gap-2">
                <Image src="/Chat Agent/Ate Yna.png" alt="Ate Yna" width={24} height={24} className={`rounded-full ring-2 ${c.border}/30`} />
                <span className="text-xs text-gray-500 font-medium">Ate Yna</span>
              </div>
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
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Article Carousel
function ArticleCarousel({ articles, siloSlug, siloName, accentColor }: { articles: any[]; siloSlug: string; siloName: string; accentColor: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef(null);
  const isInView = useInView(carouselRef, { once: true });
  const dragX = useMotionValue(0);
  const controls = useAnimation();
  const c = getColorClasses(accentColor);

  const cardWidth = 400;
  const maxIndex = Math.max(0, articles.length - 3);

  useEffect(() => {
    if (!isAutoPlaying || isPaused) return;
    const interval = setInterval(() => { setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1); }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isPaused, maxIndex]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
  }, [currentIndex]);

  const handleDragEnd = () => {
    const x = dragX.get();
    if (x > cardWidth / 3 && currentIndex > 0) setCurrentIndex(prev => prev - 1);
    else if (x < -cardWidth / 3 && currentIndex < maxIndex) setCurrentIndex(prev => prev + 1);
    controls.start({ x: 0 });
  };

  const goToSlide = (i: number) => { setCurrentIndex(i); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 5000); };
  const goToPrevious = () => { setCurrentIndex(prev => Math.max(0, prev - 1)); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 3000); };
  const goToNext = () => { setCurrentIndex(prev => Math.min(maxIndex, prev + 1)); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 3000); };

  return (
    <motion.div ref={carouselRef} initial={{ opacity: 0, y: 60 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="relative" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <motion.div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${c.bgGlow}/30 to-transparent rounded-2xl flex items-center justify-center ${c.border}/30 border`}>
            <FileText className={`w-6 h-6 ${c.text}`} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{siloName} Articles</h2>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Latest guides and insights</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <motion.button onClick={goToPrevious} disabled={currentIndex === 0} whileHover={{ scale: 1.05 }} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></motion.button>
          <motion.button onClick={goToNext} disabled={currentIndex === maxIndex} whileHover={{ scale: 1.05 }} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight className="w-5 h-5" /></motion.button>
        </div>
      </motion.div>
      <motion.div ref={scrollRef} className="flex gap-4 md:gap-6 overflow-x-auto md:overflow-hidden snap-x snap-mandatory md:snap-none pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0" drag="x" dragConstraints={{ left: -maxIndex * cardWidth, right: 0 }} dragElastic={0.1} style={{ x: dragX }} onDragEnd={handleDragEnd} animate={controls}>
        {articles.map((article, index) => (
          <ArticleCard key={article.id} article={article} index={index} siloSlug={siloSlug} accentColor={accentColor} />
        ))}
      </motion.div>
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <motion.button key={i} onClick={() => goToSlide(i)} className={`rounded-full transition-all duration-300 ${i === currentIndex ? `w-8 h-2 ${c.bgGlow}/60` : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'}`} whileHover={{ scale: 1.2 }} />
        ))}
      </div>
    </motion.div>
  );
}

// Related Silo Card
function SiloCard({ silo, index }: { silo: any; index: number }) {
  const Icon = iconMap[silo.icon] || FileText;
  return (
    <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.8, type: "spring" }} viewport={{ once: true }} whileHover={{ y: -8 }} className="h-full">
      <Link href={`/insights/${silo.slug}`} className="block h-full group">
        <div className="relative p-8 rounded-3xl h-full overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl shadow-xl group-hover:border-white/30">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center border border-white/20 mb-6">
              <Icon className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-3">{silo.name}</h3>
            <p className="text-gray-400 text-sm line-clamp-4 mb-6 leading-relaxed">{silo.description}</p>
            <div className="flex items-center text-cyan-400 text-sm font-medium">
              <span>Explore insights</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function GenericSiloClient({ silo, pillarPost, articles, pagination, relatedSilos }: GenericSiloClientProps) {
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

  const accentColor = silo.color || '#06B6D4';
  const c = getColorClasses(accentColor);
  const SiloIcon = iconMap[silo.icon] || FileText;
  const MarkdownComponents = createMarkdownComponents(accentColor);

  const getPreviewContent = (content: string) => content.split('\n\n').slice(0, 3).join('\n\n');
  const pillarPreview = pillarPost?.content ? getPreviewContent(pillarPost.content) : '';

  return (
    <div className="overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200 font-sans min-h-screen bg-[#0B0B0D]">
      <Header />

      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div className={`absolute top-[-20%] left-1/3 w-[800px] h-[800px] ${c.bgGlow}/8 rounded-full blur-[150px]`} animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className={`absolute top-[40%] right-[-5%] w-[600px] h-[600px] ${c.bgGlow}/6 rounded-full blur-[120px]`} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} />
        <motion.div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-fuchsia-500/5 rounded-full blur-[140px]" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 12, repeat: Infinity, delay: 4 }} />
        <div className="absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div key={i} className={`absolute w-1 h-1 ${c.bgGlow}/20 rounded-full`} style={{ left: `${((i * 37 + 13) % 100)}%`, top: `${((i * 53 + 7) % 100)}%` }} animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }} transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: (i * 0.3) % 4 }} />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        {/* Breadcrumbs */}
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-gray-500 mb-8">
              <Link href="/insights" className="hover:text-white transition-colors flex items-center gap-1 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Insights
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className={`${c.text} font-semibold`}>{silo.name}</span>
            </motion.div>
          </div>
        </div>

        {/* Hero Section */}
        <motion.section ref={heroRef} style={{ y: heroY, opacity: heroOpacity }} className="relative min-h-[85vh] flex items-center overflow-hidden">
          <AnimatePresence>
            {pillarPost && (pillarPost.video_url || pillarPost.hero_url) && (
              <motion.div initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5 }} className="absolute inset-0 z-0">
                {pillarPost.hero_type === 'video' && pillarPost.video_url ? (
                  <video src={pillarPost.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : pillarPost.hero_url ? (
                  <img src={pillarPost.hero_url} alt={pillarPost.title} className="w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/80 to-[#0B0B0D]/60" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 60 }} animate={isHeroInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.8 }}>
                <motion.div initial={{ scale: 0, rotate: -10 }} animate={isHeroInView ? { scale: 1, rotate: 0 } : {}} transition={{ delay: 0.5, type: "spring" }}>
                  <Badge className={`mb-6 md:mb-8 ${c.bgGlow}/20 ${c.text} ${c.border}/40 text-sm md:text-lg px-4 py-2 md:px-8 md:py-3`}>
                    <SiloIcon className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                    {silo.name} Hub
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 ml-2 md:ml-3" />
                  </Badge>
                </motion.div>

                <motion.h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black mb-6 md:mb-8 tracking-tight" initial={{ opacity: 0, y: 40 }} animate={isHeroInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6, duration: 0.8 }}>
                  <span className="text-white">{silo.name.split(' ').slice(0, -1).join(' ') || silo.name}</span>
                  <br />
                  <motion.span className={`text-transparent bg-clip-text bg-gradient-to-r ${c.gradient}`} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 8, repeat: Infinity }} style={{ backgroundSize: "200% 200%" }}>
                    {silo.name.split(' ').pop() || 'Insights'}.
                  </motion.span>
                </motion.h1>

                <motion.p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-10 max-w-4xl leading-relaxed" initial={{ opacity: 0, y: 30 }} animate={isHeroInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8 }}>
                  {silo.description}
                </motion.p>

                <motion.div className="flex flex-wrap items-center gap-6 text-lg" initial={{ opacity: 0 }} animate={isHeroInView ? { opacity: 1 } : {}} transition={{ delay: 1 }}>
                  <div className={`flex items-center gap-2 md:gap-3 ${c.bgGlow}/20 px-4 py-2 md:px-8 md:py-4 rounded-full ${c.border}/30 border backdrop-blur-md`}>
                    <FileText className={`w-5 h-5 ${c.text}`} />
                    <span className="text-white font-bold text-xl">{pagination.total}</span>
                    <span className="text-gray-400">articles</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <Calendar className="w-5 h-5" />
                    <span>Updated Feb 2026</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Article Carousel */}
          {articles.length > 0 && (
            <section className="mb-24">
              <ArticleCarousel articles={articles} siloSlug={silo.slug} siloName={silo.name} accentColor={accentColor} />
            </section>
          )}

          {/* 2-column layout */}
          <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
            {pillarPost && (
              <motion.section ref={pillarRef} initial={{ opacity: 0, y: 60 }} animate={isPillarInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="relative">
                <div className={`rounded-3xl ${c.border}/20 border bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl overflow-hidden shadow-2xl`}>
                  <div className={`p-4 md:p-8 border-b ${c.border}/20 bg-gradient-to-r ${c.bgGlow}/10 to-transparent`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-12 h-12 bg-gradient-to-br ${c.bgGlow}/30 to-transparent rounded-2xl flex items-center justify-center ${c.border}/30 border`}>
                            <BookOpen className={`w-6 h-6 ${c.text}`} />
                          </div>
                          <Badge className={`${c.bgGlow}/30 ${c.text} ${c.border}/40 px-4 py-2`}>
                            <Sparkles className="w-4 h-4 mr-2" /> The Complete Guide
                          </Badge>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-3">{pillarPost.title}</h2>
                        <p className="text-gray-400">{silo.description}</p>
                      </div>
                      <motion.button onClick={() => setShowFullPillar(!showFullPillar)} whileHover={{ scale: 1.05 }} className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${c.text} hover:text-white`}>
                        <motion.div animate={{ rotate: showFullPillar ? 180 : 0 }}><ChevronDown className="w-6 h-6" /></motion.div>
                      </motion.button>
                    </div>
                  </div>

                  <div className="p-4 md:p-8">
                    <motion.div animate={{ height: showFullPillar ? "auto" : "400px" }} transition={{ duration: 0.5 }} className="relative overflow-hidden">
                      <div className="prose prose-invert prose-lg max-w-none">
                        {showFullPillar && (pillarPost.content_part1 || pillarPost.content_part2 || pillarPost.content_part3) ? (
                          <>
                            {pillarPost.content_image0 && <figure className={`my-8 rounded-2xl overflow-hidden ${c.border}/20 border shadow-2xl`}><img src={pillarPost.content_image0} alt={`${pillarPost.title}`} className="w-full h-auto object-cover" loading="lazy" /></figure>}
                            {pillarPost.content_part1 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{sanitizeHeadings(pillarPost.content_part1)}</ReactMarkdown>}
                            {pillarPost.content_image1 && <figure className={`my-12 rounded-2xl overflow-hidden ${c.border}/20 border shadow-2xl`}><img src={pillarPost.content_image1} alt={`${pillarPost.title}`} className="w-full h-auto object-cover" loading="lazy" /></figure>}
                            {pillarPost.content_part2 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{sanitizeHeadings(pillarPost.content_part2)}</ReactMarkdown>}
                            {pillarPost.content_image2 && <figure className={`my-12 rounded-2xl overflow-hidden ${c.border}/20 border shadow-2xl`}><img src={pillarPost.content_image2} alt={`${pillarPost.title}`} className="w-full h-auto object-cover" loading="lazy" /></figure>}
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 text-center">
                          <motion.button onClick={() => setShowFullPillar(true)} whileHover={{ scale: 1.02, y: -2 }} className={`px-8 py-4 bg-gradient-to-r ${c.bgGlow}/20 to-transparent ${c.text} ${c.border}/30 border hover:${c.border}/50 rounded-2xl backdrop-blur-sm font-semibold`}>
                            <span className="flex items-center gap-2">Read the complete guide <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>↓</motion.div></span>
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 self-start">
              <div className="space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                <StickySidebarCTA />
                <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className={`w-5 h-5 ${c.text}`} /> Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Articles</span>
                      <span className={`${c.text} font-bold`}>{pagination.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Topic</span>
                      <span className="text-white font-bold text-sm">{silo.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Last Updated</span>
                      <span className="text-white text-sm">Feb 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Silos */}
          {relatedSilos.length > 0 && (
            <motion.section ref={relatedRef} initial={{ opacity: 0, y: 80 }} animate={isRelatedInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mt-24 mb-16">
              <div className="mb-12 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">You May Also Like</h2>
                <p className="text-gray-500 text-lg">Explore other career insights and guides</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedSilos.slice(0, 4).map((related, index) => (
                  <SiloCard key={related.id} silo={related} index={index} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Bottom CTA */}
          <motion.section ref={ctaRef} initial={{ opacity: 0, y: 80 }} animate={isCtaInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-16">
            <div className="max-w-4xl mx-auto text-center relative">
              <div className={`absolute inset-0 ${c.bgGlow}/10 rounded-3xl blur-3xl`} />
              <div className={`relative p-6 md:p-12 rounded-2xl md:rounded-3xl ${c.border}/20 border bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl`}>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 md:mb-6">Ready to advance your BPO career?</h2>
                <p className="text-gray-400 text-base md:text-xl mb-6 md:mb-10 max-w-2xl mx-auto">Join thousands of professionals building better careers</p>
                <SignUpCTA />
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

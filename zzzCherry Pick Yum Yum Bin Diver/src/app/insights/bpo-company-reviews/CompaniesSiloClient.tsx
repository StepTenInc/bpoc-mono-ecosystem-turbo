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
  ArrowLeft, FileText, Building2, User, Star, Eye, Building,
  ChevronDown, ChevronUp, BookOpen, TrendingUp, Users, MapPin,
  Zap, Target, Sparkles, Video, ExternalLink, CheckCircle2,
  Briefcase, DollarSign, Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';
import StickySidebarCTA from '@/components/insights/StickySidebarCTA';
import SignUpCTA from '@/components/insights/SignUpCTA';

interface CompaniesSiloClientProps {
  silo: any;
  pillarPost: any;
  articles: any[];
  pagination: any;
  relatedSilos: any[];
}

// Violet color for companies silo
const siloColor = '#8B5CF6';

// Markdown components for pillar content - companies theme
// Sanitize heading levels — convert H1 (#) to H2 (##) in article content
const sanitizeHeadings = (content: string) => {
  return content.replace(/^# (?!#)/gm, '## ');
};
const MarkdownComponents: any = {
  // H1 in markdown content downgraded to H2 — page title is the only H1
    h1: ({ node, ...props }: any) => (
    <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-12 mb-6 tracking-tight" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <div className="mt-8 md:mt-16 mb-4 md:mb-8 group">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white border-b border-white/10 pb-3 md:pb-4 flex items-center gap-2 md:gap-3 relative pl-3 md:pl-0" {...props}>
        <span className="absolute left-0 md:-left-6 top-1 w-1 h-6 md:h-8 rounded-full opacity-100 shadow-lg bg-violet-400" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          {props.children}
        </span>
      </h2>
    </div>
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-violet-400 mt-6 md:mt-10 mb-3 md:mb-4 tracking-wide flex items-center gap-2" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-300 leading-relaxed mb-4 md:mb-6 text-[15px] md:text-lg font-light tracking-wide" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="space-y-3 md:space-y-4 my-4 md:my-6 p-4 md:p-6 rounded-xl border border-violet-500/30 bg-white/5 shadow-inner backdrop-blur-sm" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="flex items-start gap-3 text-gray-300 group transition-colors duration-200 hover:text-white">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 shadow-lg" />
      <span className="flex-1 leading-relaxed">{props.children}</span>
    </li>
  ),
  blockquote: ({ node, ...props }: any) => (
    <div className="flex items-start gap-4 border-l-4 border-violet-400 p-5 rounded-r-xl my-6 bg-violet-500/10">
      <p className="text-gray-200 text-base leading-relaxed m-0">{props.children}</p>
    </div>
  ),
  a: ({ node, ...props }: any) => (
    <a className="font-medium transition-colors text-violet-400 underline underline-offset-4 decoration-2 decoration-violet-500/50 hover:decoration-violet-400" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />
  ),
};

// Calculate proper reading time
const calculateReadingTime = (article: any): string => {
  const wordCount = article.word_count || 
    (article.content ? article.content.split(/\s+/).length : 1250);
  const readingTime = Math.ceil(wordCount / 250);
  return `${readingTime} min read`;
};

// Article Card Component with enhanced animations
function ArticleCard({ article, index }: { article: any; index: number }) {
  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroImage = article.hero_url || article.content_image0;
  const readingTime = calculateReadingTime(article);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.8, 
        ease: [0.23, 1, 0.320, 1],
        type: "spring",
        stiffness: 100
      }}
      className="flex-shrink-0 w-[85vw] sm:w-[340px] md:w-[380px] h-full"
    >
      <Link href={`/insights/bpo-company-reviews/${article.slug}`} className="h-full block group">
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full flex flex-col relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl shadow-2xl hover:border-violet-400/50 hover:shadow-[0_20px_70px_-10px_rgba(139,92,246,0.3)]"
        >
          {/* Hero Image/Video with enhanced effects */}
          <div className="h-48 w-full relative overflow-hidden">
            {hasVideo ? (
              <video 
                src={article.video_url} 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
            ) : heroImage ? (
              <img 
                src={heroImage} 
                alt={article.title} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900/40 to-purple-900/20">
                <Building2 className="w-20 h-20 text-violet-500/40" />
              </div>
            )}
            
            {/* Enhanced gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/60 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
            
            {/* Animated glow effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-violet-500/0 to-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              initial={false}
            />
            
            {/* Video Badge with enhanced styling */}
            {hasVideo && (
              <motion.div 
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                className="absolute top-4 right-4"
              >
                <Badge className="bg-violet-500/30 backdrop-blur-md border-violet-400/50 text-violet-200 shadow-lg">
                  <PlayCircle className="w-3 h-3 mr-1" />
                  Video
                </Badge>
              </motion.div>
            )}
            
            {/* Rating stars with staggered animation */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 flex gap-0.5"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Star className={`w-3 h-3 ${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                </motion.div>
              ))}
            </motion.div>

            {/* Hover overlay with company info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4"
            >
              <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 text-xs text-violet-300">
                  <Building className="w-3 h-3" />
                  <span>Company Profile • {readingTime}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced content section */}
          <div className="p-6 flex flex-col flex-grow">
            <motion.h3 
              className="text-xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors line-clamp-2"
              whileHover={{ x: 4 }}
            >
              {article.title}
            </motion.h3>

            <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
              {article.description?.substring(0, 120) || ''}...
            </p>

            {/* Enhanced author & meta section */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-violet-500/20">
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ x: 4 }}
              >
                <Image 
                  src="/Chat Agent/Ate Yna.png" 
                  alt="Ate Yna" 
                  width={24} 
                  height={24} 
                  className="rounded-full ring-2 ring-violet-500/30"
                />
                <span className="text-xs text-gray-500 font-medium">Ate Yna</span>
              </motion.div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                  <Clock className="w-3 h-3" />
                  {readingTime}
                </div>
                <span className="bg-white/5 px-2 py-1 rounded-md">
                  {format(new Date(article.published_at || article.created_at), 'MMM d')}
                </span>
              </div>
            </div>
          </div>

          {/* Card shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Revolutionary Carousel Component
function ArticleCarousel({ articles }: { articles: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef(null);
  const isInView = useInView(carouselRef, { once: true });
  
  const dragX = useMotionValue(0);
  const controls = useAnimation();

  const cardWidth = 400; // card + gap
  const maxIndex = Math.max(0, articles.length - 3);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev >= maxIndex ? 0 : prev + 1;
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isPaused, maxIndex]);

  // Smooth scroll to index
  useEffect(() => {
    if (scrollRef.current) {
      const scrollPosition = currentIndex * cardWidth;
      scrollRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  const handleDragEnd = () => {
    const x = dragX.get();
    const threshold = cardWidth / 3;
    
    if (x > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (x < -threshold && currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    }
    
    controls.start({ x: 0 });
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  return (
    <motion.div 
      ref={carouselRef}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with enhanced styling */}
      <motion.div 
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            className="w-12 h-12 bg-gradient-to-br from-violet-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center border border-violet-400/30"
          >
            <Building className="w-6 h-6 text-violet-400" />
          </motion.div>
          
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              Company Reviews & Profiles
            </h2>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Real insights from real employees</p>
          </div>
        </div>
        
        {/* Enhanced navigation buttons — hidden on mobile, touch swipe instead */}
        <div className="hidden md:flex items-center gap-3">
          <motion.button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={goToNext}
            disabled={currentIndex === maxIndex}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Auto-play indicator */}
          <motion.div
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <motion.div
              animate={{ rotate: isAutoPlaying && !isPaused ? 360 : 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-2 h-2 rounded-full bg-violet-400"
            />
            <span className="text-xs text-gray-500">Auto</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Carousel container with drag support — scrollable on mobile */}
      <motion.div 
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto md:overflow-hidden cursor-grab active:cursor-grabbing snap-x snap-mandatory md:snap-none pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0"
        drag="x"
        dragConstraints={{ left: -maxIndex * cardWidth, right: 0 }}
        dragElastic={0.1}
        style={{ x: dragX }}
        onDragEnd={handleDragEnd}
        animate={controls}
      >
        {articles.map((article, index) => (
          <ArticleCard key={article.id} article={article} index={index} />
        ))}
      </motion.div>

      {/* Dot indicators with enhanced styling */}
      <motion.div 
        className="flex justify-center gap-2 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative overflow-hidden rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'w-8 h-2 bg-violet-400 shadow-[0_0_20px_-5px_rgba(139,92,246,0.8)]' 
                : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            {index === currentIndex && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-violet-300 to-purple-400"
                layoutId="activeIndicator"
                transition={{ type: "spring", stiffness: 500, damping: 50 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Progress indicator for auto-play */}
      {isAutoPlaying && !isPaused && (
        <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-400 to-purple-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

// Enhanced Silo Card Component
function SiloCard({ silo, index }: { silo: any; index: number }) {
  const hasVideo = silo.video_url;
  
  const getSiloIcon = (slug: string) => {
    const iconMap: Record<string, any> = {
      'salary-guide': DollarSign,
      'interview-preparation': Target,
      'career-advancement': TrendingUp,
      'workplace-culture': Users,
      'benefits-compensation': Shield,
      'skills-development': Zap,
      default: Building2
    };
    return iconMap[slug] || iconMap.default;
  };

  const Icon = getSiloIcon(silo.slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.8,
        type: "spring",
        stiffness: 100
      }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Link href={`/insights/${silo.slug}`} className="block h-full group">
        <motion.div 
          className="relative p-8 rounded-3xl h-full overflow-hidden border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/5 to-transparent backdrop-blur-xl shadow-xl group-hover:border-violet-400/50 group-hover:shadow-[0_20px_60px_-10px_rgba(139,92,246,0.4)]"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background gradient animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-violet-600/0 to-purple-600/0 group-hover:from-violet-600/10 group-hover:to-purple-600/5 transition-all duration-500"
          />

          {/* Video play button overlay */}
          {hasVideo && (
            <motion.div
              className="absolute top-6 right-6"
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-10 h-10 bg-violet-500/20 backdrop-blur-md border border-violet-400/40 rounded-xl flex items-center justify-center">
                <Video className="w-4 h-4 text-violet-400" />
              </div>
            </motion.div>
          )}

          <div className="relative z-10">
            {/* Icon with enhanced styling */}
            <motion.div
              className="mb-6"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500/30 to-purple-500/20 rounded-2xl flex items-center justify-center border border-violet-400/30 group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)] transition-shadow duration-500">
                <Icon className="w-8 h-8 text-violet-400" />
              </div>
            </motion.div>

            <motion.h3 
              className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors mb-3"
              whileHover={{ x: 4 }}
            >
              {silo.name}
            </motion.h3>

            {/* Article count badge */}
            <motion.div
              className="mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30">
                <FileText className="w-3 h-3 mr-1" />
                {silo.articles_count || 0} articles
              </Badge>
            </motion.div>

            <p className="text-gray-400 text-sm line-clamp-4 mb-6 leading-relaxed">
              {silo.description}
            </p>

            {/* Enhanced CTA */}
            <motion.div 
              className="flex items-center text-violet-400 text-sm font-medium group-hover:text-violet-300"
              whileHover={{ x: 4 }}
            >
              <span>Explore insights</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function CompaniesSiloClient({ silo, pillarPost, articles, pagination, relatedSilos }: CompaniesSiloClientProps) {
  const [showFullPillar, setShowFullPillar] = useState(false);
  const { scrollY } = useScroll();
  const heroRef = useRef(null);
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);
  
  // Component refs for scroll animations
  const pillarRef = useRef(null);
  const relatedRef = useRef(null);
  const ctaRef = useRef(null);
  
  const isHeroInView = useInView(heroRef, { once: true });
  const isPillarInView = useInView(pillarRef, { once: true, margin: "-100px" });
  const isRelatedInView = useInView(relatedRef, { once: true, margin: "-100px" });
  const isCtaInView = useInView(ctaRef, { once: true, margin: "-100px" });

  // Enhanced pillar preview with smooth fade
  const getPreviewContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    return paragraphs.slice(0, 3).join('\n\n');
  };

  const pillarPreview = pillarPost?.content ? getPreviewContent(pillarPost.content) : '';

  return (
    <div className="overflow-x-hidden selection:bg-violet-500/20 selection:text-violet-200 font-sans min-h-screen bg-[#0B0B0D]">
      <Header />

      {/* Enhanced background effects with animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute top-[-20%] left-1/3 w-[800px] h-[800px] bg-violet-500/8 rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-purple-500/6 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-fuchsia-500/5 rounded-full blur-[140px]"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-violet-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Removed duplicate floating sidebar - keeping only the one in 2-column layout */}

      <div className="relative z-10">
        {/* Breadcrumbs with enhanced animation */}
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center gap-2 text-sm text-gray-500 mb-8"
            >
              <Link href="/insights" className="hover:text-white transition-colors flex items-center gap-1 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Insights
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-violet-400 font-semibold">BPO Company Reviews</span>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Hero Section with video background and parallax */}
        <motion.section
          ref={heroRef}
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative min-h-[85vh] flex items-center overflow-hidden"
        >
          {/* Hero Background with video support */}
          <AnimatePresence>
            {pillarPost && (pillarPost.video_url || pillarPost.hero_url) && (
              <motion.div 
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 z-0"
              >
                {pillarPost.hero_type === 'video' && pillarPost.video_url ? (
                  <video 
                    src={pillarPost.video_url} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                ) : pillarPost.hero_url ? (
                  <img 
                    src={pillarPost.hero_url} 
                    alt={pillarPost.title} 
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/80 to-[#0B0B0D]/60"
                  animate={{ opacity: [0.8, 0.9, 0.8] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              >
                {/* Animated badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={isHeroInView ? { scale: 1, rotate: 0 } : {}}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Badge className="mb-6 md:mb-8 bg-violet-500/20 text-violet-300 border-violet-400/40 text-sm md:text-lg px-4 py-2 md:px-8 md:py-3 shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                    Company Intelligence Hub
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 ml-2 md:ml-3" />
                  </Badge>
                </motion.div>

                {/* Enhanced main heading */}
                <motion.h1 
                  className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black mb-6 md:mb-8 tracking-tight"
                  initial={{ opacity: 0, y: 40 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <span className="text-white">BPO Company</span>
                  <br />
                  <motion.span 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-500"
                    animate={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ 
                      duration: 8, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    style={{ 
                      backgroundSize: "200% 200%"
                    }}
                  >
                    Reviews
                  </motion.span>
                </motion.h1>

                {/* Enhanced subtitle */}
                <motion.p 
                  className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-10 max-w-4xl leading-relaxed"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  Honest reviews and insider perspectives on BPO employers in the Philippines. 
                  <span className="text-violet-400 font-semibold"> Know before you apply.</span>
                </motion.p>

                {/* Enhanced stats with staggered animation */}
                <motion.div 
                  className="flex flex-wrap items-center gap-6 text-lg"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1, duration: 0.8 }}
                >
                  <motion.div 
                    className="flex items-center gap-2 md:gap-3 bg-violet-500/20 px-4 py-2 md:px-8 md:py-4 rounded-full border border-violet-500/30 backdrop-blur-md shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <FileText className="w-5 h-5 text-violet-400" />
                    <motion.span 
                      className="text-white font-bold text-xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" }}
                    >
                      {articles.length}
                    </motion.span>
                    <span className="text-gray-400">articles</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-3 text-gray-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 1.4, duration: 0.6 }}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Updated Feb 2026</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Revolutionary Article Carousel */}
          {articles.length > 0 && (
            <section className="mb-24">
              <ArticleCarousel articles={articles} />
            </section>
          )}

          {/* Main Content Area with 2-column layout for pillar + sidebar */}
          <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
            {/* Pillar Content - Enhanced and collapsible */}
            {pillarPost && (
              <motion.section
                ref={pillarRef}
                initial={{ opacity: 0, y: 60 }}
                animate={isPillarInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                <motion.div 
                  className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 via-white/5 to-transparent backdrop-blur-xl overflow-hidden shadow-2xl"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header with enhanced styling */}
                  <div className="p-4 md:p-8 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <motion.div 
                          className="flex items-center gap-4 mb-6"
                          whileHover={{ x: 4 }}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500/30 to-purple-500/20 rounded-2xl flex items-center justify-center border border-violet-400/30 shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]">
                            <BookOpen className="w-6 h-6 text-violet-400" />
                          </div>
                          <Badge className="bg-violet-500/30 text-violet-200 border-violet-400/40 px-4 py-2">
                            <Sparkles className="w-4 h-4 mr-2" />
                            The Complete Guide
                          </Badge>
                        </motion.div>
                        
                        <motion.h2 
                          className="text-3xl md:text-4xl font-black text-white mb-3"
                          whileHover={{ x: 4 }}
                        >
                          {pillarPost.title}
                        </motion.h2>
                        
                        <p className="text-gray-400">Everything you need to know about BPO company reviews</p>
                      </div>
                      
                      <motion.button
                        onClick={() => setShowFullPillar(!showFullPillar)}
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 text-violet-400 hover:text-white transition-all backdrop-blur-sm"
                      >
                        <motion.div
                          animate={{ rotate: showFullPillar ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-6 h-6" />
                        </motion.div>
                      </motion.button>
                    </div>
                  </div>

                  {/* Content with smooth expand/collapse */}
                  <div className="p-4 md:p-8">
                    <motion.div
                      animate={{ height: showFullPillar ? "auto" : "400px" }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="relative overflow-hidden"
                    >
                      <div className="prose prose-invert prose-lg max-w-none">
                        {showFullPillar && (pillarPost.content_part1 || pillarPost.content_part2 || pillarPost.content_part3) ? (
                          <>
                            {pillarPost.content_image0 && (
                              <figure className="my-8 rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl">
                                <img src={pillarPost.content_image0} alt={`${pillarPost.title} - Introduction`} className="w-full h-auto object-cover" loading="lazy" />
                              </figure>
                            )}
                            {pillarPost.content_part1 && (
                              <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                {sanitizeHeadings(pillarPost.content_part1)}
                              </ReactMarkdown>
                            )}
                            {pillarPost.content_image1 && (
                              <figure className="my-12 rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl">
                                <img src={pillarPost.content_image1} alt={`${pillarPost.title} - Main content`} className="w-full h-auto object-cover" loading="lazy" />
                              </figure>
                            )}
                            {pillarPost.content_part2 && (
                              <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                {sanitizeHeadings(pillarPost.content_part2)}
                              </ReactMarkdown>
                            )}
                            {pillarPost.content_image2 && (
                              <figure className="my-12 rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl">
                                <img src={pillarPost.content_image2} alt={`${pillarPost.title} - Conclusion`} className="w-full h-auto object-cover" loading="lazy" />
                              </figure>
                            )}
                            {pillarPost.content_part3 && (
                              <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                                {sanitizeHeadings(pillarPost.content_part3)}
                              </ReactMarkdown>
                            )}
                          </>
                        ) : (
                          <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                            {sanitizeHeadings(showFullPillar ? pillarPost.content : pillarPreview)}
                          </ReactMarkdown>
                        )}
                      </div>
                      
                      {/* Smooth gradient fade */}
                      <AnimatePresence>
                        {!showFullPillar && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/80 to-transparent pointer-events-none"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                    
                    <AnimatePresence>
                      {!showFullPillar && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="mt-8 text-center"
                        >
                          <motion.button
                            onClick={() => setShowFullPillar(true)}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="group px-8 py-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 text-violet-300 border border-violet-500/30 hover:border-violet-400/50 rounded-2xl transition-all duration-300 backdrop-blur-sm shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)] font-semibold"
                          >
                            <span className="flex items-center gap-2">
                              Read the complete guide 
                              <motion.div
                                animate={{ y: [0, 4, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                ↓
                              </motion.div>
                            </span>
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.section>
            )}

            {/* Sidebar Content — stacks below on mobile, sticky on desktop */}
            {/* NOTE: Do NOT use motion.div here — Framer Motion transforms break position:sticky */}
            <div className="lg:sticky lg:top-24 self-start">
              {/* Scrollable wrapper with max height */}
              <div className="space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                <StickySidebarCTA />
                
                {/* Quick stats sidebar */}
                <motion.div
                  className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl"
                  whileHover={{ y: -4 }}
                >
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    Quick Stats
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Reviews</span>
                      <span className="text-violet-400 font-bold">{articles.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Average Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-bold">4.2</span>
                      </div>
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

          {/* Enhanced "You May Also Like" Section */}
          {relatedSilos.length > 0 && (
            <motion.section
              ref={relatedRef}
              initial={{ opacity: 0, y: 80 }}
              animate={isRelatedInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mt-24 mb-16"
            >
              <div className="mb-12 text-center">
                <motion.h2 
                  className="text-4xl md:text-5xl font-black text-white flex items-center justify-center gap-4 mb-4"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    className="w-12 h-12 bg-gradient-to-br from-violet-500/30 to-purple-500/20 rounded-2xl flex items-center justify-center border border-violet-400/30"
                  >
                    <TrendingUp className="w-7 h-7 text-violet-400" />
                  </motion.div>
                  You May Also Like
                </motion.h2>
                <p className="text-gray-500 text-lg">Explore other career insights and guides</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedSilos.slice(0, 4).map((related, index) => (
                  <SiloCard key={related.id} silo={related} index={index} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Enhanced Bottom CTA */}
          <motion.section
            ref={ctaRef}
            initial={{ opacity: 0, y: 80 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <motion.div 
              className="max-w-4xl mx-auto text-center relative"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-3xl blur-3xl" />
              
              <div className="relative p-6 md:p-12 rounded-2xl md:rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 via-white/5 to-transparent backdrop-blur-xl">
                <motion.h2 
                  className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 md:mb-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 }}
                >
                  Ready to find your dream BPO job?
                </motion.h2>
                
                <motion.p 
                  className="text-gray-400 text-base md:text-xl mb-6 md:mb-10 max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  Join thousands of professionals who've found their perfect company match
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isCtaInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  <SignUpCTA />
                </motion.div>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </div>

      {/* Enhanced scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Custom scrollbar for main content */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        /* GPU acceleration for animations */
        .gpu-accelerated {
          will-change: transform, opacity;
          transform: translateZ(0);
        }
      `}</style>
    </div>
  );
}
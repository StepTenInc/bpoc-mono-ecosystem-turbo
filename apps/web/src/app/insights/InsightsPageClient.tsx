'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  Calendar, ArrowRight, Clock, User, Sparkles, Filter, Newspaper,
  PlayCircle, Image as ImageIcon, DollarSign, BrainCircuit, TrendingUp,
  Shield, Users, Globe, Briefcase, Calculator, Mic, FileText,
  GraduationCap, Building2, MessageSquare, Heart, ChevronRight, Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';

// Icon mapping for silos
const IconMap: Record<string, any> = {
  DollarSign, BrainCircuit, TrendingUp, Shield, Users, Globe, Briefcase,
  Calculator, Mic, FileText, GraduationCap, Building2, MessageSquare, Heart
};

// Default icons for silos by slug
const SiloIcons: Record<string, any> = {
  'bpo-salary-compensation': DollarSign,
  'bpo-career-growth': TrendingUp,
  'bpo-jobs': Briefcase,
  'interview-tips': MessageSquare,
  'bpo-employment-guide': FileText,
  'bpo-company-reviews': Building2,
  'training-and-certifications': GraduationCap,
  'work-life-balance': Heart,
};

interface Silo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface InsightsPageClientProps {
  initialPosts: any[];
  silos?: Silo[];
}

// Silo Card Component
function SiloCard({ silo, index, onNavigate, isNavigating }: { silo: Silo; index: number; onNavigate: (id: string) => void; isNavigating: string | null }) {
  const Icon = silo.icon ? (IconMap[silo.icon] || FileText) : (SiloIcons[silo.slug] || FileText);
  const color = silo.color || '#06B6D4';
  const isLoading = isNavigating === `silo-${silo.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <div
        onClick={() => {
          if (!isNavigating) {
            onNavigate(`silo-${silo.id}`);
            window.location.href = `/insights/${silo.slug}`;
          }
        }}
        className="block group h-full cursor-pointer"
      >
        <article
          className="relative h-full overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-2xl p-8"
          style={{
            background: `linear-gradient(135deg, ${color}08 0%, transparent 50%)`,
            borderColor: isLoading ? color : `${color}20`,
            boxShadow: isLoading ? `0 0 40px ${color}30, inset 0 0 60px ${color}10` : 'none',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = `${color}50`;
              e.currentTarget.style.boxShadow = `0 25px 50px -12px ${color}20`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = `${color}20`;
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl backdrop-blur-sm"
                style={{ backgroundColor: `${color}15` }}
              >
                {/* Pulsing ring effect */}
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${color}` }}
                    animate={{
                      scale: [1, 1.5, 2],
                      opacity: [0.6, 0.3, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${color}` }}
                    animate={{
                      scale: [1, 1.5, 2],
                      opacity: [0.6, 0.3, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5,
                    }}
                  />
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${color}10 0%, transparent 60%)`,
            }}
          />

          {/* Icon */}
          <div
            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 ${isLoading ? 'opacity-30' : ''}`}
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-7 h-7" style={{ color }} />
          </div>

          {/* Content */}
          <div className={`relative ${isLoading ? 'opacity-30' : ''}`}>
            <h3
              className="text-2xl font-bold mb-3 transition-colors duration-300"
              style={{ color: 'white' }}
            >
              {silo.name}
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
              {silo.description || `Explore ${silo.name.toLowerCase()} insights and guides.`}
            </p>

            <div
              className="flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3"
              style={{ color }}
            >
              <span>{isLoading ? 'Loading...' : 'Explore'}</span>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
          </div>
        </article>
      </div>
    </motion.div>
  );
}

// Article Card Component
function ArticleCard({ article, index, silos, onNavigate, isNavigating }: { article: any; index: number; silos?: Silo[]; onNavigate: (id: string) => void; isNavigating: string | null }) {
  if (!article) return null;

  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroMedia = article.video_url || article.hero_url || article.content_image0;
  const isLoading = isNavigating === `article-${article.id}`;

  // Try to get silo slug from various sources
  let siloSlug = '';
  if (article.silo?.slug) {
    siloSlug = article.silo.slug;
  } else if (article.silo_id && silos) {
    const matchedSilo = silos.find(s => s.id === article.silo_id);
    siloSlug = matchedSilo?.slug || '';
  } else if (article.silo_topic) {
    siloSlug = article.silo_topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  } else if (article.category) {
    siloSlug = article.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  // Safe date formatting
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  const articleUrl = siloSlug ? `/insights/${siloSlug}/${article.slug}` : `/insights/${article.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.5 }}
    >
      <div
        onClick={() => {
          if (!isNavigating) {
            onNavigate(`article-${article.id}`);
            window.location.href = articleUrl;
          }
        }}
        className="block group h-full cursor-pointer"
      >
        <article className={`h-full flex flex-col relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0f0f12] to-[#080809] transition-all duration-500 ${isLoading ? 'border-cyan-500/50 shadow-2xl shadow-cyan-500/20' : 'border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-cyan-500/5'}`}>
          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl backdrop-blur-sm bg-black/40"
              >
                {/* Scanning line effect */}
                <motion.div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Center loader */}
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 rounded-full border-2 border-cyan-400/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-cyan-400"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-3 h-3 rounded-full bg-cyan-400"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>

                {/* Loading text */}
                <motion.div
                  className="absolute bottom-8 left-0 right-0 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-cyan-400 text-sm font-medium tracking-wider">Loading article...</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media Container */}
          <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-gray-900 to-black">
            {hasVideo ? (
              <video
                src={article.video_url}
                autoPlay
                muted
                loop
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ${isLoading ? 'opacity-50' : ''}`}
              />
            ) : heroMedia ? (
              <img
                src={heroMedia}
                alt={article.title || 'Article'}
                className={`absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ${isLoading ? 'opacity-50' : ''}`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className={`w-16 h-16 text-gray-700 ${isLoading ? 'opacity-50' : ''}`} />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080809] via-transparent to-transparent" />

            {/* Video badge - only show for videos */}
            {hasVideo && !isLoading && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white text-xs">
                  <PlayCircle className="w-3 h-3 mr-1" /> Video
                </Badge>
              </div>
            )}

            {/* Category badge */}
            {article.category && !isLoading && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-cyan-500/80 text-white border-0 text-xs font-semibold">
                  {article.category}
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`p-6 flex flex-col flex-grow ${isLoading ? 'opacity-40' : ''}`}>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2 leading-tight">
              {article.title || 'Untitled'}
            </h3>

            <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">
              {article.description || ''}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {article.author_slug === 'ate-yna' ? (
                  <Image
                    src="/Chat Agent/Ate Yna.png"
                    alt={article.author || 'Ate Yna'}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                )}
                <span>{article.author || 'Ate Yna'}</span>
              </div>
              <time className="text-xs text-gray-600 font-mono">
                {formatDate(article.created_at || article.published_at)}
              </time>
            </div>
          </div>
        </article>
      </div>
    </motion.div>
  );
}

export default function InsightsPageClient({ initialPosts, silos = [] }: InsightsPageClientProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleNavigate = (id: string) => {
    setNavigatingTo(id);
  };

  // Filter articles
  const filteredPosts = activeFilter
    ? initialPosts.filter(post =>
        post.category?.toLowerCase().includes(activeFilter.toLowerCase()) ||
        post.silo_id === activeFilter
      )
    : initialPosts;

  return (
    <div className="min-h-screen bg-[#050506] text-white overflow-x-hidden">
      <Header />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-1/3 w-[1000px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-[30%] right-[-10%] w-[800px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[900px] h-[700px] bg-emerald-500/5 rounded-full blur-[140px]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-32 pb-20 px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-8 bg-white/5 text-cyan-400 border-white/10 text-sm px-5 py-2 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
              BPOC Research & Insights
            </Badge>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.95]">
              <span className="text-white">The </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400">
                Insights
              </span>
              <span className="text-white">.</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Unfiltered insights, salary data, and career hacks from the BPO trenches.
              Written by humans, for humans.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SILOS SECTION - Clearly Separated */}
      {silos.length > 0 && (
        <section className="relative z-10 py-20 px-6 md:px-12 lg:px-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-400" />
                <span className="text-cyan-400 font-mono text-sm uppercase tracking-widest">Browse by Topic</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Explore Categories
              </h2>
              <p className="text-gray-500 mt-3 text-lg">Deep-dive into specialized topics that matter to your career</p>
            </motion.div>

            {/* Silos Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {silos.map((silo, index) => (
                <SiloCard key={silo.id} silo={silo} index={index} onNavigate={handleNavigate} isNavigating={navigatingTo} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ARTICLES SECTION - Separated from Silos */}
      <section className="relative z-10 py-20 px-6 md:px-12 lg:px-20 bg-[#050506]">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-[2px] bg-gradient-to-r from-purple-400 to-pink-400" />
              <span className="text-purple-400 font-mono text-sm uppercase tracking-widest">Latest Content</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              All Articles
            </h2>
            <p className="text-gray-500 mt-3 text-lg">{initialPosts.length} insights to level up your BPO career</p>
          </motion.div>

          {/* Filter Pills */}
          {silos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <button
                onClick={() => setActiveFilter(null)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                  !activeFilter
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                All Topics
              </button>
              {silos.map((silo) => (
                <button
                  key={silo.id}
                  onClick={() => setActiveFilter(activeFilter === silo.id ? null : silo.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                    activeFilter === silo.id
                      ? 'border-white/50 text-white'
                      : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: activeFilter === silo.id ? `${silo.color}20` : 'transparent',
                    borderColor: activeFilter === silo.id ? `${silo.color}50` : undefined,
                    color: activeFilter === silo.id ? silo.color || 'white' : undefined,
                  }}
                >
                  {silo.name}
                </button>
              ))}
            </motion.div>
          )}

          {/* Articles Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((article, index) => (
                <ArticleCard key={article.id || article.slug} article={article} index={index} silos={silos} onNavigate={handleNavigate} isNavigating={navigatingTo} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Newspaper className="w-16 h-16 mx-auto text-gray-700 mb-6" />
              <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
              <p className="text-gray-500 mb-6">Try selecting a different category</p>
              <Button
                onClick={() => setActiveFilter(null)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                View All Articles
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="relative z-10 py-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-white/10 p-12 md:p-16 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(139,92,246,0.1) 50%, rgba(16,185,129,0.1) 100%)',
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400" />

            <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-8" />

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Don't Miss the Next <span className="text-cyan-400">Hot Take</span>
            </h2>

            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join 5,000+ BPO professionals getting weekly salary leaks, interview hacks,
              and Ate Yna's unfiltered advice.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all text-lg"
              />
              <Button className="px-8 py-4 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 rounded-xl whitespace-nowrap">
                Subscribe Free
              </Button>
            </div>

            <p className="mt-6 text-sm text-gray-600">
              No spam. Unsubscribe anytime. We respect your inbox.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

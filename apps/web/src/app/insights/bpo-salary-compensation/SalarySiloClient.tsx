'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  Calendar, ArrowRight, Clock, ArrowLeft, ChevronRight, FileText,
  DollarSign, TrendingUp, Crown, User, Coins, Volume2, VolumeX,
  Play, ChevronDown, Sparkles, Plus, Pencil
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';

interface SalarySiloClientProps {
  silo: any;
  pillarPost: any;
  articles: any[];
  pagination: any;
  relatedSilos: any[];
}

// Salary silo color
const siloColor = '#EAB308'; // Yellow-500

// Markdown components for pillar content - matches article styling with salary theme
const MarkdownComponents: any = {
  h1: ({ node, ...props }: any) => (
    <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-12 mb-6 tracking-tight" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <div className="mt-16 mb-8 group">
      <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3 relative" {...props}>
        <span className="absolute -left-6 top-1 w-1 h-8 rounded-full opacity-100 shadow-lg bg-yellow-400" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          {props.children}
        </span>
      </h2>
    </div>
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-2xl font-bold text-yellow-400 mt-10 mb-4 tracking-wide flex items-center gap-2" {...props} />
  ),
  h4: ({ node, ...props }: any) => (
    <h4 className="text-xl font-semibold text-white mt-8 mb-3 border-l-2 border-yellow-400 pl-4" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-300 leading-relaxed mb-6 text-lg font-light tracking-wide" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="space-y-4 my-6 p-6 rounded-xl border border-yellow-500/30 bg-white/5 shadow-inner backdrop-blur-sm" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-inside space-y-3 my-6 text-gray-300 pl-4" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="flex items-start gap-3 text-gray-300 group transition-colors duration-200 hover:text-white">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 shadow-lg" />
      <span className="flex-1 leading-relaxed">{props.children}</span>
    </li>
  ),
  blockquote: ({ node, ...props }: any) => (
    <div className="flex items-start gap-4 border-l-4 border-yellow-400 p-5 rounded-r-xl my-6 bg-yellow-500/10">
      <div className="flex-1 min-w-0">
        <p className="text-gray-200 text-base leading-relaxed m-0">{props.children}</p>
      </div>
    </div>
  ),
  a: ({ node, ...props }: any) => (
    <a
      className="font-medium transition-colors text-yellow-400 underline underline-offset-4 decoration-2 decoration-yellow-500/50 hover:decoration-yellow-400"
      {...props}
    />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-10 rounded-xl border border-white/10 bg-white/5 shadow-inner backdrop-blur-sm">
      <table className="w-full text-left text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-white/10 text-white font-bold uppercase tracking-wider border-b border-white/10" {...props} />
  ),
  th: ({ node, ...props }: any) => <th className="p-4 text-yellow-400" {...props} />,
  td: ({ node, ...props }: any) => (
    <td className="p-4 border-b border-white/5 text-gray-300 whitespace-nowrap hover:bg-white/5 transition-colors" {...props} />
  ),
  hr: ({ node, ...props }: any) => <hr className="border-t border-white/10 my-12" {...props} />,
  code: ({ node, inline, className, children, ...props }: any) => {
    return !inline ? (
      <div className="relative my-8 rounded-lg overflow-hidden border border-white/10 bg-[#0F0F11] shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="p-6 overflow-x-auto font-mono text-sm text-gray-300">
          <code {...props}>{children}</code>
        </div>
      </div>
    ) : (
      <code
        className="px-1.5 py-0.5 rounded text-sm font-mono border bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
        {...props}
      >
        {children}
      </code>
    );
  },
};

function ArticleCard({ article, siloSlug, index }: { article: any; siloSlug: string; index: number }) {
  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroImage = article.video_url || article.hero_url || article.content_image0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link href={`/insights/${siloSlug}/${article.slug}`} className="block group">
        <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f0f12] to-[#080809] border border-yellow-500/10 hover:border-yellow-400/30 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/10">
          {/* Image/Video Container */}
          <div className="aspect-[16/10] relative overflow-hidden">
            {hasVideo ? (
              <video
                src={article.video_url}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
            ) : heroImage ? (
              <img
                src={heroImage}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/40 to-amber-900/20 flex items-center justify-center">
                <DollarSign className="w-16 h-16 text-yellow-500/30" />
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080809] via-transparent to-transparent opacity-90" />

            {/* Video badge - only show for videos */}
            {hasVideo && (
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-yellow-500/90 text-black rounded-full">
                  Video
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors duration-300 line-clamp-2 leading-tight">
              {article.title}
            </h3>

            <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
              {article.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <time className="text-xs text-gray-600 font-mono">
                {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
              </time>
              <span className="text-yellow-400 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Read <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

export default function SalarySiloClient({
  silo,
  pillarPost,
  articles,
  pagination,
  relatedSilos,
}: SalarySiloClientProps) {
  const [displayedArticles, setDisplayedArticles] = useState(articles);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [showFullContent, setShowFullContent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax effect for hero
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const textY = useTransform(scrollY, [0, 400], [0, -50]);

  const loadMore = async () => {
    if (loading || !pagination.hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/silos/${silo.slug}?page=${currentPage + 1}&limit=12`);
      const data = await res.json();
      if (data.articles) {
        setDisplayedArticles(prev => [...prev, ...data.articles]);
        setCurrentPage(data.pagination.page);
      }
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Get hero media from pillar post or silo
  const heroVideo = pillarPost?.video_url || silo?.hero_video_url;
  const heroImage = pillarPost?.hero_url || silo?.hero_image_url;

  return (
    <div className="min-h-screen bg-[#050506] text-white overflow-x-hidden">
      <Header />

      {/* CINEMATIC HERO SECTION */}
      <section ref={heroRef} className="relative h-[100vh] min-h-[700px] overflow-hidden">
        {/* Video/Image Background with Parallax */}
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY }}
        >
          {heroVideo ? (
            <video
              ref={videoRef}
              src={heroVideo}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : heroImage ? (
            <img
              src={heroImage}
              alt={silo.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/30 via-[#050506] to-amber-900/20" />
          )}
        </motion.div>

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-[#050506]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050506]/80 via-transparent to-[#050506]/40" />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />

        {/* Hero Content */}
        <motion.div
          className="relative z-10 h-full flex flex-col justify-end pb-20 px-6 md:px-12 lg:px-20"
          style={{ y: textY, opacity: heroOpacity }}
        >
          <div className="max-w-5xl">
            {/* Category Tag */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge className="mb-6 bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-sm px-4 py-2 backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Salary Intelligence Hub
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.9]"
            >
              <span className="text-white block">Know Your</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">
                Worth.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl text-gray-300 max-w-2xl leading-relaxed mb-8"
            >
              {silo.description || "Comprehensive salary benchmarks, compensation guides, and pay rate insights for the Philippine BPO industry."}
            </motion.p>

            {/* Stats & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-4"
            >
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-5 py-3 rounded-full border border-white/10">
                <FileText className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-bold text-lg">{pagination.total}</span>
                <span className="text-gray-400">guides</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-5 py-3 rounded-full border border-white/10">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-white font-bold text-lg">2024</span>
                <span className="text-gray-400">updated</span>
              </div>

              {/* Pillar Post Action Button */}
              {pillarPost ? (
                <Link href={`/admin/insights/create?edit=${pillarPost.id}`}>
                  <Button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 backdrop-blur-md px-5 py-3 rounded-full">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Pillar Article
                  </Button>
                </Link>
              ) : (
                <Link href={`/admin/insights/create?silo=${silo.slug}&pillar=true`}>
                  <Button className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 backdrop-blur-md px-5 py-3 rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Pillar Post
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Sound Toggle */}
        {heroVideo && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={toggleMute}
            className="absolute bottom-8 right-8 z-20 p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </motion.button>
        )}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* PILLAR CONTENT SECTION */}
      {pillarPost && (
        <section className="relative py-20 px-6 md:px-12 lg:px-20">
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent" />

          <div className="max-w-4xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Pillar Badge */}
              <div className="flex items-center gap-3 mb-8">
                <Crown className="w-8 h-8 text-yellow-400" />
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-base px-4 py-2">
                  Pillar Guide
                </Badge>
              </div>

              {/* Pillar Title */}
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {pillarPost.title}
              </h2>

              {/* Author & Meta */}
              <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {pillarPost.author_slug === 'ate-yna' ? (
                    <Image
                      src="/Chat Agent/Ate Yna.png"
                      alt={pillarPost.author || "Ate Yna"}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-yellow-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-yellow-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold">{pillarPost.author || "Ate Yna"}</p>
                    <p className="text-gray-500 text-sm">BPO Career Expert</p>
                  </div>
                </div>
                {pillarPost.read_time && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{pillarPost.read_time}</span>
                  </div>
                )}
              </div>

              {/* Pillar Content */}
              <div className={`prose prose-invert prose-lg max-w-none ${!showFullContent ? 'max-h-[600px] overflow-hidden relative' : ''}`}>
                {/* Section Images and Content - Same pattern as article pages */}
                {(pillarPost.content_part1 || pillarPost.content_part2 || pillarPost.content_part3) ? (
                  <>
                    {/* Featured Image */}
                    {pillarPost.content_image0 && (
                      <figure className="my-8 rounded-2xl overflow-hidden border border-yellow-500/20 shadow-2xl">
                        <img
                          src={pillarPost.content_image0}
                          alt={`${pillarPost.title} - Introduction`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      </figure>
                    )}

                    {/* Section 1 */}
                    {pillarPost.content_part1 && (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {pillarPost.content_part1}
                      </ReactMarkdown>
                    )}

                    {/* Section Image 1 */}
                    {pillarPost.content_image1 && (
                      <figure className="my-12 rounded-2xl overflow-hidden border border-yellow-500/20 shadow-2xl">
                        <img
                          src={pillarPost.content_image1}
                          alt={`${pillarPost.title} - Main content`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      </figure>
                    )}

                    {/* Section 2 */}
                    {pillarPost.content_part2 && (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {pillarPost.content_part2}
                      </ReactMarkdown>
                    )}

                    {/* Section Image 2 */}
                    {pillarPost.content_image2 && (
                      <figure className="my-12 rounded-2xl overflow-hidden border border-yellow-500/20 shadow-2xl">
                        <img
                          src={pillarPost.content_image2}
                          alt={`${pillarPost.title} - Conclusion`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      </figure>
                    )}

                    {/* Section 3 */}
                    {pillarPost.content_part3 && (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {pillarPost.content_part3}
                      </ReactMarkdown>
                    )}
                  </>
                ) : (
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {pillarPost.content}
                  </ReactMarkdown>
                )}

                {/* Fade gradient for collapsed state */}
                {!showFullContent && (
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050506] to-transparent" />
                )}
              </div>

              {/* Expand/Collapse Button */}
              <div className="mt-8 text-center">
                <Button
                  onClick={() => setShowFullContent(!showFullContent)}
                  variant="outline"
                  className="px-8 py-6 text-lg border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400/50"
                >
                  {showFullContent ? 'Show Less' : 'Read Full Guide'}
                  <ChevronDown className={`ml-2 w-5 h-5 transition-transform ${showFullContent ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ARTICLES SECTION */}
      {displayedArticles.length > 0 && (
        <section className="py-20 px-6 md:px-12 lg:px-20 bg-[#050506]">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-[2px] bg-yellow-400" />
                <span className="text-yellow-400 font-mono text-sm uppercase tracking-widest">Related Guides</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                More Salary Insights
              </h2>
              <p className="text-gray-500 mt-3 text-lg">{pagination.total} guides to help you negotiate better</p>
            </motion.div>

            {/* Articles Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedArticles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  siloSlug={silo.slug}
                  index={index}
                />
              ))}
            </div>

            {/* Load More */}
            {pagination.hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mt-16"
              >
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-10 py-6 text-lg bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 rounded-full"
                >
                  {loading ? 'Loading...' : 'Load More Guides'}
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* No Content State */}
      {displayedArticles.length === 0 && !pillarPost && (
        <section className="py-32 text-center">
          <DollarSign className="w-24 h-24 mx-auto text-yellow-500/20 mb-6" />
          <h2 className="text-2xl font-semibold text-white mb-3">No salary guides yet</h2>
          <p className="text-gray-500">Check back soon for salary insights.</p>
        </section>
      )}

      {/* RELATED SILOS SECTION */}
      {relatedSilos.length > 0 && (
        <section className="py-20 px-6 md:px-12 lg:px-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="text-3xl font-bold text-white">Explore Other Topics</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedSilos.map((related, index) => (
                <motion.div
                  key={related.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/insights/${related.slug}`}>
                    <div
                      className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                      style={{ borderColor: `${related.color}20` }}
                    >
                      <h3
                        className="font-bold text-white group-hover:text-opacity-100 transition-colors text-lg mb-2"
                        style={{ color: related.color }}
                      >
                        {related.name}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{related.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back Link */}
      <section className="py-12 px-6 text-center border-t border-white/5">
        <Link href="/insights">
          <Button variant="outline" className="border-white/20 hover:bg-white/5 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Insights
          </Button>
        </Link>
      </section>
    </div>
  );
}

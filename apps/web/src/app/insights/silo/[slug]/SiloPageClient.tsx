'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  Calendar, ArrowRight, Clock, Sparkles, PlayCircle,
  Image as ImageIcon, ArrowLeft, ChevronRight, FileText,
  DollarSign, TrendingUp, Briefcase, MessageSquare,
  Building2, GraduationCap, Heart, Crown, User
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';

interface Article {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero_url: string | null;
  video_url: string | null;
  hero_type: 'image' | 'video' | null;
  read_time: string | null;
  published_at: string;
  created_at: string;
  view_count: number;
  content_image0: string | null;
  seo?: {
    meta_title: string | null;
    meta_description: string | null;
    keywords: string[] | null;
  };
}

interface Silo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  context: string | null;
  icon: string | null;
  color: string | null;
  hero_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

interface RelatedSilo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface PillarPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  content_part1: string | null;
  content_part2: string | null;
  content_part3: string | null;
  hero_url: string | null;
  video_url: string | null;
  hero_type: 'image' | 'video' | null;
  read_time: string | null;
  published_at: string;
  content_image0: string | null;
  content_image1: string | null;
  content_image2: string | null;
  author: string | null;
  author_slug: string | null;
}

interface SiloPageClientProps {
  silo: Silo;
  pillarPost?: PillarPost | null;
  articles: Article[];
  pagination: Pagination;
  relatedSilos: RelatedSilo[];
}

// Icon component based on icon name
function SiloIcon({ icon, color, size = 'md' }: { icon: string | null; color: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-16 h-16',
  };

  const iconColor = color || '#3B82F6';

  const iconMap: Record<string, React.ReactNode> = {
    DollarSign: <DollarSign className={sizeClasses[size]} style={{ color: iconColor }} />,
    TrendingUp: <TrendingUp className={sizeClasses[size]} style={{ color: iconColor }} />,
    Briefcase: <Briefcase className={sizeClasses[size]} style={{ color: iconColor }} />,
    MessageSquare: <MessageSquare className={sizeClasses[size]} style={{ color: iconColor }} />,
    FileText: <FileText className={sizeClasses[size]} style={{ color: iconColor }} />,
    Building2: <Building2 className={sizeClasses[size]} style={{ color: iconColor }} />,
    GraduationCap: <GraduationCap className={sizeClasses[size]} style={{ color: iconColor }} />,
    Heart: <Heart className={sizeClasses[size]} style={{ color: iconColor }} />,
  };

  return iconMap[icon || ''] || <FileText className={sizeClasses[size]} style={{ color: iconColor }} />;
}

// Article Card component
function ArticleCard({ article }: { article: Article }) {
  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroImage = article.hero_url || article.content_image0;

  return (
    <Link href={`/insights/${article.slug}`} className="h-full block">
      <div className="h-full flex flex-col relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-cyan-900/10">
        {/* Card Header/Image Area */}
        <div className="h-48 w-full relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
          {hasVideo ? (
            <video
              src={article.video_url!}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          ) : heroImage ? (
            <img
              src={heroImage}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-16 h-16 text-white/20" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D]/60 to-transparent" />

          {/* Media Type Badge */}
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-black/40 backdrop-blur-md border-white/10 text-white hover:bg-black/60">
              {hasVideo ? <PlayCircle className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
              {hasVideo ? 'Video' : 'Article'}
            </Badge>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-4 text-xs font-mono">
            <span className="text-cyan-400 font-bold">
              {article.read_time || '5 min read'}
            </span>
            {article.view_count > 0 && (
              <span className="text-gray-500">{article.view_count} views</span>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
            {article.description || article.seo?.meta_description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            <span className="text-xs text-gray-500 font-mono">
              {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
            </span>
            <span className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors flex items-center">
              Read <ArrowRight className="w-3 h-3 ml-1 group-hover:ml-2 transition-all" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function SiloPageClient({
  silo,
  pillarPost,
  articles,
  pagination,
  relatedSilos,
}: SiloPageClientProps) {
  const [currentPage, setCurrentPage] = useState(pagination.page);
  const [displayedArticles, setDisplayedArticles] = useState(articles);
  const [loading, setLoading] = useState(false);
  const [showFullPillar, setShowFullPillar] = useState(false);

  const loadMore = async () => {
    if (loading || !pagination.hasMore) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/silos/${silo.slug}?page=${currentPage + 1}&limit=${pagination.limit}`);
      const data = await res.json();

      if (data.articles) {
        setDisplayedArticles(prev => [...prev, ...data.articles]);
        setCurrentPage(data.pagination.page);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200 font-sans min-h-screen bg-[#0B0B0D]">
      <Header />

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[120px]"
          style={{ backgroundColor: `${silo.color || '#3B82F6'}10` }}
        />
        <div className="absolute top-[40%] right-[-10%] w-[800px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 cyber-grid opacity-[0.03]" />
      </div>

      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-gray-500 mb-8"
          >
            <Link href="/insights" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Insights
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span style={{ color: silo.color || '#3B82F6' }}>{silo.name}</span>
          </motion.div>

          {/* Silo Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl mb-8">
              {/* Background Image/Gradient */}
              {silo.hero_image ? (
                <div className="absolute inset-0">
                  <img
                    src={silo.hero_image}
                    alt={silo.name}
                    className="w-full h-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D] via-[#0B0B0D]/80 to-transparent" />
                </div>
              ) : (
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundColor: silo.color || '#3B82F6' }}
                />
              )}

              <div className="relative p-8 md:p-12">
                <div className="flex items-start gap-6">
                  {/* Icon */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${silo.color || '#3B82F6'}20` }}
                  >
                    <SiloIcon icon={silo.icon} color={silo.color} size="lg" />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <Badge
                      className="mb-4"
                      style={{
                        backgroundColor: `${silo.color || '#3B82F6'}20`,
                        color: silo.color || '#3B82F6',
                        borderColor: `${silo.color || '#3B82F6'}30`,
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-2" />
                      Content Silo
                    </Badge>

                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-white">
                      {silo.name}
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                      {silo.description || `Explore all articles about ${silo.name.toLowerCase()} in the Philippine BPO industry.`}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-6 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-white font-semibold">{pagination.total}</span>
                        <span className="text-gray-500">articles</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pillar Post Content - Long-form SEO content for the silo */}
          {pillarPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                {/* Pillar Header */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-transparent">
                  <div className="flex items-center gap-3 mb-3">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Pillar Content
                    </Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {pillarPost.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {pillarPost.author && (
                      <div className="flex items-center gap-2">
                        {pillarPost.author_slug === 'ate-yna' ? (
                          <Image
                            src="/Chat Agent/Ate Yna.png"
                            alt={pillarPost.author}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span>{pillarPost.author}</span>
                      </div>
                    )}
                    {pillarPost.read_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{pillarPost.read_time}</span>
                      </div>
                    )}
                    {pillarPost.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(pillarPost.published_at), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hero Media */}
                {(pillarPost.hero_url || pillarPost.video_url) && (
                  <div className="relative aspect-video max-h-[400px] overflow-hidden">
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
                  </div>
                )}

                {/* Content - Collapsible on mobile, full on desktop */}
                <div className="p-6 md:p-8">
                  <div className={`prose prose-invert prose-lg max-w-none ${!showFullPillar ? 'max-h-[500px] overflow-hidden relative' : ''} md:max-h-none md:overflow-visible`}>
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-semibold text-white mt-6 mb-3">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-300">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-purple-500 pl-4 my-4 italic text-gray-400">
                            {children}
                          </blockquote>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-white font-semibold">{children}</strong>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {pillarPost.content}
                    </ReactMarkdown>

                    {/* Gradient fade for collapsed state */}
                    {!showFullPillar && (
                      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0B0D] to-transparent md:hidden" />
                    )}
                  </div>

                  {/* Show more button on mobile */}
                  <div className="mt-4 md:hidden">
                    <Button
                      onClick={() => setShowFullPillar(!showFullPillar)}
                      variant="outline"
                      className="w-full border-white/20 hover:bg-white/5"
                    >
                      {showFullPillar ? 'Show Less' : 'Read Full Article'}
                    </Button>
                  </div>
                </div>

                {/* Section Images */}
                {(pillarPost.content_image0 || pillarPost.content_image1 || pillarPost.content_image2) && (
                  <div className="px-6 pb-6 md:px-8 md:pb-8">
                    <div className="grid grid-cols-3 gap-4">
                      {pillarPost.content_image0 && (
                        <img src={pillarPost.content_image0} alt="Section 1" className="rounded-lg w-full h-32 object-cover" />
                      )}
                      {pillarPost.content_image1 && (
                        <img src={pillarPost.content_image1} alt="Section 2" className="rounded-lg w-full h-32 object-cover" />
                      )}
                      {pillarPost.content_image2 && (
                        <img src={pillarPost.content_image2} alt="Section 3" className="rounded-lg w-full h-32 object-cover" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Articles in This Silo */}
          {displayedArticles.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6" style={{ color: silo.color || '#3B82F6' }} />
                Articles in {silo.name}
              </h2>
              <p className="text-gray-500 mt-1">
                {pagination.total} {pagination.total === 1 ? 'article' : 'articles'} in this topic cluster
              </p>
            </motion.div>
          )}

          {/* Articles Grid */}
          {displayedArticles.length === 0 && !pillarPost ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <FileText className="w-16 h-16 mx-auto text-white/10 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No articles yet</h2>
              <p className="text-gray-500">
                Check back soon for articles about {silo.name.toLowerCase()}.
              </p>
              <Link href="/insights">
                <Button className="mt-6" variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Browse All Insights
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {displayedArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ArticleCard article={article} />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {pagination.hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-12"
                >
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white"
                  >
                    {loading ? 'Loading...' : 'Load More Articles'}
                  </Button>
                  <p className="text-gray-500 text-sm mt-3">
                    Showing {displayedArticles.length} of {pagination.total} articles
                  </p>
                </motion.div>
              )}
            </>
          )}

          {/* Related Silos */}
          {relatedSilos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Explore Other Topics</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedSilos.map((related) => (
                  <Link key={related.id} href={`/insights/silo/${related.slug}`}>
                    <div className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${related.color || '#3B82F6'}20` }}
                        >
                          <SiloIcon icon={related.icon} color={related.color} size="sm" />
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {related.name}
                        </h3>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {related.description || `Articles about ${related.name.toLowerCase()}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Back to All Insights */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Link href="/insights">
              <Button variant="outline" className="border-white/20 hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Insights
              </Button>
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

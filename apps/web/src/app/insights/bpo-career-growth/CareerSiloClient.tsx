'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  Calendar, ArrowRight, Clock, PlayCircle,
  ArrowLeft, ChevronRight, FileText, TrendingUp,
  Crown, User, Rocket, Target, Award, Zap,
  ArrowUpRight, Flame, Star, Trophy, Mountain
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';

interface CareerSiloClientProps {
  silo: any;
  pillarPost: any;
  articles: any[];
  pagination: any;
  relatedSilos: any[];
}

// Emerald color for career silo
const siloColor = '#10B981';

// Markdown components for pillar content - career theme
const MarkdownComponents: any = {
  h1: ({ node, ...props }: any) => (
    <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-12 mb-6 tracking-tight" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <div className="mt-16 mb-8 group">
      <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3 relative" {...props}>
        <span className="absolute -left-6 top-1 w-1 h-8 rounded-full opacity-100 shadow-lg bg-emerald-400" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          {props.children}
        </span>
      </h2>
    </div>
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-2xl font-bold text-emerald-400 mt-10 mb-4 tracking-wide flex items-center gap-2" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-300 leading-relaxed mb-6 text-lg font-light tracking-wide" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="space-y-4 my-6 p-6 rounded-xl border border-emerald-500/30 bg-white/5 shadow-inner backdrop-blur-sm" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="flex items-start gap-3 text-gray-300 group transition-colors duration-200 hover:text-white">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-lg" />
      <span className="flex-1 leading-relaxed">{props.children}</span>
    </li>
  ),
  blockquote: ({ node, ...props }: any) => (
    <div className="flex items-start gap-4 border-l-4 border-emerald-400 p-5 rounded-r-xl my-6 bg-emerald-500/10">
      <p className="text-gray-200 text-base leading-relaxed m-0">{props.children}</p>
    </div>
  ),
  a: ({ node, ...props }: any) => (
    <a className="font-medium transition-colors text-emerald-400 underline underline-offset-4 decoration-2 decoration-emerald-500/50 hover:decoration-emerald-400" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />
  ),
};

// Animated ladder rungs
const LadderRung = ({ index }: { index: number }) => (
  <motion.div
    className="absolute left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
    style={{ top: `${15 + index * 12}%`, width: '60%' }}
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 0.5 }}
    transition={{ delay: index * 0.15, duration: 0.5 }}
  />
);

function ArticleCard({ article, siloSlug }: { article: any; siloSlug: string }) {
  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroImage = article.hero_url || article.content_image0;

  return (
    <Link href={`/insights/${siloSlug}/${article.slug}`} className="h-full block">
      <div className="h-full flex flex-col relative group overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/10 to-teal-900/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-emerald-400/40 hover:shadow-2xl hover:shadow-emerald-500/20">
        {/* Upward arrow animation on hover */}
        <motion.div
          className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ y: 10 }}
          whileHover={{ y: -5 }}
        >
          <ArrowUpRight className="w-6 h-6 text-emerald-400" />
        </motion.div>

        <div className="h-48 w-full relative overflow-hidden bg-gradient-to-br from-emerald-900/30 to-teal-900/20">
          {hasVideo ? (
            <video src={article.video_url!} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : heroImage ? (
            <img src={heroImage} alt={article.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="w-20 h-20 text-emerald-500/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-transparent to-transparent" />

          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-emerald-500/20 backdrop-blur-md border-emerald-400/30 text-emerald-300">
              <Rocket className="w-3 h-3 mr-1" />
              {hasVideo ? 'Video' : 'Guide'}
            </Badge>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow relative z-10">
          <div className="flex items-center justify-between mb-4 text-xs font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {article.read_time || '5 min read'}
            </span>
          </div>

          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
            {article.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-emerald-500/10 mt-auto">
            <span className="text-xs text-gray-500 font-mono">
              {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
            </span>
            <span className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 flex items-center">
              Level Up <ArrowRight className="w-3 h-3 ml-1 group-hover:ml-2 transition-all" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CareerSiloClient({
  silo,
  pillarPost,
  articles,
  pagination,
  relatedSilos,
}: CareerSiloClientProps) {
  const [displayedArticles, setDisplayedArticles] = useState(articles);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFullPillar, setShowFullPillar] = useState(false);

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

  return (
    <div className="overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-200 font-sans min-h-screen bg-[#0B0B0D]">
      <Header />

      {/* CAREER THEME: Growth/Ladder aesthetic with rising elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-1/3 w-[800px] h-[800px] bg-emerald-500/8 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-teal-500/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-green-500/5 rounded-full blur-[140px]" />

        {/* Ladder rungs in background */}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <LadderRung key={i} index={i} />
        ))}

        {/* Upward flowing particles effect */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400 rounded-full"
              style={{ left: `${Math.random() * 100}%`, bottom: '-5%' }}
              animate={{ y: [0, -1000], opacity: [0, 1, 0] }}
              transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
            />
          ))}
        </div>
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
            <span className="text-emerald-400 font-semibold">Career Growth</span>
          </motion.div>

          {/* HERO - Mountain Peak / Summit themed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-green-900/10 backdrop-blur-xl">
              {/* Mountain silhouette decoration */}
              <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
                <svg viewBox="0 0 1200 120" className="w-full h-full fill-emerald-500">
                  <path d="M0,120 L200,60 L400,90 L600,30 L800,70 L1000,20 L1200,80 L1200,120 Z" />
                </svg>
              </div>

              <div className="relative p-8 md:p-16">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  <motion.div
                    initial={{ scale: 0, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-28 h-28 rounded-3xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl shadow-emerald-500/30"
                  >
                    <Mountain className="w-16 h-16 text-white" />
                  </motion.div>

                  <div className="flex-1">
                    <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-sm px-4 py-1">
                      <Rocket className="w-4 h-4 mr-2" />
                      Career Advancement Hub
                    </Badge>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight">
                      <span className="text-white">Climb</span>
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-400 to-green-500">
                        Higher.
                      </span>
                    </h1>

                    <p className="text-xl text-gray-300 max-w-2xl leading-relaxed mb-8">
                      Strategic career moves, promotion playbooks, and growth hacks for ambitious BPO professionals.
                      <span className="text-emerald-400 font-semibold"> Your next level awaits.</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-bold">{pagination.total}</span>
                        <span className="text-gray-400">growth guides</span>
                      </div>
                      <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-bold">Proven</span>
                        <span className="text-gray-400">strategies</span>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                        <Target className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-bold">Goal</span>
                        <span className="text-gray-400">oriented</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pillar Post */}
          {pillarPost && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/10 to-transparent backdrop-blur-xl overflow-hidden">
                <div className="p-6 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-900/30 to-transparent">
                  <div className="flex items-center gap-3 mb-3">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">Career Master Guide</Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{pillarPost.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {pillarPost.author && (
                      <div className="flex items-center gap-2">
                        {pillarPost.author_slug === 'ate-yna' ? (
                          <Image src="/Chat Agent/Ate Yna.png" alt={pillarPost.author} width={24} height={24} className="rounded-full" />
                        ) : <User className="w-4 h-4" />}
                        <span>{pillarPost.author}</span>
                      </div>
                    )}
                    {pillarPost.read_time && <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{pillarPost.read_time}</span></div>}
                  </div>
                </div>

                {(pillarPost.hero_url || pillarPost.video_url) && (
                  <div className="relative aspect-video max-h-[400px] overflow-hidden">
                    {pillarPost.hero_type === 'video' && pillarPost.video_url ? (
                      <video src={pillarPost.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    ) : pillarPost.hero_url ? (
                      <img src={pillarPost.hero_url} alt={pillarPost.title} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                )}

                <div className="p-6 md:p-8">
                  <div className={`prose prose-invert prose-lg max-w-none ${!showFullPillar ? 'max-h-[400px] overflow-hidden relative' : ''} md:max-h-none`}>
                    {/* Section Images and Content - Same pattern as article pages */}
                    {(pillarPost.content_part1 || pillarPost.content_part2 || pillarPost.content_part3) ? (
                      <>
                        {pillarPost.content_image0 && (
                          <figure className="my-8 rounded-2xl overflow-hidden border border-emerald-500/20 shadow-2xl">
                            <img src={pillarPost.content_image0} alt={`${pillarPost.title} - Introduction`} className="w-full h-auto object-cover" loading="lazy" />
                          </figure>
                        )}
                        {pillarPost.content_part1 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{pillarPost.content_part1}</ReactMarkdown>}
                        {pillarPost.content_image1 && (
                          <figure className="my-12 rounded-2xl overflow-hidden border border-emerald-500/20 shadow-2xl">
                            <img src={pillarPost.content_image1} alt={`${pillarPost.title} - Main content`} className="w-full h-auto object-cover" loading="lazy" />
                          </figure>
                        )}
                        {pillarPost.content_part2 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{pillarPost.content_part2}</ReactMarkdown>}
                        {pillarPost.content_image2 && (
                          <figure className="my-12 rounded-2xl overflow-hidden border border-emerald-500/20 shadow-2xl">
                            <img src={pillarPost.content_image2} alt={`${pillarPost.title} - Conclusion`} className="w-full h-auto object-cover" loading="lazy" />
                          </figure>
                        )}
                        {pillarPost.content_part3 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{pillarPost.content_part3}</ReactMarkdown>}
                      </>
                    ) : (
                      <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{pillarPost.content}</ReactMarkdown>
                    )}
                    {!showFullPillar && <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0B0D] to-transparent md:hidden" />}
                  </div>
                  <div className="mt-4 md:hidden">
                    <Button onClick={() => setShowFullPillar(!showFullPillar)} variant="outline" className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                      {showFullPillar ? 'Show Less' : 'Read Full Guide'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Articles */}
          {displayedArticles.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-400" />
                Career Growth Strategies
              </h2>
              <p className="text-gray-500 mt-1">{pagination.total} guides to accelerate your career</p>
            </motion.div>
          )}

          {displayedArticles.length === 0 && !pillarPost ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <TrendingUp className="w-20 h-20 mx-auto text-emerald-500/20 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No career guides yet</h2>
              <p className="text-gray-500">Check back soon for growth strategies.</p>
            </motion.div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {displayedArticles.map((article, index) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <ArticleCard article={article} siloSlug={silo.slug} />
                  </motion.div>
                ))}
              </div>

              {pagination.hasMore && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-12">
                  <Button onClick={loadMore} disabled={loading} className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400">
                    {loading ? 'Loading...' : 'Load More Guides'}
                  </Button>
                </motion.div>
              )}
            </>
          )}

          {/* Related Silos */}
          {relatedSilos.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20">
              <h2 className="text-2xl font-bold text-white mb-6">Explore Other Topics</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedSilos.map((related) => (
                  <Link key={related.id} href={`/insights/${related.slug}`}>
                    <div className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all">
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{related.name}</h3>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{related.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16 text-center">
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

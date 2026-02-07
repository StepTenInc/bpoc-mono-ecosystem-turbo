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
  ArrowLeft, ChevronRight, FileText, MessageSquare,
  Crown, User, Mic, Video, CheckCircle2, Brain,
  Lightbulb, Target, Smile, ThumbsUp
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';

interface InterviewSiloClientProps {
  silo: any;
  pillarPost: any;
  articles: any[];
  pagination: any;
  relatedSilos: any[];
}

// Orange color for interview silo
const siloColor = '#F97316';

// Markdown components for pillar content - interview theme
const MarkdownComponents: any = {
  h2: ({ node, ...props }: any) => (
    <div className="mt-16 mb-8 group">
      <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3 relative" {...props}>
        <span className="absolute -left-6 top-1 w-1 h-8 rounded-full opacity-100 shadow-lg bg-orange-400" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{props.children}</span>
      </h2>
    </div>
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-2xl font-bold text-orange-400 mt-10 mb-4 tracking-wide flex items-center gap-2" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-300 leading-relaxed mb-6 text-lg font-light tracking-wide" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="space-y-4 my-6 p-6 rounded-xl border border-orange-500/30 bg-white/5 shadow-inner backdrop-blur-sm" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="flex items-start gap-3 text-gray-300 group transition-colors duration-200 hover:text-white">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 shadow-lg" />
      <span className="flex-1 leading-relaxed">{props.children}</span>
    </li>
  ),
  blockquote: ({ node, ...props }: any) => (
    <div className="flex items-start gap-4 border-l-4 border-orange-400 p-5 rounded-r-xl my-6 bg-orange-500/10">
      <p className="text-gray-200 text-base leading-relaxed m-0">{props.children}</p>
    </div>
  ),
  a: ({ node, ...props }: any) => (
    <a className="font-medium transition-colors text-orange-400 underline underline-offset-4 decoration-2 decoration-orange-500/50 hover:decoration-orange-400" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />
  ),
};

// Speech bubble animation
const SpeechBubble = ({ delay, side }: { delay: number; side: 'left' | 'right' }) => (
  <motion.div
    className={`absolute ${side === 'left' ? 'left-[10%]' : 'right-[10%]'} w-32 h-12 rounded-2xl bg-gradient-to-r ${side === 'left' ? 'from-orange-500/10 to-transparent' : 'from-transparent to-purple-500/10'}`}
    initial={{ opacity: 0, scale: 0, x: side === 'left' ? -20 : 20 }}
    animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1, 0.8], x: 0 }}
    transition={{ duration: 3, delay, repeat: Infinity }}
  />
);

function ArticleCard({ article, siloSlug }: { article: any; siloSlug: string }) {
  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroImage = article.hero_url || article.content_image0;

  return (
    <Link href={`/insights/${siloSlug}/${article.slug}`} className="h-full block">
      <div className="h-full flex flex-col relative group overflow-hidden rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-900/10 to-amber-900/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-orange-400/40 hover:shadow-2xl hover:shadow-orange-500/20">
        {/* Conversation dots animation */}
        <motion.div
          className="absolute top-4 left-4 z-20 flex gap-1"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-400"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </motion.div>

        <div className="h-48 w-full relative overflow-hidden bg-gradient-to-br from-orange-900/30 to-amber-900/20">
          {hasVideo ? (
            <video src={article.video_url!} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : heroImage ? (
            <img src={heroImage} alt={article.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <MessageSquare className="w-20 h-20 text-orange-500/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-transparent to-transparent" />

          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-orange-500/20 backdrop-blur-md border-orange-400/30 text-orange-300">
              <Mic className="w-3 h-3 mr-1" />
              {hasVideo ? 'Video' : 'Tips'}
            </Badge>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow relative z-10">
          <div className="flex items-center justify-between mb-4 text-xs font-mono">
            <span className="text-orange-400 font-bold flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              {article.read_time || '5 min read'}
            </span>
          </div>

          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
            {article.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-orange-500/10 mt-auto">
            <span className="text-xs text-gray-500 font-mono">
              {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
            </span>
            <span className="text-sm font-medium text-orange-400 group-hover:text-orange-300 flex items-center">
              Prepare <ArrowRight className="w-3 h-3 ml-1 group-hover:ml-2 transition-all" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function InterviewSiloClient({ silo, pillarPost, articles, pagination, relatedSilos }: InterviewSiloClientProps) {
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
      if (data.articles) { setDisplayedArticles(prev => [...prev, ...data.articles]); setCurrentPage(data.pagination.page); }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  return (
    <div className="overflow-x-hidden selection:bg-orange-500/20 selection:text-orange-200 font-sans min-h-screen bg-[#0B0B0D]">
      <Header />

      {/* INTERVIEW THEME: Conversation/Speech aesthetic with warm tones */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-1/3 w-[800px] h-[800px] bg-orange-500/8 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-amber-500/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-red-500/5 rounded-full blur-[140px]" />

        {/* Floating speech bubbles */}
        <SpeechBubble delay={0} side="left" />
        <SpeechBubble delay={1.5} side="right" />
        <SpeechBubble delay={3} side="left" />
      </div>

      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/insights" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Insights</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-orange-400 font-semibold">Interview Tips</span>
          </motion.div>

          {/* HERO - Interview/Conversation themed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            <div className="relative overflow-hidden rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-900/20 via-amber-900/10 to-red-900/10 backdrop-blur-xl">
              {/* Mic/video icon decorations */}
              <div className="absolute top-4 right-4 flex gap-3 opacity-20">
                <Mic className="w-8 h-8 text-orange-400" />
                <Video className="w-8 h-8 text-orange-400" />
              </div>

              <div className="relative p-8 md:p-16">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-28 h-28 rounded-3xl flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-600 shadow-2xl shadow-orange-500/30"
                  >
                    <MessageSquare className="w-16 h-16 text-white" />
                  </motion.div>

                  <div className="flex-1">
                    <Badge className="mb-4 bg-orange-500/20 text-orange-300 border-orange-400/40 text-sm px-4 py-1">
                      <Target className="w-4 h-4 mr-2" />
                      Interview Prep Center
                    </Badge>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight">
                      <span className="text-white">Nail Every</span>
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-400 to-red-500">
                        Interview.
                      </span>
                    </h1>

                    <p className="text-xl text-gray-300 max-w-2xl leading-relaxed mb-8">
                      Expert tips, common questions, and preparation strategies to ace your BPO interviews.
                      <span className="text-orange-400 font-semibold"> Confidence is key.</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
                        <FileText className="w-4 h-4 text-orange-400" />
                        <span className="text-white font-bold">{pagination.total}</span>
                        <span className="text-gray-400">interview guides</span>
                      </div>
                      <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-white font-bold">Proven</span>
                        <span className="text-gray-400">techniques</span>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-bold">Practice</span>
                        <span className="text-gray-400">ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {pillarPost && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
              <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-900/10 to-transparent backdrop-blur-xl overflow-hidden">
                <div className="p-6 border-b border-orange-500/20 bg-gradient-to-r from-orange-900/30 to-transparent">
                  <div className="flex items-center gap-3 mb-3"><Crown className="w-6 h-6 text-yellow-400" /><Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">Ultimate Interview Guide</Badge></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{pillarPost.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {pillarPost.author && <div className="flex items-center gap-2">{pillarPost.author_slug === 'ate-yna' ? <Image src="/Chat Agent/Ate Yna.png" alt={pillarPost.author} width={24} height={24} className="rounded-full" /> : <User className="w-4 h-4" />}<span>{pillarPost.author}</span></div>}
                    {pillarPost.read_time && <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{pillarPost.read_time}</span></div>}
                  </div>
                </div>
                {(pillarPost.hero_url || pillarPost.video_url) && (
                  <div className="relative aspect-video max-h-[400px] overflow-hidden">
                    {pillarPost.hero_type === 'video' && pillarPost.video_url ? <video src={pillarPost.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" /> : pillarPost.hero_url ? <img src={pillarPost.hero_url} alt={pillarPost.title} className="w-full h-full object-cover" /> : null}
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <div className={`prose prose-invert prose-lg max-w-none ${!showFullPillar ? 'max-h-[400px] overflow-hidden relative' : ''} md:max-h-none`}>
                    {(pillarPost.content_part1 || pillarPost.content_part2 || pillarPost.content_part3) ? (
                      <>
                        {pillarPost.content_image0 && (
                          <figure className="my-8 rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl">
                            <img src={pillarPost.content_image0} alt={`${pillarPost.title} - Introduction`} className="w-full h-auto object-cover" loading="lazy" />
                          </figure>
                        )}
                        {pillarPost.content_part1 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{pillarPost.content_part1}</ReactMarkdown>}
                        {pillarPost.content_image1 && (
                          <figure className="my-12 rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl">
                            <img src={pillarPost.content_image1} alt={`${pillarPost.title} - Main content`} className="w-full h-auto object-cover" loading="lazy" />
                          </figure>
                        )}
                        {pillarPost.content_part2 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{pillarPost.content_part2}</ReactMarkdown>}
                        {pillarPost.content_image2 && (
                          <figure className="my-12 rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl">
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
                  <div className="mt-4 md:hidden"><Button onClick={() => setShowFullPillar(!showFullPillar)} variant="outline" className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10">{showFullPillar ? 'Show Less' : 'Read Full Guide'}</Button></div>
                </div>
              </div>
            </motion.div>
          )}

          {displayedArticles.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3"><ThumbsUp className="w-6 h-6 text-orange-400" />Interview Preparation</h2>
              <p className="text-gray-500 mt-1">{pagination.total} guides to help you ace your interview</p>
            </motion.div>
          )}

          {displayedArticles.length === 0 && !pillarPost ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <MessageSquare className="w-20 h-20 mx-auto text-orange-500/20 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No interview guides yet</h2>
              <p className="text-gray-500">Check back soon for interview tips.</p>
            </motion.div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {displayedArticles.map((article, index) => (<motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}><ArticleCard article={article} siloSlug={silo.slug} /></motion.div>))}
              </div>
              {pagination.hasMore && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-12"><Button onClick={loadMore} disabled={loading} className="px-8 py-3 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-400">{loading ? 'Loading...' : 'Load More Tips'}</Button></motion.div>)}
            </>
          )}

          {relatedSilos.length > 0 && (<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20"><h2 className="text-2xl font-bold text-white mb-6">Explore Other Topics</h2><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{relatedSilos.map((related) => (<Link key={related.id} href={`/insights/${related.slug}`}><div className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all"><h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{related.name}</h3><p className="text-gray-500 text-sm mt-2 line-clamp-2">{related.description}</p></div></Link>))}</div></motion.div>)}

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16 text-center"><Link href="/insights"><Button variant="outline" className="border-white/20 hover:bg-white/5"><ArrowLeft className="w-4 h-4 mr-2" /> Back to All Insights</Button></Link></motion.div>
        </div>
      </div>
    </div>
  );
}

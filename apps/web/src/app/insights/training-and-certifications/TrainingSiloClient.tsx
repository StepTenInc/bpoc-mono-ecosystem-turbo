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
  ArrowLeft, ChevronRight, FileText, GraduationCap,
  Crown, User, Award, BookOpen, Medal, Bookmark,
  Brain, Lightbulb, CheckCircle, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import Header from '@/components/shared/layout/Header';

interface TrainingSiloClientProps {
  silo: any;
  pillarPost: any;
  articles: any[];
  pagination: any;
  relatedSilos: any[];
}

// Cyan color for training silo
const siloColor = '#06B6D4';

// Markdown components for pillar content - training theme
const MarkdownComponents: any = {
  h2: ({ node, ...props }: any) => (
    <div className="mt-16 mb-8 group">
      <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3 relative" {...props}>
        <span className="absolute -left-6 top-1 w-1 h-8 rounded-full opacity-100 shadow-lg bg-cyan-400" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{props.children}</span>
      </h2>
    </div>
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-2xl font-bold text-cyan-400 mt-10 mb-4 tracking-wide flex items-center gap-2" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-300 leading-relaxed mb-6 text-lg font-light tracking-wide" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="space-y-4 my-6 p-6 rounded-xl border border-cyan-500/30 bg-white/5 shadow-inner backdrop-blur-sm" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="flex items-start gap-3 text-gray-300 group transition-colors duration-200 hover:text-white">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-lg" />
      <span className="flex-1 leading-relaxed">{props.children}</span>
    </li>
  ),
  blockquote: ({ node, ...props }: any) => (
    <div className="flex items-start gap-4 border-l-4 border-cyan-400 p-5 rounded-r-xl my-6 bg-cyan-500/10">
      <p className="text-gray-200 text-base leading-relaxed m-0">{props.children}</p>
    </div>
  ),
  a: ({ node, ...props }: any) => (
    <a className="font-medium transition-colors text-cyan-400 underline underline-offset-4 decoration-2 decoration-cyan-500/50 hover:decoration-cyan-400" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />
  ),
};

// Certificate border animation
const CertificateCorner = ({ position }: { position: string }) => {
  const posClasses: Record<string, string> = {
    'top-left': 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
    'top-right': 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
    'bottom-left': 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
    'bottom-right': 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
  };
  return (
    <motion.div
      className={`absolute w-8 h-8 border-cyan-400/30 ${posClasses[position]}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    />
  );
};

function ArticleCard({ article, siloSlug }: { article: any; siloSlug: string }) {
  const hasVideo = article.hero_type === 'video' && article.video_url;
  const heroImage = article.hero_url || article.content_image0;

  return (
    <Link href={`/insights/${siloSlug}/${article.slug}`} className="h-full block">
      <div className="h-full flex flex-col relative group overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-900/10 to-teal-900/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/20">
        {/* Certificate badge */}
        <motion.div
          className="absolute top-3 left-3 z-20"
          initial={{ rotate: -15, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Award className="w-5 h-5 text-white" />
          </div>
        </motion.div>

        <div className="h-48 w-full relative overflow-hidden bg-gradient-to-br from-cyan-900/30 to-teal-900/20">
          {hasVideo ? (
            <video src={article.video_url!} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : heroImage ? (
            <img src={heroImage} alt={article.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-20 h-20 text-cyan-500/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-transparent to-transparent" />

          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-cyan-500/20 backdrop-blur-md border-cyan-400/30 text-cyan-300">
              <BookOpen className="w-3 h-3 mr-1" />
              {hasVideo ? 'Video' : 'Course'}
            </Badge>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow relative z-10">
          <div className="flex items-center justify-between mb-4 text-xs font-mono">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {article.read_time || '5 min read'}
            </span>
          </div>

          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
            {article.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-cyan-500/10 mt-auto">
            <span className="text-xs text-gray-500 font-mono">
              {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
            </span>
            <span className="text-sm font-medium text-cyan-400 group-hover:text-cyan-300 flex items-center">
              Learn <ArrowRight className="w-3 h-3 ml-1 group-hover:ml-2 transition-all" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TrainingSiloClient({ silo, pillarPost, articles, pagination, relatedSilos }: TrainingSiloClientProps) {
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
    <div className="overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200 font-sans min-h-screen bg-[#0B0B0D]">
      <Header />

      {/* TRAINING THEME: Education/Certificate aesthetic with cyan/teal tones */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-1/3 w-[800px] h-[800px] bg-cyan-500/8 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-teal-500/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-sky-500/5 rounded-full blur-[140px]" />

        {/* Floating certification icons */}
        {[GraduationCap, Award, Medal, Bookmark].map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute text-cyan-500/10"
            style={{ left: `${20 + i * 20}%`, top: `${30 + (i % 2) * 20}%` }}
            animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.3 }}
          >
            <Icon size={35 + i * 5} />
          </motion.div>
        ))}
      </div>

      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/insights" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Insights</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-cyan-400 font-semibold">Training & Certifications</span>
          </motion.div>

          {/* HERO - Education/Certificate themed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 via-teal-900/10 to-sky-900/10 backdrop-blur-xl">
              {/* Certificate corners */}
              <CertificateCorner position="top-left" />
              <CertificateCorner position="top-right" />
              <CertificateCorner position="bottom-left" />
              <CertificateCorner position="bottom-right" />

              <div className="relative p-8 md:p-16">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  <motion.div
                    initial={{ scale: 0, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="w-28 h-28 rounded-3xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-teal-600 shadow-2xl shadow-cyan-500/30"
                  >
                    <GraduationCap className="w-16 h-16 text-white" />
                  </motion.div>

                  <div className="flex-1">
                    <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-400/40 text-sm px-4 py-1">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Skills Development Center
                    </Badge>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight">
                      <span className="text-white">Level Up</span>
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-400 to-sky-500">
                        Your Skills.
                      </span>
                    </h1>

                    <p className="text-xl text-gray-300 max-w-2xl leading-relaxed mb-8">
                      Training programs, certifications, and professional development resources for BPO careers.
                      <span className="text-cyan-400 font-semibold"> Invest in yourself.</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 bg-cyan-500/10 px-4 py-2 rounded-full border border-cyan-500/20">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span className="text-white font-bold">{pagination.total}</span>
                        <span className="text-gray-400">training guides</span>
                      </div>
                      <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
                        <Medal className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-bold">Certified</span>
                        <span className="text-gray-400">programs</span>
                      </div>
                      <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white font-bold">Industry</span>
                        <span className="text-gray-400">recognized</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {pillarPost && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-900/10 to-transparent backdrop-blur-xl overflow-hidden">
                <div className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-transparent">
                  <div className="flex items-center gap-3 mb-3"><Crown className="w-6 h-6 text-yellow-400" /><Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30">Complete Training Guide</Badge></div>
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
                          <figure className="my-8 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl">
                            <img src={pillarPost.content_image0} alt={`${pillarPost.title} - Introduction`} className="w-full h-auto object-cover" loading="lazy" />
                          </figure>
                        )}
                        {pillarPost.content_part1 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{pillarPost.content_part1}</ReactMarkdown>}
                        {pillarPost.content_image1 && (
                          <figure className="my-12 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl">
                            <img src={pillarPost.content_image1} alt={`${pillarPost.title} - Main content`} className="w-full h-auto object-cover" loading="lazy" />
                          </figure>
                        )}
                        {pillarPost.content_part2 && <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{pillarPost.content_part2}</ReactMarkdown>}
                        {pillarPost.content_image2 && (
                          <figure className="my-12 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl">
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
                  <div className="mt-4 md:hidden"><Button onClick={() => setShowFullPillar(!showFullPillar)} variant="outline" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">{showFullPillar ? 'Show Less' : 'Read Full Guide'}</Button></div>
                </div>
              </div>
            </motion.div>
          )}

          {displayedArticles.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Sparkles className="w-6 h-6 text-cyan-400" />Training & Development</h2>
              <p className="text-gray-500 mt-1">{pagination.total} resources to boost your BPO career</p>
            </motion.div>
          )}

          {displayedArticles.length === 0 && !pillarPost ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <GraduationCap className="w-20 h-20 mx-auto text-cyan-500/20 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No training guides yet</h2>
              <p className="text-gray-500">Check back soon for training resources.</p>
            </motion.div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {displayedArticles.map((article, index) => (<motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}><ArticleCard article={article} siloSlug={silo.slug} /></motion.div>))}
              </div>
              {pagination.hasMore && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-12"><Button onClick={loadMore} disabled={loading} className="px-8 py-3 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400">{loading ? 'Loading...' : 'Load More Courses'}</Button></motion.div>)}
            </>
          )}

          {relatedSilos.length > 0 && (<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20"><h2 className="text-2xl font-bold text-white mb-6">Explore Other Topics</h2><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{relatedSilos.map((related) => (<Link key={related.id} href={`/insights/${related.slug}`}><div className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all"><h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{related.name}</h3><p className="text-gray-500 text-sm mt-2 line-clamp-2">{related.description}</p></div></Link>))}</div></motion.div>)}

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16 text-center"><Link href="/insights"><Button variant="outline" className="border-white/20 hover:bg-white/5"><ArrowLeft className="w-4 h-4 mr-2" /> Back to All Insights</Button></Link></motion.div>
        </div>
      </div>
    </div>
  );
}

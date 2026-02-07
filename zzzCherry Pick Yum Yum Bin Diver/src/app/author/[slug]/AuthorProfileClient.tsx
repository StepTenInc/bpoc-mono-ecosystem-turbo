'use client';

import { motion } from 'framer-motion';
import Header from '@/components/shared/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Calendar, ArrowRight, MapPin, Briefcase, Heart, MessageCircle, BookOpen, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  hero_url?: string;
  category?: string;
  content_type?: string;
  created_at: string;
  published_at?: string;
  silo_id?: string;
  siloName: string;
  siloSlug: string;
}

interface Props {
  slug: string;
  articles?: Article[];
}

// Silo color mapping
const SILO_COLORS: Record<string, string> = {
  'bpo-salary-compensation': 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  'bpo-career-growth': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  'bpo-jobs': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  'interview-tips': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  'bpo-employment-guide': 'text-slate-400 border-slate-500/30 bg-slate-500/10',
  'bpo-company-reviews': 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  'training-and-certifications': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  'work-life-balance': 'text-rose-400 border-rose-500/30 bg-rose-500/10',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AuthorProfileClient({ slug, articles = [] }: Props) {
  const isAteYna = slug === 'ate-yna';

  if (!isAteYna) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Author Not Found</h1>
          <Link href="/insights">
            <Button variant="outline">Return to Insights</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pillarArticles = articles.filter(a => a.content_type === 'pillar');
  const supportingArticles = articles.filter(a => a.content_type !== 'pillar');

  return (
    <div className="min-h-screen bg-[#0B0B0D] overflow-x-hidden selection:bg-purple-500/20 selection:text-purple-200 font-sans">

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 cyber-grid opacity-[0.03]" />
      </div>

      <Header />

      <div className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">

          {/* ──── Profile Hero ──── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-12 items-center md:items-start mb-20"
          >
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity" />
              <Avatar className="w-48 h-48 border-4 border-[#0B0B0D] relative z-10 shadow-2xl">
                <AvatarImage src="/Chat Agent/Ate Yna.png" alt="Ate Yna" />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-5xl font-bold">
                  AY
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-2 right-2 z-20 bg-[#0B0B0D] p-2 rounded-full border border-white/10">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1 text-center md:text-left">
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 mb-4 px-4 py-1">
                BPOC Career Coach
              </Badge>

              <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-3xl lg:text-4xl lg:text-5xl font-extrabold text-white mb-4">
                Ate Yna
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-400 mb-8 text-sm">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-500" /> Clark, Pampanga PH</span>
                <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-500" /> BPO Industry Expert</span>
                <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-500" /> Taglish Friendly</span>
                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-500" /> {articles.length} Articles</span>
              </div>

              <div className="prose prose-invert prose-p:text-gray-300 max-w-none">
                <p className="text-lg leading-relaxed">
                  Hi, I&apos;m Ate Yna! 👋 Think of me as your supportive &quot;ate&quot; (big sister) in the BPO industry.
                </p>
                <p>
                  I&apos;ve been a job seeker, an agent taking calls at 3 AM, and a team lead managing chaos.
                  I know the struggle of &quot;Please tell me about yourself,&quot; the pain of rejection emails, and the joy of that first 13th-month pay.
                </p>
                <p>
                  I write real talk advice — no corporate jargon, just honest tips to help you get hired, get promoted, and survive the graveyard shift.
                  Let&apos;s navigate your career journey together, ha!
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto md:mx-0">
                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-white">{articles.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Articles</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-white">{pillarArticles.length}</div>
                  <div className="text-xs text-gray-500 mt-1">In-Depth Guides</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-bold text-white">
                    {new Set(articles.map(a => a.siloSlug).filter(Boolean)).size}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Topics</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
                <Link href="/insights">
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-purple-500/25">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Browse All Insights
                  </Button>
                </Link>
                <Link href="/try-resume-builder">
                  <Button variant="outline" className="border-white/10 hover:bg-white/5">
                    Try My Resume Builder
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ──── Articles Grid ──── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-white">
                Latest from Ate Yna
              </h2>
              <Badge variant="secondary" className="bg-white/10 text-white">
                {articles.length} Articles
              </Badge>
            </div>

            {articles.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Articles coming soon!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {articles.map((article, index) => {
                  const articleUrl = article.siloSlug
                    ? `/insights/${article.siloSlug}/${article.slug}`
                    : `/insights/${article.slug}`;
                  const colorClass = SILO_COLORS[article.siloSlug] || 'text-gray-400 border-white/10 bg-white/5';

                  return (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * Math.min(index, 10) }}
                    >
                      <Link href={articleUrl} className="group block h-full">
                        <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all duration-300 h-full hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 overflow-hidden">
                          {/* Hero Image */}
                          {article.hero_url && (
                            <div className="relative w-full h-44 overflow-hidden">
                              <Image
                                src={article.hero_url}
                                alt={article.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              {article.content_type === 'pillar' && (
                                <Badge className="absolute top-3 right-3 bg-purple-600/90 text-white text-xs border-0">
                                  In-Depth Guide
                                </Badge>
                              )}
                            </div>
                          )}
                          <CardHeader className={article.hero_url ? 'pt-4' : ''}>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className={colorClass}>
                                {article.siloName}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(article.published_at || article.created_at)}
                              </span>
                            </div>
                            <CardTitle className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors leading-snug">
                              {article.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                              {article.description}
                            </p>
                            <div className="flex items-center text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                              Read Article <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}

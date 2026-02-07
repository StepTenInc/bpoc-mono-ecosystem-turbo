'use client';

import { motion } from 'framer-motion';
import Header from '@/components/shared/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Calendar, ArrowRight, MapPin, Briefcase, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { insightsData } from '@/data/insights';

interface Props {
  slug: string;
}

export default function AuthorProfileClient({ slug }: Props) {
  // Hardcoded data for Ate Yna based on the personality guide
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

  const authorArticles = insightsData.filter(i => i.authorSlug === slug);

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
          
          {/* Profile Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-12 items-center md:items-start mb-24"
          >
            {/* Avatar Section */}
            <div className="relative group">
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

            {/* Bio Section */}
            <div className="flex-1 text-center md:text-left">
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 mb-4 px-4 py-1">
                    BPOC Career Coach
                </Badge>
                
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                    Ate Yna
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-400 mb-8 text-sm">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-500" /> Manila, PH</span>
                    <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-500" /> 10+ Years in BPO</span>
                    <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-500" /> Taglish Friendly</span>
                </div>

                <div className="prose prose-invert prose-p:text-gray-300 max-w-none">
                    <p className="text-lg leading-relaxed">
                        Hi, I'm Ate Yna! 👋 Think of me as your supportive "ate" (big sister) in the BPO industry.
                    </p>
                    <p>
                        I've been a job seeker, an agent taking calls at 3 AM, and a team lead managing chaos. 
                        I know the struggle of "Please tell me about yourself," the pain of rejection emails, and the joy of that first 13th-month pay.
                    </p>
                    <p>
                        I write real talk advice—no corporate jargon, just honest tips to help you get hired, get promoted, and survive the graveyard shift. 
                        Let's navigate your career journey together!
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-purple-500/25">
                        Ask Ate Yna a Question
                    </Button>
                    <Link href="/resume-builder">
                        <Button variant="outline" className="border-white/10 hover:bg-white/5">
                            Try My Resume Builder
                        </Button>
                    </Link>
                </div>
            </div>
          </motion.div>

          {/* Articles Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white">
                    Insights by Ate Yna
                </h2>
                <Badge variant="secondary" className="bg-white/10 text-white">
                    {authorArticles.length} Articles
                </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {authorArticles.map((insight, index) => (
                    <motion.div
                        key={insight.slug}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                    >
                         <Link href={`/insights/${insight.slug}`} className="group block h-full">
                            <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all duration-300 h-full hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1">
                                <CardHeader>
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className={`border-white/10 ${insight.color} bg-white/5`}>
                                            {insight.category}
                                        </Badge>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {insight.date}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                                        {insight.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                        {insight.description}
                                    </p>
                                    <div className="flex items-center text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        Read Advice <ArrowRight className="w-4 h-4 ml-1" />
                                    </div>
                                </CardContent>
                            </Card>
                         </Link>
                    </motion.div>
                ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}


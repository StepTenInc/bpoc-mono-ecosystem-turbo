'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import { 
  Link as LinkIcon, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  FileText, 
  Target,
  Zap,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  BarChart3
} from 'lucide-react';

interface PostHealth {
  id: string;
  title: string;
  slug: string;
  applied_links: any[];
  inbound_count: number;
  outbound_count: number;
  health_score: number;
  issues: string[];
}

export default function SEODashboard() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostHealth[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLinks: 0,
    avgLinksPerPost: 0,
    orphanPages: 0,
    healthScore: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all posts
    const { data: postsData } = await supabase
      .from('insights_posts')
      .select('id, title, slug, applied_links, is_published');

    // Fetch all internal links
    const { data: linksData } = await supabase
      .from('internal_links')
      .select('source_post_id, target_post_id');

    if (!postsData) return;

    // Calculate health for each post
    const healthData: PostHealth[] = postsData.map(post => {
      const outbound = linksData?.filter(l => l.source_post_id === post.id).length || 0;
      const inbound = linksData?.filter(l => l.target_post_id === post.id).length || 0;
      const appliedLinks = post.applied_links?.length || 0;
      
      const issues: string[] = [];
      let healthScore = 100;

      // Check for issues
      if (inbound === 0) {
        issues.push('Orphan page - no inbound links');
        healthScore -= 30;
      }
      if (outbound === 0 && appliedLinks === 0) {
        issues.push('No outbound links');
        healthScore -= 20;
      }
      if (outbound > 10) {
        issues.push('Too many outbound links (>10)');
        healthScore -= 10;
      }
      if (!post.is_published) {
        issues.push('Not published');
        healthScore -= 10;
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        applied_links: post.applied_links || [],
        inbound_count: inbound,
        outbound_count: outbound,
        health_score: Math.max(0, healthScore),
        issues
      };
    });

    // Calculate overall stats
    const totalLinks = linksData?.length || 0;
    const orphanPages = healthData.filter(p => p.inbound_count === 0).length;
    const avgHealth = healthData.reduce((sum, p) => sum + p.health_score, 0) / healthData.length;

    setStats({
      totalPosts: postsData.length,
      totalLinks,
      avgLinksPerPost: totalLinks / postsData.length,
      orphanPages,
      healthScore: Math.round(avgHealth)
    });

    setPosts(healthData.sort((a, b) => a.health_score - b.health_score));
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" /> SEO Health Dashboard
          </h2>
          <p className="text-gray-400 text-sm">Monitor your content silo health and internal linking strategy</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="border-cyan-500/30 text-cyan-400">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-white">{stats.totalPosts}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <FileText className="w-3 h-3" /> Total Articles
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-white">{stats.totalLinks}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <LinkIcon className="w-3 h-3" /> Internal Links
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-white">{stats.avgLinksPerPost.toFixed(1)}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Avg Links/Post
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.orphanPages > 0 ? 'from-red-500/10 to-orange-500/10 border-red-500/20' : 'from-green-500/10 to-emerald-500/10 border-green-500/20'}`}>
          <CardContent className="p-4">
            <div className={`text-3xl font-bold ${stats.orphanPages > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {stats.orphanPages}
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Orphan Pages
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className={`text-3xl font-bold ${getScoreColor(stats.healthScore)}`}>
              {stats.healthScore}%
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <Target className="w-3 h-3" /> Health Score
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score Bar */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Overall Site Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={stats.healthScore} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Poor</span>
              <span>Average</span>
              <span>Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Health List */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Article Health Report
          </CardTitle>
          <CardDescription>Sorted by health score (lowest first - fix these!)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white truncate">{post.title}</h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span className="text-green-400">{post.inbound_count} inbound</span>
                      <span className="text-blue-400">{post.outbound_count} outbound</span>
                      <span className="text-purple-400">{post.applied_links.length} active</span>
                    </div>
                    {post.issues.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.issues.map((issue, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] border-red-500/30 text-red-400">
                            <AlertTriangle className="w-2 h-2 mr-1" />
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(post.health_score)}`}>
                        {post.health_score}
                      </div>
                      <div className="text-[10px] text-gray-500">SCORE</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-cyan-400"
                      onClick={() => window.location.href = `/admin/insights/${post.id}`}
                    >
                      Fix <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { supabase } from '@/lib/supabase';
import { 
  Globe, 
  GraduationCap, 
  Building2, 
  Shield,
  ExternalLink,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Search,
  Link as LinkIcon,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
}

interface OutboundSuggestion {
  domain: string;
  type: 'edu' | 'gov' | 'org' | 'authority';
  reason: string;
  searchQuery?: string;
  title?: string;
  url?: string;
  snippet?: string;
}

interface BacklinkOpportunity {
  siteName: string;
  siteType: string;
  reason?: string;
  outreachAngle: string;
  searchQuery?: string;
  url?: string;
  domain?: string;
  snippet?: string;
}

export default function OutboundResearch() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string>('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [outboundSuggestions, setOutboundSuggestions] = useState<OutboundSuggestion[]>([]);
  const [backlinkOpportunities, setBacklinkOpportunities] = useState<BacklinkOpportunity[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [poweredBy, setPoweredBy] = useState<string>('');

  // Fetch all articles on mount
  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from('insights_posts')
        .select('id, title, slug, content')
        .order('title');
      
      if (!error && data) {
        setArticles(data);
      }
      setLoadingArticles(false);
    };
    fetchArticles();
  }, []);

  // When article is selected, auto-fill content
  const handleArticleSelect = (articleId: string) => {
    setSelectedArticle(articleId);
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setContent(article.content);
      toast({ title: `Loaded: ${article.title}` });
    }
  };

  const researchOutbound = async () => {
    if (!content.trim()) {
      toast({ title: 'Enter content first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setOutboundSuggestions([]);
    setBacklinkOpportunities([]);
    
    try {
      const response = await fetch('/api/admin/insights/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'outbound' })
      });

      const data = await response.json();
      if (data.outbound) {
        setOutboundSuggestions(data.outbound);
      }
      if (data.backlinks) {
        setBacklinkOpportunities(data.backlinks);
      }
      if (data.powered_by) {
        setPoweredBy(data.powered_by);
        if (data.powered_by === 'serper') {
          toast({ title: '🔥 Found real links via Google Search!' });
        }
      }
    } catch (error) {
      toast({ title: 'Research failed', variant: 'destructive' });
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: 'Copied to clipboard!' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'edu': return <GraduationCap className="w-4 h-4 text-blue-400" />;
      case 'gov': return <Shield className="w-4 h-4 text-green-400" />;
      case 'org': return <Building2 className="w-4 h-4 text-purple-400" />;
      default: return <Globe className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: any = {
      edu: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      gov: 'bg-green-500/20 text-green-400 border-green-500/30',
      org: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      authority: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    };
    return colors[type] || colors.authority;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-yellow-400" /> Link Research Lab
        </h2>
        <p className="text-gray-400 text-sm">Find authority sources to cite & backlink opportunities to pursue</p>
      </div>

      {/* Input */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> Select Article or Paste Content
          </CardTitle>
          <CardDescription>Choose an existing article or paste custom content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Article Selector */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Quick Select Article</label>
            <Select value={selectedArticle} onValueChange={handleArticleSelect} disabled={loadingArticles}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder={loadingArticles ? "Loading articles..." : "Select an article..."} />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 max-h-[300px]">
                {articles.map((article) => (
                  <SelectItem key={article.id} value={article.id} className="text-white hover:bg-white/10">
                    {article.title.length > 60 ? article.title.substring(0, 60) + '...' : article.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">or paste custom content</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <Textarea
            placeholder="Or paste custom content here..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setSelectedArticle(''); // Clear selection when manually typing
            }}
            className="min-h-[150px] bg-black/20 border-white/10"
          />
          
          {content && (
            <div className="text-xs text-gray-500">
              📝 {content.length.toLocaleString()} characters loaded
            </div>
          )}

          <Button 
            onClick={researchOutbound} 
            disabled={loading || !content.trim()}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Researching...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Research Outbound Links & Backlink Opportunities</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Outbound Link Suggestions */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <ExternalLink className="w-5 h-5" /> Outbound Link Sources
            </CardTitle>
            <CardDescription>Authority sites to cite in your article</CardDescription>
          </CardHeader>
          <CardContent>
            {outboundSuggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Run research to find .edu, .gov, .org sources</p>
              </div>
            ) : (
              <div className="space-y-3">
                {poweredBy === 'serper' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-2">
                    ✨ Live Google Results
                  </Badge>
                )}
                {outboundSuggestions.map((suggestion, i) => (
                  <div key={i} className="p-4 bg-black/30 rounded-lg border border-white/5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(suggestion.type)}
                        <span className="font-mono text-sm text-white">{suggestion.domain}</span>
                      </div>
                      <Badge variant="outline" className={getTypeBadge(suggestion.type)}>
                        .{suggestion.type}
                      </Badge>
                    </div>
                    {suggestion.title && (
                      <p className="text-sm text-cyan-300 mb-1 font-medium">{suggestion.title}</p>
                    )}
                    {suggestion.snippet && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{suggestion.snippet}</p>
                    )}
                    {!suggestion.snippet && suggestion.reason && (
                      <p className="text-xs text-gray-400 mb-3">{suggestion.reason}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {suggestion.url ? (
                        <>
                          <Button 
                            size="sm" 
                            className="h-7 text-xs flex-1 bg-cyan-600 hover:bg-cyan-500"
                            onClick={() => window.open(suggestion.url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> Visit Site
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => copyToClipboard(suggestion.url!, i)}
                          >
                            {copiedIndex === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs flex-1 border-white/10"
                            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(suggestion.searchQuery || '')}`, '_blank')}
                          >
                            <Search className="w-3 h-3 mr-1" /> Search Google
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => copyToClipboard(suggestion.searchQuery || '', i)}
                          >
                            {copiedIndex === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backlink Opportunities */}
        <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <LinkIcon className="w-5 h-5" /> Backlink Opportunities
            </CardTitle>
            <CardDescription>Sites to pitch for backlinks</CardDescription>
          </CardHeader>
          <CardContent>
            {backlinkOpportunities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Run research to find backlink outreach targets</p>
              </div>
            ) : (
              <div className="space-y-3">
                {poweredBy === 'serper' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-2">
                    ✨ Live Google Results
                  </Badge>
                )}
                {backlinkOpportunities.map((opportunity, i) => (
                  <div key={i} className="p-4 bg-black/30 rounded-lg border border-white/5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-white text-sm line-clamp-2">
                        {opportunity.siteName}
                      </span>
                      <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px] shrink-0">
                        {opportunity.siteType}
                      </Badge>
                    </div>
                    {opportunity.domain && (
                      <p className="text-xs text-gray-500 font-mono mb-2">{opportunity.domain}</p>
                    )}
                    {opportunity.snippet && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{opportunity.snippet}</p>
                    )}
                    <div className="p-2 bg-green-500/10 rounded border border-green-500/20 mb-3">
                      <p className="text-xs text-green-300">
                        <strong>Angle:</strong> {opportunity.outreachAngle}
                      </p>
                    </div>
                    {opportunity.url ? (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-500"
                          onClick={() => window.open(opportunity.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" /> Visit Site
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-white/10"
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(opportunity.domain + ' contact')}`, '_blank')}
                        >
                          Find Email
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs w-full border-white/10"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(opportunity.searchQuery || '')}`, '_blank')}
                      >
                        <Search className="w-3 h-3 mr-1" /> Find Sites
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}


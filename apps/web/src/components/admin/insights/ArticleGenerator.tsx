'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import { 
  Sparkles, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  FileText,
  Target,
  Zap,
  Eye,
  Save,
  RefreshCw,
  Wand2,
  Bot,
  ImageIcon,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Our 6 Pillar Silos
const SILOS = [
  { id: 'salary', name: '💰 Salary & Compensation', slug: 'bpo-salary-guide-philippines', keywords: ['bpo salary', 'call center pay', 'compensation', 'raise', 'allowances'] },
  { id: 'career', name: '📈 Career Growth', slug: 'how-to-get-promoted-bpo-call-center', keywords: ['promotion', 'career path', 'team leader', 'manager', 'growth'] },
  { id: 'jobs', name: '🔎 Job Search', slug: 'bpo-jobs-philippines-guide', keywords: ['bpo jobs', 'hiring', 'openings', 'voice', 'non-voice'] },
  { id: 'interview', name: '🎤 Interview Tips', slug: 'how-to-get-hired-call-center-philippines', keywords: ['interview', 'application', 'versant', 'assessment', 'hired'] },
  { id: 'benefits', name: '🏥 Benefits & Rights', slug: 'bpo-employee-benefits-rights-philippines', keywords: ['benefits', 'sss', 'philhealth', 'pagibig', '13th month', 'rights'] },
  { id: 'companies', name: '🏢 Company Reviews', slug: 'best-bpo-companies-philippines', keywords: ['best bpo', 'company review', 'telus', 'concentrix', 'accenture'] },
];

interface ExistingArticle {
  id: string;
  title: string;
  slug: string;
  keywords: string[];
  category: string;
}

interface CannibalizationWarning {
  article: ExistingArticle;
  overlap: string[];
  severity: 'high' | 'medium' | 'low';
}

interface SuggestedLink {
  articleId: string;
  title: string;
  slug: string;
  anchorText: string;
}

export default function ArticleGenerator() {
  const [selectedSilo, setSelectedSilo] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [articleTopic, setArticleTopic] = useState('');
  
  const [existingArticles, setExistingArticles] = useState<ExistingArticle[]>([]);
  const [cannibalizationWarnings, setCannibalizationWarnings] = useState<CannibalizationWarning[]>([]);
  const [suggestedLinks, setSuggestedLinks] = useState<SuggestedLink[]>([]);
  
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [generatedMeta, setGeneratedMeta] = useState('');
  const [researchData, setResearchData] = useState<any>(null);
  const [semanticKeywords, setSemanticKeywords] = useState<string[]>([]);
  const [outlineHints, setOutlineHints] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [isHumanized, setIsHumanized] = useState(false);
  const [checkingKeywords, setCheckingKeywords] = useState(false);
  const [step, setStep] = useState<'ideas' | 'direction' | 'review' | 'generated'>('ideas');
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState<{ id: string; slug: string } | null>(null);
  
  // Direction Builder state
  const [editableTitle, setEditableTitle] = useState('');
  const [editableBrief, setEditableBrief] = useState('');
  const [editableAngle, setEditableAngle] = useState('');
  const [editableOutline, setEditableOutline] = useState<string[]>([]);
  const [regeneratingDirection, setRegeneratingDirection] = useState(false);
  
  // Save progress state
  const [saveStatus, setSaveStatus] = useState<{
    stage: 'idle' | 'checking' | 'creating' | 'seo' | 'done' | 'error';
    message: string;
    error?: string;
  }>({ stage: 'idle', message: '' });
  
  // Hero image state
  const [heroUrl, setHeroUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageStyle, setImageStyle] = useState('professional');

  // Fetch existing articles on mount
  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from('insights_posts')
        .select('id, title, slug, category, seo:seo_metadata(keywords)');
      
      if (!error && data) {
        setExistingArticles(data.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          category: a.category || '',
          keywords: a.seo?.[0]?.keywords || []
        })));
      }
    };
    fetchArticles();
  }, []);

  // Check for keyword cannibalization
  const checkCannibalization = async () => {
    if (!targetKeyword.trim()) {
      toast({ title: 'Enter a target keyword first', variant: 'destructive' });
      return;
    }

    setCheckingKeywords(true);
    const warnings: CannibalizationWarning[] = [];
    
    const allKeywords = [
      targetKeyword.toLowerCase(),
      ...secondaryKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    ];

    for (const article of existingArticles) {
      const articleKeywords = article.keywords.map(k => k.toLowerCase());
      const titleWords = article.title.toLowerCase().split(' ');
      const overlap: string[] = [];

      for (const kw of allKeywords) {
        // Check exact keyword match
        if (articleKeywords.some(ak => ak.includes(kw) || kw.includes(ak))) {
          overlap.push(kw);
        }
        // Check title contains keyword
        if (article.title.toLowerCase().includes(kw)) {
          if (!overlap.includes(kw)) overlap.push(kw);
        }
      }

      if (overlap.length > 0) {
        warnings.push({
          article,
          overlap,
          severity: overlap.length >= 2 ? 'high' : overlap.includes(targetKeyword.toLowerCase()) ? 'medium' : 'low'
        });
      }
    }

    setCannibalizationWarnings(warnings);
    
    // Also find suggested internal links
    const links: SuggestedLink[] = existingArticles
      .filter(a => {
        const silo = SILOS.find(s => s.id === selectedSilo);
        if (!silo) return false;
        // Suggest pillar page and related articles
        return a.slug === silo.slug || a.category === silo.name;
      })
      .slice(0, 5)
      .map(a => ({
        articleId: a.id,
        title: a.title,
        slug: a.slug,
        anchorText: a.title.split(':')[0].trim()
      }));
    
    setSuggestedLinks(links);
    setCheckingKeywords(false);
    
    if (warnings.filter(w => w.severity === 'high').length > 0) {
      toast({ 
        title: '⚠️ High cannibalization risk detected!', 
        description: 'Consider adjusting your target keyword.',
        variant: 'destructive' 
      });
    } else {
      toast({ title: '✅ Keyword check complete!' });
      setStep('review');
    }
  };

  // Generate the article
  const generateArticle = async () => {
    if (!selectedSilo || !targetKeyword || !articleTopic) {
      toast({ title: 'Fill in all fields first', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const silo = SILOS.find(s => s.id === selectedSilo);
      
      const response = await fetch('/api/admin/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          silo: silo,
          targetKeyword,
          secondaryKeywords: secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean),
          topic: articleTopic,
          existingArticles: existingArticles.map(a => ({ title: a.title, slug: a.slug })),
          suggestedLinks,
          outlineHints,
          semanticKeywords
        })
      });

      const data = await response.json();
      
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
        return;
      }

      setGeneratedTitle(data.title || '');
      setGeneratedContent(data.content || '');
      setGeneratedSlug(data.slug || '');
      setGeneratedMeta(data.metaDescription || '');
      setResearchData(data.research || null);
      setIsHumanized(false);
      setStep('generated');
      
      const researchMsg = data.research 
        ? `Found ${data.research.statsFound} stats, ${data.research.sourcesFound} sources!`
        : '';
      toast({ title: `🔥 Article generated! ${researchMsg}` });
    } catch (error) {
      toast({ title: 'Generation failed', variant: 'destructive' });
    }
    setLoading(false);
  };

  // Fetch smart ideas for the selected silo
  const fetchIdeas = async () => {
    if (!selectedSilo) {
      toast({ title: 'Select a silo first', variant: 'destructive' });
      return;
    }
    setIdeaLoading(true);
    try {
      const res = await fetch('/api/admin/insights/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siloId: selectedSilo })
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        setIdeas(data.ideas || []);
        toast({ title: '💡 Got fresh ideas for this silo!' });
      }
    } catch (e) {
      toast({ title: 'Failed to fetch ideas', variant: 'destructive' });
    }
    setIdeaLoading(false);
  };

  const useIdea = (idea: any) => {
    // Populate direction builder fields
    setEditableTitle(idea.titleSuggestion || idea.title);
    setEditableBrief(idea.brief || '');
    setEditableAngle(idea.ateYnaAngle || '');
    setEditableOutline(idea.outline || []);
    
    // Also set the keywords
    setTargetKeyword(idea.target);
    setSecondaryKeywords((idea.secondary || []).join(', '));
    if (idea.semanticKeywords) setSemanticKeywords(idea.semanticKeywords);
    
    // Move to direction builder step
    setStep('direction');
    toast({ title: `📝 Editing: ${idea.title}` });
  };

  // Regenerate the direction/brief using AI
  const regenerateDirection = async () => {
    if (!targetKeyword || !editableTitle) {
      toast({ title: 'Need a title and keyword first', variant: 'destructive' });
      return;
    }

    setRegeneratingDirection(true);
    try {
      const response = await fetch('/api/admin/insights/refine-direction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editableTitle,
          targetKeyword,
          secondaryKeywords: secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean),
          currentBrief: editableBrief,
          currentAngle: editableAngle,
          currentOutline: editableOutline,
          siloId: selectedSilo
        })
      });

      const data = await response.json();
      
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
        return;
      }

      if (data.brief) setEditableBrief(data.brief);
      if (data.angle) setEditableAngle(data.angle);
      if (data.outline) setEditableOutline(data.outline);
      if (data.title) setEditableTitle(data.title);
      
      toast({ title: '✨ Direction refined!' });
    } catch (error) {
      toast({ title: 'Failed to regenerate', variant: 'destructive' });
    }
    setRegeneratingDirection(false);
  };

  // Proceed from direction to review
  const proceedToReview = () => {
    // Compile the direction into articleTopic
    const fullBrief = `${editableBrief}\n\n**Ate Yna's Angle:** ${editableAngle}\n\n**Outline:**\n${editableOutline.map(h => `- ${h}`).join('\n')}`;
    setArticleTopic(fullBrief);
    setGeneratedTitle(editableTitle);
    setOutlineHints(editableOutline);
    setStep('review');
  };

  // Humanize with Grok
  const humanizeWithGrok = async () => {
    if (!generatedContent) {
      toast({ title: 'Generate content first', variant: 'destructive' });
      return;
    }

    setHumanizing(true);
    try {
      const response = await fetch('/api/admin/insights/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedContent,
          title: generatedTitle
        })
      });

      const data = await response.json();
      
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
        return;
      }

      if (data.content) {
        setGeneratedContent(data.content);
        setIsHumanized(true);
        toast({ title: '🔥 Humanized with Grok! Content is now more unique.' });
      }
    } catch (error) {
      toast({ title: 'Humanization failed', variant: 'destructive' });
    }
    setHumanizing(false);
  };

  // Save the article with detailed progress
  const saveArticle = async () => {
    console.log('🚀 [SAVE] Starting save process...');
    console.log('🚀 [SAVE] Title:', generatedTitle);
    console.log('🚀 [SAVE] Content length:', generatedContent?.length || 0);
    
    if (!generatedTitle || !generatedContent) {
      const err = 'Missing title or content';
      console.error('❌ [SAVE] Validation failed:', err);
      setSaveStatus({ stage: 'error', message: err, error: err });
      toast({ title: '❌ ' + err, variant: 'destructive' });
      return;
    }

    setLoading(true);
    setSaveStatus({ stage: 'checking', message: 'Checking if slug exists...' });

    try {
      const silo = SILOS.find(s => s.id === selectedSilo);
      let baseSlug =
        generatedSlug?.trim() ||
        slugify(generatedTitle).replace(/-+$/, '') ||
        `insight-${Date.now()}`;
      
      console.log('🔍 [SAVE] Base slug:', baseSlug);
      
      // Check if slug already exists
      const { data: existing, error: checkError } = await supabase
        .from('insights_posts')
        .select('slug')
        .eq('slug', baseSlug)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ [SAVE] Slug check failed:', checkError);
        throw new Error(`Slug check failed: ${checkError.message}`);
      }
      
      let finalSlug = baseSlug;
      if (existing) {
        finalSlug = `${baseSlug}-${Date.now().toString(36)}`;
        console.log('⚠️ [SAVE] Slug exists, using:', finalSlug);
        toast({ title: `⚠️ Slug exists, using: ${finalSlug}` });
      }
      
      // Stage 2: Creating post
      setSaveStatus({ stage: 'creating', message: 'Creating article in database...' });
      console.log('📝 [SAVE] Inserting post with slug:', finalSlug);
      
      const postData = {
        title: generatedTitle,
        slug: finalSlug,
        content: generatedContent,
        category: silo?.name || 'Uncategorized',
        author: 'Ate Yna',
        author_slug: 'ate-yna',
        is_published: false,
        hero_type: 'image',
        hero_url: heroUrl || null,
        icon_name: 'FileText'
      };
      console.log('📝 [SAVE] Post data:', JSON.stringify(postData, null, 2));
      
      const { data: post, error: postError } = await supabase
        .from('insights_posts')
        .insert(postData)
        .select()
        .single();

      if (postError) {
        console.error('❌ [SAVE] Post insert failed:', postError);
        console.error('❌ [SAVE] Error code:', postError.code);
        console.error('❌ [SAVE] Error details:', postError.details);
        console.error('❌ [SAVE] Error hint:', postError.hint);
        throw new Error(`Post insert failed: ${postError.message} (Code: ${postError.code})`);
      }

      console.log('✅ [SAVE] Post created:', post.id);

      // Stage 3: Creating SEO metadata
      setSaveStatus({ stage: 'seo', message: 'Adding SEO metadata...' });
      console.log('🔍 [SAVE] Creating SEO metadata for post:', post.id);
      
      const seoData = {
        post_id: post.id,
        meta_title: generatedTitle,
        meta_description: generatedMeta || generatedTitle,
        keywords: [targetKeyword, ...secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean)],
        canonical_url: `https://bpoc-stepten.vercel.app/insights/${finalSlug}`
      };
      console.log('🔍 [SAVE] SEO data:', JSON.stringify(seoData, null, 2));
      
      const { error: seoError } = await supabase
        .from('seo_metadata')
        .insert(seoData);

      if (seoError) {
        console.warn('⚠️ [SAVE] SEO insert warning:', seoError);
        // Don't throw - SEO is optional, post is already saved
      } else {
        console.log('✅ [SAVE] SEO metadata created');
      }

      // Success!
      setSaveStatus({ stage: 'done', message: 'Article saved successfully!' });
      console.log('🎉 [SAVE] Complete! Post ID:', post.id, 'Slug:', post.slug);
      
      toast({ title: '✅ Article saved as draft!' });
      setLastSaved({ id: post.id, slug: post.slug });
      
    } catch (error: any) {
      console.error('❌ [SAVE] FINAL ERROR:', error);
      const message = error?.message || 'Unknown error';
      setSaveStatus({ 
        stage: 'error', 
        message: 'Save failed!', 
        error: message 
      });
      toast({ 
        title: '❌ Save failed', 
        description: message,
        variant: 'destructive' 
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" /> AI Article Generator
        </h2>
        <p className="text-gray-400 text-sm">Generate SEO-optimized articles in Ate Yna's voice with auto-linking</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={step === 'ideas' ? 'bg-cyan-500' : 'bg-white/10'}>1. Pick Idea</Badge>
        <div className="w-6 h-px bg-white/20" />
        <Badge className={step === 'direction' ? 'bg-cyan-500' : 'bg-white/10'}>2. Shape Direction</Badge>
        <div className="w-6 h-px bg-white/20" />
        <Badge className={step === 'review' ? 'bg-cyan-500' : 'bg-white/10'}>3. Check & Generate</Badge>
        <div className="w-6 h-px bg-white/20" />
        <Badge className={step === 'generated' ? 'bg-cyan-500' : 'bg-white/10'}>4. Review & Save</Badge>
      </div>

      {/* Step 1: Pick an Idea */}
      {step === 'ideas' && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Step 1: Pick an Article Idea
            </CardTitle>
            <CardDescription>Select a silo and get AI-suggested ideas with full briefs, angles, and outlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Silo Selection */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Select Silo (Pillar Page)</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select value={selectedSilo} onValueChange={setSelectedSilo}>
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue placeholder="Choose a silo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {SILOS.map((silo) => (
                        <SelectItem key={silo.id} value={silo.id} className="text-white hover:bg-white/10">
                          {silo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={fetchIdeas}
                  disabled={ideaLoading || !selectedSilo}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500"
                >
                  {ideaLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                  ) : (
                    <>💡 Get Ideas</>
                  )}
                </Button>
              </div>
              {selectedSilo && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {SILOS.find(s => s.id === selectedSilo)?.keywords.map(kw => (
                    <Badge key={kw} variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Idea Cards - Rich Display */}
            {ideas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">💡 Article Ideas (Click to Shape)</h4>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={() => setIdeas([])}>
                    Clear
                  </Button>
                </div>
                <div className="space-y-4">
                  {ideas.map((idea, i) => (
                    <div key={i} className="p-4 rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-cyan-500/30 transition-all">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{idea.titleSuggestion || idea.title}</h3>
                          <p className="text-xs text-cyan-300 font-mono">{idea.target}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            idea.risk === 'high'
                              ? 'border-red-500 text-red-400'
                              : idea.risk === 'medium'
                              ? 'border-yellow-500 text-yellow-400'
                              : 'border-green-500 text-green-400'
                          }
                        >
                          {idea.risk} risk
                        </Badge>
                      </div>

                      {/* Brief */}
                      <div className="mb-3 p-3 bg-black/20 rounded-lg">
                        <h4 className="text-xs font-semibold text-gray-400 mb-1">📄 What This Article Covers</h4>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{idea.brief}</p>
                      </div>

                      {/* Ate Yna's Angle */}
                      {idea.ateYnaAngle && (
                        <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                          <h4 className="text-xs font-semibold text-purple-400 mb-1">👩‍💼 Ate Yna's Angle</h4>
                          <p className="text-sm text-purple-200">{idea.ateYnaAngle}</p>
                        </div>
                      )}

                      {/* Outline Preview */}
                      {idea.outline && idea.outline.length > 0 && (
                        <div className="mb-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                          <h4 className="text-xs font-semibold text-cyan-400 mb-2">📋 Suggested Structure</h4>
                          <div className="space-y-1">
                            {idea.outline.slice(0, 6).map((item: string, j: number) => (
                              <p key={j} className="text-xs text-cyan-200">
                                {item.startsWith('H3:') ? '  └ ' : '• '}
                                {item.replace(/^H[23]: /, '')}
                              </p>
                            ))}
                            {idea.outline.length > 6 && (
                              <p className="text-xs text-cyan-400">+ {idea.outline.length - 6} more sections...</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Keywords */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(idea.secondary || []).map((kw: string) => (
                          <Badge key={kw} variant="outline" className="text-[11px] border-white/10 text-gray-300">
                            {kw}
                          </Badge>
                        ))}
                      </div>

                      {/* Sources & Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        {idea.source && <span>🔗 Source: {idea.source.domain}</span>}
                        {idea.stats?.length > 0 && <span>📊 {idea.stats.length} stats found</span>}
                        {idea.links?.length > 0 && <span>🔗 {idea.links.length} internal links ready</span>}
                      </div>

                      {/* Action Button */}
                      <Button 
                        onClick={() => useIdea(idea)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      >
                        ✏️ Shape This Direction
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {ideas.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select a silo and click "Get Ideas" to see AI-suggested articles</p>
                <p className="text-xs mt-2">Each idea comes with a full brief, Ate Yna's angle, and H2/H3 outline</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Direction Builder */}
      {step === 'direction' && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400" /> Step 2: Shape Your Direction
            </CardTitle>
            <CardDescription>Edit the title, brief, angle, and outline. Regenerate to refine. Only proceed when you're happy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                📰 Article Title
              </label>
              <Input
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="bg-black/20 border-white/10 text-lg font-bold"
                placeholder="Your headline..."
              />
            </div>

            {/* Target Keyword */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Primary Keyword</label>
                <Input
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  className="bg-black/20 border-white/10 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Secondary Keywords</label>
                <Input
                  value={secondaryKeywords}
                  onChange={(e) => setSecondaryKeywords(e.target.value)}
                  className="bg-black/20 border-white/10 font-mono text-sm"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>

            {/* Brief */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                📄 Article Brief <span className="text-xs text-gray-400">(What will this cover?)</span>
              </label>
              <Textarea
                value={editableBrief}
                onChange={(e) => setEditableBrief(e.target.value)}
                className="bg-black/20 border-white/10 min-h-[150px]"
                placeholder="Describe what the article will cover, the main points, and what makes it valuable to readers..."
              />
            </div>

            {/* Ate Yna's Angle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-400 flex items-center gap-2">
                👩‍💼 Ate Yna's Angle <span className="text-xs text-gray-400">(Her unique voice/viewpoint)</span>
              </label>
              <Textarea
                value={editableAngle}
                onChange={(e) => setEditableAngle(e.target.value)}
                className="bg-purple-500/10 border-purple-500/20 min-h-[100px]"
                placeholder="How does Ate Yna approach this topic? What's her personal take, stories, or tough love advice?"
              />
            </div>

            {/* Outline */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                📋 Article Structure <span className="text-xs text-gray-400">(H2/H3 outline)</span>
              </label>
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg space-y-2">
                {editableOutline.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-cyan-400 w-8">{item.startsWith('H3') ? 'H3' : 'H2'}</span>
                    <Input
                      value={item.replace(/^H[23]: /, '')}
                      onChange={(e) => {
                        const prefix = item.startsWith('H3:') ? 'H3: ' : 'H2: ';
                        const newOutline = [...editableOutline];
                        newOutline[i] = prefix + e.target.value;
                        setEditableOutline(newOutline);
                      }}
                      className="bg-black/30 border-white/10 text-sm flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditableOutline(editableOutline.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditableOutline([...editableOutline, 'H2: New Section'])}
                    className="text-xs border-cyan-500/30 text-cyan-400"
                  >
                    + Add H2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditableOutline([...editableOutline, 'H3: Sub-section'])}
                    className="text-xs border-cyan-500/30 text-cyan-300"
                  >
                    + Add H3
                  </Button>
                </div>
              </div>
            </div>

            {/* Regenerate Direction */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">✨ Not quite right?</h4>
                  <p className="text-xs text-gray-400">AI will refine the brief, angle, and outline based on your edits</p>
                </div>
                <Button 
                  onClick={regenerateDirection}
                  disabled={regeneratingDirection}
                  variant="outline"
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                >
                  {regeneratingDirection ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refining...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate Direction</>
                  )}
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('ideas')} className="flex-1">
                ← Back to Ideas
              </Button>
              <Button 
                onClick={proceedToReview}
                disabled={!editableTitle || !editableBrief}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                Proceed to Check & Generate →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review Warnings */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Cannibalization Warnings */}
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" /> Cannibalization Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cannibalizationWarnings.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>No cannibalization detected! Safe to proceed.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {cannibalizationWarnings.map((warning, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg border ${
                        warning.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                        warning.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{warning.article.title}</span>
                        <Badge variant="outline" className={
                          warning.severity === 'high' ? 'border-red-500 text-red-400' :
                          warning.severity === 'medium' ? 'border-yellow-500 text-yellow-400' :
                          'border-blue-500 text-blue-400'
                        }>
                          {warning.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        Overlapping: {warning.overlap.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Internal Links */}
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-green-400" /> Auto-Link Suggestions
              </CardTitle>
              <CardDescription>These articles will be linked from your new content</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestedLinks.length === 0 ? (
                <p className="text-gray-500 text-sm">No related articles found</p>
              ) : (
                <div className="space-y-2">
                  {suggestedLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-black/20 rounded">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">{link.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('direction')} className="flex-1">
              ← Edit Direction
            </Button>
            <Button 
              onClick={generateArticle}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Article</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Content */}
      {step === 'generated' && (
        <div className="space-y-4">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" /> Generated Article
              </CardTitle>
              <CardDescription>Review and edit before saving</CardDescription>
            </CardHeader>
            
            {/* Research Stats */}
            {researchData && (
              <div className="mx-6 mb-4 p-3 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400">🔍 Research:</span>
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    {researchData.statsFound} Stats
                  </Badge>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    {researchData.sourcesFound} Authority Sources
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    {researchData.questionsFound} FAQs
                  </Badge>
                </div>
                {researchData.sources?.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    Sources used: {researchData.sources.map((s: any) => s.domain).join(', ')}
                  </div>
                )}
              </div>
            )}
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Title</label>
                <Input
                  value={generatedTitle}
                  onChange={(e) => setGeneratedTitle(e.target.value)}
                  className="bg-black/20 border-white/10 text-lg font-bold"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Slug</label>
                <Input
                  value={generatedSlug}
                  onChange={(e) => setGeneratedSlug(e.target.value)}
                  className="bg-black/20 border-white/10 font-mono text-sm"
                />
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Meta Description</label>
                <Textarea
                  value={generatedMeta}
                  onChange={(e) => setGeneratedMeta(e.target.value)}
                  className="bg-black/20 border-white/10"
                  rows={2}
                />
                <p className="text-xs text-gray-500">{generatedMeta.length}/160 characters</p>
              </div>

              {/* Hero Image Generation */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <h4 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Hero Image (AI Generated)
                </h4>
                
                {/* Image Preview */}
                {heroUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-white/10 mb-3">
                    <img src={heroUrl} alt="Hero preview" className="w-full h-32 object-cover" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/50"
                      onClick={() => setHeroUrl('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Style Selection */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {['professional', 'illustration', 'cinematic', 'tech', 'warm'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setImageStyle(style)}
                      className={`px-2 py-1 text-xs rounded-full border transition-all ${
                        imageStyle === style 
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                          : 'border-white/10 text-gray-400 hover:border-purple-500/30'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <Button
                  onClick={async () => {
                    setImageLoading(true);
                    try {
                      const res = await fetch('/api/admin/insights/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: generatedTitle,
                          slug: generatedSlug,
                          style: imageStyle
                        })
                      });
                      const data = await res.json();
                      if (data.error) {
                        toast({ title: data.error, variant: 'destructive' });
                      } else if (data.imageUrl) {
                        setHeroUrl(data.imageUrl);
                        const msg = data.permanent 
                          ? '🎨 Image saved permanently!' 
                          : '🎨 Generated (temp URL)';
                        toast({ title: msg });
                      }
                    } catch (err) {
                      toast({ title: 'Image generation failed', variant: 'destructive' });
                    }
                    setImageLoading(false);
                  }}
                  disabled={imageLoading || !generatedTitle}
                  variant="outline"
                  className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                >
                  {imageLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating & saving (~15s)...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" /> Generate Hero Image</>
                  )}
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Content (Markdown)</label>
                  {isHumanized && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      <Bot className="w-3 h-3 mr-1" /> Humanized by Grok
                    </Badge>
                  )}
                </div>
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="bg-black/20 border-white/10 font-mono text-sm min-h-[400px]"
                />
                <p className="text-xs text-gray-500">{generatedContent.length.toLocaleString()} characters</p>
              </div>

              {/* Humanize Button */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-purple-400" /> Make it More Human
                    </h4>
                    <p className="text-xs text-gray-400">Use Grok AI to add more personality & uniqueness</p>
                  </div>
                  <Button 
                    onClick={humanizeWithGrok}
                    disabled={humanizing || !generatedContent}
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                  >
                    {humanizing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Humanizing...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" /> Humanize with Grok</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Progress Indicator */}
          {saveStatus.stage !== 'idle' && (
            <div className={`p-4 rounded-lg border ${
              saveStatus.stage === 'error' 
                ? 'bg-red-500/10 border-red-500/30' 
                : saveStatus.stage === 'done'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {saveStatus.stage === 'error' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : saveStatus.stage === 'done' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    saveStatus.stage === 'error' ? 'text-red-400' 
                    : saveStatus.stage === 'done' ? 'text-green-400' 
                    : 'text-blue-400'
                  }`}>
                    {saveStatus.message}
                  </p>
                  {saveStatus.error && (
                    <p className="text-xs text-red-300 mt-1 font-mono">{saveStatus.error}</p>
                  )}
                </div>
                {saveStatus.stage !== 'idle' && saveStatus.stage !== 'done' && saveStatus.stage !== 'error' && (
                  <div className="flex gap-1">
                    <div className={`w-2 h-2 rounded-full ${saveStatus.stage === 'checking' ? 'bg-blue-400' : 'bg-white/20'}`} />
                    <div className={`w-2 h-2 rounded-full ${saveStatus.stage === 'creating' ? 'bg-blue-400' : 'bg-white/20'}`} />
                    <div className={`w-2 h-2 rounded-full ${saveStatus.stage === 'seo' ? 'bg-blue-400' : 'bg-white/20'}`} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('review')} className="flex-1">
              ← Back
            </Button>
            <Button variant="outline" onClick={generateArticle} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
            </Button>
            <Button 
              onClick={saveArticle}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                  {saveStatus.stage === 'checking' && 'Checking slug...'}
                  {saveStatus.stage === 'creating' && 'Creating post...'}
                  {saveStatus.stage === 'seo' && 'Adding SEO...'}
                  {!['checking', 'creating', 'seo'].includes(saveStatus.stage) && 'Saving...'}
                </>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save as Draft</>
              )}
            </Button>
          </div>

          {/* Success Actions */}
          {(lastSaved || saveStatus.stage === 'done') && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 font-medium mb-3">✅ Draft saved successfully!</p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/insights/${lastSaved?.id}`}>
                  <Button variant="outline" className="border-green-500/30 text-green-400">
                    ✏️ Edit draft
                  </Button>
                </Link>
                <Link href="/admin/insights">
                  <Button variant="outline" className="border-white/20">
                    📋 View in All Articles
                  </Button>
                </Link>
                <Link href={`/insights/${lastSaved?.slug}`} target="_blank">
                  <Button variant="outline" className="border-cyan-500/30 text-cyan-400">
                    👁️ Preview live page
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


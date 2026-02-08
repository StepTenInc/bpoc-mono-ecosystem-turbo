'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Search, Link as LinkIcon, ArrowUp, ArrowDown, ArrowRight, ArrowLeft, X, ExternalLink, RefreshCw, Plus, Check, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LinkManagerProps {
  postId: string;
  postTitle: string;
}

interface InternalLink {
  id: string;
  source_post_id: string;
  target_post_id: string;
  anchor_text: string | null;
  type: 'related' | 'pillar' | 'cluster';
  source_post?: { title: string; slug: string };
  target_post?: { title: string; slug: string };
}

export default function LinkManager({ postId, postTitle }: LinkManagerProps) {
  const [links, setLinks] = useState<InternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [anchorText, setAnchorText] = useState('');
  const [linkType, setLinkType] = useState<'related' | 'pillar' | 'cluster'>('related');
  
  // Quick Add Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState<'outbound' | 'inbound'>('outbound');
  const [quickAddStep, setQuickAddStep] = useState<'choose' | 'browse' | 'search'>('choose');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState<any[]>([]);
  const [quickSelectedTarget, setQuickSelectedTarget] = useState<any>(null);
  const [quickAnchorText, setQuickAnchorText] = useState('');
  const [quickLinkType, setQuickLinkType] = useState<'related' | 'pillar' | 'cluster'>('related');
  const [isSearching, setIsSearching] = useState(false);
  const [ownArticles, setOwnArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const quickSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (postId) fetchLinks();
  }, [postId]);

  const fetchLinks = async () => {
    setLoading(true);
    // Fetch links where this post is the SOURCE (Outbound)
    const { data: outbound, error: outError } = await supabase
      .from('internal_links')
      .select('*, target_post:insights_posts!internal_links_target_post_id_fkey(title, slug)')
      .eq('source_post_id', postId);

    // Fetch links where this post is the TARGET (Inbound)
    const { data: inbound, error: inError } = await supabase
      .from('internal_links')
      .select('*, source_post:insights_posts!internal_links_source_post_id_fkey(title, slug)')
      .eq('target_post_id', postId);

    if (outError || inError) {
      console.error('Error fetching links:', outError || inError);
    } else {
      setLinks([...(outbound || []), ...(inbound || [])]);
    }
    setLoading(false);
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('insights_posts')
      .select('id, title, slug')
      .ilike('title', `%${term}%`)
      .neq('id', postId) // Don't link to self
      .limit(5);

    if (!error && data) {
      setSearchResults(data);
    }
  };

  // Quick Add search handler
  const handleQuickSearch = async (term: string) => {
    setQuickSearchTerm(term);
    if (term.length < 2) {
      setQuickSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase
      .from('insights_posts')
      .select('id, title, slug, category')
      .ilike('title', `%${term}%`)
      .neq('id', postId)
      .limit(8);

    setIsSearching(false);
    if (!error && data) {
      // Filter out already linked posts based on mode
      if (quickAddMode === 'outbound') {
        const linkedIds = outboundLinks.map(l => l.target_post_id);
        setQuickSearchResults(data.filter(d => !linkedIds.includes(d.id)));
      } else {
        // For inbound, filter out posts that already link TO this post
        const linkedIds = inboundLinks.map(l => l.source_post_id);
        setQuickSearchResults(data.filter(d => !linkedIds.includes(d.id)));
      }
    }
  };

  // Quick Add link handler
  const addQuickLink = async () => {
    if (!quickSelectedTarget) return;

    try {
      // For outbound: this post → target
      // For inbound: selected post → this post
      const linkData = quickAddMode === 'outbound' 
        ? {
            source_post_id: postId,
            target_post_id: quickSelectedTarget.id,
            anchor_text: quickAnchorText || quickSelectedTarget.title,
            type: quickLinkType
          }
        : {
            source_post_id: quickSelectedTarget.id,
            target_post_id: postId,
            anchor_text: quickAnchorText || postTitle,
            type: quickLinkType
          };

      const { error } = await supabase
        .from('internal_links')
        .insert(linkData);

      if (error) throw error;

      const message = quickAddMode === 'outbound'
        ? `Now linking TO "${quickSelectedTarget.title}"`
        : `"${quickSelectedTarget.title}" now links TO this post`;
      
      toast({ title: '✅ Link added!', description: message });
      resetQuickAdd();
      fetchLinks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickAddMode('outbound');
    setQuickAddStep('choose');
    setQuickSearchTerm('');
    setQuickSearchResults([]);
    setQuickSelectedTarget(null);
    setQuickAnchorText('');
    setQuickLinkType('related');
    setOwnArticles([]);
  };

  const openQuickAdd = (mode: 'outbound' | 'inbound') => {
    setQuickAddMode(mode);
    setQuickAddStep('choose');
    setShowQuickAdd(true);
  };

  // Fetch own articles for browse mode
  const fetchOwnArticles = async () => {
    setLoadingArticles(true);
    const { data, error } = await supabase
      .from('insights_posts')
      .select('id, title, slug, category, is_published')
      .neq('id', postId)
      .order('created_at', { ascending: false })
      .limit(50);

    setLoadingArticles(false);
    if (!error && data) {
      // Filter out already linked posts based on mode
      if (quickAddMode === 'outbound') {
        const linkedIds = outboundLinks.map(l => l.target_post_id);
        setOwnArticles(data.filter(d => !linkedIds.includes(d.id)));
      } else {
        const linkedIds = inboundLinks.map(l => l.source_post_id);
        setOwnArticles(data.filter(d => !linkedIds.includes(d.id)));
      }
    }
  };

  const handleChooseOption = (option: 'browse' | 'search') => {
    setQuickAddStep(option);
    if (option === 'browse') {
      fetchOwnArticles();
    }
  };

  // Focus search input when modal opens
  useEffect(() => {
    if (showQuickAdd && quickSearchRef.current) {
      setTimeout(() => quickSearchRef.current?.focus(), 100);
    }
  }, [showQuickAdd]);

  const addLink = async () => {
    if (!selectedTarget) return;

    try {
      const { error } = await supabase
        .from('internal_links')
        .insert({
          source_post_id: postId,
          target_post_id: selectedTarget.id,
          anchor_text: anchorText,
          type: linkType
        });

      if (error) throw error;

      toast({ title: 'Link added', description: `Linked to ${selectedTarget.title}` });
      setAnchorText('');
      setSelectedTarget(null);
      setSearchTerm('');
      fetchLinks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const removeLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('internal_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      toast({ title: 'Link removed' });
      fetchLinks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const inboundLinks = links.filter(l => l.target_post_id === postId);
  const outboundLinks = links.filter(l => l.source_post_id === postId);

  return (
    <div className="space-y-8">
      
      {/* 1. Visual Link Graph (Simplified) */}
      <Card className="bg-black/40 border-white/10 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-cyan-400" /> Link Graph Visualization
          </CardTitle>
          <CardDescription>Visualize the content silo structure for this article.</CardDescription>
        </CardHeader>
        <CardContent className="relative py-12">
          <div className="flex flex-col items-center gap-8 relative z-10">
            
            {/* Inbound (Up/Side) */}
            <div className="flex gap-4 flex-wrap justify-center items-end">
              {inboundLinks.length === 0 && <div className="text-sm text-gray-600 italic">No inbound links</div>}
              {inboundLinks.map(link => (
                <div key={link.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center gap-2 min-w-[150px] relative group">
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-[10px]">
                    {link.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-white font-medium text-center truncate w-full max-w-[140px]">{link.source_post?.title}</span>
                  <ArrowDown className="w-4 h-4 text-gray-500" />
                  <button 
                    onClick={() => removeLink(link.id)}
                    className="absolute -top-2 -right-2 bg-red-500/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {/* Quick Add Inbound Link Button */}
              <button
                onClick={() => openQuickAdd('inbound')}
                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-lg p-3 flex flex-col items-center justify-center gap-2 min-w-[150px] min-h-[100px] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] group"
              >
                <Plus className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                <span className="text-xs text-purple-400 font-medium group-hover:text-purple-300">Add Inbound</span>
              </button>
            </div>

            {/* Current Post (Center) */}
            <div className="bg-cyan-500/10 border border-cyan-500/50 rounded-xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] text-center max-w-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-2 text-xs text-cyan-400 font-bold uppercase tracking-widest">Current Post</div>
              <h3 className="text-lg font-bold text-white">{postTitle}</h3>
              <p className="text-xs text-gray-400 mt-1">{inboundLinks.length} Inbound • {outboundLinks.length} Outbound</p>
            </div>

            {/* Outbound (Down) */}
            <div className="flex gap-4 flex-wrap justify-center items-start">
              {outboundLinks.length === 0 && <div className="text-sm text-gray-600 italic">No outbound links</div>}
              {outboundLinks.map(link => (
                <div key={link.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center gap-2 min-w-[150px] relative group">
                  <ArrowUp className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-white font-medium text-center truncate w-full max-w-[140px]">{link.target_post?.title}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                      {link.type.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-gray-500 truncate max-w-[80px]">"{link.anchor_text}"</span>
                  </div>
                  <button 
                    onClick={() => removeLink(link.id)}
                    className="absolute -top-2 -right-2 bg-red-500/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {/* Quick Add Outbound Link Button */}
              <button
                onClick={() => openQuickAdd('outbound')}
                className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-lg p-3 flex flex-col items-center justify-center gap-2 min-w-[150px] min-h-[100px] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] group"
              >
                <Plus className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" />
                <span className="text-xs text-cyan-400 font-medium group-hover:text-cyan-300">Add Outbound</span>
              </button>
            </div>

          </div>
          
          {/* Quick Add Modal Overlay */}
          {showQuickAdd && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
              <div className={`bg-[#0a0a0a] border rounded-xl p-6 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 ${
                quickAddMode === 'outbound' 
                  ? 'border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]' 
                  : 'border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)]'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {quickAddStep !== 'choose' && (
                      <button 
                        onClick={() => setQuickAddStep('choose')} 
                        className="text-gray-400 hover:text-white mr-1"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    <LinkIcon className={`w-5 h-5 ${quickAddMode === 'outbound' ? 'text-cyan-400' : 'text-purple-400'}`} />
                    {quickAddMode === 'outbound' ? 'Add Outbound Link' : 'Add Inbound Link'}
                  </h3>
                  <button onClick={resetQuickAdd} className="text-gray-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Mode Explanation */}
                <p className="text-xs text-gray-500 mb-4">
                  {quickAddMode === 'outbound' 
                    ? '→ This article will link TO the selected article'
                    : '← The selected article will link TO this article'}
                </p>

                {/* Step 1: Choose Option */}
                {quickAddStep === 'choose' && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleChooseOption('browse')}
                      className={`p-6 rounded-xl border-2 border-dashed transition-all hover:scale-[1.02] flex flex-col items-center gap-3 ${
                        quickAddMode === 'outbound'
                          ? 'border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10'
                          : 'border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        quickAddMode === 'outbound' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
                      }`}>
                        <FileText className={`w-6 h-6 ${quickAddMode === 'outbound' ? 'text-cyan-400' : 'text-purple-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">Own Articles</p>
                        <p className="text-xs text-gray-500 mt-1">Browse your existing articles</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleChooseOption('search')}
                      className={`p-6 rounded-xl border-2 border-dashed transition-all hover:scale-[1.02] flex flex-col items-center gap-3 ${
                        quickAddMode === 'outbound'
                          ? 'border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10'
                          : 'border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        quickAddMode === 'outbound' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
                      }`}>
                        <Search className={`w-6 h-6 ${quickAddMode === 'outbound' ? 'text-cyan-400' : 'text-purple-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">Search Articles</p>
                        <p className="text-xs text-gray-500 mt-1">Find by keyword or title</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Step 2a: Browse Own Articles */}
                {quickAddStep === 'browse' && !quickSelectedTarget && (
                  <div className="space-y-3">
                    {loadingArticles ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className={`w-6 h-6 animate-spin ${quickAddMode === 'outbound' ? 'text-cyan-400' : 'text-purple-400'}`} />
                      </div>
                    ) : (
                      <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden max-h-[280px] overflow-y-auto">
                        {ownArticles.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No available articles to link
                          </div>
                        ) : (
                          ownArticles.map(article => (
                            <div
                              key={article.id}
                              onClick={() => {
                                setQuickSelectedTarget(article);
                                setQuickAnchorText(quickAddMode === 'outbound' ? article.title : postTitle);
                              }}
                              className={`p-3 cursor-pointer border-b border-white/5 last:border-0 transition-colors flex items-center justify-between ${
                                quickAddMode === 'outbound' ? 'hover:bg-cyan-500/10' : 'hover:bg-purple-500/10'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">{article.title}</p>
                                <p className="text-xs text-gray-500">{article.category} • /{article.slug}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {article.is_published ? (
                                  <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px]">LIVE</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[10px]">DRAFT</Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2b: Search Articles */}
                {quickAddStep === 'search' && !quickSelectedTarget && (
                  <>
                    <div className="relative mb-4">
                      <Input
                        ref={quickSearchRef}
                        placeholder={quickAddMode === 'outbound' 
                          ? "🔍 Search articles to link TO..." 
                          : "🔍 Search articles that should link HERE..."}
                        value={quickSearchTerm}
                        onChange={(e) => handleQuickSearch(e.target.value)}
                        className={`bg-black/50 border-white/20 pl-4 pr-10 text-white placeholder:text-gray-500 ${
                          quickAddMode === 'outbound' ? 'focus:border-cyan-500' : 'focus:border-purple-500'
                        }`}
                      />
                      {isSearching && (
                        <RefreshCw className={`w-4 h-4 absolute right-3 top-3 animate-spin ${
                          quickAddMode === 'outbound' ? 'text-cyan-400' : 'text-purple-400'
                        }`} />
                      )}
                    </div>

                    {/* Search Results */}
                    {quickSearchResults.length > 0 && (
                      <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden mb-4 max-h-[200px] overflow-y-auto">
                        {quickSearchResults.map(result => (
                          <div
                            key={result.id}
                            onClick={() => {
                              setQuickSelectedTarget(result);
                              setQuickSearchTerm(result.title);
                              setQuickAnchorText(quickAddMode === 'outbound' ? result.title : postTitle);
                              setQuickSearchResults([]);
                            }}
                            className={`p-3 cursor-pointer border-b border-white/5 last:border-0 transition-colors ${
                              quickAddMode === 'outbound' ? 'hover:bg-cyan-500/10' : 'hover:bg-purple-500/10'
                            }`}
                          >
                            <p className="text-sm text-white font-medium">{result.title}</p>
                            <p className="text-xs text-gray-500">{result.category} • /{result.slug}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {quickSearchTerm.length >= 2 && quickSearchResults.length === 0 && !isSearching && (
                      <div className="text-center text-gray-500 text-sm py-4">
                        No articles found matching "{quickSearchTerm}"
                      </div>
                    )}
                  </>
                )}

                {/* Selected Target Preview */}
                {quickSelectedTarget && (
                  <div className={`rounded-lg p-3 mb-4 ${
                    quickAddMode === 'outbound' 
                      ? 'bg-cyan-500/10 border border-cyan-500/30' 
                      : 'bg-purple-500/10 border border-purple-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${quickAddMode === 'outbound' ? 'text-cyan-400' : 'text-purple-400'}`}>
                          {quickSelectedTarget.title}
                        </p>
                        <p className="text-xs text-gray-500">/{quickSelectedTarget.slug}</p>
                      </div>
                      <button
                        onClick={() => {
                          setQuickSelectedTarget(null);
                          setQuickSearchTerm('');
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Anchor Text */}
                {quickSelectedTarget && (
                  <div className="mb-4">
                    <Label className="text-gray-400 text-xs mb-2 block">
                      Anchor Text {quickAddMode === 'inbound' && <span className="text-purple-400">(text in source article)</span>}
                    </Label>
                    <Input
                      placeholder={quickAddMode === 'outbound' 
                        ? "e.g., 'See our salary guide'" 
                        : "e.g., 'Learn about maternity leave'"}
                      value={quickAnchorText}
                      onChange={(e) => setQuickAnchorText(e.target.value)}
                      className="bg-black/50 border-white/20 text-white"
                    />
                  </div>
                )}

                {/* Link Type Selector */}
                {quickSelectedTarget && (
                  <div className="mb-6">
                    <Label className="text-gray-400 text-xs mb-2 block">Link Type</Label>
                    <div className="flex gap-2">
                      {['related', 'pillar', 'cluster'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setQuickLinkType(type as any)}
                          className={`
                            flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
                            ${quickLinkType === type
                              ? quickAddMode === 'outbound'
                                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                                : 'bg-purple-500/20 border border-purple-500 text-purple-400'
                              : 'bg-black/30 border border-white/10 text-gray-400 hover:border-white/30'}
                          `}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={resetQuickAdd}
                    className="flex-1 border-white/20 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addQuickLink}
                    disabled={!quickSelectedTarget || !quickAnchorText}
                    className={`flex-1 text-white disabled:opacity-50 ${
                      quickAddMode === 'outbound'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500'
                    }`}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {quickAddMode === 'outbound' ? 'Add Outbound' : 'Add Inbound'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-1 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full absolute" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Link Builder */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle>Add Internal Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Search Target */}
            <div className="space-y-2">
              <Label>Link to Article (Target)</Label>
              <div className="relative">
                <Input 
                  placeholder="Search articles..." 
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-black/20 pr-8"
                />
                <Search className="w-4 h-4 absolute right-3 top-3 text-gray-500" />
                
                {searchResults.length > 0 && !selectedTarget && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
                    {searchResults.map(result => (
                      <div 
                        key={result.id}
                        className="p-3 hover:bg-white/5 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors"
                        onClick={() => {
                          setSelectedTarget(result);
                          setSearchTerm(result.title);
                          setSearchResults([]);
                        }}
                      >
                        {result.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Anchor Text */}
            <div className="space-y-2">
              <Label>Anchor Text (Rich Keyword)</Label>
              <Input 
                placeholder="e.g., 'See our 2026 salary guide'" 
                value={anchorText}
                onChange={(e) => setAnchorText(e.target.value)}
                className="bg-black/20"
              />
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label>Link Type</Label>
              <div className="flex gap-2">
                {['related', 'pillar', 'cluster'].map((type) => (
                  <div 
                    key={type}
                    onClick={() => setLinkType(type as any)}
                    className={`
                      cursor-pointer px-4 py-2 rounded-md border text-sm font-medium transition-all
                      ${linkType === type 
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'}
                    `}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={addLink} 
              disabled={!selectedTarget || !anchorText}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Connect Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


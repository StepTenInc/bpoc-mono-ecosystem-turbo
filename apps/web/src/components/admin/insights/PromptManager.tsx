'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Textarea } from '@/components/shared/ui/textarea';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_PROMPTS = {
  stage1_ideas: `You are an AI content strategist for a BPO careers platform serving Filipino professionals.

Context: BPOC.io helps BPO workers find jobs, advance careers, understand benefits, and navigate the industry.

Generate 5-10 article ideas based on:
- Topic: {topic}
- Silo: {silo}
- Target audience: BPO candidates, agents, team leaders in the Philippines

Requirements:
- Each idea should solve a real problem BPO workers face
- Use Filipino-relevant examples (Manila, Makati, Quezon City, etc.)
- Include practical, actionable advice
- Consider search intent (informational, transactional, navigational)
- Mix beginner and advanced topics

Return format:
{
  "ideas": [
    {
      "title": "Clear, searchable title",
      "description": "2-sentence pitch",
      "keywords": ["primary", "secondary", "lsi"],
      "difficulty": "beginner|intermediate|advanced",
      "searchVolume": "high|medium|low"
    }
  ]
}`,

  stage2_research: `You are researching for a BPO careers article.

Topic: {title}
Silo: {silo}

Research tasks:
1. Find .edu and .org authority sources related to:
   - Philippine labor laws
   - BPO industry statistics
   - Employment regulations
   - Career development research

2. Search internal HR Knowledge Base for:
   - DOLE regulations
   - Employee rights
   - Benefits information
   - Labor code articles

3. Competitor analysis:
   - What angles do they cover?
   - What's missing?
   - How can we be better/more specific?

Return: Authority links, HR KB articles, content gaps, unique angles`,

  stage3_plan: `Create a comprehensive article plan for a BPO careers article.

Title: {title}
Target: Filipino BPO professionals
Platform: BPOC.io careers platform

Requirements:
- Word count: 1,500-2,500 words
- H1: {title}
- H2-H6: Logical hierarchy
- Include:
  * Introduction (100-150 words)
  * Main content sections (3-5 H2 sections)
  * FAQ section (5-7 questions)
  * Conclusion with CTA
  * Internal link opportunities
  * External authority link placements

Tone: Ate Ina voice (warm, professional, encouraging, uses "kaya mo yan!")

Return: Complete outline with word count per section, link placement suggestions`,

  stage4_write: `Write a full article for BPOC.io - BPO careers platform.

Plan: {plan}
Research: {research}

Voice: Ate Ina
- Warm, encouraging, professional
- Uses phrases like "Here's the thing...", "Kaya mo yan!", "Let me be real with you..."
- Filipino context (Manila, Makati, BPO companies)
- Personal anecdotes and insider tips
- Short paragraphs (2-3 sentences)

Requirements:
- Follow the plan structure exactly
- Place all suggested links naturally
- Use research data and statistics
- Include real company examples (Concentrix, TELUS, Accenture)
- Add Filipino context and examples
- Keep it practical and actionable

Return: Full HTML article with proper heading tags, links, and formatting`,

  stage5_humanize: `Rewrite this AI-generated content to pass AI detectors while maintaining the Ate Ina voice.

Original: {content}

Humanization requirements:
- Vary sentence length dramatically (some 5 words, some 40+)
- Add natural speech patterns and filler words
- Include conversational asides
- Add rhetorical questions
- Mix professional and casual language
- Keep Ate Ina personality phrases
- Preserve ALL links exactly as they are
- Add subtle imperfections (contractions, etc.)

Target: 85%+ human score on AI detectors

Return: Humanized content with score estimate`,

  stage6_seo: `Optimize this article for SEO and generate image prompt.

Content: {content}
Target keywords: {keywords}

SEO Tasks:
1. Enrich anchor text (descriptive but natural)
2. Add semantic/contextual internal links
3. Ensure .edu/.org links are valuable and relevant
4. Optimize heading hierarchy
5. Add LSI keywords naturally
6. Improve keyword density (2-3% for primary)

Image Generation:
Create a prompt for hero image that shows:
- Real Filipino BPO professionals
- Modern call center environment
- Professional, warm atmosphere
- Authentic, not stock-photo-looking

Return: Optimized content + image prompt`,

  stage7_meta: `Generate SEO meta tags and schema markup.

Title: {title}
Content: {content}
Keywords: {keywords}

Generate:
1. Meta title (50-60 chars, includes primary keyword)
2. Meta description (150-160 chars, compelling, includes CTA)
3. OG tags (social media)
4. Schema.org markup:
   - Article schema
   - FAQ schema (if applicable)
   - Organization schema
   - BreadcrumbList schema

Return: Complete meta tags object + JSON-LD schema`
};

export default function PromptManager() {
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [saving, setSaving] = useState(false);
  const [activePrompt, setActivePrompt] = useState<keyof typeof DEFAULT_PROMPTS>('stage1_ideas');
  const { toast } = useToast();

  // Load saved prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pipeline_prompts');
    if (saved) {
      setPrompts(JSON.parse(saved));
    }
  }, []);

  const savePrompts = () => {
    setSaving(true);
    localStorage.setItem('pipeline_prompts', JSON.stringify(prompts));
    toast({ title: 'Saved!', description: 'Prompts updated successfully' });
    setTimeout(() => setSaving(false), 1000);
  };

  const resetToDefault = () => {
    if (confirm('Reset all prompts to default? This cannot be undone.')) {
      setPrompts(DEFAULT_PROMPTS);
      localStorage.removeItem('pipeline_prompts');
      toast({ title: 'Reset', description: 'All prompts restored to default' });
    }
  };

  const promptStages = [
    { key: 'stage1_ideas', label: 'Stage 1: Ideas Generation', color: 'border-purple-500' },
    { key: 'stage2_research', label: 'Stage 2: Research', color: 'border-blue-500' },
    { key: 'stage3_plan', label: 'Stage 3: Plan Structure', color: 'border-cyan-500' },
    { key: 'stage4_write', label: 'Stage 4: Write Article', color: 'border-green-500' },
    { key: 'stage5_humanize', label: 'Stage 5: Humanize', color: 'border-yellow-500' },
    { key: 'stage6_seo', label: 'Stage 6: SEO Optimize', color: 'border-pink-500' },
    { key: 'stage7_meta', label: 'Stage 7: Meta & Schema', color: 'border-indigo-500' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Settings className="w-8 h-8" />
            AI Pipeline Prompt Manager
          </h1>
          <p className="text-gray-400 mt-1">Configure prompts for each stage of the content pipeline</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={resetToDefault} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={savePrompts} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Prompts'}
          </Button>
        </div>
      </div>

      {/* Prompt Selector */}
      <div className="grid grid-cols-7 gap-2">
        {promptStages.map((stage) => (
          <button
            key={stage.key}
            onClick={() => setActivePrompt(stage.key as keyof typeof DEFAULT_PROMPTS)}
            className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
              activePrompt === stage.key
                ? `${stage.color} bg-white/10`
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Active Prompt Editor */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle>
            {promptStages.find(s => s.key === activePrompt)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Variables Helper */}
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
            <p className="text-sm font-semibold text-cyan-400 mb-2">Available Variables:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">{`{topic}`}</Badge>
              <Badge variant="outline" className="text-xs">{`{silo}`}</Badge>
              <Badge variant="outline" className="text-xs">{`{title}`}</Badge>
              <Badge variant="outline" className="text-xs">{`{content}`}</Badge>
              <Badge variant="outline" className="text-xs">{`{keywords}`}</Badge>
              <Badge variant="outline" className="text-xs">{`{research}`}</Badge>
              <Badge variant="outline" className="text-xs">{`{plan}`}</Badge>
            </div>
          </div>

          {/* Prompt Editor */}
          <Textarea
            value={prompts[activePrompt]}
            onChange={(e) => setPrompts({ ...prompts, [activePrompt]: e.target.value })}
            className="min-h-[500px] font-mono text-sm bg-black/40 border-white/10"
            placeholder="Enter your prompt..."
          />

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => setPrompts({ ...prompts, [activePrompt]: DEFAULT_PROMPTS[activePrompt] })}
              variant="outline"
              size="sm"
            >
              Reset This Prompt
            </Button>
            <Button onClick={savePrompts} size="sm" className="bg-green-600">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


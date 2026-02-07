'use client';

import { motion, useInView } from 'framer-motion';
import { useState, useRef } from 'react';
import Header from '@/components/shared/layout/Header';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Calendar, Clock, ArrowLeft, ArrowRight, Twitter, Linkedin, Facebook, Share2, PlayCircle, FileText, DollarSign, BrainCircuit, TrendingUp, Shield, Users, Globe, Briefcase, Calculator, Mic, CheckCircle, XCircle, Lightbulb, Target, AlertTriangle, Info, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import StickySidebarCTA from '@/components/insights/StickySidebarCTA';
import AuthorBio from '@/components/insights/AuthorBio';
import Image from 'next/image';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// Enhanced Icon mapping with heading-specific icons (Emman's styling)
const IconMap: any = {
  DollarSign, BrainCircuit, TrendingUp, Shield, Users, Globe, Briefcase, Calculator, Mic, FileText, Clock, CheckCircle, XCircle,
  // BPO Companies Article Icons
  'Your Immediate Team Leader (Not the CEO)': Users,
  'The Account You\'re Assigned To': Briefcase,
  'Your Schedule Reality': Clock,
  'Actual Promotion Timeline (Not the Recruiter\'s Promise)': TrendingUp,
  'How They Treat You When Things Go Wrong': Shield,
  'The Unspoken "Pakikisama Tax"': Users,
  'Money Reality Check': DollarSign,
  // Promotion Article Icons
  '1. They Volunteer Strategically (Not for Everything)': BrainCircuit,
  '2. They Build Relationships With the Right People': Users,
  '3. They Document Everything': FileText,
  '4. They Show Leadership Before Getting the Title': Shield,
  '5. They Handle What Others Avoid': TrendingUp,
  '6. They Communicate Their Goals (the Right Way)': Mic,
  '7. They\'re Consistent (Not Just Occasionally Great)': Clock,
};

// List of special H3 headings that get icon boxes
const SPECIAL_H3_HEADINGS = [
  'Your Immediate Team Leader (Not the CEO)',
  'The Account You\'re Assigned To',
  'Your Schedule Reality',
  'Actual Promotion Timeline (Not the Recruiter\'s Promise)',
  'How They Treat You When Things Go Wrong',
  'The Unspoken "Pakikisama Tax"',
  'Money Reality Check',
  '1. They Volunteer Strategically (Not for Everything)',
  '2. They Build Relationships With the Right People',
  '3. They Document Everything',
  '4. They Show Leadership Before Getting the Title',
  '5. They Handle What Others Avoid',
  '6. They Communicate Their Goals (the Right Way)',
  '7. They\'re Consistent (Not Just Occasionally Great)',
];

interface Props {
  post: any;
  relatedPosts: any[];
  internalLinks?: any[];
}

// Helper to generate descriptive alt text for images
const generateAltText = (context: string, title: string, section?: string) => {
  if (section) {
    return `${context} for "${title}" - ${section}`;
  }
  return `${context} for "${title}"`;
};

export default function InsightArticleClient({ post, relatedPosts, internalLinks = [] }: Props) {
  const shareUrl = `https://www.bpoc.io/insights/${post.slug}`;
  const [videoError, setVideoError] = useState(false);
  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true, margin: "-100px" });

  const getIcon = (name: string) => {
    return IconMap[name] || FileText;
  };

  const Icon = getIcon(post.icon_name);

  // Video support - uses video_url from database (Supabase Storage)
  // Falls back to local path for legacy videos
  const getVideoPath = (slug: string) => {
    // If video_url exists in database, use it
    if (post.video_url) {
      return post.video_url;
    }
    // Fallback to local path for legacy videos
    return `/Pillar-assets/videos/${slug}.mp4`;
  };

  // Inject applied links from JSONB into content (YOUR FEATURE - KEPT!)
  const injectLinks = (content: string) => {
    console.log('🔗 Applied Links:', post.applied_links);

    if (!post.applied_links || !Array.isArray(post.applied_links) || post.applied_links.length === 0) {
      console.log('🔗 No links to inject');
      return content;
    }

    let processedContent = content;

    post.applied_links.forEach((link: any) => {
      const originalText = link.original_text || link.anchor_text;
      const anchorText = link.anchor_text;
      const targetSlug = link.target_slug;

      if (!originalText || !targetSlug) {
        console.log('🔗 Invalid link:', link);
        return;
      }

      // Find original_text and replace with anchor_text as a link
      const escapedOriginal = originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedOriginal})`, 'i');

      if (regex.test(processedContent)) {
        // Replace original with linked anchor text
        processedContent = processedContent.replace(regex, `[${anchorText}](/insights/${targetSlug})`);
        console.log(`🔗 ✅ Replaced "${originalText}" → "[${anchorText}](/insights/${targetSlug})"`);
      } else {
        console.log(`🔗 ❌ Original text not found: "${originalText}"`);
      }
    });

    return processedContent;
  };

  const contentWithLinks = injectLinks(post.content);

  // Custom components for Markdown rendering - MERGED STYLING
  const MarkdownComponents: any = {
    h1: ({ node, ...props }: any) => <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-12 mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" {...props} />,

    // Enhanced H2 with special handling (Emman's styling)
    h2: ({ node, ...props }: any) => {
      const headingText = node.children[0]?.value;

      // Special grid trigger for "7 Things" articles
      if (headingText === "The 7 Things That Actually Make or Break Your Experience") {
        return (
          <div className="mt-16 mb-8">
            <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3 relative" {...props}>
              <span className="absolute -left-6 top-1 w-1 h-8 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full opacity-100 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {props.children}
              </span>
            </h2>
          </div>
        );
      }

      return (
        <div className="mt-16 mb-8 group">
          <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3 relative" {...props}>
            <span className="absolute -left-6 top-1 w-1 h-8 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full opacity-100 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {props.children}
            </span>
          </h2>
        </div>
      );
    },

    // Enhanced H3 with icon boxes for special headings (Emman's styling)
    h3: ({ node, ...props }: any) => {
      const headingText = node.children[0]?.value;
      const SpecificIcon = headingText && IconMap[headingText] ? IconMap[headingText] : FileText;
      const isSpecialHeading = SPECIAL_H3_HEADINGS.includes(headingText);
      const isFlagSectionHeading = headingText?.includes("Flags:") ||
        headingText?.includes("Do this:") ||
        headingText?.includes("Don't waste energy on:") ||
        headingText?.includes("Typical BPO career path:");

      // Special icon box styling for featured headings
      if (isSpecialHeading) {
        return (
          <div className="mt-16 mb-8 flex items-center gap-5 group relative">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl shadow-cyan-500/10 group-hover:border-cyan-500/30 transition-all duration-300">
                <SpecificIcon className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="h-px w-12 bg-gradient-to-r from-cyan-500 to-transparent mb-2" />
              <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight" {...props}>
                {props.children}
              </h3>
            </div>
          </div>
        );
      }

      // Default H3 styling
      return <h3 className="text-2xl font-bold text-cyan-400 mt-10 mb-4 tracking-wide flex items-center gap-2 before:content-['#'] before:text-cyan-500/30 before:mr-2" {...props} />;
    },

    h4: ({ node, ...props }: any) => <h4 className="text-xl font-semibold text-white mt-8 mb-3 border-l-2 border-purple-500 pl-4" {...props} />,
    p: ({ node, ...props }: any) => <p className="text-gray-300 leading-relaxed mb-6 text-lg font-light tracking-wide" {...props} />,

    // Enhanced UL with card styling (Emman's styling)
    ul: ({ node, ...props }: any) => {
      const parent = node.parent;
      const previousSibling = parent?.children[parent.children.indexOf(node) - 1];
      const isFlagsList = previousSibling?.type === 'element' &&
        previousSibling.tagName === 'h3' &&
        (previousSibling.children[0]?.value?.includes("Flags:") ||
          previousSibling.children[0]?.value?.includes("Do this:") ||
          previousSibling.children[0]?.value?.includes("Don't waste energy on:") ||
          previousSibling.children[0]?.value?.includes("Typical BPO career path:"));

      // Grid layout for flag lists
      if (isFlagsList) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {props.children.map((child: any, index: number) => (
              <div key={index} className="p-4 border border-white/10 rounded-lg shadow-inner shadow-purple-500/5 backdrop-blur-sm">
                {child}
              </div>
            ))}
          </div>
        );
      }

      // Default card-style UL (Emman's enhancement)
      return <ul className="space-y-4 my-6 p-6 rounded-xl border border-white/10 bg-white/5 shadow-inner shadow-purple-500/5 backdrop-blur-sm" {...props} />;
    },

    ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside space-y-3 my-6 text-gray-300 marker:text-cyan-500 marker:font-bold pl-4" {...props} />,

    // Enhanced LI with green/red flag detection (Emman's styling)
    li: ({ node, ...props }: any) => {
      // Helper to extract text content
      const getTextContent = (children: any): string => {
        if (typeof children === 'string') return children;
        if (typeof children === 'number') return String(children);
        if (Array.isArray(children)) return children.map(getTextContent).join('');
        if (children && typeof children === 'object') {
          if (children.props?.children) return getTextContent(children.props.children);
          if (children.props?.value) return String(children.props.value);
          if (children.value) return String(children.value);
          if (children.children) return getTextContent(children.children);
        }
        return '';
      };

      // Get raw text content from node
      let rawTextContent = '';
      if (node && node.children) {
        rawTextContent = node.children.map((child: any) => {
          if (child.value) return child.value;
          if (child.children) return child.children.map((c: any) => c.value || '').join('');
          return '';
        }).join('');
      }
      if (!rawTextContent) {
        rawTextContent = getTextContent(props.children);
      }

      // Detect green/red flags (Emman's feature)
      const isGreenFlagItem = rawTextContent.includes("✅") || rawTextContent.includes("✓") || rawTextContent.includes("[CHECK]");
      const isRedFlagItem = rawTextContent.includes("❌") || rawTextContent.includes("✗") || rawTextContent.includes("×") || rawTextContent.includes("[X]");

      let IconComponent = null;
      let iconColorClass = "";
      let finalContent = props.children;

      if (isGreenFlagItem) {
        IconComponent = CheckCircle;
        iconColorClass = "text-cyan-400";
      } else if (isRedFlagItem) {
        IconComponent = XCircle;
        iconColorClass = "text-red-500";
      }

      return (
        <li className={`flex items-start gap-3 text-gray-300 group transition-colors duration-200 ${isGreenFlagItem ? 'hover:text-cyan-400' : isRedFlagItem ? 'hover:text-red-400' : 'hover:text-white'
          }`}>
          {IconComponent ? (
            <IconComponent className={`w-5 h-5 shrink-0 mt-1 ${iconColorClass}`} />
          ) : (
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
          )}
          <span className="flex-1 leading-relaxed">{finalContent}</span>
        </li>
      );
    },

    blockquote: ({ node, ...props }: any) => {
      // Extract text content to detect callout type
      const getTextContent = (children: any): string => {
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) return children.map(getTextContent).join('');
        if (children?.props?.children) return getTextContent(children.props.children);
        return '';
      };
      const textContent = getTextContent(props.children);

      // Detect callout type and configure styling
      let CalloutIcon = Mic;
      let borderColor = 'border-purple-500';
      let bgColor = 'from-purple-500/10';
      let iconColor = 'text-purple-400';
      let label = '';

      if (textContent.includes('[TIP]')) {
        CalloutIcon = Lightbulb;
        borderColor = 'border-amber-500';
        bgColor = 'from-amber-500/10';
        iconColor = 'text-amber-400';
        label = 'Pro Tip';
      } else if (textContent.includes('[KEY]')) {
        CalloutIcon = Target;
        borderColor = 'border-cyan-500';
        bgColor = 'from-cyan-500/10';
        iconColor = 'text-cyan-400';
        label = 'Key Point';
      } else if (textContent.includes('[WARNING]')) {
        CalloutIcon = AlertTriangle;
        borderColor = 'border-red-500';
        bgColor = 'from-red-500/10';
        iconColor = 'text-red-400';
        label = 'Heads Up';
      } else if (textContent.includes('[INFO]')) {
        CalloutIcon = Info;
        borderColor = 'border-blue-500';
        bgColor = 'from-blue-500/10';
        iconColor = 'text-blue-400';
        label = 'Quick Info';
      } else if (textContent.includes('[SUCCESS]')) {
        CalloutIcon = ThumbsUp;
        borderColor = 'border-green-500';
        bgColor = 'from-green-500/10';
        iconColor = 'text-green-400';
        label = 'Ate Ina Says';
      }

      // Clean the marker from content display
      const displayContent = textContent
        .replace(/\[TIP\]\s*/g, '')
        .replace(/\[KEY\]\s*/g, '')
        .replace(/\[WARNING\]\s*/g, '')
        .replace(/\[INFO\]\s*/g, '')
        .replace(/\[SUCCESS\]\s*/g, '')
        .trim();

      return (
        <div className={`flex items-start gap-4 border-l-4 ${borderColor} bg-gradient-to-r ${bgColor} to-transparent p-5 rounded-r-xl my-6`}>
          <div className={`flex-shrink-0 p-2.5 rounded-xl bg-white/5 ${iconColor}`}>
            <CalloutIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            {label && <span className={`text-xs font-bold uppercase tracking-wider ${iconColor} block mb-1.5`}>{label}</span>}
            <p className="text-gray-200 text-base leading-relaxed m-0">{displayContent || props.children}</p>
          </div>
        </div>
      );
    },
    a: ({ node, ...props }: any) => <a className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors underline decoration-cyan-500/30 hover:decoration-cyan-500 underline-offset-4 decoration-2" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />,
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-10 rounded-xl border border-white/10 bg-white/5 shadow-inner backdrop-blur-sm">
        <table className="w-full text-left text-sm" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-white/10 text-white font-bold uppercase tracking-wider border-b border-white/10" {...props} />,
    th: ({ node, ...props }: any) => <th className="p-4 text-cyan-400" {...props} />,
    td: ({ node, ...props }: any) => <td className="p-4 border-b border-white/5 text-gray-300 whitespace-nowrap group-hover:bg-white/5 transition-colors" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="group hover:bg-white/[0.02] transition-colors" {...props} />,
    hr: ({ node, ...props }: any) => <hr className="border-t border-white/10 my-12" {...props} />,
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      return !inline ? (
        <div className="relative my-8 rounded-lg overflow-hidden border border-white/10 bg-[#0F0F11] shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="p-6 overflow-x-auto font-mono text-sm text-gray-300">
            <code className="" {...props}>
              {children}
            </code>
          </div>
        </div>
      ) : (
        <code className="bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono border border-purple-500/20" {...props}>
          {children}
        </code>
      )
    }
  };

  return (
    <div className="overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-200 font-sans">
      <Header />

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${post.bg_color} rounded-full blur-[150px] opacity-20`} />
        <div className="absolute inset-0 cyber-grid opacity-[0.03]" />
      </div>

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 z-50 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'none' }}
      />

      {/* Hero Section with Background Media - Directly below navbar */}
      <section className="relative pt-20">
        {/* Hero Media Background - Fills entire section */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {post.hero_type === 'video' && (post.video_url || !videoError) ? (
            <video
              src={post.video_url || getVideoPath(post.slug)}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover object-center"
              onError={() => setVideoError(true)}
              poster={post.hero_url}
              aria-label={`Video background for article: ${post.title}`}
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
              }}
            />
          ) : post.hero_url ? (
            <img
              src={post.hero_url}
              alt={generateAltText("Hero image", post.title, post.category)}
              className="w-full h-full object-cover object-center"
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
              }}
            />
          ) : (
            <div
              className={`w-full h-full ${post.bg_color} opacity-30`}
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className={`w-48 h-48 ${post.color} opacity-20`} />
              </div>
            </div>
          )}
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
          {/* Subtle side vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(240,10%,3.9%)]/30 via-transparent to-[hsl(240,10%,3.9%)]/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-8 pb-16">
          <Link href="/insights">
            <Button variant="ghost" className="text-gray-300 hover:text-white mb-8 pl-0 hover:bg-transparent group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Intelligence
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl space-y-6"
          >
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono">
              <Badge variant="outline" className={`border-white/20 ${post.color} bg-black/30 backdrop-blur-sm px-3 py-1`}>
                {post.category}
              </Badge>
              <span className="text-gray-300 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> {format(new Date(post.created_at), 'MMM d, yyyy')}
              </span>
              <span className="text-gray-300 flex items-center gap-2">
                <Clock className="w-3 h-3" /> {post.read_time}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-2xl">
              {post.title}
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-light max-w-3xl drop-shadow-lg">
              {post.description}
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg shadow-purple-500/30">
                {post.author_slug === 'ate-yna' ? (
                  <Image
                    src="/Chat Agent/Ate Yna.png"
                    alt={`${post.author} avatar`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {post.author.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-medium">By <span className="text-cyan-400">{post.author}</span></p>
                <p className="text-gray-400 text-sm">BPO Career Expert</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <article className="pb-20 relative z-10">
        {/* Main Layout: Content + Sidebar */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:items-start">

            {/* Left Column: Article Content */}
            <div className="lg:col-span-8" ref={contentRef}>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="max-w-none"
              >
                {/* Check if we have split content parts - render with body images */}
                {(post.content_part1 || post.content_part2 || post.content_part3) ? (
                  <>
                    {/* Featured Image (after hero, before content) */}
                    {post.content_image0 && (
                      <figure className="my-8 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={post.content_image0}
                          alt={post.section1_image_alt || generateAltText("Featured illustration", post.title, "Introduction")}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                        <figcaption className="sr-only">
                          Featured image for {post.title}
                        </figcaption>
                      </figure>
                    )}

                    {/* Section 1: Introduction */}
                    {post.content_part1 && (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {injectLinks(post.content_part1)}
                      </ReactMarkdown>
                    )}

                    {/* Body Image 1 (after section 1) */}
                    {post.content_image1 && (
                      <figure className="my-12 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={post.content_image1}
                          alt={post.section2_image_alt || generateAltText("Illustration", post.title, "Main content section")}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                        <figcaption className="sr-only">
                          Supporting image for {post.title} - Section 1
                        </figcaption>
                      </figure>
                    )}

                    {/* Section 2: Main Body */}
                    {post.content_part2 && (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {injectLinks(post.content_part2)}
                      </ReactMarkdown>
                    )}

                    {/* Body Image 2 (after section 2) */}
                    {post.content_image2 && (
                      <figure className="my-12 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={post.content_image2}
                          alt={post.section3_image_alt || generateAltText("Illustration", post.title, "Conclusion section")}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                        <figcaption className="sr-only">
                          Supporting image for {post.title} - Section 2
                        </figcaption>
                      </figure>
                    )}

                    {/* Section 3: Conclusion */}
                    {post.content_part3 && (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {injectLinks(post.content_part3)}
                      </ReactMarkdown>
                    )}
                  </>
                ) : (
                  /* Fallback: Render combined content (legacy articles) */
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {contentWithLinks}
                  </ReactMarkdown>
                )}
              </motion.div>

              {/* Share Section */}
              <div className="mt-16 pt-8 border-t border-white/10">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share this insight
                </h4>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}>
                    <Twitter className="w-4 h-4 mr-2" /> Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-all" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}>
                    <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/50 transition-all" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}>
                    <Facebook className="w-4 h-4 mr-2" /> Facebook
                  </Button>
                </div>
              </div>

              <AuthorBio authorName={post.author} authorSlug={post.author_slug} />

            </div>

            {/* Right Column: Sidebar with sticky behavior */}
            <div className="lg:col-span-4">
              {/* Sticky wrapper - sticks to top when scrolling */}
              <div className="sticky top-20 space-y-6 z-30 self-start">
                {/* CTA Cards */}
                <StickySidebarCTA />

                {/* Related Articles */}
                {/* Related Article Mini-List (Internal Links) */}
                {internalLinks.length > 0 && (
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Deep Dive</h4>
                    <ul className="space-y-4">
                      {internalLinks.map((link: any, i: number) => (
                        <li key={i}>
                          <Link href={`/insights/${link.target_post?.slug}`} className="group block">
                            <h5 className="text-gray-300 group-hover:text-cyan-400 transition-colors text-sm font-medium leading-snug mb-1">
                              {link.target_post?.title}
                            </h5>
                            <span className="text-xs text-purple-400 flex items-center mt-1">
                              <ArrowRight className="w-3 h-3 mr-1" /> {link.anchor_text || 'Read more'}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Article Mini-List (Category Fallback) */}
                {relatedPosts.length > 0 && internalLinks.length === 0 && (
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">More on this topic</h4>
                    <ul className="space-y-4">
                      {relatedPosts.map((item) => (
                        <li key={item.slug}>
                          <Link href={`/insights/${item.slug}`} className="group block">
                            <h5 className="text-gray-300 group-hover:text-cyan-400 transition-colors text-sm font-medium leading-snug mb-1">
                              {item.title}
                            </h5>
                            <span className="text-xs text-gray-600 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" /> {item.read_time}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </article>
    </div>
  );
}

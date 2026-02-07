'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Calendar, Clock, ArrowLeft, Twitter, Linkedin, Facebook, Share2, PlayCircle, FileText, DollarSign, BrainCircuit, TrendingUp, Shield, Users, Globe, Briefcase, Calculator, Mic, CheckCircle, XCircle, Sparkles, ArrowRight, UserPlus, Rocket, CheckCircle2, Eye, EyeOff, Lightbulb, Target, AlertTriangle, Info, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import PreviewSidebar from './PreviewSidebar';

// Icon mapping (same as article page)
const IconMap: any = {
  DollarSign, BrainCircuit, TrendingUp, Shield, Users, Globe, Briefcase, Calculator, Mic, FileText, Clock, CheckCircle, XCircle,
  'Your Immediate Team Leader (Not the CEO)': Users,
  'The Account You\'re Assigned To': Briefcase,
  'Your Schedule Reality': Clock,
  'Actual Promotion Timeline (Not the Recruiter\'s Promise)': TrendingUp,
  'How They Treat You When Things Go Wrong': Shield,
  'The Unspoken "Pakikisama Tax"': Users,
  'Money Reality Check': DollarSign,
  '1. They Volunteer Strategically (Not for Everything)': BrainCircuit,
  '2. They Build Relationships With the Right People': Users,
  '3. They Document Everything': FileText,
  '4. They Show Leadership Before Getting the Title': Shield,
  '5. They Handle What Others Avoid': TrendingUp,
  '6. They Communicate Their Goals (the Right Way)': Mic,
  '7. They\'re Consistent (Not Just Occasionally Great)': Clock,
};

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

interface ArticlePreviewProps {
  data: {
    title: string;
    slug: string;
    description: string;
    content: string;
    category: string;
    author: string;
    author_slug: string;
    read_time: string;
    icon_name: string;
    color: string;
    bg_color: string;
    hero_type: 'image' | 'video';
    hero_url: string;
    video_url: string;
    is_published: boolean;
  };
  onClose?: () => void;
  isFullscreen?: boolean;
}

export default function ArticlePreview({ data, onClose, isFullscreen = false }: ArticlePreviewProps) {
  const shareUrl = `https://www.bpoc.io/insights/${data.slug}`;
  const getIcon = (name: string) => IconMap[name] || FileText;
  const Icon = getIcon(data.icon_name);

  // Simulated date for preview
  const previewDate = new Date();

  // Custom components for Markdown rendering - Same as live article
  const MarkdownComponents: any = {
    h1: ({node, ...props}: any) => <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-12 mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" {...props} />,
    
    h2: ({node, ...props}: any) => {
      const headingText = node.children[0]?.value;
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

    h3: ({node, ...props}: any) => {
      const headingText = node.children[0]?.value;
      const SpecificIcon = headingText && IconMap[headingText] ? IconMap[headingText] : FileText;
      const isSpecialHeading = SPECIAL_H3_HEADINGS.includes(headingText);

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

      return <h3 className="text-2xl font-bold text-cyan-400 mt-10 mb-4 tracking-wide flex items-center gap-2 before:content-['#'] before:text-cyan-500/30 before:mr-2" {...props} />;
    },

    h4: ({node, ...props}: any) => <h4 className="text-xl font-semibold text-white mt-8 mb-3 border-l-2 border-purple-500 pl-4" {...props} />,
    p: ({node, ...props}: any) => <p className="text-gray-300 leading-relaxed mb-6 text-lg font-light tracking-wide" {...props} />,
    
    ul: ({node, ...props}: any) => {
      return <ul className="space-y-4 my-6 p-6 rounded-xl border border-white/10 bg-white/5 shadow-inner shadow-purple-500/5 backdrop-blur-sm" {...props} />;
    },

    ol: ({node, ...props}: any) => <ol className="list-decimal list-inside space-y-3 my-6 text-gray-300 marker:text-cyan-500 marker:font-bold pl-4" {...props} />,
    
    li: ({node, ...props}: any) => {
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

      const isGreenFlagItem = rawTextContent.includes("✅") || rawTextContent.includes("✓") || rawTextContent.includes("[CHECK]");
      const isRedFlagItem = rawTextContent.includes("❌") || rawTextContent.includes("✗") || rawTextContent.includes("×") || rawTextContent.includes("[X]");

      let IconComponent = null;
      let iconColorClass = "";

      if (isGreenFlagItem) {
        IconComponent = CheckCircle;
        iconColorClass = "text-cyan-400";
      } else if (isRedFlagItem) {
        IconComponent = XCircle;
        iconColorClass = "text-red-500";
      }

      return (
        <li className={`flex items-start gap-3 text-gray-300 group transition-colors duration-200 ${
          isGreenFlagItem ? 'hover:text-cyan-400' : isRedFlagItem ? 'hover:text-red-400' : 'hover:text-white'
        }`}>
          {IconComponent ? (
            <IconComponent className={`w-5 h-5 shrink-0 mt-1 ${iconColorClass}`} />
          ) : (
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
          )}
          <span className="flex-1 leading-relaxed">{props.children}</span>
        </li>
      );
    },

    blockquote: ({node, ...props}: any) => {
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
      let cleanContent = props.children;
      
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
        <div className={`flex items-start gap-4 border-l-4 ${borderColor} bg-gradient-to-r ${bgColor} to-transparent p-4 rounded-r-lg my-4`}>
          <div className={`flex-shrink-0 p-2 rounded-lg bg-white/5 ${iconColor}`}>
            <CalloutIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            {label && <span className={`text-xs font-bold uppercase tracking-wider ${iconColor} block mb-1`}>{label}</span>}
            <p className="text-gray-200 text-sm leading-relaxed m-0">{displayContent || props.children}</p>
          </div>
        </div>
      );
    },
    a: ({node, ...props}: any) => <a className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors underline decoration-cyan-500/30 hover:decoration-cyan-500 underline-offset-4 decoration-2" {...props} />,
    strong: ({node, ...props}: any) => <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />,
    table: ({node, ...props}: any) => (
      <div className="overflow-x-auto my-10 rounded-xl border border-white/10 bg-white/5 shadow-inner backdrop-blur-sm">
        <table className="w-full text-left text-sm" {...props} />
      </div>
    ),
    thead: ({node, ...props}: any) => <thead className="bg-white/10 text-white font-bold uppercase tracking-wider border-b border-white/10" {...props} />,
    th: ({node, ...props}: any) => <th className="p-4 text-cyan-400" {...props} />,
    td: ({node, ...props}: any) => <td className="p-4 border-b border-white/5 text-gray-300 whitespace-nowrap group-hover:bg-white/5 transition-colors" {...props} />,
    tr: ({node, ...props}: any) => <tr className="group hover:bg-white/[0.02] transition-colors" {...props} />,
    hr: ({node, ...props}: any) => <hr className="border-t border-white/10 my-12" {...props} />,
    code: ({node, inline, className, children, ...props}: any) => {
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

  // Calculate author image
  const authorImageUrl = data.author_slug === 'ate-yna' ? '/Chat Agent/Ate Yna.png' : undefined;

  return (
    <div className={`bg-[#0B0B0D] selection:bg-cyan-500/20 selection:text-cyan-200 font-sans ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : 'relative'}`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${data.bg_color} rounded-full blur-[150px] opacity-20`} />
        <div className="absolute inset-0 cyber-grid opacity-[0.03]" />
      </div>

      {/* Preview Header Bar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Live Preview</span>
            </div>
            <Badge variant="outline" className={`${data.is_published ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}`}>
              {data.is_published ? '● PUBLISHED' : '○ DRAFT'}
            </Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <EyeOff className="w-4 h-4 mr-2" /> Close Preview
            </Button>
          )}
        </div>
      </div>
      
      {/* Hero Section with Background Media */}
      <section className="relative pt-4">
        {/* Hero Media Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {data.hero_type === 'video' && data.video_url ? (
            <video
              src={data.video_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover object-center"
              poster={data.hero_url}
            />
          ) : data.hero_url ? (
            <img 
              src={data.hero_url} 
              alt={data.title} 
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className={`w-full h-full ${data.bg_color} opacity-30`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className={`w-48 h-48 ${data.color} opacity-20`} />
              </div>
            </div>
          )}
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/70 to-[#0B0B0D]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D]/50 via-transparent to-[#0B0B0D]/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-8 pb-16">
          <Button variant="ghost" className="text-gray-300 hover:text-white mb-8 pl-0 hover:bg-transparent group pointer-events-none">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Intelligence
          </Button>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl space-y-6"
          >
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono">
              <Badge variant="outline" className={`border-white/20 ${data.color} bg-black/30 backdrop-blur-sm px-3 py-1`}>
                {data.category || 'Category'}
              </Badge>
              <span className="text-gray-300 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> {format(previewDate, 'MMM d, yyyy')}
              </span>
              <span className="text-gray-300 flex items-center gap-2">
                <Clock className="w-3 h-3" /> {data.read_time || '5 min read'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-2xl">
              {data.title || 'Your Article Title'}
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-light max-w-3xl drop-shadow-lg">
              {data.description || 'Your article description will appear here...'}
            </p>
            
            {/* Author */}
            <div className="flex items-center gap-3 pt-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/30 shadow-lg shadow-purple-500/30 overflow-hidden">
                {authorImageUrl ? (
                  <img src={authorImageUrl} alt={data.author} className="w-full h-full object-cover" />
                ) : (
                  data.author?.charAt(0) || 'A'
                )}
              </div>
              <div>
                <p className="text-white font-medium">By <span className="text-cyan-400">{data.author || 'Author Name'}</span></p>
                <p className="text-gray-400 text-sm">BPO Career Expert</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <article className="pb-20 relative z-10">
        {/* Main Layout: Content + Sidebar */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Article Content */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-none"
              >
                {data.content ? (
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {data.content}
                  </ReactMarkdown>
                ) : (
                  <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Your article content will be rendered here...</p>
                    <p className="text-sm mt-2 opacity-60">Start writing in the Content Editor tab</p>
                  </div>
                )}
              </motion.div>

              {/* Share Section */}
              <div className="mt-16 pt-8 border-t border-white/10">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share this insight
                </h4>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all pointer-events-none">
                    <Twitter className="w-4 h-4 mr-2" /> Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-all pointer-events-none">
                    <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/50 transition-all pointer-events-none">
                    <Facebook className="w-4 h-4 mr-2" /> Facebook
                  </Button>
                </div>
              </div>

              {/* Author Bio */}
              <div className="flex items-start gap-4 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm mt-12 mb-12">
                <Avatar className="w-16 h-16 border-2 border-electric-purple">
                  <AvatarImage src={authorImageUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl">
                    {data.author?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">
                      {data.author || 'Author Name'}
                    </h3>
                    <Button variant="link" className="text-cyan-400 text-xs h-auto p-0 pointer-events-none">
                      View Profile
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {data.author_slug === 'ate-yna' 
                      ? "Your supportive career 'ate' from the BPO industry. Sharing real talk, tips, and the occasional hug (virtually)." 
                      : "BPO Industry Expert & Contributor."}
                  </p>
                </div>
              </div>
              
            </div>

            {/* Right Column: Sticky Sidebar */}
            <div className="lg:col-span-4">
              <PreviewSidebar />
            </div>

          </div>
        </div>
      </article>
    </div>
  );
}



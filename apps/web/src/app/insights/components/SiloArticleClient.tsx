'use client';

import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import Header from '@/components/shared/layout/Header';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import {
  Calendar, Clock, ArrowLeft, ArrowRight, Twitter, Linkedin, Facebook, Share2,
  PlayCircle, FileText, CheckCircle, XCircle, Lightbulb, Target, AlertTriangle,
  Info, ThumbsUp, Mic, ChevronRight, Eye, Bookmark, Volume2, VolumeX
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface SiloArticleClientProps {
  post: any;
  relatedPosts: any[];
  siloSlug: string;
  siloName: string;
  siloColor?: string;
}

export default function SiloArticleClient({ post, relatedPosts, siloSlug, siloName, siloColor = '#06B6D4' }: SiloArticleClientProps) {
  const shareUrl = `https://www.bpoc.io/insights/${siloSlug}/${post.slug}`;
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: "-100px" });

  // Parallax effect for hero
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  // Inject applied links from JSONB into content
  const injectLinks = (content: string) => {
    if (!post.applied_links || !Array.isArray(post.applied_links) || post.applied_links.length === 0) {
      return content;
    }

    let processedContent = content;
    post.applied_links.forEach((link: any) => {
      const originalText = link.original_text || link.anchor_text;
      const anchorText = link.anchor_text;
      const targetSlug = link.target_slug;

      if (!originalText || !targetSlug) return;

      const escapedOriginal = originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedOriginal})`, 'i');

      if (regex.test(processedContent)) {
        // Link to silo path if same silo, otherwise to general path
        processedContent = processedContent.replace(regex, `[${anchorText}](/insights/${siloSlug}/${targetSlug})`);
      }
    });

    return processedContent;
  };

  // Enhanced Markdown components with silo theming
  const MarkdownComponents: any = {
    h1: ({ node, ...props }: any) => (
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-12 mb-6 tracking-tight" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <div className="mt-16 mb-8 group">
        <h2 className="text-3xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3 relative" {...props}>
          <span
            className="absolute -left-6 top-1 w-1 h-8 rounded-full opacity-100 shadow-lg"
            style={{ backgroundColor: siloColor }}
          />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {props.children}
          </span>
        </h2>
      </div>
    ),
    h3: ({ node, ...props }: any) => (
      <h3
        className="text-2xl font-bold mt-10 mb-4 tracking-wide flex items-center gap-2"
        style={{ color: siloColor }}
        {...props}
      />
    ),
    h4: ({ node, ...props }: any) => (
      <h4
        className="text-xl font-semibold text-white mt-8 mb-3 border-l-2 pl-4"
        style={{ borderColor: siloColor }}
        {...props}
      />
    ),
    p: ({ node, ...props }: any) => (
      <p className="text-gray-300 leading-relaxed mb-6 text-lg font-light tracking-wide" {...props} />
    ),
    ul: ({ node, ...props }: any) => (
      <ul
        className="space-y-4 my-6 p-6 rounded-xl border bg-white/5 shadow-inner backdrop-blur-sm"
        style={{ borderColor: `${siloColor}30` }}
        {...props}
      />
    ),
    ol: ({ node, ...props }: any) => (
      <ol className="list-decimal list-inside space-y-3 my-6 text-gray-300 pl-4" {...props} />
    ),
    li: ({ node, ...props }: any) => {
      const getTextContent = (children: any): string => {
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) return children.map(getTextContent).join('');
        if (children?.props?.children) return getTextContent(children.props.children);
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
      if (!rawTextContent) rawTextContent = getTextContent(props.children);

      const isGreenFlagItem = rawTextContent.includes("✅") || rawTextContent.includes("✓");
      const isRedFlagItem = rawTextContent.includes("❌") || rawTextContent.includes("✗");

      let IconComponent = null;
      let iconColorClass = "";

      if (isGreenFlagItem) {
        IconComponent = CheckCircle;
        iconColorClass = "text-emerald-400";
      } else if (isRedFlagItem) {
        IconComponent = XCircle;
        iconColorClass = "text-red-500";
      }

      return (
        <li className="flex items-start gap-3 text-gray-300 group transition-colors duration-200 hover:text-white">
          {IconComponent ? (
            <IconComponent className={`w-5 h-5 shrink-0 mt-1 ${iconColorClass}`} />
          ) : (
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 shadow-lg"
              style={{ backgroundColor: siloColor }}
            />
          )}
          <span className="flex-1 leading-relaxed">{props.children}</span>
        </li>
      );
    },
    blockquote: ({ node, ...props }: any) => {
      const getTextContent = (children: any): string => {
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) return children.map(getTextContent).join('');
        if (children?.props?.children) return getTextContent(children.props.children);
        return '';
      };
      const textContent = getTextContent(props.children);

      let CalloutIcon = Mic;
      let borderColor = siloColor;
      let label = '';

      if (textContent.includes('[TIP]')) {
        CalloutIcon = Lightbulb;
        borderColor = '#F59E0B';
        label = 'Pro Tip';
      } else if (textContent.includes('[KEY]')) {
        CalloutIcon = Target;
        borderColor = '#06B6D4';
        label = 'Key Point';
      } else if (textContent.includes('[WARNING]')) {
        CalloutIcon = AlertTriangle;
        borderColor = '#EF4444';
        label = 'Heads Up';
      } else if (textContent.includes('[INFO]')) {
        CalloutIcon = Info;
        borderColor = '#3B82F6';
        label = 'Quick Info';
      } else if (textContent.includes('[SUCCESS]')) {
        CalloutIcon = ThumbsUp;
        borderColor = '#10B981';
        label = 'Ate Ina Says';
      }

      const displayContent = textContent
        .replace(/\[TIP\]\s*/g, '')
        .replace(/\[KEY\]\s*/g, '')
        .replace(/\[WARNING\]\s*/g, '')
        .replace(/\[INFO\]\s*/g, '')
        .replace(/\[SUCCESS\]\s*/g, '')
        .trim();

      return (
        <div
          className="flex items-start gap-4 border-l-4 p-5 rounded-r-xl my-6"
          style={{ borderColor, backgroundColor: `${borderColor}10` }}
        >
          <div className="flex-shrink-0 p-2.5 rounded-xl bg-white/5" style={{ color: borderColor }}>
            <CalloutIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            {label && <span className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: borderColor }}>{label}</span>}
            <p className="text-gray-200 text-base leading-relaxed m-0">{displayContent || props.children}</p>
          </div>
        </div>
      );
    },
    a: ({ node, ...props }: any) => (
      <a
        className="font-medium transition-colors underline underline-offset-4 decoration-2"
        style={{ color: siloColor, textDecorationColor: `${siloColor}50` }}
        {...props}
      />
    ),
    strong: ({ node, ...props }: any) => (
      <strong className="text-white font-bold bg-white/5 px-1 rounded mx-0.5 border border-white/10" {...props} />
    ),
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-10 rounded-xl border border-white/10 bg-white/5 shadow-inner backdrop-blur-sm">
        <table className="w-full text-left text-sm" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead className="bg-white/10 text-white font-bold uppercase tracking-wider border-b border-white/10" {...props} />
    ),
    th: ({ node, ...props }: any) => <th className="p-4" style={{ color: siloColor }} {...props} />,
    td: ({ node, ...props }: any) => (
      <td className="p-4 border-b border-white/5 text-gray-300 whitespace-nowrap hover:bg-white/5 transition-colors" {...props} />
    ),
    hr: ({ node, ...props }: any) => <hr className="border-t border-white/10 my-12" {...props} />,
    code: ({ node, inline, className, children, ...props }: any) => {
      return !inline ? (
        <div className="relative my-8 rounded-lg overflow-hidden border border-white/10 bg-[#0F0F11] shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="p-6 overflow-x-auto font-mono text-sm text-gray-300">
            <code {...props}>{children}</code>
          </div>
        </div>
      ) : (
        <code
          className="px-1.5 py-0.5 rounded text-sm font-mono border"
          style={{ backgroundColor: `${siloColor}15`, color: siloColor, borderColor: `${siloColor}30` }}
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className="overflow-x-hidden selection:text-white font-sans min-h-screen bg-[#0B0B0D]" style={{ ['--silo-color' as any]: siloColor }}>
      <Header />

      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[180px] opacity-15"
          style={{ backgroundColor: siloColor }}
        />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section with Video/Image */}
      <section ref={heroRef} className="relative min-h-[70vh] flex items-end overflow-hidden">
        {/* Parallax Background Media */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {post.hero_type === 'video' && post.video_url && !videoError ? (
            <>
              <video
                src={post.video_url}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className="w-full h-full object-cover scale-110"
                onError={() => setVideoError(true)}
                poster={post.hero_url}
              />
              {/* Mute toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 right-4 z-20 p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </>
          ) : post.hero_url ? (
            <img
              src={post.hero_url}
              alt={post.title}
              className="w-full h-full object-cover scale-110"
            />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: `${siloColor}20` }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-32 h-32 opacity-10" style={{ color: siloColor }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D]/40 via-transparent to-[#0B0B0D]/40" />

        {/* Hero Content */}
        <div className="relative z-10 w-full pb-12 pt-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Badge
                  className="border backdrop-blur-sm px-3 py-1"
                  style={{ backgroundColor: `${siloColor}20`, borderColor: `${siloColor}40`, color: siloColor }}
                >
                  {post.category || siloName}
                </Badge>
                <span className="text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {format(new Date(post.published_at || post.created_at), 'MMMM d, yyyy')}
                </span>
                <span className="text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {post.read_time || '5 min read'}
                </span>
                {post.view_count > 0 && (
                  <span className="text-gray-300 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> {post.view_count} views
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight max-w-4xl">
                {post.title}
              </h1>

              {/* Description */}
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-light max-w-3xl">
                {post.description}
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4">
                <div
                  className="w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg"
                  style={{ borderColor: `${siloColor}50` }}
                >
                  {post.author_slug === 'ate-yna' ? (
                    <Image
                      src="/Chat Agent/Ate Yna.png"
                      alt={post.author}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: siloColor }}
                    >
                      {post.author?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium text-lg">
                    By <span style={{ color: siloColor }}>{post.author || 'Ate Yna'}</span>
                  </p>
                  <p className="text-gray-400 text-sm">BPO Career Expert</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <article className="relative z-10 pb-20 bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-12">

            {/* Article Content */}
            <div className="lg:col-span-8" ref={contentRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="max-w-none"
              >
                {/* Section Images and Content */}
                {(post.content_part1 || post.content_part2 || post.content_part3) ? (
                  <>
                    {/* Featured Image */}
                    {post.content_image0 && (
                      <figure className="my-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={post.content_image0}
                          alt={`${post.title} - Introduction`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      </figure>
                    )}

                    {/* Section 1 */}
                    {post.content_part1 && (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {injectLinks(post.content_part1)}
                      </ReactMarkdown>
                    )}

                    {/* Section Image 1 */}
                    {post.content_image1 && (
                      <figure className="my-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={post.content_image1}
                          alt={`${post.title} - Main content`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      </figure>
                    )}

                    {/* Section 2 */}
                    {post.content_part2 && (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {injectLinks(post.content_part2)}
                      </ReactMarkdown>
                    )}

                    {/* Section Image 2 */}
                    {post.content_image2 && (
                      <figure className="my-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={post.content_image2}
                          alt={`${post.title} - Conclusion`}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      </figure>
                    )}

                    {/* Section 3 */}
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
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {injectLinks(post.content || '')}
                  </ReactMarkdown>
                )}
              </motion.div>

              {/* Share Section */}
              <div className="mt-16 pt-8 border-t border-white/10">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share this article
                </h4>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}
                  >
                    <Twitter className="w-4 h-4 mr-2" /> Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/50"
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}
                  >
                    <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/50"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                  >
                    <Facebook className="w-4 h-4 mr-2" /> Facebook
                  </Button>
                </div>
              </div>

              {/* Author Bio */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-12 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0"
                    style={{ borderColor: `${siloColor}50` }}
                  >
                    {post.author_slug === 'ate-yna' ? (
                      <Image
                        src="/Chat Agent/Ate Yna.png"
                        alt={post.author}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold text-2xl"
                        style={{ backgroundColor: siloColor }}
                      >
                        {post.author?.charAt(0) || 'A'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{post.author || 'Ate Yna'}</h4>
                    <p className="text-sm mb-2" style={{ color: siloColor }}>BPO Career Expert</p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Helping BPO professionals navigate their careers with practical advice, salary insights, and industry knowledge.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {/* Back to Silo */}
                <Link href={`/insights/${siloSlug}`}>
                  <div
                    className="p-4 rounded-xl border transition-all hover:scale-[1.02]"
                    style={{ borderColor: `${siloColor}30`, backgroundColor: `${siloColor}10` }}
                  >
                    <div className="flex items-center gap-3">
                      <ArrowLeft className="w-5 h-5" style={{ color: siloColor }} />
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Back to</p>
                        <p className="font-semibold" style={{ color: siloColor }}>{siloName}</p>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Related Articles */}
                {relatedPosts.length > 0 && (
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                      <Bookmark className="w-4 h-4" style={{ color: siloColor }} />
                      More in {siloName}
                    </h4>
                    <ul className="space-y-4">
                      {relatedPosts.map((item) => (
                        <li key={item.id}>
                          <Link href={`/insights/${siloSlug}/${item.slug}`} className="group block">
                            {item.hero_url && (
                              <div className="w-full h-24 rounded-lg overflow-hidden mb-2 border border-white/10">
                                <img
                                  src={item.hero_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <h5 className="text-gray-300 group-hover:text-white transition-colors text-sm font-medium leading-snug mb-1 line-clamp-2">
                              {item.title}
                            </h5>
                            <span className="text-xs flex items-center mt-1" style={{ color: siloColor }}>
                              <ArrowRight className="w-3 h-3 mr-1" /> Read article
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* View All Link */}
                    <Link
                      href={`/insights/${siloSlug}`}
                      className="mt-4 block text-center text-sm font-medium py-2 rounded-lg border transition-colors"
                      style={{ borderColor: `${siloColor}30`, color: siloColor }}
                    >
                      View all {siloName} articles
                    </Link>
                  </div>
                )}

                {/* CTA */}
                <div
                  className="p-6 rounded-2xl border"
                  style={{ borderColor: `${siloColor}30`, background: `linear-gradient(135deg, ${siloColor}10, transparent)` }}
                >
                  <h4 className="text-white font-bold mb-2">Stay Updated</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Get the latest {siloName.toLowerCase()} insights delivered to your inbox.
                  </p>
                  <Button
                    className="w-full text-white"
                    style={{ backgroundColor: siloColor }}
                  >
                    Subscribe Free
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </article>
    </div>
  );
}

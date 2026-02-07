'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Client-side only particles component to avoid hydration mismatch
function ClientParticles() {
  const [particles, setParticles] = useState<Array<{
    left: number;
    top: number;
    animationDelay: number;
    animationDuration: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    // Generate particles only on client side
    const newParticles = [...Array(50)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.7
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.animationDuration}s`,
            opacity: particle.opacity
          }}
        ></div>
      ))}
    </div>
  );
}
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PacmanLoader } from 'react-spinners';
import { 
  Download, 
  Share2, 
  Eye, 
  Calendar,
  User,
  Building,
  GraduationCap,
  Award,
  Code,
  Star,
  Globe,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Gamepad2,
  Briefcase,
  FileText,
  Trophy,
  Crown,
  Medal,
  Zap,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  Calculator,
  Brain,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
  Unlock,
  Settings,
  RefreshCw,
  Save,
  Upload,
  X,
  Plus,
  Minus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Heart,
  Bookmark,
  Flag,
  Shield,
  Clock,
  Check,
  AlertTriangle,
  Info,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Timer,
  StopCircle,
  PlayCircle,
  PauseCircle,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Maximize,
  Minimize,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Scissors,
  Pen,
  Pencil,
  Eraser,
  Paintbrush,
  Palette,
  Image,
  Video,
  Music,
  File,
  Folder,
  Archive,
  Inbox,
  Trash,
  Recycle,
  Undo,
  Redo,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  ClipboardCopy,
  ClipboardPaste,
  ClipboardX,
  ClipboardMinus,
  ClipboardPlus,
  ClipboardEdit,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';
import Header from '@/components/shared/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Progress } from '@/components/shared/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shared/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Separator } from '@/components/shared/ui/separator';
import { ScrollArea } from '@/components/shared/ui/scroll-area';
// import { Alert, AlertDescription } from '@/components/shared/ui/alert';
import { toast } from '@/components/shared/ui/toast';
import { formatNumber, generateInitials } from '@/lib/utils';

interface SavedResume {
  id: string;
  slug: string;
  title: string;
  data: any;
  template: string;
  originalResumeId: string | null;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    fullName: string;
    avatarUrl: string;
    email: string;
    phone: string;
    location: string;
    position: string;
  };
}

export default function ResumeSlugPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;
  
  const [resume, setResume] = useState<SavedResume | null>(null);
  
  // Helper function to get template colors (supports both old and new data structures)
  const getTemplateColor = (type: 'primary' | 'secondary') => {
    if (!resume?.data) return type === 'primary' ? '#6366f1' : '#6b7280';
    return resume.data.template?.[`${type}Color`] || 
           resume.data.selectedTemplate?.[`${type}Color`] || 
           resume.data[`${type}Color`] || 
           (type === 'primary' ? '#6366f1' : '#6b7280');
  };

  // Helper to get resume content, handling both old (content.summary) and new (summary) structures
  const getResumeContent = (key: string, defaultValue: any = null) => {
    if (!resume?.data) return defaultValue;
    // Prioritize direct property, then content property
    return resume.data[key] || resume.data.content?.[key] || defaultValue;
  };

  // Get template ID from resume
  const getTemplateId = () => {
    if (!resume) return 'modern';
    return resume.template || resume.data?.selectedTemplate || resume.data?.template?.id || 'modern';
  };

  // Get colors for template rendering
  const primaryColor = getTemplateColor('primary');
  const secondaryColor = getTemplateColor('secondary');
  const templateId = getTemplateId();

  // Generate dynamic styles based on template
  const generateDynamicStyles = (primary: string, secondary: string, layout: string) => {
    const isLightHeader = layout === 'minimal';
    return {
      headerBg: isLightHeader ? '#f5f5f5' : `linear-gradient(135deg, ${primary}, ${secondary})`,
    };
  };
  const currentStyle = generateDynamicStyles(primaryColor, secondaryColor, templateId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('resume');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareModalData, setShareModalData] = useState<{ platform: string; text: string; url: string }>({ platform: '', text: '', url: '' });
  const shareRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);


  const [isGameResultsDropdownOpen, setIsGameResultsDropdownOpen] = useState<boolean>(false);


  // Calculate dropdown position and close when clicking outside
  useEffect(() => {
    const updatePosition = () => {
      if (isShareOpen && shareRef.current) {
        const rect = shareRef.current.getBoundingClientRect();
        // For fixed positioning, use viewport coordinates directly (no scroll offsets)
        setDropdownPosition({
          top: rect.bottom + 8, // 8px = mt-2
          right: window.innerWidth - rect.right
        });
      } else {
        setDropdownPosition(null);
      }
    };

    if (isShareOpen) {
      // Use setTimeout to ensure the DOM is updated before calculating position
      setTimeout(updatePosition, 0);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    } else {
      setDropdownPosition(null);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isShareOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
      const target = event.target as Element;
        if (!target.closest('[data-share-dropdown]')) {
        setIsShareOpen(false);
        }
      }
    };

    if (isShareOpen) {
    document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareOpen]);

  // Fetch resume data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/get-saved-resume/${slug}`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load resume');
        }
        
        const data = await response.json();
        if (data.success && data.resume) {
          console.log('=== API RESPONSE DEBUG ===');
          console.log('Full API response:', data);
          console.log('Resume object:', data.resume);
          console.log('Resume data:', data.resume.data);
          console.log('Resume template from data.template:', data.resume.template);
          console.log('Resume template from data.data.template:', data.resume.data.template);
          console.log('Template colors:', {
            primary: data.resume.data.template?.primaryColor,
            secondary: data.resume.data.template?.secondaryColor,
            font: data.resume.data.template?.fontFamily
          });
          console.log('User info from API:', data.resume.user);
          console.log('========================');
          setResume(data.resume);
          setIsOwner(user?.id === data.resume.userId);
          
        } else {
          throw new Error('Resume not found');
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
        setError(error instanceof Error ? error.message : 'Failed to load resume');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchResume();
    }
  }, [slug, user?.id]);

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${resume?.user.fullName} - Resume`,
          text: `Check out ${resume?.user.fullName}'s resume`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  // Copy URL function
  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Resume URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying URL:', error);
      alert('Failed to copy URL. Please try again.');
    }
  };

  // Share resume function
  const shareResume = async (platform?: string) => {
    const currentUrl = new URL(window.location.href);
    const baseUrl = currentUrl.origin;
    const currentPath = currentUrl.pathname;
    const resumeUrl = `${baseUrl}${currentPath}`;
    const userName = resume?.user.fullName || 'Professional';
    const resumeTitle = resume?.title || 'Resume';

    switch (platform) {
      case 'facebook':
        const facebookShareText = `🎉 I just made my professional resume for FREE on BPOC.IO!\n\n📄 Check it out: ${resumeUrl}\n\n✨ Build YOUR resume FREE at bpoc.io:\n• 🤖 AI-powered resume builder (100% FREE)\n• 🎯 Skills assessments & ATS optimization\n• 💼 Direct connections to top BPO employers\n\nStop paying for resume builders! Join thousands building their careers FREE! 🚀`;
        
        try {
          await navigator.clipboard.writeText(facebookShareText);
          setShareModalData({ platform: 'Facebook', text: facebookShareText, url: resumeUrl });
          setShowShareModal(true);
          setTimeout(() => {
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resumeUrl)}`;
            window.open(facebookUrl, '_blank', 'width=600,height=400');
          }, 1500);
        } catch (err) {
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resumeUrl)}`;
          window.open(facebookUrl, '_blank', 'width=600,height=400');
        }
        setIsShareOpen(false);
        break;

      case 'linkedin':
        const linkedinShareText = `🎉 Just created my professional resume for FREE using BPOC.IO's AI-powered resume builder!\n\n📄 View my resume: ${resumeUrl}\n\n💡 If you're job hunting, check out BPOC.IO:\n✅ 100% FREE AI resume builder\n✅ Skills assessments & ATS optimization\n✅ Direct connections to employers\n\nNo more paying for resume builders! Build yours FREE today.\n\n#FreeResume #CareerGrowth #JobSearch #BPO #AI`;
        
        try {
          await navigator.clipboard.writeText(linkedinShareText);
          setShareModalData({ platform: 'LinkedIn', text: linkedinShareText, url: resumeUrl });
          setShowShareModal(true);
          setTimeout(() => {
            const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(resumeUrl)}`;
            window.open(linkedinUrl, '_blank', 'width=600,height=400');
          }, 1500);
        } catch (err) {
          const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(resumeUrl)}`;
          window.open(linkedinUrl, '_blank', 'width=600,height=400');
        }
        setIsShareOpen(false);
        break;

      case 'copy':
        await copyUrl(resumeUrl);
        setIsShareOpen(false);
        break;

      default:
        // Default native sharing
        const text = `Check out ${userName}'s resume: ${resumeTitle}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: resumeTitle,
              text: text,
              url: resumeUrl
            });
          } catch (error) {
            console.error('Error sharing:', error);
          }
        } else {
          // Fallback to copying to clipboard
          await copyUrl(resumeUrl);
        }
    setIsShareOpen(false);
    }
  };

  // Edit resume function
  const editResume = async () => {
    console.log('Edit Resume clicked!', { resume: resume?.data });

    try {
      // Use existing generated resume data from database instead of regenerating
      if (resume?.data?.content) {
        // Set a flag to indicate we're editing an existing resume
        localStorage.setItem('editingExistingResume', 'true');
        
        // Load the complete resume data structure (including profilePhoto, template, etc.)
        const completeResumeData = {
          content: resume.data.content,
          template: resume.data.template,
          sections: resume.data.sections,
          headerInfo: resume.data.headerInfo,
          profilePhoto: resume.data.profilePhoto
        };
        
        console.log('🔍 Resume data from database:', resume.data);
        console.log('📸 Profile photo in resume data:', resume.data.profilePhoto);
        console.log('📦 Complete resume data being saved to localStorage:', completeResumeData);
        
        localStorage.setItem('resumeData', JSON.stringify(completeResumeData));
        console.log('✅ Complete resume data loaded for editing');
      } else {
        console.error('No resume data found to edit');
        return;
      }
      console.log('Redirecting to resume builder...');
      window.location.href = '/resume-builder/build';
    } catch (e) {
      console.error('Error in editResume:', e);
    }
  };

  // Export to PDF function using Puppeteer
  const exportToPDF = async () => {
    console.log('Export PDF clicked!');
    const element = document.getElementById('resume-content');

    if (!element) {
      alert('Resume content not found. Please try again.');
      return;
    }

    setExporting(true);

    try {
      // Wait for fonts to load
      await document.fonts.ready;
      
      console.log('Preparing resume content for PDF generation...');
      
      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Get computed styles and apply them inline
      const styles = window.getComputedStyle(element);
      clonedElement.style.width = styles.width;
      clonedElement.style.maxWidth = styles.maxWidth;
      clonedElement.style.backgroundColor = styles.backgroundColor || '#ffffff';
      clonedElement.style.color = styles.color || '#1f2937';
      clonedElement.style.fontFamily = styles.fontFamily || 'Inter, sans-serif';
      
      // Find and preserve the divider element specifically
      // Use attribute selectors to avoid issues with dots in class names
      const dividerSelectors = [
        '[class*="h-0.5"][class*="my-6"]',
        '[class*="h-0.5"]',
        'div[class*="h-0\\.5"]',
        'div[class*="h-px"]'
      ];
      
      let dividerElement: HTMLElement | null = null;
      for (const selector of dividerSelectors) {
        try {
          dividerElement = element.querySelector(selector) as HTMLElement;
          if (dividerElement) {
            // Verify it's actually a divider by checking height
            const computedStyle = window.getComputedStyle(dividerElement);
            const height = parseFloat(computedStyle.height);
            if (height <= 2) {
              break;
            } else {
              dividerElement = null; // Not a divider, continue searching
            }
          }
        } catch (e) {
          // Invalid selector, try next one
          continue;
        }
      }
      
      if (dividerElement) {
        const dividerComputedStyle = window.getComputedStyle(dividerElement);
        const dividerInlineBg = dividerElement.style.backgroundColor;
        const dividerInlineOpacity = dividerElement.style.opacity;
        
        // Find the corresponding divider in the cloned element using the same method
        let clonedDivider: HTMLElement | null = null;
        for (const selector of dividerSelectors) {
          try {
            clonedDivider = clonedElement.querySelector(selector) as HTMLElement;
            if (clonedDivider) {
              // Verify it's actually a divider by checking height
              const computedStyle = window.getComputedStyle(clonedDivider);
              const height = parseFloat(computedStyle.height);
              if (height <= 2) {
                break;
              } else {
                clonedDivider = null; // Not a divider, continue searching
              }
            }
          } catch (e) {
            // Invalid selector, try next one
            continue;
          }
        }
        
        if (clonedDivider) {
          // Get the actual values - prioritize inline styles, then computed, then defaults
          // For background color, preserve the original color
          let bgColor = dividerElement.style.backgroundColor;
          
          // Check style attribute first (most reliable)
          const styleAttr = dividerElement.getAttribute('style');
          if (styleAttr) {
            const bgMatch = styleAttr.match(/background-color:\s*([^;!]+)/i);
            if (bgMatch && bgMatch[1]) {
              const extractedColor = bgMatch[1].trim();
              if (extractedColor && extractedColor !== 'transparent' && extractedColor !== 'rgba(0, 0, 0, 0)') {
                bgColor = extractedColor;
              }
            }
          }
          
          // Fallback to inline style property
          if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === '') {
            bgColor = dividerElement.style.backgroundColor;
          }
          
          // Fallback to computed style
          if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === '') {
            const computedBg = dividerComputedStyle.backgroundColor;
            if (computedBg && computedBg !== 'transparent' && computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'rgba(8, 6, 0, 0)') {
              bgColor = computedBg;
            } else {
              // Only use black as last resort
              bgColor = '#000000';
            }
          }
          
          // Preserve original opacity
          let opacity = dividerElement.style.opacity;
          if (!opacity || opacity === '') {
            if (styleAttr) {
              const opacityMatch = styleAttr.match(/opacity:\s*([^;]+)/i);
              if (opacityMatch && opacityMatch[1]) {
                opacity = opacityMatch[1].trim();
              }
            }
          }
          if (!opacity || opacity === '') {
            opacity = dividerComputedStyle.opacity || '0.3';
          }
          const height = dividerElement.style.height || dividerComputedStyle.height || '0.5px';
          const width = dividerElement.style.width || dividerComputedStyle.width || '100%';
          const marginTop = dividerElement.style.marginTop || dividerComputedStyle.marginTop || '24px';
          const marginBottom = dividerElement.style.marginBottom || dividerComputedStyle.marginBottom || '24px';
          
          // Build the complete style string
          const styleString = [
            `display: block`,
            `visibility: visible`,
            `width: ${width}`,
            `height: ${height}`,
            `margin-top: ${marginTop}`,
            `margin-bottom: ${marginBottom}`,
            `background-color: ${bgColor}`,
            `opacity: ${opacity}`,
            `box-shadow: none`,
            `border: none`,
            `padding: 0`
          ].join('; ');
          
          // Set all styles at once
          clonedDivider.setAttribute('data-divider', 'true');
          clonedDivider.setAttribute('style', styleString);
          
          // Also set via style object for compatibility
          clonedDivider.style.cssText = styleString;
          
          console.log('✅ Divider preserved with inline styles:', {
            backgroundColor: bgColor,
            opacity: opacity,
            height: height,
            width: width,
            marginTop: marginTop,
            marginBottom: marginBottom,
            styleString: styleString
          });
        } else {
          console.warn('⚠️ Divider not found in cloned element');
          // Create a divider if it wasn't found
          const headerSection = clonedElement.querySelector('div:first-child');
          if (headerSection) {
            const newDivider = document.createElement('div');
            newDivider.setAttribute('data-divider', 'true');
            newDivider.className = 'w-full h-0.5 my-6';
            newDivider.style.cssText = 'display: block; visibility: visible; width: 100%; height: 0.5px; margin-top: 24px; margin-bottom: 24px; background-color: #000000; opacity: 1; box-shadow: none; border: none; padding: 0;';
            headerSection.insertAdjacentElement('afterend', newDivider);
            console.log('✅ Created new divider element');
          }
        }
      } else {
        console.warn('⚠️ Divider element not found in resume content');
        // Try to create a divider after the header section
        const headerSection = clonedElement.querySelector('div:first-child');
        if (headerSection) {
          const newDivider = document.createElement('div');
          newDivider.setAttribute('data-divider', 'true');
          newDivider.className = 'w-full h-0.5 my-6';
          newDivider.style.cssText = 'display: block; visibility: visible; width: 100%; height: 0.5px; margin-top: 24px; margin-bottom: 24px; background-color: #000000; opacity: 1; box-shadow: none; border: none; padding: 0;';
          headerSection.insertAdjacentElement('afterend', newDivider);
          console.log('✅ Created new divider element (fallback)');
        }
      }
      
      // Get all computed styles for child elements
      const allElements = element.querySelectorAll('*');
      allElements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const htmlEl = el as HTMLElement;
        // Preserve important styles including backgrounds and gradients
        if (computedStyle.color) htmlEl.style.color = computedStyle.color;
        if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          htmlEl.style.backgroundColor = computedStyle.backgroundColor;
        }
        // PRESERVE gradients and background images!
        if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
          htmlEl.style.backgroundImage = computedStyle.backgroundImage;
        }
        if (computedStyle.fontSize) htmlEl.style.fontSize = computedStyle.fontSize;
        if (computedStyle.fontWeight) htmlEl.style.fontWeight = computedStyle.fontWeight;
        if (computedStyle.fontFamily) htmlEl.style.fontFamily = computedStyle.fontFamily;
        if (computedStyle.margin) htmlEl.style.margin = computedStyle.margin;
        if (computedStyle.padding) htmlEl.style.padding = computedStyle.padding;
      });
      
      // Remove any black backgrounds, shadows, gradients, or problematic styles from cloned element
      const allClonedElements = clonedElement.querySelectorAll('*');
      allClonedElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computedStyle = window.getComputedStyle(el);
        
        // Remove black backgrounds
        if (htmlEl.style.backgroundColor === 'black' || 
            htmlEl.style.backgroundColor === '#000000' ||
            htmlEl.style.backgroundColor === 'rgb(0, 0, 0)' ||
            htmlEl.style.backgroundColor === 'rgba(0, 0, 0, 1)') {
          htmlEl.style.backgroundColor = 'transparent';
        }
        
        // Remove shadows (but preserve divider lines)
        // Only remove shadows if it's not a divider line
        // Check for divider by class, height, or if it's a thin horizontal line with background color
        const hasDividerClass = htmlEl.classList.contains('h-0.5') || 
                                htmlEl.classList.contains('h-px') ||
                                htmlEl.classList.contains('my-6');
        const hasDividerHeight = computedStyle.height === '0.5px' ||
                                 computedStyle.height === '1px' ||
                                 (computedStyle.height && parseFloat(computedStyle.height) <= 2);
        const hasDividerStyle = (computedStyle.width === '100%' || htmlEl.style.width === '100%') &&
                                hasDividerHeight &&
                                (computedStyle.backgroundColor !== 'transparent' && 
                                 computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)');
        const isDivider = hasDividerClass || hasDividerHeight || hasDividerStyle;
        
        if (!isDivider) {
          htmlEl.style.boxShadow = 'none';
          htmlEl.style.textShadow = 'none';
          htmlEl.style.filter = 'none';
        }
        
        // Remove gradients
        if (computedStyle.backgroundImage && computedStyle.backgroundImage.includes('gradient')) {
          htmlEl.style.backgroundImage = 'none';
        }
        if (htmlEl.style.backgroundImage && htmlEl.style.backgroundImage.includes('gradient')) {
          htmlEl.style.backgroundImage = 'none';
        }
        
        // Remove backdrop filters
        htmlEl.style.backdropFilter = 'none';
        (htmlEl.style as any).webkitBackdropFilter = 'none';
        
        // Ensure no black borders (but preserve colored borders for dividers)
        if (htmlEl.style.borderColor === 'black' || 
            htmlEl.style.borderColor === '#000000') {
          htmlEl.style.borderColor = 'transparent';
        }
        
        // Preserve divider lines - ensure they have a visible background or border
        if (isDivider) {
          // Preserve the original background color if it exists
          const originalBg = computedStyle.backgroundColor;
          const inlineBg = htmlEl.style.backgroundColor;
          
          // Priority: inline style > computed style > fallback
          if (inlineBg && inlineBg !== 'transparent' && inlineBg !== 'rgba(0, 0, 0, 0)') {
            // Keep the inline style background color
            htmlEl.style.backgroundColor = inlineBg;
          } else if (originalBg && originalBg !== 'transparent' && originalBg !== 'rgba(0, 0, 0, 0)') {
            // Keep the original background color
            htmlEl.style.backgroundColor = originalBg;
          } else {
            // Use black for dividers if no color is set
            htmlEl.style.backgroundColor = '#000000'; // Black color
            htmlEl.style.opacity = '1'; // Full opacity for black
          }
          
          // Ensure divider is visible
          htmlEl.style.height = computedStyle.height || '0.5px' || '1px';
          htmlEl.style.display = 'block';
          htmlEl.style.width = '100%';
          htmlEl.style.marginTop = computedStyle.marginTop || '24px';
          htmlEl.style.marginBottom = computedStyle.marginBottom || '24px';
          
          // Preserve opacity for dividers (they might have opacity for styling)
          if (computedStyle.opacity && parseFloat(computedStyle.opacity) < 1) {
            // Keep the opacity for dividers as it's part of their design
            htmlEl.style.opacity = computedStyle.opacity;
          } else if (!htmlEl.style.opacity) {
            // Default opacity for dividers
            htmlEl.style.opacity = '0.3';
          }
        } else {
          // Remove opacity effects that might cause shadows (only for non-dividers)
          if (computedStyle.opacity && parseFloat(computedStyle.opacity) < 1) {
            htmlEl.style.opacity = '1';
          }
        }
      });
      
      // Copy computed styles to cloned element recursively
      const copyStylesToClone = (original: HTMLElement, clone: HTMLElement) => {
        const computedStyle = window.getComputedStyle(original);
        
        // Copy background colors and gradients
        if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          clone.style.backgroundColor = computedStyle.backgroundColor;
        }
        if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
          clone.style.backgroundImage = computedStyle.backgroundImage;
        }
        if (computedStyle.color) clone.style.color = computedStyle.color;
        if (computedStyle.fontSize) clone.style.fontSize = computedStyle.fontSize;
        if (computedStyle.fontWeight) clone.style.fontWeight = computedStyle.fontWeight;
        if (computedStyle.fontFamily) clone.style.fontFamily = computedStyle.fontFamily;
        if (computedStyle.padding) clone.style.padding = computedStyle.padding;
        if (computedStyle.margin) clone.style.margin = computedStyle.margin;
        if (computedStyle.border) clone.style.border = computedStyle.border;
        if (computedStyle.borderRadius) clone.style.borderRadius = computedStyle.borderRadius;
        if (computedStyle.width && computedStyle.width !== 'auto') clone.style.width = computedStyle.width;
        if (computedStyle.height && computedStyle.height !== 'auto') clone.style.height = computedStyle.height;
        if (computedStyle.display) clone.style.display = computedStyle.display;
        if (computedStyle.flexDirection) clone.style.flexDirection = computedStyle.flexDirection;
        if (computedStyle.alignItems) clone.style.alignItems = computedStyle.alignItems;
        if (computedStyle.justifyContent) clone.style.justifyContent = computedStyle.justifyContent;
        if (computedStyle.gap) clone.style.gap = computedStyle.gap;
        
        // Recursively apply to children
        Array.from(original.children).forEach((child, index) => {
          if (clone.children[index]) {
            copyStylesToClone(child as HTMLElement, clone.children[index] as HTMLElement);
          }
        });
      };
      
      // Apply styles to cloned element
      copyStylesToClone(element, clonedElement);
      
      // Ensure the main element has white background (only if it's transparent)
      if (!clonedElement.style.backgroundColor || clonedElement.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
      clonedElement.style.backgroundColor = '#ffffff';
      }
      clonedElement.style.color = '#1f2937';
      
      // Before creating HTML, ensure divider is visible in the cloned element
      // Find the divider one more time and ensure it has all styles
      const finalDividerCheck = clonedElement.querySelector('[data-divider="true"]') || 
                                clonedElement.querySelector('[class*="h-0.5"][class*="my-6"]') ||
                                clonedElement.querySelector('[class*="h-0.5"]');
      
      if (finalDividerCheck) {
        const finalDivider = finalDividerCheck as HTMLElement;
        const finalComputed = window.getComputedStyle(finalDivider);
        
        // Get template color if available
        const bgColor = finalDivider.style.backgroundColor || finalComputed.backgroundColor || '#000000';
        const opacity = finalDivider.style.opacity || finalComputed.opacity || '1';
        
        // Force all styles
        finalDivider.setAttribute('data-divider', 'true');
        finalDivider.style.cssText = `display: block; visibility: visible; width: 100%; height: 0.5px; margin-top: 24px; margin-bottom: 24px; background-color: ${bgColor}; opacity: ${opacity}; box-shadow: none; border: none; padding: 0;`;
        
        console.log('✅ Final divider check - styles applied:', {
          backgroundColor: finalDivider.style.backgroundColor,
          opacity: finalDivider.style.opacity,
          cssText: finalDivider.style.cssText,
          outerHTML: finalDivider.outerHTML.substring(0, 200)
        });
      } else {
        console.warn('⚠️ Divider not found in final check, creating new one');
        // Create divider after first div
        const firstDiv = clonedElement.querySelector('div');
        if (firstDiv) {
          const newDivider = document.createElement('div');
          newDivider.setAttribute('data-divider', 'true');
          newDivider.className = 'w-full h-0.5 my-6';
          newDivider.style.cssText = `display: block; visibility: visible; width: 100%; height: 0.5px; margin-top: 24px; margin-bottom: 24px; background-color: #000000; opacity: 1; box-shadow: none; border: none; padding: 0;`;
          firstDiv.insertAdjacentElement('afterend', newDivider);
          console.log('✅ Created new divider in final check');
        }
      }
      
      // Create a complete HTML document with styles
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body {
                font-family: ${styles.fontFamily || 'Inter, sans-serif'};
                color: #1f2937;
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                height: auto !important;
                min-height: 100vh !important;
              }
              body > * {
                background: #ffffff !important;
                margin: 0 !important;
                max-width: 210mm !important;
                width: 210mm !important;
              }
              /* Override any black backgrounds */
              [style*="background: black"],
              [style*="background-color: black"],
              [style*="background: #000"],
              [style*="background-color: #000"],
              [style*="background: rgb(0, 0, 0)"],
              [style*="background-color: rgb(0, 0, 0)"] {
                background: #ffffff !important;
                background-color: #ffffff !important;
              }
              /* Preserve background colors - don't override them */
              /* Only set white background for body, not all divs */
              body {
                background: #ffffff !important;
              }
              /* Remove any black overlays or pseudo-elements */
              ::before,
              ::after {
                background: transparent !important;
                box-shadow: none !important;
                text-shadow: none !important;
                display: none !important;
              }
              /* Remove all shadows (but preserve divider lines) */
              *:not([class*="h-0.5"]):not([class*="h-px"]):not([style*="height: 0.5px"]):not([style*="height: 1px"]) {
                box-shadow: none !important;
                text-shadow: none !important;
                filter: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
              }
              /* Preserve divider lines */
              [class*="h-0.5"],
              [class*="h-px"],
              [style*="height: 0.5px"],
              [style*="height: 1px"],
              [class*="my-6"] {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
              }
              /* Ensure divider with my-6 class is visible */
              [class*="h-0.5"][class*="my-6"],
              [class*="h-0.5"],
              [data-divider="true"] {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                min-height: 0.5px !important;
                margin-top: 24px !important;
                margin-bottom: 24px !important;
              }
              /* Only set default color/opacity if not already set inline */
              [class*="h-0.5"][class*="my-6"]:not([style*="background"]),
              [class*="h-0.5"]:not([style*="background"]),
              [data-divider="true"]:not([style*="background"]) {
                background-color: #000000 !important;
                opacity: 1 !important;
              }
              /* Force divider to be visible - but respect inline styles */
              [data-divider="true"] {
                display: block !important;
                visibility: visible !important;
                height: 0.5px !important;
                width: 100% !important;
                margin-top: 24px !important;
                margin-bottom: 24px !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
              }
              /* Only set default color/opacity if not set inline */
              [data-divider="true"]:not([style*="background-color"]):not([style*="background:"]) {
                background-color: #000000 !important;
              }
              [data-divider="true"]:not([style*="opacity"]) {
                opacity: 1 !important;
              }
              /* PRESERVE gradients and background colors - don't remove them! */
              /* Only remove shadows, not backgrounds */
              [class*="shadow"]:not([style*="background"]):not([class*="bg-"]) {
                box-shadow: none !important;
      }
              
              /* Preserve background colors and gradients */
              [style*="background"],
              [style*="background-color"],
              [style*="background-image"],
              [class*="bg-"] {
                /* Keep original backgrounds - don't override */
              }
              
              /* Page break controls - prevent unwanted breaks */
              @page {
                size: A4;
                margin: 0;
              }
              
              /* For A4 PDF, content should fill the page exactly - no centering needed */
              html {
                width: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              body {
                width: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              /* Allow the main resume container to break across pages naturally */
              body > *,
              #resume-content,
              [id*="resume"] {
                page-break-inside: auto !important;
                break-inside: auto !important;
              }
              
              /* Prevent breaking inside list items and small elements only */
              li,
              button,
              [role="button"],
              [class*="rounded-full"] {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Prevent breaking inside headings */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                break-after: avoid;
                page-break-inside: avoid;
                break-inside: avoid;
                white-space: nowrap;
                overflow: visible;
              }
              
              /* Prevent breaking in heading containers with borders */
              div[class*="border-b"] {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Prevent orphaned/widowed text */
              p {
                orphans: 2;
                widows: 2;
              }
              
              /* Allow all other elements to break naturally */
              * {
                page-break-inside: auto;
                break-inside: auto;
              }
              
              /* Override for elements that should never break */
              li, button, h1, h2, h3, h4, h5, h6,
              [class*="rounded-full"],
              div[class*="border-b"] {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
      }
              /* Remove glass effects */
              [class*="glass"],
              [class*="backdrop"] {
                background: #ffffff !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
              }
              ${Array.from(document.styleSheets)
                .map((sheet) => {
                  try {
                    return Array.from(sheet.cssRules)
                      .map((rule) => {
                        const ruleText = rule.cssText;
                        // Filter out any rules that might cause black backgrounds
                        if (ruleText.includes('background: black') || 
                            ruleText.includes('background-color: black') ||
                            ruleText.includes('background: #000') ||
                            ruleText.includes('background-color: #000')) {
                          return '';
                        }
                        return ruleText;
                      })
                      .join('\n');
                  } catch (e) {
                    return '';
                  }
                })
                .join('\n')}
            </style>
          </head>
          <body style="background: #ffffff !important; color: #1f2937; margin: 0; padding: 0; width: 210mm;">
            ${clonedElement.outerHTML}
          </body>
        </html>
      `;

      // Format filename as FirstName-LastName-BPOC-Resume.pdf
      const fullName = resume?.user.fullName || 'Resume';
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Resume';
      const lastName = nameParts.slice(1).join('-') || 'User';
      const fileName = `${firstName}-${lastName}-BPOC-Resume.pdf`;
      const pdfTitle = `${fullName} - Resume | BPOC.IO`;

      // Add title to HTML for PDF metadata
      const htmlWithTitle = htmlContent.replace(
        '<head>',
        `<head>\n            <title>${pdfTitle}</title>`
      );

      // Debug: Check if divider is in the HTML
      const hasDivider = htmlWithTitle.includes('data-divider="true"') || 
                        htmlWithTitle.includes('h-0.5') ||
                        htmlWithTitle.includes('my-6');
      
      if (hasDivider) {
        console.log('✅ Divider found in HTML string');
        // Extract a snippet of HTML around the divider for debugging
        const dividerIndex = htmlWithTitle.indexOf('data-divider') || htmlWithTitle.indexOf('h-0.5');
        if (dividerIndex > -1) {
          const snippet = htmlWithTitle.substring(Math.max(0, dividerIndex - 100), dividerIndex + 300);
          console.log('📄 Divider HTML snippet:', snippet);
        }
      } else {
        console.error('❌ Divider NOT found in HTML string!');
        console.log('📄 HTML preview (first 2000 chars):', htmlWithTitle.substring(0, 2000));
      }

      console.log('Sending request to PDF generation API...');

      // Call Puppeteer API
      let response: Response;
      try {
        response = await fetch('/api/resume/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlWithTitle,
          fileName: fileName,
        }),
      });
      } catch (fetchError) {
        console.error('❌ Network error calling PDF API:', fetchError);
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to server'}`);
      }

      if (!response.ok) {
        let errorData: any = {};
        let errorMessage = `Server returned ${response.status}: ${response.statusText || 'Unknown error'}`;
        
        try {
          const text = await response.text();
          console.log('📄 Error response text:', text);
          
          if (text && text.trim()) {
            try {
              errorData = JSON.parse(text);
              console.log('📄 Parsed error data:', errorData);
            } catch (parseError) {
              // If not JSON, use the text as error message
              console.log('📄 Response is not JSON, using as text');
              errorMessage = text.trim();
            }
          } else {
            console.log('📄 Empty response body');
          }
        } catch (readError) {
          console.error('❌ Failed to read error response:', readError);
          errorMessage = `Server returned ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        
        // Extract error message from errorData
        if (errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
          errorMessage = errorData.details || errorData.hint || errorData.error || errorData.message || errorMessage;
        }
        
        console.error('❌ PDF generation error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          message: errorMessage
        });
        
        throw new Error(errorMessage || 'Failed to generate PDF');
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('PDF downloaded successfully');

    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', error?.constructor?.name);
      console.error('❌ Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message || error.toString();
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).error || JSON.stringify(error);
      }
      
      let detailedMessage = `Error generating PDF: ${errorMessage}`;
      
      if (errorMessage.includes('Failed to launch browser') || 
          errorMessage.includes('Could not find Chrome') || 
          errorMessage.includes('executable') ||
          errorMessage.includes('Browser was not found')) {
        detailedMessage = 'PDF generation failed: Chrome/Chromium could not be found.\n\n' +
          'For local development:\n' +
          '1. Install Google Chrome browser, OR\n' +
          '2. Run: npx puppeteer browsers install chrome\n' +
          '3. Restart your development server\n' +
          '4. Check server console logs for more details';
      } else if (errorMessage.includes('timeout')) {
        detailedMessage = 'PDF generation timed out. The resume might be too complex. Please try again or contact support.';
      } else if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
        detailedMessage = 'Network error: Could not connect to the PDF generation service. Please check if the server is running.';
      }
      
      alert(detailedMessage);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Futuristic Space Background */}
        <div className="absolute inset-0">
          {/* Nebula Effect */}
          <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-cyan-900/20"></div>
          <div className="absolute inset-0 bg-gradient-radial from-blue-900/15 via-transparent to-pink-900/15"></div>
          
          {/* Starfield */}
          <ClientParticles />
          
          {/* Floating Space Debris */}
          <div className="absolute top-20 left-10 w-3 h-3 bg-cyan-400/40 rounded-full animate-bounce"></div>
          <div className="absolute top-40 right-20 w-2 h-2 bg-purple-400/50 rounded-full animate-ping"></div>
          <div className="absolute top-60 left-1/4 w-2.5 h-2.5 bg-blue-400/40 rounded-full animate-pulse"></div>
          <div className="absolute top-80 right-1/3 w-1.5 h-1.5 bg-green-400/60 rounded-full animate-bounce"></div>
          <div className="absolute top-32 left-2/3 w-2 h-2 bg-pink-400/50 rounded-full animate-ping"></div>
          <div className="absolute top-72 right-1/6 w-1.5 h-1.5 bg-yellow-400/40 rounded-full animate-pulse"></div>
          
          {/* Energy Orbs */}
          <div className="absolute top-1/4 left-1/6 w-6 h-6 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full animate-spin opacity-40"></div>
          <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-gradient-to-r from-purple-400/25 to-pink-400/25 rounded-full animate-pulse opacity-30"></div>
          <div className="absolute top-2/3 left-1/3 w-5 h-5 bg-gradient-to-r from-green-400/35 to-cyan-400/35 rounded-full animate-bounce opacity-50"></div>
          <div className="absolute top-1/2 right-1/6 w-4 h-4 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 rounded-full animate-spin opacity-40" style={{ animationDirection: 'reverse' }}></div>
          
          {/* Cosmic Grid */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/8 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/8 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-transparent"></div>
          
          {/* Wormhole Effect */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-40 h-40 border border-cyan-400/15 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-purple-400/15 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '4s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-blue-400/15 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-pink-400/15 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          </div>
          
          {/* Energy Waves */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent animate-pulse"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-purple-500/10 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="text-center relative z-10">
          {/* Pacman Loader */}
          <div className="relative mb-8">
            <div className="flex justify-center">
              <PacmanLoader 
                color="#fbbf24" 
                size={60}
                margin={4}
                speedMultiplier={1.2}
              />
            </div>
            
            {/* Floating energy particles */}
            <div className="absolute -top-4 -left-4 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -top-4 -right-4 w-3 h-3 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-4 -left-4 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
          </div>
          
          {/* Enhanced Text with Glow Effect */}
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg" style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}>
            Loading Resume...
          </h2>
          <p className="text-gray-400 text-lg">Preparing your professional profile</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error Loading Resume</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Resume Not Found</h1>
          <p className="text-gray-400 mb-4">The resume you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen cyber-grid overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <Header />
      
      {/* Main Content */}
      <div className="pt-16 relative z-10">
        <div className="container mx-auto px-6 py-8 flex justify-center">
          <div className="max-w-6xl w-full">
            {/* Resume Header with User Info and Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 mb-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                {/* User Info */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {resume.user.avatarUrl ? (
                      <img
                        src={resume.user.avatarUrl}
                        alt={resume.user.fullName}
                        className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400/30"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                        {generateInitials(resume.user.fullName)}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">
                      {resume.user.fullName}'s Resume
                    </h1>
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(resume.viewCount)} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>Template: {resume.template || 'Default'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Actions */}
                 <div className="flex items-center gap-3">
                   {/* Share Button with Dropdown */}
                   <div className="relative z-50" ref={shareRef}>
                     <Button
                       onClick={() => setIsShareOpen(!isShareOpen)}
                       variant="outline"
                       className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
                     >
                       <Share2 className="h-4 w-4 mr-2" />
                       Share
                     </Button>
                             </div>
                   
                   {/* Share Dropdown Menu - Rendered via Portal to avoid overflow clipping */}
                   {isShareOpen && dropdownPosition && typeof document !== 'undefined' && createPortal(
                     <div
                       data-share-dropdown
                       className="fixed bg-gray-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-[9999] min-w-[240px]"
                       style={{
                         top: `${dropdownPosition.top}px`,
                         right: `${dropdownPosition.right}px`
                       }}
                     >
                       <div className="py-2">
                         {/* Facebook Share */}
                         <button
                             onClick={() => shareResume('facebook')}
                           className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-white flex items-center gap-3"
                           >
                           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">f</div>
                           <span className="font-medium">Share on Facebook</span>
                         </button>
                           
                         {/* LinkedIn Share */}
                         <button
                             onClick={() => shareResume('linkedin')}
                           className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-white flex items-center gap-3"
                           >
                           <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-sm font-bold">in</div>
                           <span className="font-medium">Share on LinkedIn</span>
                         </button>

                         <div className="border-t border-white/10 my-1"></div>
                           
                         {/* Copy Link */}
                         <button
                             onClick={() => shareResume('copy')}
                           className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-white flex items-center gap-3"
                           >
                           <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">📋</div>
                           <span className="font-medium">Copy Link</span>
                         </button>
                           </div>
                     </div>,
                     document.body
                     )}
                   
                   {/* Export PDF Button */}
                   <Button
                     onClick={exportToPDF}
                     disabled={exporting}
                     className="bg-cyan-500 hover:bg-cyan-600 text-white"
                   >
                     {exporting ? (
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     ) : (
                       <Download className="h-4 w-4 mr-2" />
                     )}
                     {exporting ? 'Exporting...' : 'Export PDF'}
                   </Button>
                 </div>
              </div>

            </motion.div>

            {/* Resume Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8"
            >
              {resume.data ? (
                <div 
                  id="resume-content"
                  className="bg-white rounded-lg shadow-2xl max-w-6xl w-full mx-auto text-gray-900 [&_*]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_p]:text-gray-700 [&_li]:text-gray-700 [&_span]:text-gray-700 [&_.text-gray-700]:text-gray-700 [&_.text-gray-600]:text-gray-600 [&_text-gray-500]:text-gray-500 [&_.text-gray-900]:text-gray-900"
                  style={{
                    fontFamily: resume.data.template?.fontFamily || resume.data.selectedTemplate?.fontFamily || 'Inter, sans-serif',
                    color: '#1f2937',
                    width: '210mm',
                    minHeight: '297mm'
                  }}
                >
                  {/* MODERN TEMPLATE - 2-Column Sidebar */}
                  {templateId === 'modern' && (
                    <div className="flex min-h-[297mm]">
                      {/* Left Sidebar */}
                      <div className="w-[75mm] text-white p-6 space-y-6" style={{ background: currentStyle.headerBg }}>
                        {/* Photo - Only show if explicitly added */}
                        <div className="flex justify-center">
                          <div className="w-32 h-32 rounded-full bg-white/20 border-4 border-white/40 overflow-hidden flex items-center justify-center">
                            {getResumeContent('profilePhoto') ? (
                              <img 
                                src={getResumeContent('profilePhoto')} 
                                alt="Profile" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <User className="h-14 w-14 text-white/60" />
                            )}
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">Contact</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 opacity-70" />
                              <span className="text-xs break-all">{getResumeContent('email') || resume.user.email || 'email@example.com'}</span>
                            </div>
                            {getResumeContent('phone') || resume.user.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 opacity-70" />
                                <span className="text-xs">{getResumeContent('phone') || resume.user.phone}</span>
                              </div>
                            ) : null}
                            {getResumeContent('location') || resume.user.location ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 opacity-70" />
                                <span className="text-xs">{getResumeContent('location') || resume.user.location}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        
                        {/* Skills in Sidebar */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">Skills</h3>
                          {getResumeContent('skills')?.technical?.length > 0 && (
                            <div className="space-y-1">
                              {getResumeContent('skills').technical.slice(0, 6).map((s: string, i: number) => (
                                <div key={i} className="text-xs flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                  {s}
                                </div>
                              ))}
                            </div>
                          )}
                          {getResumeContent('skills')?.soft?.length > 0 && (
                            <div className="space-y-1 mt-3">
                              <p className="text-[10px] uppercase tracking-wide opacity-60">Soft Skills</p>
                              {getResumeContent('skills').soft.slice(0, 4).map((s: string, i: number) => (
                                <div key={i} className="text-xs flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                  {s}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Education in Sidebar */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">Education</h3>
                          {getResumeContent('education', []).map((edu: any, i: number) => (
                            <div key={i} className="text-xs space-y-0.5">
                              <p className="font-medium">{edu.degree}</p>
                              <p className="opacity-70">{edu.institution}</p>
                              <p className="opacity-50">{edu.year}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Right Main Content */}
                      <div className="flex-1 p-8">
                        {/* Name & Title */}
                        <div className="mb-6">
                          <h1 className="text-3xl font-bold text-gray-900">
                            {getResumeContent('name') || resume.user.fullName || 'Your Name'}
                          </h1>
                          <p className="text-lg mt-1" style={{ color: primaryColor }}>
                            {getResumeContent('bestJobTitle') || resume.user.position || 'Professional Title'}
                          </p>
                        </div>
                        
                        {/* Summary */}
                        {getResumeContent('summary') && (
                          <div className="mb-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider mb-2 pb-1 border-b-2" style={{ color: primaryColor, borderColor: primaryColor }}>
                              Professional Summary
                            </h2>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {getResumeContent('summary')}
                            </p>
                          </div>
                        )}
                        
                        {/* Experience */}
                        {getResumeContent('experience', []).length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2 pb-1 border-b-2" style={{ borderColor: primaryColor, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <h2 className="text-sm font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: primaryColor }}>Work Experience</h2>
                            </div>
                            <div className="space-y-4">
                              {getResumeContent('experience', []).map((exp: any, i: number) => (
                                <div key={i}>
                                  <div className="flex justify-between items-baseline">
                                    <h3 className="font-semibold text-gray-900">{exp.title || exp.position}</h3>
                                    <span className="text-xs text-gray-500">{exp.duration || exp.dates}</span>
                                  </div>
                                  <p className="text-sm" style={{ color: primaryColor }}>{exp.company}</p>
                                  {exp.achievements?.length > 0 && (
                                    <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                                      {exp.achievements.map((a: string, j: number) => <li key={j}>{a}</li>)}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* EXECUTIVE TEMPLATE - Classic Traditional */}
                  {templateId === 'executive' && (
                    <div className="p-10">
                      {/* Centered Header - No colorful gradient, elegant serif */}
                      <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                        <h1 className="text-4xl font-serif font-bold text-gray-900">
                          {getResumeContent('name') || resume.user.fullName || 'Your Name'}
                        </h1>
                        <p className="text-lg font-serif text-gray-600 mt-2">
                          {getResumeContent('bestJobTitle') || resume.user.position || 'Professional Title'}
                        </p>
                        <div className="flex justify-center gap-6 mt-3 text-sm text-gray-600">
                          <span>{getResumeContent('email') || resume.user.email || ''}</span>
                          {(getResumeContent('phone') || resume.user.phone) && (
                            <>
                              <span>•</span>
                              <span>{getResumeContent('phone') || resume.user.phone}</span>
                            </>
                          )}
                          {(getResumeContent('location') || resume.user.location) && (
                            <>
                              <span>•</span>
                              <span>{getResumeContent('location') || resume.user.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Photo - Small, aligned right - Only show if explicitly added to resume */}
                      {getResumeContent('profilePhoto') && (
                        <div className="float-right ml-6 mb-4">
                          <div className="w-24 h-24 rounded border-2 border-gray-300 overflow-hidden">
                            <img 
                              src={getResumeContent('profilePhoto')} 
                              alt="Profile" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Summary - Always show section */}
                      <div className="mb-6">
                        <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">
                          Executive Summary
                        </h2>
                        <p className="text-sm font-serif text-gray-700 leading-relaxed">
                          {getResumeContent('summary') || 'Professional summary not provided.'}
                        </p>
                      </div>
                      
                      {/* Experience */}
                      <div className="mb-6 clear-both">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-3">
                          <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-gray-700">Professional Experience</h2>
                        </div>
                        <div className="space-y-4">
                          {getResumeContent('experience', []).length > 0 ? (
                            getResumeContent('experience', []).map((exp: any, i: number) => (
                              <div key={i} className="pb-3 border-b border-gray-100 last:border-0">
                                <div className="flex justify-between items-baseline">
                                  <h3 className="font-serif font-semibold text-gray-900">{exp.title || exp.position}</h3>
                                  <span className="text-sm font-serif text-gray-500">{exp.duration || exp.dates || ''}</span>
                                </div>
                                <p className="text-sm font-serif text-gray-600 italic">{exp.company || ''}</p>
                                {exp.achievements?.length > 0 && (
                                  <ul className="mt-2 text-sm font-serif text-gray-700 list-disc list-outside ml-4 space-y-1">
                                    {exp.achievements.slice(0, 4).map((a: string, j: number) => <li key={j}>{a}</li>)}
                                  </ul>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm font-serif text-gray-400">No experience listed.</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Two columns for Skills & Education */}
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">Core Competencies</h2>
                          <div className="flex flex-wrap gap-2">
                            {getResumeContent('skills')?.technical?.length > 0 ? (
                              getResumeContent('skills').technical.map((s: string, i: number) => (
                                <span key={i} className="text-xs font-serif px-2 py-1 bg-gray-100 text-gray-700 rounded">{s}</span>
                              ))
                            ) : (
                              <span className="text-xs font-serif text-gray-400">No technical skills listed.</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">Education</h2>
                          {getResumeContent('education', []).length > 0 ? (
                            getResumeContent('education', []).map((edu: any, i: number) => (
                              <div key={i} className="text-sm font-serif">
                                <p className="font-medium text-gray-800">{edu.degree || ''}</p>
                                <p className="text-gray-600">{edu.institution || ''}{edu.year ? `, ${edu.year}` : ''}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm font-serif text-gray-400">No education listed.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CREATIVE TEMPLATE - Bold Portfolio Style */}
                  {templateId === 'creative' && (
                    <div>
                      {/* Bold Hero Header with Large Photo */}
                      <div className="relative h-[140mm] overflow-hidden" style={{ background: currentStyle.headerBg }}>
                        {/* Diagonal overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} />
                        
                        <div className="relative z-10 p-8 flex items-center gap-8 h-full">
                          {/* Large Photo - Only show if explicitly added */}
                          <div className="w-44 h-44 rounded-2xl bg-white/20 border-4 border-white/40 overflow-hidden shadow-2xl">
                            {getResumeContent('profilePhoto') ? (
                              <img 
                                src={getResumeContent('profilePhoto')} 
                                alt="Profile" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="h-20 w-20 text-white/60" />
                              </div>
                            )}
                          </div>
                          
                          {/* Name & Info */}
                          <div className="text-white flex-1">
                            <h1 className="text-5xl font-black tracking-tight">
                              {getResumeContent('name') || resume.user.fullName || 'YOUR NAME'}
                            </h1>
                            <p className="text-2xl font-light mt-2 opacity-90">
                              {getResumeContent('bestJobTitle') || resume.user.position || 'Creative Professional'}
                            </p>
                            
                            {/* Contact Icons Row */}
                            <div className="flex gap-4 mt-6">
                              <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">{getResumeContent('email') || resume.user.email}</span>
                              </div>
                              {(getResumeContent('phone') || resume.user.phone) && (
                                <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                                  <Phone className="h-4 w-4" />
                                  <span className="text-sm">{getResumeContent('phone') || resume.user.phone}</span>
                                </div>
                              )}
                              {(getResumeContent('location') || resume.user.location) && (
                                <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-sm">{getResumeContent('location') || resume.user.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content with Visual Cards */}
                      <div className="p-8 -mt-16 relative z-20">
                        {/* Summary Card */}
                        {getResumeContent('summary') && (
                          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-l-4" style={{ borderColor: primaryColor }}>
                            <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>About Me</h2>
                            <p className="text-gray-700">
                              {getResumeContent('summary')}
                            </p>
                          </div>
                        )}
                        
                        {/* Skills as Visual Tags */}
                        {getResumeContent('skills') && (
                          <div className="mb-6">
                            <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>Skills & Expertise</h2>
                            <div className="flex flex-wrap gap-2">
                              {getResumeContent('skills').technical?.map((s: string, i: number) => (
                                <span key={i} className="px-4 py-2 rounded-full text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>{s}</span>
                              ))}
                              {getResumeContent('skills').soft?.map((s: string, i: number) => (
                                <span key={i} className="px-4 py-2 rounded-full text-sm font-medium border-2" style={{ borderColor: primaryColor, color: primaryColor }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Experience Cards */}
                        {getResumeContent('experience', []).length > 0 && (
                          <div className="mb-6">
                            <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>Experience</h2>
                            <div className="grid gap-3">
                              {getResumeContent('experience', []).map((exp: any, i: number) => (
                                <div key={i} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900">{exp.title || exp.position}</h3>
                                    <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-500">{exp.duration || exp.dates}</span>
                                  </div>
                                  <p className="text-sm font-medium" style={{ color: primaryColor }}>{exp.company}</p>
                                  {exp.achievements?.length > 0 && (
                                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                      {exp.achievements.slice(0, 2).map((a: string, j: number) => (
                                        <li key={j} className="flex items-start gap-2">
                                          <span style={{ color: primaryColor }}>▸</span>{a}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Education */}
                        {getResumeContent('education', []).length > 0 && (
                          <div>
                            <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>Education</h2>
                            <div className="flex flex-wrap gap-3">
                              {getResumeContent('education', []).map((edu: any, i: number) => (
                                <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                                  <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
                                  <div>
                                    <p className="font-medium text-sm">{edu.degree}</p>
                                    <p className="text-xs text-gray-500">{edu.institution} • {edu.year}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MINIMAL TEMPLATE - Typography Focused */}
                  {templateId === 'minimal' && (
                    <div className="p-12">
                      {/* Clean Typography Header - NO PHOTO */}
                      <div className="mb-10">
                        <h1 className="text-5xl font-light text-gray-900 tracking-tight">
                          {getResumeContent('name') || resume.user.fullName || 'Your Name'}
                        </h1>
                        <div className="flex items-center gap-3 mt-3 text-gray-500">
                          <span className="text-lg">{getResumeContent('bestJobTitle') || resume.user.position || 'Professional'}</span>
                          <span className="text-gray-300">|</span>
                          <span>{getResumeContent('email') || resume.user.email || ''}</span>
                          {(getResumeContent('phone') || resume.user.phone) && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span>{getResumeContent('phone') || resume.user.phone}</span>
                            </>
                          )}
                          {(getResumeContent('location') || resume.user.location) && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span>{getResumeContent('location') || resume.user.location}</span>
                            </>
                          )}
                        </div>
                        <div className="w-16 h-0.5 bg-gray-900 mt-6" />
                      </div>
                      
                      {/* Summary - Clean - Always show */}
                      <div className="mb-8">
                        <p className="text-gray-700 leading-relaxed text-lg">
                          {getResumeContent('summary') || 'Professional summary not provided.'}
                        </p>
                      </div>
                      
                      {/* Experience - Minimal */}
                      <div className="mb-8">
                        <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-4">Experience</h2>
                        <div className="space-y-6">
                          {getResumeContent('experience', []).length > 0 ? (
                            getResumeContent('experience', []).map((exp: any, i: number) => (
                              <div key={i}>
                                <div className="flex justify-between items-baseline">
                                  <span className="font-medium text-gray-900">{exp.title || exp.position || ''}</span>
                                  <span className="text-sm text-gray-400">{exp.duration || exp.dates || ''}</span>
                                </div>
                                <p className="text-gray-600">{exp.company || ''}</p>
                                {exp.achievements?.length > 0 && (
                                  <p className="mt-1 text-gray-600 text-sm">
                                    {exp.achievements.slice(0, 2).join(' • ')}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">No experience listed.</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Skills & Education side by side */}
                      <div className="grid grid-cols-2 gap-12">
                        <div>
                          <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-3">Skills</h2>
                          <p className="text-gray-700">
                            {[...(getResumeContent('skills')?.technical || []), ...(getResumeContent('skills')?.soft || [])].length > 0
                              ? [...(getResumeContent('skills')?.technical || []), ...(getResumeContent('skills')?.soft || [])].join(' · ')
                              : 'No skills listed.'}
                          </p>
                        </div>
                        <div>
                          <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-3">Education</h2>
                          {getResumeContent('education', []).length > 0 ? (
                            getResumeContent('education', []).map((edu: any, i: number) => (
                              <div key={i} className="text-gray-700">
                                <span className="font-medium">{edu.degree || ''}</span> — {edu.institution || ''}{edu.year ? `, ${edu.year}` : ''}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">No education listed.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FALLBACK: Generic layout for unknown templates */}
                  {!['modern', 'executive', 'creative', 'minimal'].includes(templateId) && (
                    <div className="p-4 sm:p-6 lg:p-8">
                  {/* Header */}
                  <div className="mb-8">
                    {/* Header Content - Dynamic layout based on photo presence */}
                    <div className="relative">
                      {/* Dynamic Text Content - Centered when no photo, Left-aligned when photo exists */}
                      <div className={resume.data.profilePhoto ? "text-left" : "text-center"}>
                        <h1 
                          className="text-2xl font-bold mb-2 text-gray-900"
                          style={{ color: resume.data.template?.primaryColor || resume.data.selectedTemplate?.primaryColor || resume.data.primaryColor || '#1f2937' }}
                        >
                          {resume.user.fullName || resume.data.content?.name || resume.data.name || resume.data.headerInfo?.name || 'Professional'}
                        </h1>
                        <p 
                          className="text-lg font-semibold mb-2 text-gray-800"
                          style={{ color: resume.data.template?.secondaryColor || resume.data.selectedTemplate?.secondaryColor || resume.data.secondaryColor || '#374151' }}
                        >
                          {resume.user.position || resume.data.content?.bestJobTitle || resume.data.bestJobTitle || resume.data.headerInfo?.title || 'Professional'}
                        </p>
                        {(resume.user.location || resume.data.headerInfo?.location || resume.data.content?.location || resume.data.location) && (
                          <p className="text-gray-600">
                            {resume.user.location || resume.data.headerInfo?.location || resume.data.content?.location || resume.data.location}
                          </p>
                        )}
                      </div>

                      {/* Profile Photo - Positioned absolutely on the right */}
                      {resume.data.profilePhoto && (
                        <div className="absolute -top-2 right-0">
                          <div className="relative">
                            <img 
                              src={resume.data.profilePhoto} 
                              alt="Profile" 
                              className="w-32 h-32 rounded-lg object-cover border-4 shadow-lg"
                              style={{ borderColor: resume.data.template?.primaryColor || resume.data.selectedTemplate?.primaryColor || resume.data.primaryColor || '#6366f1' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div 
                    className="w-full h-0.5 my-6" 
                    style={{ 
                      backgroundColor: resume.data.template?.primaryColor || resume.data.selectedTemplate?.primaryColor || resume.data.primaryColor || '#6366f1',
                      opacity: 0.3
                    }}
                  ></div>

                   {/* Professional Summary */}
                   {(resume.data.content?.summary || resume.data.summary) && (
                     <div className="mb-6">
                       <div className="flex items-center gap-2 mb-3">
                         <div 
                           className="w-1 h-6 rounded-full"
                           style={{ backgroundColor: getTemplateColor('primary') }}
                         ></div>
                         <h2 
                           className="text-lg font-semibold text-gray-900"
                           style={{ color: getTemplateColor('primary') }}
                         >
                           Professional Summary
                         </h2>
                       </div>
                       <p 
                         className="text-gray-700 leading-relaxed pl-3 border-l-2"
                         style={{ borderColor: getTemplateColor('secondary') }}
                       >{resume.data.content?.summary || resume.data.summary}</p>
                     </div>
                   )}

                   {/* Work Experience */}
                   {((resume.data.content?.experience && resume.data.content.experience.length > 0) || (resume.data.experience && resume.data.experience.length > 0)) && (
                     <div className="mb-6">
                       <div className="flex items-center gap-2 mb-3">
                         <div 
                           className="w-1 h-6 rounded-full"
                           style={{ backgroundColor: getTemplateColor('primary') }}
                         ></div>
                         <h2 
                           className="text-lg font-semibold text-gray-900"
                           style={{ color: getTemplateColor('primary') }}
                         >
                           Work Experience
                         </h2>
                       </div>
                       <div className="space-y-4">
                         {(resume.data.content?.experience || resume.data.experience || []).map((exp: any, index: number) => (
                           <div key={index} className="border-l-4 pl-4 transition-all duration-200" style={{ borderColor: getTemplateColor('secondary') }}>
                             <div className="flex justify-between items-start mb-2">
                               <h3 className="font-semibold text-gray-900">{exp.title || exp.position}</h3>
                               <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{exp.duration}</span>
                             </div>
                             <p className="text-gray-600 mb-2 font-medium">{exp.company}</p>
                             {exp.description && (
                               <p className="text-gray-700 text-sm">{exp.description}</p>
                             )}
                             {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                               <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                 {exp.achievements.map((achievement: string, idx: number) => (
                                   <li key={idx} className="hover:text-gray-900 transition-colors">{achievement}</li>
                                 ))}
                               </ul>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Education */}
                   {((resume.data.content?.education && resume.data.content.education.length > 0) || (resume.data.education && resume.data.education.length > 0)) && (
                     <div className="mb-6">
                       <div className="flex items-center gap-2 mb-3">
                         <div 
                           className="w-1 h-6 rounded-full"
                           style={{ backgroundColor: getTemplateColor('primary') }}
                         ></div>
                         <h2 
                           className="text-lg font-semibold text-gray-900"
                           style={{ color: getTemplateColor('primary') }}
                         >
                           Education
                         </h2>
                       </div>
                       <div className="space-y-4">
                         {(resume.data.content?.education || resume.data.education || []).map((edu: any, index: number) => (
                           <div key={index} className="border-l-4 pl-4 transition-all duration-200" style={{ borderColor: getTemplateColor('secondary') }}>
                             <div className="flex justify-between items-start mb-2">
                               <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                               <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{edu.year}</span>
                             </div>
                             <p className="text-gray-600 mb-2 font-medium">{edu.institution}</p>
                             {edu.major && <p className="text-gray-700 text-sm">Major: {edu.major}</p>}
                             {Array.isArray(edu.highlights) && edu.highlights.length > 0 && (
                               <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                                 {edu.highlights.map((highlight: string, idx: number) => (
                                   <li key={idx} className="hover:text-gray-900 transition-colors">{highlight}</li>
                                 ))}
                               </ul>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Skills */}
                   {(resume.data.content?.skills || resume.data.skills) && (
                     <div className="mb-6">
                       <div className="flex items-center gap-2 mb-3">
                         <div 
                           className="w-1 h-6 rounded-full"
                           style={{ backgroundColor: getTemplateColor('primary') }}
                         ></div>
                         <h2 
                           className="text-lg font-semibold text-gray-900"
                           style={{ color: getTemplateColor('primary') }}
                         >
                           Skills
                         </h2>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {((resume.data.content?.skills?.technical && resume.data.content.skills.technical.length > 0) || (resume.data.skills?.technical && resume.data.skills.technical.length > 0)) && (
                           <div>
                             <h3 className="font-medium text-gray-900 mb-3">Technical Skills</h3>
                             <div className="flex flex-wrap gap-2">
                               {((resume.data.content?.skills?.technical || resume.data.skills?.technical) || []).map((skill: string, index: number) => (
                                 <Badge 
                                   key={index} 
                                   variant="secondary" 
                                   style={{ backgroundColor: getTemplateColor('secondary'), color: 'white' }}
                                   className="text-xs px-2 py-1"
                                 >
                                   {skill}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         )}
                         {((resume.data.content?.skills?.soft && resume.data.content.skills.soft.length > 0) || (resume.data.skills?.soft && resume.data.skills.soft.length > 0)) && (
                           <div>
                             <h3 className="font-medium text-gray-900 mb-3">Soft Skills</h3>
                             <div className="flex flex-wrap gap-2">
                               {((resume.data.content?.skills?.soft || resume.data.skills?.soft) || []).map((skill: string, index: number) => (
                                 <Badge 
                                   key={index} 
                                   variant="outline" 
                                   className="text-xs px-2 py-1 border-gray-300 text-gray-700"
                                 >
                                   {skill}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         )}
                         {((resume.data.content?.skills?.languages && resume.data.content.skills.languages.length > 0) || (resume.data.skills?.languages && resume.data.skills.languages.length > 0)) && (
                           <div>
                             <h3 className="font-medium text-gray-900 mb-3">Languages</h3>
                             <div className="flex flex-wrap gap-2">
                               {((resume.data.content?.skills?.languages || resume.data.skills?.languages) || []).map((skill: string, index: number) => (
                                 <Badge 
                                   key={index} 
                                   variant="outline" 
                                   className="text-xs px-2 py-1 border-blue-300 text-blue-700"
                                 >
                                   {skill}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                       {/* Fallback for simple skills array */}
                       {!resume.data.content?.skills?.technical && !resume.data.content?.skills?.soft && !resume.data.content?.skills?.languages && !resume.data.skills?.technical && !resume.data.skills?.soft && !resume.data.skills?.languages && Array.isArray(resume.data.content?.skills || resume.data.skills) && (
                         <div className="flex flex-wrap gap-2">
                           {(resume.data.content?.skills || resume.data.skills || []).map((skill: string, index: number) => (
                             <Badge 
                               key={index} 
                               variant="secondary" 
                               style={{ backgroundColor: getTemplateColor('secondary'), color: 'white' }}
                               className="text-xs px-2 py-1"
                             >
                               {skill}
                             </Badge>
                           ))}
                         </div>
                       )}
                     </div>
                   )}

                   {/* Certifications */}
                   {resume.data.content?.certifications && resume.data.content.certifications.length > 0 && (
                     <div className="mb-6">
                       <div className="flex items-center gap-2 mb-3">
                         <div 
                           className="w-1 h-6 rounded-full"
                           style={{ backgroundColor: getTemplateColor('primary') }}
                         ></div>
                         <h2 
                           className="text-lg font-semibold text-gray-900"
                           style={{ color: getTemplateColor('primary') }}
                         >
                           Certifications
                         </h2>
                       </div>
                       <div className="space-y-3">
                         {resume.data.content.certifications.map((cert: string, index: number) => (
                           <div key={index} className="border-l-4 pl-4 transition-all duration-200" style={{ borderColor: getTemplateColor('secondary') }}>
                             <div className="flex items-center gap-2">
                               <Award className="h-4 w-4 text-emerald-600" />
                               <span className="text-gray-700 font-medium">{cert}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Projects */}
                   {resume.data.content?.projects && resume.data.content.projects.length > 0 && (
                     <div className="mb-6">
                       <div className="flex items-center gap-2 mb-3">
                         <div 
                           className="w-1 h-6 rounded-full"
                           style={{ backgroundColor: getTemplateColor('primary') }}
                         ></div>
                         <h2 
                           className="text-lg font-semibold text-gray-900"
                           style={{ color: getTemplateColor('primary') }}
                         >
                           Projects
                         </h2>
                       </div>
                       <div className="space-y-4">
                         {resume.data.content.projects.map((project: any, index: number) => (
                           <div key={index} className="border-l-4 pl-4 transition-all duration-200" style={{ borderColor: getTemplateColor('secondary') }}>
                             <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                             {project.description && (
                               <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                             )}
                             {Array.isArray(project.technologies) && project.technologies.length > 0 && (
                               <div className="mb-2">
                                 <div className="flex flex-wrap gap-1">
                                   {project.technologies.map((tech: string, idx: number) => (
                                     <Badge 
                                       key={idx} 
                                       variant="outline" 
                                       className="text-xs px-2 py-1 border-violet-300 text-violet-700"
                                     >
                                       {tech}
                                     </Badge>
                                   ))}
                                 </div>
                               </div>
                             )}
                             {Array.isArray(project.impact) && project.impact.length > 0 && (
                               <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                 {project.impact.map((impact: string, idx: number) => (
                                   <li key={idx} className="hover:text-gray-900 transition-colors">{impact}</li>
                                 ))}
                               </ul>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Achievements */}
                   {resume.data.content?.achievements && resume.data.content.achievements.length > 0 && (
                     <div className="mb-6">
                       <div className="flex items-center gap-2 mb-3">
                         <div 
                           className="w-1 h-6 rounded-full"
                           style={{ backgroundColor: getTemplateColor('primary') }}
                         ></div>
                         <h2 
                           className="text-lg font-semibold text-gray-900"
                           style={{ color: getTemplateColor('primary') }}
                         >
                           Achievements
                         </h2>
                       </div>
                       <div className="space-y-3">
                         {resume.data.content.achievements.map((achievement: string, index: number) => (
                           <div key={index} className="border-l-4 pl-4 transition-all duration-200" style={{ borderColor: getTemplateColor('secondary') }}>
                             <div className="flex items-center gap-2">
                               <Trophy className="h-4 w-4 text-amber-600" />
                               <span className="text-gray-700">{achievement}</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Organizations */}
                   {resume.data.content?.organizations && resume.data.content.organizations.length > 0 && (
                     <div className="mb-6">
                       <div className="flex items-center gap-2 mb-3">
                         <div 
                           className="w-1 h-6 rounded-full"
                           style={{ backgroundColor: getTemplateColor('primary') }}
                         ></div>
                         <h2 
                           className="text-lg font-semibold text-gray-900"
                           style={{ color: getTemplateColor('primary') }}
                         >
                           Organizations & Activities
                         </h2>
                       </div>
                       <div className="space-y-4">
                         {resume.data.content.organizations.map((org: any, index: number) => (
                           <div key={index} className="border-l-4 pl-4 hover:border-l-4 hover:border-pink-500 transition-all duration-200" style={{ borderColor: getTemplateColor('secondary') }}>
                             <div className="flex justify-between items-start mb-2">
                               <h3 className="font-semibold text-gray-900">{org.role || org.title}</h3>
                               <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{org.duration}</span>
                             </div>
                             <p className="text-gray-600 mb-2 font-medium">{org.organization || org.company}</p>
                             {org.description && <p className="text-gray-700 text-sm">{org.description}</p>}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Debug: Show raw data if no structured content found */}
                       {!getResumeContent('summary') && !getResumeContent('experience', []).length && !getResumeContent('education', []).length && !getResumeContent('skills') && (
                     <div className="bg-gray-50 p-6 rounded-lg">
                       <p className="text-gray-600 mb-4">
                         No structured content found. Showing raw data:
                       </p>
                       <details>
                         <summary className="text-blue-600 cursor-pointer">Show raw data</summary>
                         <pre className="mt-2 text-xs text-gray-500 overflow-auto">
                           {JSON.stringify(resume.data, null, 2)}
                         </pre>
                       </details>
                         </div>
                       )}
                     </div>
                   )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No resume content available</p>
                </div>
              )}
            </motion.div>
            
            {/* Create Your Own Resume CTA - Only for non-owners */}
            {!isOwner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-500 p-[2px]">
                  <div className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse rounded-2xl" />
                    
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                          <span className="text-3xl">🎉</span>
                          <span className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-sm font-bold rounded-full">
                            100% FREE
                          </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                          Create Your Own AI-Powered Resume!
                        </h3>
                        <p className="text-gray-300 max-w-lg">
                          This resume was created for FREE using BPOC.IO&apos;s AI resume builder. 
                          Upload your old resume and let AI transform it in minutes!
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <a
                          href="/candidate/resume"
                          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-cyan-500/25 text-center whitespace-nowrap"
                        >
                          🚀 Build My Resume FREE
                        </a>
                        <p className="text-gray-500 text-xs text-center">No credit card required</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-2xl"
          >
            {/* Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-2xl animate-pulse"></div>
            
            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-2 border-cyan-400/30 shadow-2xl overflow-hidden">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-3xl">✓</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Text Copied Successfully!</h3>
                      <p className="text-cyan-100 text-sm">Ready to share on {shareModalData.platform}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Instructions */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl p-5 border border-cyan-400/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xl">💡</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">What to do next:</h4>
                      <ol className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold mt-0.5">1.</span>
                          <span>The {shareModalData.platform} share dialog will open in 1.5 seconds</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold mt-0.5">2.</span>
                          <span>Paste the text below (Ctrl+V or Cmd+V) into the post box</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold mt-0.5">3.</span>
                          <span>Your resume image will appear automatically - just hit Share!</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Text Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Post Text Preview</label>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shareModalData.text);
                          const btn = document.getElementById('copy-again-btn');
                          if (btn) {
                            btn.textContent = '✓ Copied!';
                            setTimeout(() => {
                              btn.textContent = 'Copy Again';
                            }, 2000);
                          }
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                      id="copy-again-btn"
                      className="text-xs px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-400/30 transition-all duration-200 hover:scale-105 font-medium"
                    >
                      Copy Again
                    </button>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10 max-h-48 overflow-y-auto">
                    <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {shareModalData.text}
                    </p>
                  </div>
                </div>

                {/* BPOC Branding Footer */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    BPOC.IO
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-sm">Where BPO Careers Begin</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Got It! 👍
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
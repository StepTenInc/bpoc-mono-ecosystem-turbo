'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  Palette, 
  Type, 
  Save,
  ArrowLeft,
  CheckCircle,
  Briefcase,
  FileText,
  Sparkles,
  Camera,
  User,
  Loader2,
  Download,
  ZoomIn,
  ZoomOut,
  GraduationCap,
  Phone,
  MapPin,
  Mail,
  X,
  MessageSquare,
  Wand2,
  ExternalLink,
  Home,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';
import { toast } from '@/components/ui/toast';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/image-crop-utils';
import { supabase } from '@/lib/supabase';
import { optimizeImage } from '@/lib/storage';
import { ResumePreview } from '@/features/resume-builder/components/templates';

// Template definitions - TRULY DIFFERENT LAYOUTS!
const templates = [
  { id: 'modern', name: 'Modern', emoji: '💻', description: '2-Column Sidebar' },
  { id: 'executive', name: 'Executive', emoji: '👔', description: 'Classic Traditional' },
  { id: 'creative', name: 'Creative', emoji: '🎨', description: 'Bold Portfolio Style' },
  { id: 'minimal', name: 'Minimal', emoji: '📋', description: 'Typography Focused' },
];

// Color schemes - User can pick OR customize
const colorSchemes = [
  { id: 'ocean', name: 'Ocean', primary: '#0ea5e9', secondary: '#7c3aed', icon: '🌊' },
  { id: 'sunset', name: 'Sunset', primary: '#f97316', secondary: '#ec4899', icon: '🌅' },
  { id: 'forest', name: 'Forest', primary: '#10b981', secondary: '#059669', icon: '🌲' },
  { id: 'royal', name: 'Royal', primary: '#1e3a8a', secondary: '#7c3aed', icon: '👑' },
  { id: 'fire', name: 'Fire', primary: '#ef4444', secondary: '#f97316', icon: '🔥' },
  { id: 'berry', name: 'Berry', primary: '#d946ef', secondary: '#ec4899', icon: '🍇' },
  { id: 'slate', name: 'Slate', primary: '#475569', secondary: '#64748b', icon: '🪨' },
  { id: 'custom', name: 'Custom', primary: '#0ea5e9', secondary: '#7c3aed', icon: '🎨' },
];

// Layout styles - Structure & typography only (colors come from user selection)
const layoutStyles: Record<string, {
  headerTextClass: string;
  sectionHeadingClass: string;
  bodyTextClass: string;
  chipStyle: 'rounded' | 'rounded-full' | 'rounded-lg';
  listClass: string;
  dateStyle: 'normal' | 'bold' | 'accent';
  borderStyle: 'solid' | 'dashed' | 'dotted';
}> = {
  modern: {
    headerTextClass: 'text-white',
    sectionHeadingClass: 'tracking-wider uppercase text-sm',
    bodyTextClass: 'text-gray-700',
    chipStyle: 'rounded',
    listClass: 'list-disc list-inside space-y-1 text-sm text-gray-600',
    dateStyle: 'normal',
    borderStyle: 'solid'
  },
  executive: {
    headerTextClass: 'text-gray-50',
    sectionHeadingClass: 'tracking-[0.2em] uppercase text-[11px]',
    bodyTextClass: 'text-gray-800 font-serif',
    chipStyle: 'rounded-full',
    listClass: 'list-disc list-inside space-y-1 text-sm text-gray-700',
    dateStyle: 'bold',
    borderStyle: 'solid'
  },
  creative: {
    headerTextClass: 'text-white',
    sectionHeadingClass: 'tracking-wide uppercase text-sm',
    bodyTextClass: 'text-gray-800',
    chipStyle: 'rounded-lg',
    listClass: 'list-disc list-inside space-y-1 text-sm text-gray-700',
    dateStyle: 'accent',
    borderStyle: 'solid'
  },
  minimal: {
    headerTextClass: 'text-gray-900',
    sectionHeadingClass: 'tracking-wide uppercase text-sm text-gray-500',
    bodyTextClass: 'text-gray-700',
    chipStyle: 'rounded',
    listClass: 'list-disc list-inside space-y-1 text-sm text-gray-700',
    dateStyle: 'normal',
    borderStyle: 'dotted'
  }
};

// Helper to generate dynamic styles based on user's color choices
const generateDynamicStyles = (primary: string, secondary: string, layout: string) => {
  const layoutStyle = layoutStyles[layout] || layoutStyles.modern;
  // Executive and Minimal templates use white/light headers, not gradients
  const isLightHeader = layout === 'minimal' || layout === 'executive';
  
  return {
    headerBg: isLightHeader ? '#ffffff' : `linear-gradient(135deg, ${primary}, ${secondary})`,
    headerText: layoutStyle.headerTextClass,
    // Use inline styles for dynamic colors (Tailwind can't purge arbitrary values)
    sectionBorderStyle: { borderBottomWidth: '2px', borderStyle: layoutStyle.borderStyle, borderColor: `${primary}30` },
    sectionHeadingClass: layoutStyle.sectionHeadingClass,
    bodyTextClass: layoutStyle.bodyTextClass,
    // Chip styles use inline for colors
    chipClass: `px-2 py-0.5 text-xs ${layoutStyle.chipStyle}`,
    chipStyle: { backgroundColor: `${primary}15`, color: primary },
    chipAltClass: `px-2 py-0.5 bg-gray-50 text-gray-600 text-xs ${layoutStyle.chipStyle} border border-gray-200`,
    listClass: layoutStyle.listClass,
    experienceDateClass: layoutStyle.dateStyle === 'bold' || layoutStyle.dateStyle === 'accent'
      ? 'text-xs font-semibold'
      : 'text-xs text-gray-500',
    experienceDateStyle: layoutStyle.dateStyle !== 'normal' ? { color: primary } : {},
    accent: primary,
  };
};

const quickColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#1e3a8a', '#374151'];

// Helper to check if a date string is invalid/placeholder
const isInvalidDate = (date: string | undefined | null): boolean => {
  if (!date) return true;
  if (typeof date !== 'string') return false;
  const lower = date.toLowerCase();
  return lower.includes('to be specified') || 
         lower.includes('undefined') || 
         lower.includes('n/a') ||
         lower === 'null' ||
         lower === '';
};

// Helper: convert data URL to File
const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const type = blob.type || 'image/png';
  return new File([blob], fileName, { type });
};

// Resume data is loaded from localStorage or API - no mock data

export default function ResumeBuildPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [candidateProfile, setCandidateProfile] = useState<{ position?: string } | null>(null);
  
  // Helper function to get job title with multiple fallbacks (same as public resume page)
  const getJobTitle = () => {
    return candidateProfile?.position ||
           resumeData?.bestJobTitle ||
           resumeData?.position ||
           resumeData?.title ||
           resumeData?.jobTitle ||
           resumeData?.content?.bestJobTitle ||
           resumeData?.headerInfo?.title ||
           'Professional Title';
  };
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Resume data
  const [resumeData, setResumeData] = useState<any>(null);
  
  // Customization - Separate Layout from Colors!
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedColorScheme, setSelectedColorScheme] = useState('ocean');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#7c3aed');
  const [zoom, setZoom] = useState(1.0); // Default to 100%
  
  // Compute dynamic styles based on user's color choices
  const currentStyle = generateDynamicStyles(primaryColor, secondaryColor, selectedTemplate);
  
  // Editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Photo
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropState, setCropState] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  // AI Panel
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [improvingSection, setImprovingSection] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [aiMessages, setAiMessages] = useState<{role: 'ai' | 'user', content: string}[]>([
    { role: 'ai', content: "👋 Hi! I'm your AI Resume Coach. I'll help you build a perfect resume that gets you hired!\n\nI can see what's missing and guide you step by step. Click any missing item or use the quick actions above!" }
  ]);
  
  // Update AI welcome message based on source (from-scratch vs upload)
  useEffect(() => {
    const resumeSource = localStorage.getItem('bpoc_resume_source');
    const aiAnalysis = localStorage.getItem('bpoc_ai_analysis');
    
    // Different welcome messages based on path
    if (resumeSource === 'from_scratch') {
      // NEW RESUME PATH - Help them build from scratch
      setAiMessages([{
        role: 'ai',
        content: `👋 Hi! I'm here to help you BUILD your first resume!\n\n🆕 Since you're starting fresh, I'll guide you through each section:\n\n1️⃣ **Summary** - Let's create a powerful intro\n2️⃣ **Experience** - We'll highlight your work history\n3️⃣ **Skills** - I'll help pick the right keywords\n4️⃣ **Education** - Add your qualifications\n\n✨ Click any section to start, or use "AI Improve" to let me write content for you!\n\n💡 Tip: Based on what you told me earlier, I already have ideas for your resume!`
      }]);
    } else if (resumeSource === 'existing_resume' && aiAnalysis) {
      // EXISTING RESUME PATH - Help them improve
      try {
        const analysis = JSON.parse(aiAnalysis);
        const missingCount = (analysis.improvements?.length || 0);
        const score = analysis.overallScore || 70;
        
        if (missingCount > 0 || score < 80) {
          setAiMessages([{
            role: 'ai',
            content: `👋 Welcome back! I've analyzed your existing resume and found some opportunities to improve.\n\n📊 Your current score: ${score}/100\n\n${missingCount > 0 ? `📝 ${missingCount} areas to enhance - click the items in "Missing" section to add them!\n\n` : ''}Use the quick actions above to:\n• ✨ Improve sections with AI\n• 🎯 Optimize for ATS\n• 📄 Change your template style`
          }]);
        }
      } catch (e) {
        // Keep default message
      }
    } else if (aiAnalysis) {
      // Fallback - has analysis but no source flag
      try {
        const analysis = JSON.parse(aiAnalysis);
        const missingCount = (analysis.improvements?.length || 0);
        const score = analysis.overallScore || 70;
        
        if (missingCount > 0 || score < 80) {
          setAiMessages([{
            role: 'ai',
            content: `👋 Welcome! I've analyzed your resume.\n\n📊 Score: ${score}/100\n\n${missingCount > 0 ? `📝 ${missingCount} areas to enhance!\n\n` : ''}Click any section to improve it with AI!`
          }]);
        }
      } catch (e) {
        // Keep default message
      }
    }
    
    // Clean up the source flag after reading (one-time use)
    // localStorage.removeItem('bpoc_resume_source');
  }, []);
  
  // Smart input modal
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputModalData, setInputModalData] = useState<{
    title: string;
    fields: { key: string; label: string; placeholder: string; type?: string; required?: boolean }[];
    onSubmit: (values: Record<string, string>) => void;
  } | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Detect missing fields with smart analysis
  useEffect(() => {
    if (!resumeData) return;
    const missing: string[] = [];
    
    // Check missing fields
    
    // Contact info
    if (!resumeData.phone || resumeData.phone === 'Add phone') {
      missing.push('📱 Phone number');
    }
    if (!resumeData.location || resumeData.location === 'Add location') {
      missing.push('📍 Location');
    }
    
    // Content sections
    if (!resumeData.summary || resumeData.summary.length < 30) {
      missing.push('📝 Professional summary');
    }
    if (!resumeData.experience?.length) {
      missing.push('💼 Work experience');
    }
    if (!resumeData.education?.length) {
      missing.push('🎓 Education');
    }
    
    // Skills - only flag if completely empty
    if (!resumeData.skills?.technical?.length && !resumeData.skills?.soft?.length) {
      missing.push('🛠️ Skills');
    }
    
    // Check experience quality - be more specific
    resumeData.experience?.forEach((exp: any, i: number) => {
      const hasDate = exp.duration || exp.dates;
      const isDateValid = hasDate && 
        !hasDate.toLowerCase().includes('to be specified') && 
        !hasDate.toLowerCase().includes('undefined') &&
        !hasDate.toLowerCase().includes('n/a');
      
      if (!isDateValid) {
        missing.push(`📅 Dates for ${exp.title || exp.position || exp.company || `Job #${i+1}`}`);
      }
      if (!exp.achievements?.length) {
        missing.push(`✨ Achievements for ${exp.title || exp.position || `Job #${i+1}`}`);
      }
    });
    
    // Check education quality
    resumeData.education?.forEach((edu: any, i: number) => {
      if (!edu.degree || edu.degree === 'undefined' || edu.degree.includes('undefined')) {
        missing.push(`🎓 Degree for Education #${i+1}`);
      }
      if (!edu.institution || edu.institution === 'undefined') {
        missing.push(`🏫 School for Education #${i+1}`);
      }
    });
    
    setMissingFields(missing);
  }, [resumeData]);

  // Normalize resume data to ensure arrays are arrays
  const normalizeResumeData = (data: any) => {
    if (!data) return data;
    return {
      ...data,
      experience: Array.isArray(data.experience) ? data.experience : [],
      education: Array.isArray(data.education) ? data.education : [],
      skills: {
        technical: Array.isArray(data.skills?.technical) ? data.skills.technical : [],
        soft: Array.isArray(data.skills?.soft) ? data.skills.soft : [],
      },
    };
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Step 1: Fetch candidate data ONCE (if logged in)
        let candidateData: any = null;
        if (user?.id) {
          try {
            const candidateRes = await fetch(`/api/candidates/${user.id}`);
            if (candidateRes.ok) {
              const data = await candidateRes.json();
              candidateData = data.candidate;
              console.log('📋 Candidate data loaded once:', { 
                name: `${candidateData?.first_name} ${candidateData?.last_name}`,
                hasAvatar: !!candidateData?.avatar_url
              });
            }
          } catch (err) {
            console.warn('Could not fetch candidate data:', err);
          }
        }

        // Set avatar from candidate data (only place we do this)
        if (candidateData?.avatar_url) {
          setProfileImage(candidateData.avatar_url);
        }
        
        // Store candidate profile
        if (candidateData) {
          setCandidateProfile({
            position: candidateData.position,
            location: candidateData.location,
            phone: candidateData.phone,
            email: candidateData.email,
            avatar_url: candidateData.avatar_url,
          });
        }

        // Step 2: Try to get resume data from API
        let resumeLoaded = false;
        if (user?.id) {
          const sessionToken = await getSessionToken();
          if (sessionToken) {
            const res = await fetch('/api/user/resume-for-build', {
              headers: { 
                'Authorization': `Bearer ${sessionToken}`, 
                'x-user-id': String(user.id) 
              }
            });
            if (res.ok) {
              const data = await res.json();
              const resumePayload = data.improvedResume || data.resumeData || data.extractedResume;
              
              if (data.hasData && resumePayload) {
                const normalized = normalizeResumeData(resumePayload);
                
                // Fill in missing fields from candidate profile
                if (candidateData) {
                  if (!normalized.name) normalized.name = `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim();
                  if (!normalized.email) normalized.email = candidateData.email;
                  if (!normalized.phone || normalized.phone === 'Add phone') normalized.phone = candidateData.phone;
                  if (!normalized.location || normalized.location === 'Add location') normalized.location = candidateData.location;
                  if (!normalized.bestJobTitle) normalized.bestJobTitle = candidateData.position;
                }
                
                setResumeData(normalized);
                resumeLoaded = true;
                
                // Load template/colors if saved
                if (resumePayload?.primaryColor) setPrimaryColor(resumePayload.primaryColor);
                if (resumePayload?.secondaryColor) setSecondaryColor(resumePayload.secondaryColor);
                if (resumePayload?.selectedTemplate && layoutStyles[resumePayload.selectedTemplate]) {
                  setSelectedTemplate(resumePayload.selectedTemplate);
                }
                if (data.template?.id && layoutStyles[data.template.id]) {
                  setSelectedTemplate(data.template.id);
                }
                
                localStorage.setItem('bpoc_generated_resume', JSON.stringify(normalized));
              }
            }
          }
        }
        
        // Step 3: Try localStorage if API didn't have data
        if (!resumeLoaded) {
          const stored = localStorage.getItem('bpoc_generated_resume') ||
                         localStorage.getItem('anon_extracted_resume');
          
          if (stored) {
            const parsed = normalizeResumeData(JSON.parse(stored));
            setResumeData(parsed);
            resumeLoaded = true;
            
            if (parsed?.primaryColor) setPrimaryColor(parsed.primaryColor);
            if (parsed?.secondaryColor) setSecondaryColor(parsed.secondaryColor);
            if (parsed?.templateId && layoutStyles[parsed.templateId]) {
              setSelectedTemplate(parsed.templateId);
            }
          }
        }
        
        // Step 4: If still no resume, create one from profile data (NOT mock data)
        if (!resumeLoaded) {
          if (candidateData) {
            // Build resume from profile - no mock data!
            const profileResume = {
              name: `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim() || 'Your Name',
              email: candidateData.email || '',
              phone: candidateData.phone || '',
              location: candidateData.location || '',
              bestJobTitle: candidateData.position || 'Your Title',
              summary: candidateData.bio || '',
              experience: [],
              education: [],
              skills: { technical: [], soft: [] },
            };
            setResumeData(normalizeResumeData(profileResume));
            toast.info('Resume created from your profile. Add your experience and skills!');
          } else {
            // Truly new user with no profile - empty template
            const emptyResume = {
              name: 'Your Name',
              email: user?.email || '',
              phone: '',
              location: '',
              bestJobTitle: 'Your Title',
              summary: '',
              experience: [],
              education: [],
              skills: { technical: [], soft: [] },
            };
            setResumeData(normalizeResumeData(emptyResume));
            toast.info('Start building your resume! Fill in your details.');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Load error:', err);
        // Even on error, show empty template not mock data
        setResumeData(normalizeResumeData({
          name: 'Your Name',
          email: user?.email || '',
          phone: '',
          location: '',
          bestJobTitle: 'Your Title',
          summary: '',
          experience: [],
          education: [],
          skills: { technical: [], soft: [] },
        }));
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id]);

  // Field editing
  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value || '');
  };
  
  const saveEdit = () => {
    if (!editingField) return;
    setResumeData((prev: any) => {
      const base = prev ?? {};
      const updated = { ...base, [editingField]: editValue };
      localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
      return updated;
    });
    setEditingField(null);
    toast.success('Updated!');
  };

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setShowCropModal(true);
    };
    reader.onerror = (err) => {
      console.error('Image upload error:', err);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropSave = async () => {
    if (!tempImage || !croppedAreaPixels) {
      toast.error('No image to crop');
      return;
    }
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
      // Convert Blob to data URL for display
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfileImage(dataUrl);
        // persist locally immediately
        setResumeData((prev: any) => {
          const base = prev ?? {};
          const updated = { ...base, profilePhoto: dataUrl };
          localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
          return updated;
        });
        setShowCropModal(false);
        setTempImage(null);
        toast.success('📸 Photo updated!');
        
        // Add AI message
        setAiMessages(prev => [...prev, 
          { role: 'ai', content: '📸 Great photo! A professional headshot makes your resume stand out. Your photo has been added to the header.' }
        ]);
      };
      reader.readAsDataURL(croppedBlob);
    } catch (err) {
      console.error('Image crop error:', err);
      toast.error('Failed to crop image. Try a different photo.');
    }
  };

  // AI Improve
  const handleAiImprove = async (section: string, content: string | any) => {
    if (!content) {
      toast.error('No content to improve');
      return;
    }
    
    // Convert content to string if it's an object
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    
    setImprovingSection(section);
    setAiMessages(prev => [...prev, 
      { role: 'user', content: `Improve my ${section}` },
      { role: 'ai', content: `✨ Improving your ${section}...` }
    ]);
    try {
      const res = await fetch('/api/ai/improve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, content: contentString, context: resumeData?.bestJobTitle })
      });
      if (res.ok) {
        const { improved } = await res.json();
        if (improved) {
          setResumeData((prev: any) => {
            // If improved is a string but section expects an object/array, try to parse
            let improvedValue = improved;
            if (typeof improved === 'string' && (section === 'experience' || section === 'skills' || section === 'education')) {
              try {
                improvedValue = JSON.parse(improved);
              } catch {
                // If parsing fails, use as-is
                improvedValue = improved;
              }
            }
            
            const updated = { ...prev, [section]: improvedValue };
            localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
            return updated;
          });
          setAiMessages(prev => [...prev.slice(0, -1), 
            { role: 'ai', content: `✅ Done! I've enhanced your ${section} with stronger action words, better structure, and quantifiable achievements. Check the preview to see the changes!` }
          ]);
          toast.success('✨ AI improved!');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'API failed');
      }
    } catch (error) {
      console.error('AI improve error:', error);
      setAiMessages(prev => [...prev.slice(0, -1), 
        { role: 'ai', content: `❌ Sorry, I couldn't improve that section. ${error instanceof Error ? error.message : 'Please try again.'}` }
      ]);
      toast.error('AI improvement failed');
    }
    setImprovingSection(null);
  };

  // Optimize for ATS
  const handleOptimizeATS = async () => {
    setAiLoading(true);
    setAiMessages(prev => [...prev, 
      { role: 'user', content: 'Optimize my resume for ATS' },
      { role: 'ai', content: '🎯 Analyzing your resume for ATS optimization...' }
    ]);
    
    try {
      // Improve summary for ATS
      if (resumeData?.summary) {
        const res = await fetch('/api/ai/improve-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            section: 'summary', 
            content: resumeData.summary, 
            context: `${resumeData.bestJobTitle} - Optimize for ATS with keywords` 
          })
        });
        if (res.ok) {
          const { improved } = await res.json();
          if (improved) {
            setResumeData((prev: any) => {
              const updated = { ...prev, summary: improved };
              localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
              return updated;
            });
          }
        }
      }
      
      setAiMessages(prev => [...prev.slice(0, -1), 
        { role: 'ai', content: `✅ ATS Optimization Complete!\n\n📋 What I did:\n• Added industry-relevant keywords\n• Improved formatting for ATS parsing\n• Enhanced action verbs\n• Standardized date formats\n\n💡 Tips:\n• Use standard section headings\n• Avoid tables/graphics\n• Include job-specific keywords` }
      ]);
      toast.success('🎯 ATS Optimized!');
    } catch {
      setAiMessages(prev => [...prev.slice(0, -1), 
        { role: 'ai', content: '❌ ATS optimization failed. Please try again.' }
      ]);
    }
    setAiLoading(false);
  };

  // Smart modal opener for different field types
  const openSmartModal = (fieldType: string) => {
    const fieldLower = fieldType.toLowerCase();
    
    if (fieldLower.includes('phone')) {
      setInputModalData({
        title: '📱 Add Your Phone Number',
        fields: [
          { key: 'phone', label: 'Phone Number', placeholder: '+63 912 345 6789', required: true }
        ],
        onSubmit: (values) => {
          updateResumeField('phone', values.phone);
          addAiMessage('ai', `✅ Perfect! Added your phone: ${values.phone}\n\nRecruiters can now contact you directly. This is essential for job applications!`);
        }
      });
      setInputValues({ phone: resumeData?.phone || '' });
      setShowInputModal(true);
      
    } else if (fieldLower.includes('location')) {
      setInputModalData({
        title: '📍 Where Are You Located?',
        fields: [
          { key: 'city', label: 'City', placeholder: 'Manila', required: true },
          { key: 'country', label: 'Country', placeholder: 'Philippines', required: true }
        ],
        onSubmit: (values) => {
          const location = `${values.city}, ${values.country}`;
          updateResumeField('location', location);
          addAiMessage('ai', `✅ Location set to ${location}!\n\nThis helps recruiters know if you're local or open to relocation. Many BPO jobs prefer candidates in Metro Manila.`);
        }
      });
      setInputValues({ city: '', country: 'Philippines' });
      setShowInputModal(true);
      
    } else if (fieldLower.includes('education') || fieldLower.includes('school') || fieldLower.includes('degree')) {
      setInputModalData({
        title: '🎓 Tell Me About Your Education',
        fields: [
          { key: 'degree', label: 'What degree/diploma do you have?', placeholder: 'Bachelor of Science in Business Administration', required: true },
          { key: 'institution', label: 'Where did you study?', placeholder: 'University of the Philippines', required: true },
          { key: 'year', label: 'What year did you graduate?', placeholder: '2020', required: true }
        ],
        onSubmit: (values) => {
          const newEducation = {
            degree: values.degree,
            institution: values.institution,
            year: values.year
          };
          const updatedEducation = [...(resumeData?.education || []), newEducation];
          updateResumeField('education', updatedEducation);
          addAiMessage('ai', `✅ Education added!\n\n🎓 ${values.degree}\n🏫 ${values.institution}\n📅 ${values.year}\n\nEducation credentials are important for BPO roles. Many companies require at least 2 years of college.`);
        }
      });
      setInputValues({ degree: '', institution: '', year: '' });
      setShowInputModal(true);
      
    } else if (fieldLower.includes('experience') || fieldLower.includes('work') || fieldLower.includes('job')) {
      setInputModalData({
        title: '💼 Add Work Experience',
        fields: [
          { key: 'title', label: 'Job Title', placeholder: 'Customer Support Representative', required: true },
          { key: 'company', label: 'Company Name', placeholder: 'Accenture Philippines', required: true },
          { key: 'duration', label: 'Duration (e.g., Jan 2020 - Present)', placeholder: 'Jan 2020 - Present', required: true },
          { key: 'achievement1', label: 'Key Achievement #1', placeholder: 'Handled 100+ customer inquiries daily', required: false },
          { key: 'achievement2', label: 'Key Achievement #2', placeholder: 'Maintained 95% customer satisfaction', required: false }
        ],
        onSubmit: (values) => {
          const achievements = [values.achievement1, values.achievement2].filter(a => a?.trim());
          const newExp = {
            title: values.title,
            company: values.company,
            duration: values.duration,
            achievements: achievements.length > 0 ? achievements : ['Contributed to team success']
          };
          const updatedExp = [...(resumeData?.experience || []), newExp];
          updateResumeField('experience', updatedExp);
          addAiMessage('ai', `✅ Experience added!\n\n💼 ${values.title} at ${values.company}\n📅 ${values.duration}\n\n💡 Tip: Use numbers to quantify your achievements (e.g., "Increased sales by 25%"). This makes your resume more impactful!`);
        }
      });
      setInputValues({ title: '', company: '', duration: '', achievement1: '', achievement2: '' });
      setShowInputModal(true);
      
    } else if (fieldLower.includes('skill')) {
      setInputModalData({
        title: '🛠️ Add Your Skills',
        fields: [
          { key: 'technical', label: 'Technical Skills (comma separated)', placeholder: 'Microsoft Office, Zendesk, Salesforce, CRM', required: false },
          { key: 'soft', label: 'Soft Skills (comma separated)', placeholder: 'Communication, Problem Solving, Leadership', required: false }
        ],
        onSubmit: (values) => {
          const technical = values.technical?.split(',').map(s => s.trim()).filter(s => s) || [];
          const soft = values.soft?.split(',').map(s => s.trim()).filter(s => s) || [];
          const updatedSkills = {
            technical: [...(resumeData?.skills?.technical || []), ...technical],
            soft: [...(resumeData?.skills?.soft || []), ...soft]
          };
          updateResumeField('skills', updatedSkills);
          addAiMessage('ai', `✅ Skills added!\n\n🔧 Technical: ${technical.join(', ') || 'None added'}\n🤝 Soft: ${soft.join(', ') || 'None added'}\n\n💡 For BPO roles, highlight: English proficiency, computer literacy, typing speed, and customer service skills!`);
        }
      });
      setInputValues({ technical: '', soft: '' });
      setShowInputModal(true);
      
    } else if (fieldLower.includes('summary')) {
      setInputModalData({
        title: '📝 Write Your Professional Summary',
        fields: [
          { key: 'summary', label: 'Tell us about yourself in 2-3 sentences', placeholder: 'Dedicated customer support professional with 3+ years of experience in the BPO industry. Proven track record of maintaining high customer satisfaction scores. Fluent in English with excellent communication skills.', type: 'textarea', required: true }
        ],
        onSubmit: (values) => {
          updateResumeField('summary', values.summary);
          addAiMessage('ai', `✅ Summary added!\n\nI can make this even better - click "Improve Summary" to enhance it with AI!`);
        }
      });
      setInputValues({ summary: resumeData?.summary || '' });
      setShowInputModal(true);
      
    } else if (fieldLower.includes('date')) {
      // Handle experience dates
      const expMatch = fieldLower.match(/dates for (.+)/i);
      const expTitle = expMatch ? expMatch[1] : 'this position';
      
      setInputModalData({
        title: `📅 Add Dates for ${expTitle}`,
        fields: [
          { key: 'startDate', label: 'Start Date', placeholder: 'Jan 2020', required: true },
          { key: 'endDate', label: 'End Date (or "Present")', placeholder: 'Present', required: true }
        ],
        onSubmit: (values) => {
          const duration = `${values.startDate} - ${values.endDate}`;
          // Find and update the experience
          const updatedExp = resumeData?.experience?.map((exp: any) => {
            if (exp.title?.toLowerCase().includes(expTitle.toLowerCase()) || !exp.duration) {
              return { ...exp, duration };
            }
            return exp;
          });
          if (updatedExp) {
            updateResumeField('experience', updatedExp);
          }
          addAiMessage('ai', `✅ Dates added: ${duration}\n\nRecruiters look at employment gaps, so accurate dates are important!`);
        }
      });
      setInputValues({ startDate: '', endDate: 'Present' });
      setShowInputModal(true);
      
    } else {
      // Generic handler
      addAiMessage('ai', `I'll help you add ${fieldType}. Look at the resume preview and click on that section to edit it directly!`);
      toast.info(`Click on ${fieldType} in the resume to edit`);
    }
  };
  
  // Helper to update resume field
  const updateResumeField = (field: string, value: any) => {
    setResumeData((prev: any) => {
      const base = prev ?? {};
      const updated = { ...base, [field]: value };
      localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
      return updated;
    });
    toast.success('Resume updated!');
  };
  
  // Helper to add AI message
  const addAiMessage = (role: 'ai' | 'user', content: string) => {
    setAiMessages(prev => [...prev, { role, content }]);
  };
  
  // Handle modal submit
  const handleModalSubmit = () => {
    if (!inputModalData) return;
    
    // Validate required fields
    const missingRequired = inputModalData.fields
      .filter(f => f.required && !inputValues[f.key]?.trim())
      .map(f => f.label);
    
    if (missingRequired.length > 0) {
      toast.error(`Please fill in: ${missingRequired.join(', ')}`);
      return;
    }
    
    inputModalData.onSubmit(inputValues);
    setShowInputModal(false);
    setInputModalData(null);
    setInputValues({});
  };

  // Wrapper for the add missing info button
  const handleAddMissingInfo = (field: string) => {
    addAiMessage('user', `I want to add ${field}`);
    openSmartModal(field);
  };

  // Improve all sections
  const handleImproveAll = async () => {
    setAiLoading(true);
    setAiMessages(prev => [...prev, 
      { role: 'user', content: 'Improve my entire resume' },
      { role: 'ai', content: '🚀 Starting full resume enhancement... This may take a moment.' }
    ]);
    
    try {
      const improvements: string[] = [];
      
      // Improve summary
      if (resumeData?.summary) {
        await handleAiImprove('summary', resumeData.summary);
        improvements.push('summary');
      }
      
      // Improve experience
      if (resumeData?.experience?.length) {
        const experienceJson = JSON.stringify(resumeData.experience);
        await handleAiImprove('experience', experienceJson);
        improvements.push('experience');
      }
      
      // Improve skills
      if (resumeData?.skills && (resumeData.skills.technical?.length || resumeData.skills.soft?.length)) {
        const skillsJson = JSON.stringify(resumeData.skills);
        await handleAiImprove('skills', skillsJson);
        improvements.push('skills');
      }
      
      // Improve education
      if (resumeData?.education?.length) {
        const educationJson = JSON.stringify(resumeData.education);
        await handleAiImprove('education', educationJson);
        improvements.push('education');
      }
      
      setAiMessages(prev => [...prev, 
        { role: 'ai', content: `✅ Full enhancement complete! I've improved your ${improvements.join(', ')} with stronger language, better structure, and quantifiable achievements. Check the preview to see all the changes!` }
      ]);
      toast.success('🚀 Resume enhanced!');
    } catch (error) {
      console.error('Enhancement error:', error);
      setAiMessages(prev => [...prev, 
        { role: 'ai', content: '❌ Some sections failed to enhance. Please try improving individual sections.' }
      ]);
      toast.error('Some enhancements failed');
    }
    setAiLoading(false);
  };

  // Export to PDF function using Puppeteer (EXACT COPY from public resume page)
  const handleExportPDF = async () => {
    console.log('Export PDF clicked!');
    const element = document.getElementById('resume-preview');

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
      
      // DON'T remove elements here - it breaks the DOM structure for copyStylesToClone!
      // Instead, hide them with CSS (done in the style block below)
      
      // Get computed styles for child elements (apply to ORIGINAL first - this is how public page does it!)
      // Only apply essential visual styles - colors, fonts, backgrounds
      const allElements = element.querySelectorAll('*');
      allElements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const htmlEl = el as HTMLElement;
        
        // PRESERVE gradients and background images! (essential for sidebar)
        if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
          htmlEl.style.backgroundImage = computedStyle.backgroundImage;
        }
        // Only set backgroundColor if no gradient
        if (!htmlEl.style.backgroundImage && computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          htmlEl.style.backgroundColor = computedStyle.backgroundColor;
        }
        
        // Text colors
        if (computedStyle.color) htmlEl.style.color = computedStyle.color;
        
        // DON'T copy: fontSize, fontWeight, fontFamily, margin, padding
        // These are handled by CSS classes and copying them inline can break layout
      });
      
      // Clean up problematic styles from CLONED element (minimal changes to preserve layout)
      const allClonedElements = clonedElement.querySelectorAll('*');
      allClonedElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        
        // Remove black backgrounds only
        if (htmlEl.style.backgroundColor === 'black' || 
            htmlEl.style.backgroundColor === '#000000' ||
            htmlEl.style.backgroundColor === 'rgb(0, 0, 0)' ||
            htmlEl.style.backgroundColor === 'rgba(0, 0, 0, 1)') {
          htmlEl.style.backgroundColor = 'transparent';
        }
        
        // Remove backdrop filters
        htmlEl.style.backdropFilter = 'none';
        (htmlEl.style as any).webkitBackdropFilter = 'none';
        
        // DON'T remove gradients here - they'll be copied back from original
      });
      
      // Copy computed styles to cloned element recursively (this copies BACK from original with gradients!)
      // IMPORTANT: Only copy visual styles, NOT layout styles that could break the natural flow
      const copyStylesToClone = (original: HTMLElement, clone: HTMLElement) => {
        const computedStyle = window.getComputedStyle(original);
        
        // Copy background colors and gradients (essential for sidebar)
        if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          clone.style.backgroundColor = computedStyle.backgroundColor;
        }
        if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
          clone.style.backgroundImage = computedStyle.backgroundImage;
        }
        
        // Copy text styles
        if (computedStyle.color) clone.style.color = computedStyle.color;
        if (computedStyle.fontSize) clone.style.fontSize = computedStyle.fontSize;
        if (computedStyle.fontWeight) clone.style.fontWeight = computedStyle.fontWeight;
        if (computedStyle.fontFamily) clone.style.fontFamily = computedStyle.fontFamily;
        
        // Copy borders
        if (computedStyle.border && computedStyle.border !== 'none') clone.style.border = computedStyle.border;
        if (computedStyle.borderRadius) clone.style.borderRadius = computedStyle.borderRadius;
        
        // Only copy width for specific elements (like sidebar) that need fixed widths
        // Note: className can be SVGAnimatedString for SVG elements, so check type first
        const classNameStr = typeof original.className === 'string' ? original.className : '';
        const hasFixedWidth = original.style.width || classNameStr.includes('w-[');
        if (hasFixedWidth && computedStyle.width && computedStyle.width !== 'auto') {
          clone.style.width = computedStyle.width;
        }
        
        // DON'T copy: display, flexDirection, alignItems, justifyContent, gap, margin, padding, height
        // These can break the natural layout - let CSS classes handle them
        
        // Recursively apply to children
        Array.from(original.children).forEach((child, index) => {
          if (clone.children[index]) {
            copyStylesToClone(child as HTMLElement, clone.children[index] as HTMLElement);
          }
        });
      };
      
      // Apply styles to cloned element (this is where gradients get copied back!)
      copyStylesToClone(element, clonedElement);
      
      // NOW it's safe to modify the clone structure
      // Convert content buttons to divs (preserve phone, location, etc. that are in buttons)
      clonedElement.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent?.trim() || '';
        // Check if this is an "add" button (should be removed) or a content button (should be converted to div)
        const isAddButton = text.startsWith('+ Add') || text === 'Add dates' || text === 'Remove' || 
                           text === 'AI Improve' || text.includes('Add Phone') || text.includes('Add Location') ||
                           text.includes('Add Skills') || text.includes('Add Education');
        
        if (isAddButton) {
          // Remove "add" buttons entirely
          btn.remove();
        } else if (btn.innerHTML.trim()) {
          // Convert content buttons to divs to preserve their content
          const div = document.createElement('div');
          div.innerHTML = btn.innerHTML;
          div.className = btn.className;
          // Copy inline styles
          div.setAttribute('style', btn.getAttribute('style') || '');
          btn.parentNode?.replaceChild(div, btn);
        } else {
          btn.remove();
        }
      });
      
      // Remove file inputs and hover overlays
      clonedElement.querySelectorAll('input[type="file"]').forEach(el => el.remove());
      clonedElement.querySelectorAll('[class*="group-hover"]').forEach(el => {
        // Only remove actual hover overlays (opacity-0 elements)
        if (el.classList.contains('opacity-0')) {
          el.remove();
        }
      });
      
      // Ensure the main element has white background (only if it's transparent)
      if (!clonedElement.style.backgroundColor || clonedElement.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
        clonedElement.style.backgroundColor = '#ffffff';
      }
      clonedElement.style.color = '#1f2937';
      
      console.log('📄 After style copy and cleanup:', {
        innerHTMLLength: clonedElement.innerHTML.length,
        hasGradient: clonedElement.outerHTML.includes('linear-gradient')
      });
      
      // Create a complete HTML document with styles (same CSS as public page)
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
                min-height: 0 !important;
                overflow: hidden !important;
              }
              body > * {
                margin: 0 !important;
                max-width: 210mm !important;
                width: 210mm !important;
                overflow: hidden !important;
              }
              /* Hide edit controls - buttons are already removed/converted in JS */
              input[type="file"] { display: none !important; }
              .opacity-0 { display: none !important; }
              [class*="group-hover"] { opacity: 0 !important; }
              .cursor-pointer { cursor: default !important; }
              .cursor-text { cursor: default !important; }
              /* Remove hover effects */
              *:hover { background-color: inherit; }
              /* Remove all shadows */
              *:not([class*="h-0.5"]):not([class*="h-px"]):not([style*="height: 0.5px"]):not([style*="height: 1px"]) {
                box-shadow: none !important;
                text-shadow: none !important;
                filter: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
              }
              /* Remove glass effects */
              [class*="glass"],
              [class*="backdrop"] {
                background: #ffffff !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
              }
              /* Page break controls */
              @page {
                size: A4;
                margin: 0;
              }
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
              /* Include all CSS rules from current page stylesheets */
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
      const fullName = resumeData?.name || 'Resume';
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

      // Debug: Check if gradient is in final HTML
      const hasGradientInHTML = htmlWithTitle.includes('linear-gradient');
      console.log('📄 Final gradient check:', { hasGradientInHTML });
      if (!hasGradientInHTML && selectedTemplate !== 'minimal') {
        console.warn('⚠️ No gradient found in final HTML for non-minimal template');
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

  // State for saved resume slug (for sharing)
  const [savedResumeSlug, setSavedResumeSlug] = useState<string | null>(null);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  
  // Share functionality
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareModalData, setShareModalData] = useState<{ platform: string; text: string; url: string }>({ platform: '', text: '', url: '' });
  const shareRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);

  // Save (just saves, doesn't open new tab)
  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Please sign up to save');
      router.push('/?signup=true');
      return;
    }
    setSaving(true);
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) throw new Error('No session');

      // Upload profile photo to Supabase bucket if needed
      let uploadedPhotoUrl: string | null = null;
      let uploadedFileName: string | null = null;
      if (profileImage && profileImage.startsWith('data:')) {
        setPhotoUploading(true);
        toast.info('Uploading photo...');
        console.debug('[Photo] uploading data URL to Supabase via API');
        try {
          const fileFromDataUrl = await dataUrlToFile(profileImage, `${user.id}-resume-photo.png`);
          const optimizedFile = await optimizeImage(fileFromDataUrl, 600, 600);
          const buf = await optimizedFile.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          const apiRes = await fetch('/api/upload/resume-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl: `data:${optimizedFile.type};base64,${base64}`,
              fileName: `${user.id}-${Date.now()}.png`,
            })
          });
          if (!apiRes.ok) {
            const err = await apiRes.json().catch(() => ({}));
            throw new Error(err.error || 'API upload failed');
          }
          const uploadResult = await apiRes.json();
          uploadedPhotoUrl = uploadResult.publicUrl;
          uploadedFileName = uploadResult.fileName;
          setProfileImage(uploadedPhotoUrl);
          setResumeData((prev: any) => {
            const base = prev ?? {};
            const updated = { ...base, profilePhoto: uploadedPhotoUrl };
            localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
            return updated;
          });
          toast.success('📤 Photo uploaded!');
          console.debug('[Photo] upload success', uploadResult);
        } catch (err) {
          console.error('Photo upload failed', err);
          toast.error(`Photo upload failed - ${err instanceof Error ? err.message : 'try another image'}`);
        } finally {
          setPhotoUploading(false);
        }
      } else if (profileImage) {
        uploadedPhotoUrl = profileImage;
      }

      const payloadResume = { 
        ...resumeData, 
        profilePhoto: uploadedPhotoUrl || resumeData?.profilePhoto || null 
      };

      const res = await fetch('/api/candidates/resume/save-generated', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${sessionToken}`, 
          'x-user-id': String(user.id) 
        },
        body: JSON.stringify({
          generated_data: payloadResume,
          template_used: selectedTemplate,
          generation_metadata: { primaryColor: primaryColor, photoFileName: uploadedFileName }
        })
      });
      
      if (!res.ok) throw new Error('Save failed');
      const result = await res.json();
      localStorage.setItem('bpoc_generated_resume', JSON.stringify(payloadResume));
      
      // Store slug for sharing
      if (result?.resume?.slug) {
        setSavedResumeSlug(result.resume.slug);
      }
      
      toast.success('✅ Resume saved to your profile!');
      // Show success modal
      setShowSaveSuccessModal(true);
    } catch {
      toast.error('Save failed');
    }
    setSaving(false);
  };

  // Calculate dropdown position and close when clicking outside
  useEffect(() => {
    const updatePosition = () => {
      if (isShareOpen && shareRef.current) {
        const rect = shareRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      } else {
        setDropdownPosition(null);
      }
    };

    if (isShareOpen) {
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

  // Copy URL function
  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Resume URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error('Failed to copy URL. Please try again.');
    }
  };

  // Share resume function - saves first to get shareable URL
  const shareResume = async (platform?: string) => {
    if (!user?.id) {
      toast.error('Please sign in to share your resume');
      router.push('/?signup=true');
      return;
    }

    // Ensure resume is saved first
    let resumeSlug = savedResumeSlug;
    if (!resumeSlug) {
      toast.info('Saving your resume first...');
      
      try {
        const sessionToken = await getSessionToken();
        if (!sessionToken) throw new Error('No session');

        const response = await fetch('/api/candidates/resume/save-generated', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${sessionToken}`,
            'x-user-id': String(user.id)
          },
          body: JSON.stringify({
            generated_data: {
              ...resumeData,
              selectedTemplate: selectedTemplate,
              primaryColor: primaryColor,
              secondaryColor: secondaryColor,
            },
            template_used: selectedTemplate,
            generation_metadata: { 
              source: 'share',
              primaryColor,
              secondaryColor,
            }
          })
        });

        if (!response.ok) throw new Error('Save failed');
        const result = await response.json();
        
        if (result.resume?.slug) {
          resumeSlug = result.resume.slug;
          setSavedResumeSlug(resumeSlug);
        } else {
          throw new Error('No slug returned');
        }
      } catch (err) {
        console.error('Share save error:', err);
        toast.error('Could not save resume for sharing');
        return;
      }
    }

      const baseUrl = window.location.origin;
    const resumeUrl = `${baseUrl}/resume/${resumeSlug}`;
    const userName = resumeData?.name || user?.user_metadata?.full_name || 'Professional';
    const resumeTitle = resumeData?.bestJobTitle || 'Resume';

    switch (platform) {
      case 'facebook':
        const facebookShareText = `🎉 I just made my professional resume for FREE on BPOC.IO!\n\n📄 Check it out: ${resumeUrl}\n\n✨ Build YOUR resume FREE at bpoc.io:\n• 🤖 AI-powered resume builder (100% FREE)\n• 🎯 Skills assessments & career games\n• 💼 Direct connections to top BPO employers\n\nStop paying for resume builders! Join thousands building their careers FREE! 🚀`;
        
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
        const linkedinShareText = `🎉 Just created my professional resume for FREE using BPOC.IO's AI-powered resume builder!\n\n📄 View my resume: ${resumeUrl}\n\n💡 If you're job hunting, check out BPOC.IO:\n✅ 100% FREE AI resume builder\n✅ Skills assessments & career games\n✅ Direct connections to employers\n\nNo more paying for resume builders! Build yours FREE today.\n\n#FreeResume #CareerGrowth #JobSearch #BPO #AI`;
        
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
          await copyUrl(resumeUrl);
        }
        setIsShareOpen(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex items-center justify-center z-[9999]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Resume Builder...</p>
        </div>
      </div>
    );
  }

  // currentStyle is now computed above using generateDynamicStyles

  return (
    <>
      {/* Custom Scrollbar Styles - Inline to avoid global.css */}
      <style jsx>{`
        .resume-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
        }
        .resume-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .resume-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .resume-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .resume-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
          background-clip: padding-box;
        }
      `}</style>
    <div className="fixed inset-0 bg-[#0a0a0c] z-[9999] flex">
      {/* Print Stylesheet - Show only resume when printing */}
      {/* ═══════════════════════════════════════════════════════════════
          LEFT SIDEBAR - Controls
          ═══════════════════════════════════════════════════════════════ */}
      <div className="w-72 bg-[#111113] border-r border-white/10 flex flex-col h-screen overflow-hidden">
        
        {/* Header - Fixed */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/candidate/resume')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </button>
            <a 
              href="/"
              className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
            >
              BPOC
            </a>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="flex-1 overflow-y-auto resume-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent'
          }}
        >
        {/* Layout Selection - Structure Only */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">📐 Layout</h3>
          <div className="grid grid-cols-2 gap-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => { 
                  setSelectedTemplate(t.id); 
                  setResumeData((prev: any) => {
                    const base = prev ?? {};
                    const updated = { ...base, templateId: t.id };
                    localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
                    return updated;
                  });
                }}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  selectedTemplate === t.id
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                <p className="text-xs mt-1 font-medium">{t.name}</p>
                <p className="text-[9px] text-gray-500">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Color Scheme Selection - NEW! */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">🎨 Color Scheme</h3>
          
          {/* Preset Color Schemes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
            {colorSchemes.filter(cs => cs.id !== 'custom').map(cs => (
              <button
                key={cs.id}
                onClick={() => {
                  setSelectedColorScheme(cs.id);
                  setPrimaryColor(cs.primary);
                  setSecondaryColor(cs.secondary);
                  // Save colors to localStorage
                  setResumeData((prev: any) => {
                    const updated = { ...prev, colorScheme: cs.id, primaryColor: cs.primary, secondaryColor: cs.secondary };
                    localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
                    return updated;
                  });
                }}
                className={`p-2 rounded-lg border text-center transition-all ${
                  selectedColorScheme === cs.id
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                title={cs.name}
              >
                <div 
                  className="w-full h-4 rounded mb-1"
                  style={{ background: `linear-gradient(135deg, ${cs.primary}, ${cs.secondary})` }}
                />
                <span className="text-[10px]">{cs.icon}</span>
              </button>
            ))}
          </div>
          
          {/* Custom Color Pickers */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-400 w-16">Primary</label>
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setPrimaryColor(newColor);
                    setSelectedColorScheme('custom');
                    setResumeData((prev: any) => {
                      const updated = { ...prev, colorScheme: 'custom', primaryColor: newColor };
                      localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
                      return updated;
                    });
                  }}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <div className="flex gap-1">
                  {quickColors.slice(0, 4).map(c => (
              <button
                key={c}
                      onClick={() => {
                        setPrimaryColor(c);
                        setSelectedColorScheme('custom');
                        setResumeData((prev: any) => {
                          const updated = { ...prev, colorScheme: 'custom', primaryColor: c };
                          localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
                          return updated;
                        });
                      }}
                      className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                        primaryColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#111113]' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-400 w-16">Secondary</label>
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setSecondaryColor(newColor);
                    setSelectedColorScheme('custom');
                    setResumeData((prev: any) => {
                      const updated = { ...prev, colorScheme: 'custom', secondaryColor: newColor };
                      localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
                      return updated;
                    });
                  }}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <div className="flex gap-1">
                  {quickColors.slice(4, 8).map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setSecondaryColor(c);
                        setSelectedColorScheme('custom');
                        setResumeData((prev: any) => {
                          const updated = { ...prev, colorScheme: 'custom', secondaryColor: c };
                          localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
                          return updated;
                        });
                      }}
                      className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                        secondaryColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#111113]' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
          </div>
          </div>
          
          {/* Live Preview of Gradient */}
          <div 
            className="mt-3 h-8 rounded-lg shadow-inner"
            style={{ background: currentStyle.headerBg }}
          />
          <p className="text-[9px] text-gray-500 mt-1 text-center">Header Preview</p>
        </div>

        {/* Zoom Control */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Zoom: {Math.round(zoom * 100)}%</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <input
                type="range"
                min="50"
                max="150"
                value={zoom * 100}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <button 
                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-1">
              {[0.5, 0.75, 1.0, 1.25].map(z => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${
                    Math.abs(zoom - z) < 0.05 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Helper */}
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`w-full p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
              showAiPanel 
                ? 'border-purple-500 bg-purple-500/20 text-purple-300' 
                : 'border-white/10 hover:border-purple-500/50 text-gray-400 hover:text-purple-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI Assistant</span>
          </button>
        </div>

        </div>
        {/* End Scrollable Content Area */}

        {/* Action Buttons - Fixed at bottom */}
        <div className="p-4 space-y-3 border-t border-white/10 bg-[#111113] flex-shrink-0">
          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            variant="outline"
            className="w-full border-white/20 text-gray-300 hover:bg-white/10"
          >
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {savedResumeSlug ? '✅ Saved' : 'Save Resume'}
          </Button>
          
          <div className="relative" ref={shareRef}>
          <Button
              onClick={() => setIsShareOpen(!isShareOpen)}
            disabled={saving}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg"
          >
              <Share2 className="h-4 w-4 mr-2" />
              Share
          </Button>
            
            {/* Share Dropdown Menu */}
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
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CANVAS - Resume Preview
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-auto bg-[#0a0a0c] p-8 resume-scrollbar">
        <div className="min-h-full flex justify-center items-start">
          <div 
            className="transition-transform duration-300 ease-out origin-top"
            style={{ 
              transform: `scale(${zoom})`,
              marginBottom: zoom > 1 ? `${(zoom - 1) * 297}mm` : 0 // Add margin for larger zooms
            }}
          >
          {/* Resume Paper - LAYOUT SPECIFIC! */}
          <div 
            id="resume-preview"
            className="bg-white shadow-2xl"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            
            {/* ═══════════════════════════════════════════════════════════
                MODERN LAYOUT - 2-Column Sidebar
            ═══════════════════════════════════════════════════════════ */}
            {selectedTemplate === 'modern' && (
              <div className="flex min-h-[297mm]">
                {/* Left Sidebar */}
                <div className="w-[75mm] text-white p-6 space-y-6" style={{ background: currentStyle.headerBg }}>
                {/* Photo */}
                  <div className="flex justify-center">
                  <div 
                      className="w-32 h-32 rounded-full bg-white/20 border-4 border-white/40 overflow-hidden flex items-center justify-center cursor-pointer hover:border-white transition-colors group relative"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User className="h-14 w-14 text-white/60" />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">Contact</h3>
                    <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 opacity-70" />
                        <span className="text-xs break-all">{resumeData?.email || 'email@example.com'}</span>
                    </div>
                      <button onClick={() => openSmartModal('phone')} className="flex items-center gap-2 hover:bg-white/10 rounded px-1 -mx-1 w-full text-left">
                        <Phone className="h-3.5 w-3.5 opacity-70" />
                        <span className="text-xs">{resumeData?.phone || '+ Add phone'}</span>
                      </button>
                      <button onClick={() => openSmartModal('location')} className="flex items-center gap-2 hover:bg-white/10 rounded px-1 -mx-1 w-full text-left">
                        <MapPin className="h-3.5 w-3.5 opacity-70" />
                        <span className="text-xs">{resumeData?.location || '+ Add location'}</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Skills in Sidebar */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">Skills</h3>
                    {resumeData?.skills?.technical?.length > 0 && (
                      <div className="space-y-1">
                        {resumeData.skills.technical.slice(0, 6).map((s: string, i: number) => (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    {resumeData?.skills?.soft?.length > 0 && (
                      <div className="space-y-1 mt-3">
                        <p className="text-[10px] uppercase tracking-wide opacity-60">Soft Skills</p>
                        {resumeData.skills.soft.slice(0, 4).map((s: string, i: number) => (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => openSmartModal('skills')} className="text-[10px] text-white/60 hover:text-white mt-2">+ Add Skills</button>
                  </div>
                  
                  {/* Education in Sidebar */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">Education</h3>
                    {resumeData?.education?.map((edu: any, i: number) => (
                      <div key={i} className="text-xs space-y-0.5">
                        <p className="font-medium">{edu.degree}</p>
                        <p className="opacity-70">{edu.institution}</p>
                        <p className="opacity-50">{edu.year}</p>
                      </div>
                    ))}
                    <button onClick={() => openSmartModal('education')} className="text-[10px] text-white/60 hover:text-white">+ Add Education</button>
                  </div>
                </div>
                
                {/* Right Main Content */}
                <div className="flex-1 p-8">
                  {/* Name & Title */}
                  <div className="mb-6">
                    <h1 
                      onClick={() => startEdit('name', resumeData?.name)}
                      className="text-3xl font-bold text-gray-900 cursor-text hover:bg-gray-50 rounded px-2 py-1 -mx-2"
                    >
                      {resumeData?.name || 'Your Name'}
                    </h1>
                    <p className="text-lg mt-1" style={{ color: primaryColor }}>{getJobTitle()}</p>
                  </div>
                  
                  {/* Summary */}
                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-2 pb-1 border-b-2" style={{ color: primaryColor, borderColor: primaryColor }}>
                      Professional Summary
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed cursor-pointer hover:bg-gray-50 rounded p-1 -m-1" onClick={() => openSmartModal('summary')}>
                      {resumeData?.summary || 'Click to add your professional summary...'}
                    </p>
                  </div>
                  
                  {/* Experience */}
                  <div>
                    <div className="flex items-center justify-between mb-2 pb-1 border-b-2" style={{ borderColor: primaryColor }}>
                      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Work Experience</h2>
                      <button onClick={() => openSmartModal('experience')} className="text-xs text-gray-500 hover:text-gray-700">+ Add</button>
                    </div>
                    <div className="space-y-4">
                      {resumeData?.experience?.map((exp: any, i: number) => (
                        <div key={i} className="group">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-semibold text-gray-900">{exp.title || exp.position}</h3>
                            <span className="text-xs text-gray-500">{exp.duration || exp.dates}</span>
                          </div>
                          <p className="text-sm" style={{ color: primaryColor }}>{exp.company}</p>
                          {exp.achievements?.length > 0 && (
                            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                              {exp.achievements.slice(0, 3).map((a: string, j: number) => <li key={j}>{a}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                      {(!resumeData?.experience || resumeData.experience.length === 0) && (
                        <p className="text-sm text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => openSmartModal('experience')}>+ Add experience...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                EXECUTIVE LAYOUT - Classic Traditional
            ═══════════════════════════════════════════════════════════ */}
            {selectedTemplate === 'executive' && (
              <div className="p-10">
                {/* Centered Header - No colorful gradient, elegant serif */}
                <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                  <h1 
                    onClick={() => startEdit('name', resumeData?.name)}
                    className="text-4xl font-serif font-bold text-gray-900 cursor-text hover:bg-gray-50 rounded inline-block px-4 py-1"
                  >
                    {resumeData?.name || 'Your Name'}
                  </h1>
                  <p className="text-lg font-serif text-gray-600 mt-2">{getJobTitle()}</p>
                  <div className="flex justify-center gap-6 mt-3 text-sm text-gray-600">
                    <span>{resumeData?.email}</span>
                    <span>•</span>
                    <button onClick={() => openSmartModal('phone')} className="hover:text-gray-900">{resumeData?.phone || 'Add Phone'}</button>
                    <span>•</span>
                    <button onClick={() => openSmartModal('location')} className="hover:text-gray-900">{resumeData?.location || 'Add Location'}</button>
                  </div>
                </div>
                
                {/* Photo - Small, aligned right */}
                {profileImage && (
                  <div className="float-right ml-6 mb-4">
                    <div 
                      className="w-24 h-24 rounded border-2 border-gray-300 overflow-hidden cursor-pointer"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                
                {/* Summary */}
                <div className="mb-6">
                  <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">
                    Executive Summary
                  </h2>
                  <p className="text-sm font-serif text-gray-700 leading-relaxed cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded" onClick={() => openSmartModal('summary')}>
                    {resumeData?.summary || 'Click to add your executive summary...'}
                  </p>
                </div>
                
                {/* Experience */}
                <div className="mb-6 clear-both">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-3">
                    <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-gray-700">Professional Experience</h2>
                    <button onClick={() => openSmartModal('experience')} className="text-xs text-gray-500 hover:text-gray-700">+ Add</button>
                  </div>
                  <div className="space-y-4">
                    {resumeData?.experience?.map((exp: any, i: number) => (
                      <div key={i} className="group pb-3 border-b border-gray-100 last:border-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-serif font-semibold text-gray-900">{exp.title || exp.position}</h3>
                          <span className="text-sm font-serif text-gray-500">{exp.duration || exp.dates}</span>
                        </div>
                        <p className="text-sm font-serif text-gray-600 italic">{exp.company}</p>
                        {exp.achievements?.length > 0 && (
                          <ul className="mt-2 text-sm font-serif text-gray-700 list-disc list-outside ml-4 space-y-1">
                            {exp.achievements.slice(0, 4).map((a: string, j: number) => <li key={j}>{a}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                    {(!resumeData?.experience || resumeData.experience.length === 0) && (
                      <p className="text-sm font-serif text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => openSmartModal('experience')}>+ Add experience...</p>
                    )}
                  </div>
                </div>
                
                {/* Two columns for Skills & Education */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">Core Competencies</h2>
                    <div className="flex flex-wrap gap-2">
                      {resumeData?.skills?.technical?.map((s: string, i: number) => (
                        <span key={i} className="text-xs font-serif px-2 py-1 bg-gray-100 text-gray-700 rounded">{s}</span>
                      ))}
                    </div>
                    <button onClick={() => openSmartModal('skills')} className="text-xs text-gray-500 hover:text-gray-700 mt-2">+ Add Skills</button>
                  </div>
                  <div>
                    <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">Education</h2>
                    {resumeData?.education?.map((edu: any, i: number) => (
                      <div key={i} className="text-sm font-serif">
                        <p className="font-medium text-gray-800">{edu.degree}</p>
                        <p className="text-gray-600">{edu.institution}, {edu.year}</p>
                      </div>
                    ))}
                    <button onClick={() => openSmartModal('education')} className="text-xs text-gray-500 hover:text-gray-700 mt-2">+ Add Education</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                CREATIVE LAYOUT - Bold Portfolio Style
            ═══════════════════════════════════════════════════════════ */}
            {selectedTemplate === 'creative' && (
              <div>
                {/* Bold Hero Header with Large Photo */}
                <div className="relative h-[140mm] overflow-hidden" style={{ background: currentStyle.headerBg }}>
                  {/* Diagonal overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} />
                  
                  <div className="relative z-10 p-8 flex items-center gap-8 h-full">
                    {/* Large Photo */}
                    <div 
                      className="w-44 h-44 rounded-2xl bg-white/20 border-4 border-white/40 overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-2xl group relative"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-20 w-20 text-white/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Name & Info */}
                    <div className="text-white flex-1">
                      <h1 
                        onClick={() => startEdit('name', resumeData?.name)}
                        className="text-5xl font-black cursor-text hover:bg-white/10 rounded px-2 py-1 -mx-2 tracking-tight"
                      >
                        {resumeData?.name || 'YOUR NAME'}
                      </h1>
                      <p className="text-2xl font-light mt-2 opacity-90">{getJobTitle()}</p>
                      
                      {/* Contact Icons Row */}
                      <div className="flex gap-4 mt-6">
                        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                          <Mail className="h-4 w-4 text-white" />
                          <span className="text-sm text-white font-medium">{resumeData?.email}</span>
                        </div>
                        <button onClick={() => openSmartModal('phone')} className="flex items-center gap-2 bg-black/30 hover:bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 transition-colors border border-white/20">
                          <Phone className="h-4 w-4 text-white" />
                          <span className="text-sm text-white font-medium">{resumeData?.phone || 'Add Phone'}</span>
                    </button>
                        <button onClick={() => openSmartModal('location')} className="flex items-center gap-2 bg-black/30 hover:bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 transition-colors border border-white/20">
                          <MapPin className="h-4 w-4 text-white" />
                          <span className="text-sm text-white font-medium">{resumeData?.location || 'Add Location'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

                {/* Content with Visual Cards */}
                <div className="p-8 -mt-16 relative z-20">
                  {/* Summary Card */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-l-4" style={{ borderColor: primaryColor }}>
                    <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>About Me</h2>
                    <p className="text-gray-700 cursor-pointer hover:bg-gray-50 rounded p-1 -m-1" onClick={() => openSmartModal('summary')}>
                      {resumeData?.summary || 'Click to add your creative summary...'}
                    </p>
                  </div>
                  
                  {/* Skills as Visual Tags */}
                  <div className="mb-6">
                    <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>Skills & Expertise</h2>
                    <div className="flex flex-wrap gap-2">
                      {resumeData?.skills?.technical?.map((s: string, i: number) => (
                        <span key={i} className="px-4 py-2 rounded-full text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>{s}</span>
                      ))}
                      {resumeData?.skills?.soft?.map((s: string, i: number) => (
                        <span key={i} className="px-4 py-2 rounded-full text-sm font-medium border-2" style={{ borderColor: primaryColor, color: primaryColor }}>{s}</span>
                      ))}
                      <button onClick={() => openSmartModal('skills')} className="px-4 py-2 rounded-full text-sm border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400">+ Add</button>
                    </div>
                  </div>
                  
                  {/* Experience Cards */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold" style={{ color: primaryColor }}>Experience</h2>
                      <button onClick={() => openSmartModal('experience')} className="text-sm text-gray-500 hover:text-gray-700">+ Add</button>
                    </div>
                    <div className="grid gap-3">
                      {resumeData?.experience?.map((exp: any, i: number) => (
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
                      {(!resumeData?.experience || resumeData.experience.length === 0) && (
                        <div className="py-6 border-2 border-dashed rounded-xl text-center text-gray-400 cursor-pointer hover:border-gray-400" onClick={() => openSmartModal('experience')}>
                          + Add your experience
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Education */}
                  <div>
                    <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>Education</h2>
                    <div className="flex flex-wrap gap-3">
                      {resumeData?.education?.map((edu: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                          <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
                          <div>
                            <p className="font-medium text-sm text-gray-900">{edu.degree}</p>
                            <p className="text-xs text-gray-600">{edu.institution} • {edu.year}</p>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => openSmartModal('education')} className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-gray-400 text-sm">
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* ═══════════════════════════════════════════════════════════
                MINIMAL LAYOUT - Typography Focused (No photo, clean)
            ═══════════════════════════════════════════════════════════ */}
            {selectedTemplate === 'minimal' && (
              <div className="p-12">
                {/* Clean Typography Header - NO PHOTO */}
                <div className="mb-10">
                  <h1 
                    onClick={() => startEdit('name', resumeData?.name)}
                    className="text-5xl font-light text-gray-900 cursor-text hover:bg-gray-50 rounded inline-block tracking-tight"
                  >
                    {resumeData?.name || 'Your Name'}
                  </h1>
                  <div className="flex items-center gap-3 mt-3 text-gray-500">
                    <span className="text-lg">{getJobTitle()}</span>
                    <span className="text-gray-300">|</span>
                    <span>{resumeData?.email}</span>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => openSmartModal('phone')} className="hover:text-gray-700">{resumeData?.phone || 'Phone'}</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => openSmartModal('location')} className="hover:text-gray-700">{resumeData?.location || 'Location'}</button>
                  </div>
                  <div className="w-16 h-0.5 bg-gray-900 mt-6" />
                </div>
                
                {/* Summary - Clean */}
                <div className="mb-8">
                  <p className="text-gray-700 leading-relaxed text-lg cursor-pointer hover:bg-gray-50 rounded p-2 -m-2" onClick={() => openSmartModal('summary')}>
                    {resumeData?.summary || 'Add your professional summary...'}
                  </p>
                </div>
                
                {/* Experience - Minimal */}
                <div className="mb-8">
                  <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-4">Experience</h2>
                  <div className="space-y-6">
                    {resumeData?.experience?.map((exp: any, i: number) => (
                      <div key={i} className="group">
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium text-gray-900">{exp.title || exp.position}</span>
                          <span className="text-sm text-gray-400">{exp.duration || exp.dates}</span>
                        </div>
                        <p className="text-gray-600">{exp.company}</p>
                        {exp.achievements?.length > 0 && (
                          <p className="mt-1 text-gray-600 text-sm">
                            {exp.achievements.slice(0, 2).join(' • ')}
                          </p>
                        )}
                      </div>
                    ))}
                    {(!resumeData?.experience || resumeData.experience.length === 0) && (
                      <p className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => openSmartModal('experience')}>+ Add experience</p>
                    )}
                  </div>
                </div>
                
                {/* Skills & Education side by side */}
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-3">Skills</h2>
                    <p className="text-gray-700">
                      {[...(resumeData?.skills?.technical || []), ...(resumeData?.skills?.soft || [])].join(' · ') || 'Add skills'}
                    </p>
                    <button onClick={() => openSmartModal('skills')} className="text-xs text-gray-400 hover:text-gray-600 mt-2">+ Add</button>
                  </div>
                  <div>
                    <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-3">Education</h2>
                    {resumeData?.education?.map((edu: any, i: number) => (
                      <div key={i} className="text-gray-700">
                        <span className="font-medium">{edu.degree}</span> — {edu.institution}, {edu.year}
                      </div>
                    ))}
                    <button onClick={() => openSmartModal('education')} className="text-xs text-gray-400 hover:text-gray-600 mt-2">+ Add</button>
                  </div>
                </div>
              </div>
            )}

            {/* Body - Only for templates without built-in content sections */}
            {/* This fallback body is hidden since all 4 layouts now have custom sections */}
            <div className="px-10 py-8 space-y-6 text-gray-800 hidden">
              
              {/* Summary */}
              <section className="group">
                <div className={`flex items-center justify-between pb-2 mb-3`} style={currentStyle.sectionBorderStyle}>
                  <h2 className={`text-base font-bold flex items-center gap-2 ${currentStyle.sectionHeadingClass}`} style={{ color: primaryColor }}>
                    <User className="h-4 w-4" />
                    Professional Summary
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openSmartModal('summary')}
                      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleAiImprove('summary', resumeData?.summary)}
                      disabled={improvingSection === 'summary'}
                      className="text-xs px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {improvingSection === 'summary' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                      AI Improve
                    </button>
                  </div>
                </div>
                {resumeData?.summary ? (
                  <p className={`text-sm leading-relaxed cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded transition-colors ${currentStyle.bodyTextClass}`} onClick={() => openSmartModal('summary')}>
                    {resumeData.summary}
                  </p>
                ) : (
                  <button
                    onClick={() => openSmartModal('summary')}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                  >
                    + Add your professional summary
                  </button>
                )}
              </section>

              {/* Experience */}
              <section>
                <div className={`flex items-center justify-between pb-2 mb-3`} style={currentStyle.sectionBorderStyle}>
                  <h2 className={`text-base font-bold flex items-center gap-2 ${currentStyle.sectionHeadingClass}`} style={{ color: primaryColor }}>
                    <Briefcase className="h-4 w-4" />
                    Work Experience
                  </h2>
                  <button
                    onClick={() => openSmartModal('experience')}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    + Add Job
                  </button>
                </div>
                <div className="space-y-5">
                  {resumeData?.experience?.map((exp: any, i: number) => (
                    <div key={i} className="relative pl-5 border-l-2 group" style={{ borderColor: `${primaryColor}40` }}>
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-gray-900">{exp.title || exp.position}</h3>
                        <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setInputModalData({
                              title: `📅 Edit Dates for ${exp.title || exp.position || 'this position'}`,
                              fields: [
                                { key: 'startDate', label: 'Start Date', placeholder: 'Jan 2020', required: true },
                                { key: 'endDate', label: 'End Date (or "Present")', placeholder: 'Present', required: true }
                              ],
                              onSubmit: (values) => {
                                const duration = `${values.startDate} - ${values.endDate}`;
                                const updatedExp = resumeData?.experience?.map((e: any, idx: number) => 
                                  idx === i ? { ...e, duration } : e
                                );
                                updateResumeField('experience', updatedExp);
                                addAiMessage('ai', `✅ Updated dates for ${exp.title || exp.position}: ${duration}`);
                              }
                            });
                            setInputValues({ startDate: '', endDate: 'Present' });
                            setShowInputModal(true);
                          }}
                          className={`text-xs cursor-pointer hover:bg-gray-100 px-2 py-0.5 rounded transition-colors ${
                            isInvalidDate(exp.duration || exp.dates) ? 'text-red-500 bg-red-50 border border-red-200' : currentStyle.experienceDateClass
                          }`}
                          style={isInvalidDate(exp.duration || exp.dates) ? {} : currentStyle.experienceDateStyle}
                        >
                          {isInvalidDate(exp.duration || exp.dates) ? '⚠️ Add dates' : (exp.duration || exp.dates)}
                        </button>
                        <button
                          onClick={() => {
                            const updated = resumeData?.experience?.filter((_: any, idx: number) => idx !== i);
                            updateResumeField('experience', updated);
                            toast.success('Removed job');
                          }}
                          className="text-xs text-red-500 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{exp.company}</p>
                      {exp.achievements && exp.achievements.length > 0 ? (
                        <ul className={currentStyle.listClass}>
                          {exp.achievements.slice(0, 4).map((a: string, j: number) => (
                            <li key={j}>{a}</li>
                          ))}
                        </ul>
                      ) : (
                        <button
                          onClick={() => {
                            setInputModalData({
                              title: `✨ Add Achievements for ${exp.title}`,
                              fields: [
                                { key: 'a1', label: 'Achievement #1', placeholder: 'Increased team productivity by 30%', required: true },
                                { key: 'a2', label: 'Achievement #2', placeholder: 'Managed a team of 10 people', required: false },
                                { key: 'a3', label: 'Achievement #3', placeholder: 'Reduced customer complaints by 50%', required: false }
                              ],
                              onSubmit: (values) => {
                                const achievements = [values.a1, values.a2, values.a3].filter(a => a?.trim());
                                const updatedExp = resumeData?.experience?.map((e: any, idx: number) => 
                                  idx === i ? { ...e, achievements } : e
                                );
                                updateResumeField('experience', updatedExp);
                                addAiMessage('ai', `✅ Added ${achievements.length} achievements for ${exp.title}!`);
                              }
                            });
                            setInputValues({});
                            setShowInputModal(true);
                          }}
                          className="text-xs text-red-500 bg-red-50 border border-red-200 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                        >
                          ⚠️ Add achievements (important!)
                        </button>
                      )}
                    </div>
                  ))}
                  {(!resumeData?.experience || resumeData.experience.length === 0) && (
                    <button
                      onClick={() => openSmartModal('experience')}
                      className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >
                      + Add your work experience
                    </button>
                  )}
                </div>
              </section>

              {/* Skills */}
              <section>
                <div className={`flex items-center justify-between pb-2 mb-3`} style={currentStyle.sectionBorderStyle}>
                  <h2 className={`text-base font-bold flex items-center gap-2 ${currentStyle.sectionHeadingClass}`} style={{ color: primaryColor }}>
                    <FileText className="h-4 w-4" />
                    Skills
                  </h2>
                  <button
                    onClick={() => openSmartModal('skills')}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    + Add Skills
                  </button>
                </div>
                <div className="space-y-3">
                  {resumeData?.skills?.technical?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Technical</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeData.skills.technical.map((s: string, i: number) => (
                          <span 
                            key={i} 
                            className={`${currentStyle.chipClass} cursor-pointer hover:opacity-80 transition-colors group`}
                            style={currentStyle.chipStyle}
                            onClick={() => {
                              const newSkills = resumeData.skills.technical.filter((_: string, idx: number) => idx !== i);
                              updateResumeField('skills', { ...resumeData.skills, technical: newSkills });
                              toast.success(`Removed "${s}"`);
                            }}
                          >
                            {s} <span className="opacity-0 group-hover:opacity-100 text-red-500">×</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeData?.skills?.soft?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Soft Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeData.skills.soft.map((s: string, i: number) => (
                          <span 
                            key={i} 
                            className={`${currentStyle.chipAltClass} cursor-pointer hover:bg-gray-100 transition-colors group`}
                            onClick={() => {
                              const newSkills = resumeData.skills.soft.filter((_: string, idx: number) => idx !== i);
                              updateResumeField('skills', { ...resumeData.skills, soft: newSkills });
                              toast.success(`Removed "${s}"`);
                            }}
                          >
                            {s} <span className="opacity-0 group-hover:opacity-100 text-red-500">×</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!resumeData?.skills?.technical?.length && !resumeData?.skills?.soft?.length) && (
                    <button
                      onClick={() => openSmartModal('skills')}
                      className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >
                      + Add your skills (technical & soft)
                    </button>
                  )}
                </div>
              </section>

              {/* Education */}
              <section>
                <div className={`flex items-center justify-between pb-2 mb-3`} style={currentStyle.sectionBorderStyle}>
                  <h2 className={`text-base font-bold flex items-center gap-2 ${currentStyle.sectionHeadingClass}`} style={{ color: primaryColor }}>
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </h2>
                  <button
                    onClick={() => openSmartModal('education')}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    + Add Education
                  </button>
                </div>
                <div className="space-y-3">
                  {resumeData?.education?.map((edu: any, i: number) => (
                    <div key={i} className="flex justify-between items-start group">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {edu.degree || <span className="text-red-500">Add degree</span>}
                        </p>
                        <p className="text-sm text-gray-600">
                          {edu.institution || <span className="text-red-500">Add institution</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{edu.year || '?'}</span>
                        <button
                          onClick={() => {
                            setInputModalData({
                              title: '✏️ Edit Education',
                              fields: [
                                { key: 'degree', label: 'Degree/Diploma', placeholder: 'Bachelor of Science', required: true },
                                { key: 'institution', label: 'School/University', placeholder: 'University of the Philippines', required: true },
                                { key: 'year', label: 'Year Graduated', placeholder: '2020', required: true }
                              ],
                              onSubmit: (values) => {
                                const updatedEdu = resumeData?.education?.map((e: any, idx: number) => 
                                  idx === i ? { degree: values.degree, institution: values.institution, year: values.year } : e
                                );
                                updateResumeField('education', updatedEdu);
                                addAiMessage('ai', `✅ Updated education: ${values.degree} from ${values.institution}`);
                              }
                            });
                            setInputValues({ degree: edu.degree || '', institution: edu.institution || '', year: edu.year || '' });
                            setShowInputModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const updatedEdu = resumeData?.education?.filter((_: any, idx: number) => idx !== i);
                            updateResumeField('education', updatedEdu);
                            toast.success('Education removed');
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!resumeData?.education || resumeData.education.length === 0) && (
                    <button
                      onClick={() => openSmartModal('education')}
                      className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                    >
                      + Add your education (degree, school, year)
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          RIGHT PANEL - AI Assistant (Optional)
          ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[#111113] border-l border-white/10 overflow-hidden"
          >
            <div className="w-80 h-full flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="font-semibold text-white">AI Assistant</span>
                </div>
                <button onClick={() => setShowAiPanel(false)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col overflow-y-auto resume-scrollbar">
                {/* Quick Actions */}
                <div className="p-3 border-b border-white/10 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleAiImprove('summary', resumeData?.summary)}
                      disabled={improvingSection === 'summary' || aiLoading}
                      className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-sm text-purple-200 hover:from-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {improvingSection === 'summary' ? <Loader2 className="h-3 w-3 animate-spin" /> : '✨'}
                      <span>Improve Summary</span>
                    </button>
                    <button 
                      onClick={handleOptimizeATS}
                      disabled={aiLoading}
                      className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-sm text-cyan-200 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '🎯'}
                      <span>Optimize ATS</span>
                    </button>
                  </div>
                  <button 
                    onClick={handleImproveAll}
                    disabled={aiLoading}
                    className="w-full p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-sm text-emerald-200 hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '🚀'}
                    <span>Enhance Entire Resume</span>
                  </button>
                </div>

                {/* Photo Upload/Remove Quick Action */}
                  <div className="p-3 border-b border-white/10">
                  {!profileImage ? (
                    <button
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="w-full p-3 rounded-lg bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 text-sm text-pink-200 hover:from-pink-500/30 hover:to-orange-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      📸 Add Your Photo
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setProfileImage(null);
                        setResumeData((prev: any) => {
                          const updated = { ...prev, profilePhoto: null };
                          localStorage.setItem('bpoc_generated_resume', JSON.stringify(updated));
                          return updated;
                        });
                        toast.success('Photo removed');
                        addAiMessage('ai', '📸 Photo removed. You can add a new one anytime!');
                      }}
                      className="w-full p-3 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-sm text-red-200 hover:from-red-500/30 hover:to-orange-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      🗑️ Remove Photo
                    </button>
                )}
                </div>

                {/* Missing Fields Alert */}
                {missingFields.length > 0 && (
                  <div className="p-3 border-b border-white/10">
                    <div className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
                      <h4 className="text-xs font-semibold text-amber-300 uppercase mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-amber-500/30 rounded-full flex items-center justify-center text-[10px]">{missingFields.length}</span>
                        Missing Information
                      </h4>
                      <div className="space-y-1.5">
                        {missingFields.slice(0, 6).map((field, i) => (
                          <button
                            key={i}
                            onClick={() => handleAddMissingInfo(field)}
                            className="w-full text-left text-xs text-amber-100 p-2.5 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-transparent hover:border-amber-500/30 transition-all flex items-center gap-2 group"
                          >
                            <span className="w-5 h-5 bg-amber-500/20 group-hover:bg-amber-500/40 rounded-full flex items-center justify-center text-amber-300 text-[10px] transition-colors">+</span>
                            <span className="flex-1">{field}</span>
                            <span className="text-amber-400/60 group-hover:text-amber-300 text-[10px]">Click to add →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Quick Add Buttons (always visible) */}
                <div className="p-3 border-b border-white/10">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">➕ Quick Add</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => openSmartModal('experience')}
                      className="p-2 text-xs rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-all"
                    >
                      💼 Add Job
                    </button>
                    <button
                      onClick={() => openSmartModal('education')}
                      className="p-2 text-xs rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all"
                    >
                      🎓 Add Education
                    </button>
                    <button
                      onClick={() => openSmartModal('skills')}
                      className="p-2 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all"
                    >
                      🛠️ Add Skills
                    </button>
                    <button
                      onClick={() => openSmartModal('summary')}
                      className="p-2 text-xs rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 hover:bg-pink-500/20 transition-all"
                    >
                      📝 Add Summary
                    </button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-auto p-3 space-y-3 resume-scrollbar">
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                        msg.role === 'ai' 
                          ? 'bg-white/5 text-gray-300 border border-white/10' 
                          : 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30 ml-4'
                      }`}
                    >
                      {msg.role === 'ai' && <span className="text-purple-400 font-medium">🤖 AI: </span>}
                      {msg.content}
                    </div>
                  ))}
                  {(improvingSection || aiLoading) && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>

                {/* Resume Score */}
                <div className="p-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Resume Score</h4>
                    <span className="text-lg font-bold text-cyan-400">
                      {Math.max(0, 100 - (missingFields.length * 10) - (profileImage ? 0 : 10))}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, 100 - (missingFields.length * 10) - (profileImage ? 0 : 10))}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {missingFields.length === 0 && profileImage 
                      ? '🎉 Perfect! Your resume is complete!' 
                      : `Fix ${missingFields.length + (profileImage ? 0 : 1)} items to reach 100%`}
                  </p>
                </div>

                {/* Section Improvers */}
                <div className="p-3 border-t border-white/10">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">✨ AI Enhance Sections</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'summary', label: 'Summary', icon: '📝', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
                      { id: 'experience', label: 'Experience', icon: '💼', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
                      { id: 'skills', label: 'Skills', icon: '🛠️', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' },
                      { id: 'education', label: 'Education', icon: '🎓', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
                    ].map(section => (
                      <button
                        key={section.id}
                        onClick={() => {
                          const content = section.id === 'experience' 
                            ? JSON.stringify(resumeData?.experience) 
                            : section.id === 'skills'
                            ? JSON.stringify(resumeData?.skills)
                            : section.id === 'education'
                            ? JSON.stringify(resumeData?.education)
                            : resumeData?.[section.id];
                          handleAiImprove(section.id, content);
                        }}
                        disabled={improvingSection === section.id || aiLoading}
                        className={`p-2.5 text-xs rounded-lg bg-gradient-to-r ${section.color} border text-gray-200 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5`}
                      >
                        {improvingSection === section.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>{section.icon}</span>}
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          IMAGE CROP MODAL
          ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-lg bg-[#111113] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Crop Your Photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 bg-black rounded-lg overflow-hidden">
            {tempImage && (
              <Cropper 
                image={tempImage} 
                crop={cropState} 
                zoom={cropZoom} 
                aspect={1} 
                cropShape="round"
                onCropChange={setCropState} 
                onCropComplete={onCropComplete} 
                onZoomChange={setCropZoom} 
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCropModal(false)}>Cancel</Button>
            <Button onClick={handleCropSave} className="bg-cyan-500 hover:bg-cyan-600">Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          SMART INPUT MODAL - For adding missing information
          ═══════════════════════════════════════════════════════════════ */}
      <Dialog 
        open={showInputModal} 
        onOpenChange={(open) => {
          setShowInputModal(open);
          if (!open) {
            setInputModalData(null);
            setInputValues({});
          }
        }}
      >
        <DialogContent className="max-w-md bg-gradient-to-br from-[#111113] to-[#0a0a0c] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">{inputModalData?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {inputModalData?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-400">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={inputValues[field.key] || ''}
                    onChange={(e) => setInputValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={inputValues[field.key] || ''}
                    onChange={(e) => setInputValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => { setShowInputModal(false); setInputModalData(null); }}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleModalSubmit}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Add to Resume
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Facebook Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1877F2]/20 via-blue-500/20 to-[#1877F2]/20 rounded-2xl blur-2xl animate-pulse" />
            
            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-2 border-[#1877F2]/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-[#1877F2] p-5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Share on Facebook</h3>
                      <p className="text-blue-100 text-sm">Text copied to clipboard!</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Instructions */}
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/20">
                  <h4 className="text-white font-semibold mb-2">📋 Instructions:</h4>
                  <ol className="space-y-1.5 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">1.</span>
                      <span>Facebook will open in 1.5 seconds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">2.</span>
                      <span>Paste the text (Ctrl+V / Cmd+V) in the post</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">3.</span>
                      <span>Your resume preview will appear - hit Share!</span>
                    </li>
                  </ol>
                </div>

                {/* Text Preview */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Post Text (Copied!)</label>
                  <div className="bg-gray-800/50 rounded-xl p-3 border border-white/10 max-h-32 overflow-y-auto">
                    <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                      {shareModalData.text}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => setShowShareModal(false)}
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3 rounded-xl"
                >
                  Got It! 👍
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Modal */}
      <Dialog open={showSaveSuccessModal} onOpenChange={setShowSaveSuccessModal}>
        <DialogContent className="max-w-md bg-[#111113] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Resume Saved Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <p className="text-gray-300 text-sm">
              Your resume has been saved and is now available at your public resume page.
            </p>
            {savedResumeSlug && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Resume URL:</p>
                <code className="text-xs text-cyan-400 break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/resume/${savedResumeSlug}` : `/resume/${savedResumeSlug}`}
                </code>
    </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowSaveSuccessModal(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Keep Editing
              </Button>
              <Button
                onClick={() => {
                  if (savedResumeSlug) {
                    window.open(`/resume/${savedResumeSlug}`, '_blank');
                  }
                  setShowSaveSuccessModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Resume
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10 max-h-48 overflow-y-auto resume-scrollbar">
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
    
    {/* Mobile Bottom Action Bar */}
    <div className="fixed bottom-0 left-0 right-0 z-[10001] md:hidden bg-[#111113]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center justify-around gap-2 safe-area-bottom">
      <Button
        onClick={handleSave}
        disabled={saving}
        className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-400/30 text-xs py-2"
        size="sm"
      >
        <Save className="w-3.5 h-3.5 mr-1" />
        {saving ? 'Saving...' : 'Save'}
      </Button>
      <Button
        onClick={handleExportPDF}
        disabled={exporting}
        className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-400/30 text-xs py-2"
        size="sm"
      >
        <Download className="w-3.5 h-3.5 mr-1" />
        {exporting ? '...' : 'PDF'}
      </Button>
      <Button
        onClick={() => shareResume()}
        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-400/30 text-xs py-2"
        size="sm"
      >
        <Share2 className="w-3.5 h-3.5 mr-1" />
        Share
      </Button>
      <Button
        onClick={() => setShowAiPanel(!showAiPanel)}
        className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-400/30 text-xs py-2"
        size="sm"
      >
        <Sparkles className="w-3.5 h-3.5 mr-1" />
        AI
      </Button>
    </div>
    </>
  );
}


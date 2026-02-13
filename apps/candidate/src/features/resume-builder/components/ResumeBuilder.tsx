'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Save,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Palette,
  Layout,
  Loader2,
  Check,
  Eye,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { ResumePreview } from './templates';
import { AIAssistant } from './ai/AIAssistant';
import { EditPanel } from './builder/EditPanel';
import { useResumeStore, useIsDirty, useCompletionScore } from '../hooks/useResumeStore';
import { TEMPLATES, COLOR_SCHEMES, FONTS } from '../lib/templates';
import { ResumeData } from '../lib/schema';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// RESUME BUILDER - Main orchestrator component
// Brings together the toolbar, preview, AI assistant, and edit modals
// ═══════════════════════════════════════════════════════════════════════════════

interface ResumeBuilderProps {
  initialData?: ResumeData;
  candidateId?: string;
  onSave?: (data: ResumeData) => Promise<void>;
}

export function ResumeBuilder({ initialData, candidateId, onSave }: ResumeBuilderProps) {
  const {
    resume,
    loadResume,
    setTemplate,
    setColors,
    setFont,
    previewZoom,
    setPreviewZoom,
    showAIPanel,
    toggleAIPanel,
    isSaving,
    setSaving,
    markClean,
  } = useResumeStore();
  
  const isDirty = useIsDirty();
  const completionScore = useCompletionScore();
  
  // Edit modal state
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string | undefined>();
  
  // Customization panel
  const [showCustomize, setShowCustomize] = useState(false);
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  // Preview ref for PDF generation
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Load initial data
  useEffect(() => {
    if (initialData) {
      loadResume(initialData);
    }
  }, [initialData, loadResume]);
  
  // Handle edit section callback
  const handleEditSection = useCallback((section: string, itemId?: string) => {
    setEditSection(section);
    setEditItemId(itemId);
  }, []);
  
  // Handle save
  const handleSave = async () => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(resume);
      markClean();
    } catch (error) {
      console.error('Save failed:', error);
    }
    setSaving(false);
  };
  
  // Handle export PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Would use html2canvas + jsPDF or server-side Puppeteer
      // For now, trigger print dialog
      window.print();
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
  };
  
  // Handle AI improve
  const handleAIImprove = async (section: string, content: string) => {
    // Would call AI API here
    console.log('AI improving:', section, content);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0b]">
      {/* ═══════════════════════════════════════════════════════════════════
          TOP TOOLBAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <Link 
            href="/resume" 
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          
          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />
          
          {/* Template selector */}
          <button
            onClick={() => setShowCustomize(!showCustomize)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showCustomize 
                ? 'bg-cyan-500/20 text-cyan-300' 
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layout className="h-4 w-4" />
            <span>Customize</span>
          </button>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button 
              onClick={() => setPreviewZoom(previewZoom - 0.1)}
              className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-400 min-w-[3rem] text-center">
              {Math.round(previewZoom * 100)}%
            </span>
            <button 
              onClick={() => setPreviewZoom(previewZoom + 0.1)}
              className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Center - Completion score */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Resume Score</span>
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${completionScore}%` }}
              />
            </div>
            <span className="text-sm font-medium text-cyan-400">{completionScore}%</span>
          </div>
        </div>
        
        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* AI Toggle */}
          <button
            onClick={toggleAIPanel}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showAIPanel 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Coach</span>
          </button>
          
          {/* Save button */}
          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isDirty ? (
                <Save className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4 text-emerald-400" />
              )}
              <span>{isSaving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}</span>
            </button>
          )}
          
          {/* Export button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm bg-cyan-500 hover:bg-cyan-600 text-white transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export PDF</span>
          </button>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Customization Panel */}
        {showCustomize && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[#111113] border-r border-white/10 overflow-y-auto flex-shrink-0"
          >
            <div className="p-4 space-y-6">
              {/* Templates */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Template
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setTemplate(template.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        resume.templateId === template.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="text-sm font-medium text-white">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{template.category}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Colors */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Color Scheme
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_SCHEMES.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => setColors(scheme.primary, scheme.secondary)}
                      className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all ${
                        resume.primaryColor === scheme.primary
                          ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#111113]'
                          : 'hover:scale-105'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})` }}
                      title={scheme.name}
                    >
                      {scheme.icon}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom colors */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Custom Colors
                </h3>
                <div className="flex gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Primary</label>
                    <input
                      type="color"
                      value={resume.primaryColor}
                      onChange={(e) => setColors(e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Secondary</label>
                    <input
                      type="color"
                      value={resume.secondaryColor}
                      onChange={(e) => setColors(resume.primaryColor, e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              {/* Fonts */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Font
                </h3>
                <div className="space-y-1">
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setFont(font.family)}
                      className={`w-full p-2 rounded-lg text-left text-sm transition-colors ${
                        resume.fontFamily === font.family
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════════
            PREVIEW AREA
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
          <div 
            ref={previewRef}
            className="bg-white shadow-2xl rounded-lg overflow-hidden transition-transform origin-top"
            style={{ 
              transform: `scale(${previewZoom})`,
              width: '210mm', // A4 width
            }}
          >
            <ResumePreview
              data={resume}
              editable={true}
              onEditSection={handleEditSection}
              onPhotoUpload={() => handleEditSection('photo')}
            />
          </div>
        </div>
        
        {/* AI Assistant Panel */}
        <AIAssistant
          isOpen={showAIPanel}
          onClose={toggleAIPanel}
          onImproveSection={handleAIImprove}
        />
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          EDIT MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      <EditPanel
        section={editSection || ''}
        itemId={editItemId}
        isOpen={!!editSection}
        onClose={() => {
          setEditSection(null);
          setEditItemId(undefined);
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════════
          PRINT STYLES
          ═══════════════════════════════════════════════════════════════════ */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #resume-preview, #resume-preview * {
            visibility: visible;
          }
          #resume-preview {
            position: absolute;
            left: 0;
            top: 0;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ResumeBuilder;

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, GripVertical, Sparkles, Loader2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useResumeStore } from '../../hooks/useResumeStore';
import type { Experience, Education, Skill } from '../../lib/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT PANEL - Universal modal for editing resume sections
// Uses Tiptap for rich text editing where applicable
// ═══════════════════════════════════════════════════════════════════════════════

interface EditPanelProps {
  section: string;
  itemId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPanel({ section, itemId, isOpen, onClose }: EditPanelProps) {
  const { 
    resume, 
    setName, setTitle, setSummary, setContact, setPhoto,
    addExperience, updateExperience, removeExperience,
    addEducation, updateEducation, removeEducation,
    addSkill, updateSkill, removeSkill, bulkAddSkills,
  } = useResumeStore();
  
  const [isImproving, setIsImproving] = useState(false);
  
  // Get current item for editing
  const experienceItem = itemId 
    ? resume.experience.find(e => e.id === itemId) 
    : null;
  const educationItem = itemId 
    ? resume.education.find(e => e.id === itemId) 
    : null;
  
  // Render appropriate form based on section
  const renderContent = () => {
    switch (section) {
      case 'name':
        return <NameEditor value={resume.name} onChange={setName} onClose={onClose} />;
      case 'title':
        return <TitleEditor value={resume.title} onChange={setTitle} onClose={onClose} />;
      case 'summary':
        return (
          <SummaryEditor 
            value={resume.summary} 
            onChange={setSummary} 
            onClose={onClose}
            onImprove={async (content) => {
              setIsImproving(true);
              // Would call AI API here
              await new Promise(resolve => setTimeout(resolve, 1500));
              setIsImproving(false);
            }}
            isImproving={isImproving}
          />
        );
      case 'contact':
        return (
          <ContactEditor 
            contact={resume.contact}
            field={itemId}
            onChange={setContact}
            onClose={onClose}
          />
        );
      case 'experience':
        return experienceItem ? (
          <ExperienceEditor 
            experience={experienceItem}
            onChange={(data) => updateExperience(experienceItem.id, data)}
            onDelete={() => {
              removeExperience(experienceItem.id);
              onClose();
            }}
            onClose={onClose}
          />
        ) : (
          <NewExperienceEditor 
            onAdd={(data) => {
              addExperience(data);
              onClose();
            }}
            onClose={onClose}
          />
        );
      case 'education':
        return educationItem ? (
          <EducationEditor 
            education={educationItem}
            onChange={(data) => updateEducation(educationItem.id, data)}
            onDelete={() => {
              removeEducation(educationItem.id);
              onClose();
            }}
            onClose={onClose}
          />
        ) : (
          <NewEducationEditor 
            onAdd={(data) => {
              addEducation(data);
              onClose();
            }}
            onClose={onClose}
          />
        );
      case 'skills':
        return (
          <SkillsEditor 
            skills={resume.skills}
            onAdd={addSkill}
            onUpdate={updateSkill}
            onRemove={removeSkill}
            onBulkAdd={bulkAddSkills}
            onClose={onClose}
          />
        );
      default:
        return <div className="p-4 text-gray-400">Unknown section: {section}</div>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a1a1d] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL EDITORS
// ═══════════════════════════════════════════════════════════════════════════════

interface EditorProps {
  onClose: () => void;
}

// Name Editor
function NameEditor({ value, onChange, onClose }: { value: string; onChange: (v: string) => void } & EditorProps) {
  const [name, setName] = useState(value);
  
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Edit Name</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
        placeholder="Your full name"
        autoFocus
      />
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={() => { onChange(name); onClose(); }}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// Title Editor
function TitleEditor({ value, onChange, onClose }: { value: string; onChange: (v: string) => void } & EditorProps) {
  const [title, setTitle] = useState(value);
  
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Edit Professional Title</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
        placeholder="e.g. Senior Software Engineer"
        autoFocus
      />
      <p className="text-xs text-gray-500 mt-2">A short headline that describes what you do</p>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={() => { onChange(title); onClose(); }}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// Summary Editor with Tiptap
function SummaryEditor({ 
  value, 
  onChange, 
  onClose,
  onImprove,
  isImproving,
}: { 
  value: string; 
  onChange: (v: string) => void;
  onImprove?: (content: string) => Promise<void>;
  isImproving?: boolean;
} & EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write a compelling 2-3 sentence summary of your professional background and goals...',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none min-h-[120px] p-4 focus:outline-none',
      },
    },
  });
  
  const handleSave = () => {
    if (editor) {
      onChange(editor.getText());
      onClose();
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Edit Summary</h2>
        {onImprove && (
          <button 
            onClick={() => editor && onImprove(editor.getText())}
            disabled={isImproving}
            className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
          >
            {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>AI Improve</span>
          </button>
        )}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <EditorContent editor={editor} />
      </div>
      <p className="text-xs text-gray-500 mt-2">2-3 sentences about your professional background and career goals</p>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// Contact Editor
function ContactEditor({ 
  contact, 
  field, 
  onChange, 
  onClose,
}: { 
  contact: any; 
  field?: string;
  onChange: (field: any, value: string) => void;
} & EditorProps) {
  const [values, setValues] = useState({
    email: contact.email || '',
    phone: contact.phone || '',
    location: contact.location || '',
    linkedin: contact.linkedin || '',
    website: contact.website || '',
  });
  
  const handleSave = () => {
    Object.entries(values).forEach(([key, value]) => {
      onChange(key as keyof typeof values, value);
    });
    onClose();
  };
  
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Edit Contact Info</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Email</label>
          <input
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Phone</label>
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="+63 9XX XXX XXXX"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Location</label>
          <input
            type="text"
            value={values.location}
            onChange={(e) => setValues({ ...values, location: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="City, Country"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">LinkedIn (optional)</label>
          <input
            type="url"
            value={values.linkedin}
            onChange={(e) => setValues({ ...values, linkedin: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Website (optional)</label>
          <input
            type="url"
            value={values.website}
            onChange={(e) => setValues({ ...values, website: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// Experience Editor
function ExperienceEditor({ 
  experience, 
  onChange, 
  onDelete,
  onClose,
}: { 
  experience: Experience;
  onChange: (data: Partial<Experience>) => void;
  onDelete: () => void;
} & EditorProps) {
  const [values, setValues] = useState({ ...experience });
  const [achievementInput, setAchievementInput] = useState('');
  
  const handleAddAchievement = () => {
    if (achievementInput.trim()) {
      setValues({ 
        ...values, 
        achievements: [...values.achievements, achievementInput.trim()] 
      });
      setAchievementInput('');
    }
  };
  
  const handleRemoveAchievement = (index: number) => {
    setValues({
      ...values,
      achievements: values.achievements.filter((_, i) => i !== index),
    });
  };
  
  const handleSave = () => {
    onChange(values);
    onClose();
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Edit Experience</h2>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Job Title</label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="e.g. Senior Developer"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Company</label>
          <input
            type="text"
            value={values.company}
            onChange={(e) => setValues({ ...values, company: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="Company name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Start Date</label>
            <input
              type="text"
              value={values.startDate}
              onChange={(e) => setValues({ ...values, startDate: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Jan 2022"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">End Date</label>
            <input
              type="text"
              value={values.current ? '' : values.endDate}
              onChange={(e) => setValues({ ...values, endDate: e.target.value })}
              disabled={values.current}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
              placeholder="Present"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={values.current}
            onChange={(e) => setValues({ ...values, current: e.target.checked })}
            className="rounded border-white/20 bg-white/5"
          />
          I currently work here
        </label>
        
        {/* Achievements */}
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Key Achievements</label>
          <div className="space-y-2">
            {values.achievements.map((achievement, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/5 rounded-lg p-2">
                <span className="flex-1 text-sm text-gray-300">{achievement}</span>
                <button 
                  onClick={() => handleRemoveAchievement(i)}
                  className="text-gray-500 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={achievementInput}
              onChange={(e) => setAchievementInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAchievement()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Add an achievement (press Enter)"
            />
            <button 
              onClick={handleAddAchievement}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 text-white" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Start with action verbs (Led, Built, Increased, etc.)</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// New Experience Editor
function NewExperienceEditor({ onAdd, onClose }: { onAdd: (data: Partial<Experience>) => void } & EditorProps) {
  const [values, setValues] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    current: false,
    achievements: [] as string[],
  });
  const [achievementInput, setAchievementInput] = useState('');
  
  const handleAddAchievement = () => {
    if (achievementInput.trim()) {
      setValues({ ...values, achievements: [...values.achievements, achievementInput.trim()] });
      setAchievementInput('');
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Add Experience</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Job Title</label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="e.g. Customer Service Representative"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Company</label>
          <input
            type="text"
            value={values.company}
            onChange={(e) => setValues({ ...values, company: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="Company name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Start Date</label>
            <input
              type="text"
              value={values.startDate}
              onChange={(e) => setValues({ ...values, startDate: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Jan 2022"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">End Date</label>
            <input
              type="text"
              value={values.current ? '' : values.endDate}
              onChange={(e) => setValues({ ...values, endDate: e.target.value })}
              disabled={values.current}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
              placeholder="Dec 2023"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={values.current}
            onChange={(e) => setValues({ ...values, current: e.target.checked })}
            className="rounded border-white/20 bg-white/5"
          />
          I currently work here
        </label>
        
        {/* Achievements */}
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Key Achievements (optional)</label>
          {values.achievements.length > 0 && (
            <div className="space-y-2 mb-2">
              {values.achievements.map((a, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/5 rounded-lg p-2">
                  <span className="flex-1 text-sm text-gray-300">{a}</span>
                  <button onClick={() => setValues({ 
                    ...values, 
                    achievements: values.achievements.filter((_, idx) => idx !== i) 
                  })} className="text-gray-500 hover:text-red-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={achievementInput}
              onChange={(e) => setAchievementInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAchievement()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Add an achievement (press Enter)"
            />
            <button onClick={handleAddAchievement} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <Plus className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={() => onAdd(values)}
          disabled={!values.title || !values.company}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Add Experience
        </button>
      </div>
    </div>
  );
}

// Education Editor
function EducationEditor({ 
  education, 
  onChange, 
  onDelete,
  onClose,
}: { 
  education: Education;
  onChange: (data: Partial<Education>) => void;
  onDelete: () => void;
} & EditorProps) {
  const [values, setValues] = useState({ ...education });
  
  const handleSave = () => {
    onChange(values);
    onClose();
  };
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Edit Education</h2>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Degree</label>
          <input
            type="text"
            value={values.degree}
            onChange={(e) => setValues({ ...values, degree: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="e.g. Bachelor of Science in Computer Science"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Institution</label>
          <input
            type="text"
            value={values.institution}
            onChange={(e) => setValues({ ...values, institution: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="University name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Start Year</label>
            <input
              type="text"
              value={values.startYear}
              onChange={(e) => setValues({ ...values, startYear: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="2018"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">End Year</label>
            <input
              type="text"
              value={values.endYear}
              onChange={(e) => setValues({ ...values, endYear: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="2022"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

// New Education Editor
function NewEducationEditor({ onAdd, onClose }: { onAdd: (data: Partial<Education>) => void } & EditorProps) {
  const [values, setValues] = useState({
    degree: '',
    institution: '',
    startYear: '',
    endYear: '',
  });
  
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Add Education</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Degree</label>
          <input
            type="text"
            value={values.degree}
            onChange={(e) => setValues({ ...values, degree: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="e.g. Bachelor of Arts in Psychology"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Institution</label>
          <input
            type="text"
            value={values.institution}
            onChange={(e) => setValues({ ...values, institution: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="University or school name"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Year Graduated</label>
          <input
            type="text"
            value={values.endYear}
            onChange={(e) => setValues({ ...values, endYear: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="2022"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
        <button 
          onClick={() => onAdd(values)}
          disabled={!values.degree || !values.institution}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Add Education
        </button>
      </div>
    </div>
  );
}

// Skills Editor
function SkillsEditor({ 
  skills, 
  onAdd, 
  onUpdate,
  onRemove,
  onBulkAdd,
  onClose,
}: { 
  skills: Skill[];
  onAdd: (data: Partial<Skill>) => void;
  onUpdate: (id: string, data: Partial<Skill>) => void;
  onRemove: (id: string) => void;
  onBulkAdd: (skills: string[], category?: Skill['category']) => void;
} & EditorProps) {
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<Skill['category']>('technical');
  
  const handleAdd = () => {
    if (input.trim()) {
      // Support comma-separated skills
      const skillNames = input.split(',').map(s => s.trim()).filter(Boolean);
      if (skillNames.length > 1) {
        onBulkAdd(skillNames, category);
      } else {
        onAdd({ name: input.trim(), category });
      }
      setInput('');
    }
  };
  
  const technicalSkills = skills.filter(s => s.category === 'technical');
  const softSkills = skills.filter(s => s.category === 'soft');
  const languageSkills = skills.filter(s => s.category === 'language');
  const certSkills = skills.filter(s => s.category === 'certification');
  
  const renderSkillGroup = (title: string, items: Skill[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {items.map(skill => (
            <div 
              key={skill.id} 
              className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-sm text-white group"
            >
              <span>{skill.name}</span>
              <button 
                onClick={() => onRemove(skill.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Manage Skills</h2>
      
      {/* Skill groups */}
      <div className="max-h-[300px] overflow-y-auto mb-4 pr-2">
        {renderSkillGroup('Technical Skills', technicalSkills)}
        {renderSkillGroup('Soft Skills', softSkills)}
        {renderSkillGroup('Languages', languageSkills)}
        {renderSkillGroup('Certifications', certSkills)}
        {skills.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No skills added yet</p>
        )}
      </div>
      
      {/* Add new skill */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex gap-2 mb-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Skill['category'])}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="technical">Technical</option>
            <option value="soft">Soft Skill</option>
            <option value="language">Language</option>
            <option value="certification">Certification</option>
          </select>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            placeholder="Add skill (comma separate for multiple)"
          />
          <button 
            onClick={handleAdd}
            className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-500">Tip: Type multiple skills separated by commas</p>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default EditPanel;

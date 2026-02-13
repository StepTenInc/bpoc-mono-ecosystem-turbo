'use client';

import React from 'react';
import { ResumeData } from '../../lib/schema';

interface MinimalTemplateProps {
  data: ResumeData;
  primaryColor: string;
  secondaryColor: string;
  onEditField?: (field: string, value?: string) => void;
  onPhotoUpload?: () => void;
  editable?: boolean;
}

/**
 * MINIMAL TEMPLATE
 * Typography-focused, clean design with no photo
 * Content-first approach with subtle styling
 */
export function MinimalTemplate({
  data,
  primaryColor,
  secondaryColor,
  onEditField,
  onPhotoUpload,
  editable = false,
}: MinimalTemplateProps) {
  return (
    <div className="p-12 min-h-[297mm] bg-white">
      {/* ═══════════════════════════════════════════════════════════
          CLEAN TYPOGRAPHY HEADER - No photo
          ═══════════════════════════════════════════════════════════ */}
      <div className="mb-10">
        <h1 
          className={`text-5xl font-light text-gray-900 tracking-tight ${
            editable ? 'cursor-text hover:bg-gray-50 rounded inline-block' : ''
          }`}
          onClick={editable ? () => onEditField?.('name', data.name) : undefined}
        >
          {data.name || (editable ? 'Your Name' : '')}
        </h1>
        <div className="flex items-center gap-3 mt-3 text-gray-500 flex-wrap">
          <span className="text-lg">{data.title || (editable ? 'Your Title' : '')}</span>
          {data.title && <span className="text-gray-300">|</span>}
          {data.contact.email && (
            <>
              <span>{data.contact.email}</span>
              <span className="text-gray-300">|</span>
            </>
          )}
          <button 
            className={editable ? 'hover:text-gray-700' : ''}
            onClick={editable ? () => onEditField?.('contact.phone', data.contact.phone) : undefined}
          >
            {data.contact.phone || (editable ? 'Phone' : '')}
          </button>
          {(data.contact.phone || data.contact.location) && <span className="text-gray-300">|</span>}
          <button 
            className={editable ? 'hover:text-gray-700' : ''}
            onClick={editable ? () => onEditField?.('contact.location', data.contact.location) : undefined}
          >
            {data.contact.location || (editable ? 'Location' : '')}
          </button>
        </div>
        <div className="w-16 h-0.5 bg-gray-900 mt-6" />
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          SUMMARY - Clean paragraph
          ═══════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <p 
          className={`text-gray-700 leading-relaxed text-lg ${
            editable ? 'cursor-pointer hover:bg-gray-50 rounded p-2 -m-2' : ''
          }`}
          onClick={editable ? () => onEditField?.('summary', data.summary) : undefined}
        >
          {data.summary || (editable ? 'Add your professional summary...' : '')}
        </p>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          EXPERIENCE - Minimal styling
          ═══════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-4">
          Experience
        </h2>
        <div className="space-y-6">
          {data.experience.map((exp) => (
            <div key={exp.id} className="group">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-gray-900">{exp.title}</span>
                <span className="text-sm text-gray-400">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <p className="text-gray-600">{exp.company}</p>
              {exp.achievements.length > 0 && (
                <p className="mt-1 text-gray-600 text-sm">
                  {exp.achievements.slice(0, 2).join(' • ')}
                </p>
              )}
            </div>
          ))}
          {data.experience.length === 0 && editable && (
            <p 
              className="text-gray-400 cursor-pointer hover:text-gray-600" 
              onClick={() => onEditField?.('experience.add')}
            >
              + Add experience
            </p>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          SKILLS & EDUCATION - Side by side
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-12">
        {/* Skills */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-3">
            Skills
          </h2>
          <p className="text-gray-700">
            {[...data.skills.technical, ...data.skills.soft].join(' · ') || 
              (editable ? 'Add skills' : '')}
          </p>
          {editable && (
            <button 
              onClick={() => onEditField?.('skills')}
              className="text-xs text-gray-400 hover:text-gray-600 mt-2"
            >
              + Add
            </button>
          )}
        </div>
        
        {/* Education */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-gray-400 mb-3">
            Education
          </h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="text-gray-700">
              <span className="font-medium">{edu.degree}</span> — {edu.institution}, {edu.year}
            </div>
          ))}
          {editable && (
            <button 
              onClick={() => onEditField?.('education')}
              className="text-xs text-gray-400 hover:text-gray-600 mt-2"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MinimalTemplate;

'use client';

import React from 'react';
import { User, Camera } from 'lucide-react';
import { TemplateProps } from '../../lib/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTIVE TEMPLATE
// Traditional professional layout with centered header, serif typography
// Photo is optional and small (floating right)
// ═══════════════════════════════════════════════════════════════════════════════

export function ExecutiveTemplate({
  data,
  primaryColor,
  secondaryColor,
  editable = false,
  onEditSection,
  onPhotoUpload,
}: TemplateProps) {
  const allSkills = data.skills.map(s => s.name);

  return (
    <div className="p-10 min-h-[297mm] bg-white font-serif">
      {/* ═══════════════════════════════════════════════════════════════════
          CENTERED HEADER - Name, Title, Contact
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
        <h1 
          className={`text-4xl font-bold text-gray-900 ${
            editable ? 'cursor-text hover:bg-gray-50 rounded inline-block px-4 py-1' : ''
          }`}
          onClick={editable ? () => onEditSection?.('name') : undefined}
        >
          {data.name || (editable ? 'Your Name' : '')}
        </h1>
        <p 
          className={`text-lg text-gray-600 mt-2 ${editable ? 'cursor-text hover:bg-gray-50 rounded inline-block px-4 py-0.5' : ''}`}
          onClick={editable ? () => onEditSection?.('title') : undefined}
        >
          {data.title || (editable ? 'Professional Title' : '')}
        </p>
        <div className="flex justify-center gap-6 mt-3 text-sm text-gray-600 flex-wrap">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.email && (data.contact.phone || editable) && <span>•</span>}
          <span 
            className={editable ? 'cursor-pointer hover:text-gray-900' : ''}
            onClick={editable ? () => onEditSection?.('contact', 'phone') : undefined}
          >
            {data.contact.phone || (editable ? 'Add Phone' : '')}
          </span>
          {(data.contact.phone || data.contact.location || editable) && <span>•</span>}
          <span 
            className={editable ? 'cursor-pointer hover:text-gray-900' : ''}
            onClick={editable ? () => onEditSection?.('contact', 'location') : undefined}
          >
            {data.contact.location || (editable ? 'Add Location' : '')}
          </span>
        </div>
      </div>
      
      {/* Photo - Small, floating right (optional) */}
      {(data.photo || editable) && (
        <div className="float-right ml-6 mb-4">
          <div 
            className={`w-24 h-24 rounded border-2 border-gray-300 overflow-hidden relative ${
              editable ? 'cursor-pointer group' : ''
            }`}
            onClick={editable ? onPhotoUpload : undefined}
          >
            {data.photo ? (
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : editable ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            ) : null}
            {editable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════
          EXECUTIVE SUMMARY
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">
          Executive Summary
        </h2>
        <p 
          className={`text-sm text-gray-700 leading-relaxed ${
            editable ? 'cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded' : ''
          }`}
          onClick={editable ? () => onEditSection?.('summary') : undefined}
        >
          {data.summary || (editable ? 'Click to add your executive summary...' : '')}
        </p>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          PROFESSIONAL EXPERIENCE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-6 clear-both">
        <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700">
            Professional Experience
          </h2>
          {editable && (
            <button 
              onClick={() => onEditSection?.('experience')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              + Add
            </button>
          )}
        </div>
        <div className="space-y-4">
          {data.experience.map((exp) => (
            <div 
              key={exp.id} 
              className={`pb-3 border-b border-gray-100 last:border-0 ${
                editable ? 'hover:bg-gray-50 rounded p-2 -m-2 cursor-pointer' : ''
              }`}
              onClick={editable ? () => onEditSection?.('experience', exp.id) : undefined}
            >
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-gray-900">{exp.title || 'Position'}</h3>
                <span className="text-sm text-gray-500">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <p className="text-sm text-gray-600 italic">{exp.company}</p>
              {exp.achievements.length > 0 && (
                <ul className="mt-2 text-sm text-gray-700 list-disc list-outside ml-4 space-y-1">
                  {exp.achievements.slice(0, 5).map((achievement, j) => (
                    <li key={j}>{achievement}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {data.experience.length === 0 && editable && (
            <p 
              className="text-sm text-gray-400 cursor-pointer hover:text-gray-600" 
              onClick={() => onEditSection?.('experience')}
            >
              + Add experience...
            </p>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          TWO COLUMNS - Skills & Education
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-8">
        {/* Core Competencies */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">
            Core Competencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill, i) => (
              <span 
                key={i} 
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
          {editable && (
            <button 
              onClick={() => onEditSection?.('skills')}
              className="text-xs text-gray-500 hover:text-gray-700 mt-2"
            >
              + Add Skills
            </button>
          )}
        </div>
        
        {/* Education */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-700 mb-2 border-b border-gray-200 pb-1">
            Education
          </h2>
          {data.education.map((edu) => (
            <div 
              key={edu.id} 
              className={`text-sm mb-2 ${editable ? 'hover:bg-gray-50 rounded p-1 -m-1 cursor-pointer' : ''}`}
              onClick={editable ? () => onEditSection?.('education', edu.id) : undefined}
            >
              <p className="font-medium text-gray-800">{edu.degree}</p>
              <p className="text-gray-600">{edu.institution}, {edu.endYear}</p>
            </div>
          ))}
          {editable && (
            <button 
              onClick={() => onEditSection?.('education')}
              className="text-xs text-gray-500 hover:text-gray-700 mt-2"
            >
              + Add Education
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExecutiveTemplate;

'use client';

import React from 'react';
import { Mail, Phone, MapPin, User, Camera, GraduationCap } from 'lucide-react';
import { ResumeData } from '../../lib/schema';

interface CreativeTemplateProps {
  data: ResumeData;
  primaryColor: string;
  secondaryColor: string;
  onEditField?: (field: string, value?: string) => void;
  onPhotoUpload?: () => void;
  editable?: boolean;
}

/**
 * CREATIVE TEMPLATE
 * Bold portfolio-style layout with large hero header, gradient background
 * Card-based sections with visual emphasis
 */
export function CreativeTemplate({
  data,
  primaryColor,
  secondaryColor,
  onEditField,
  onPhotoUpload,
  editable = false,
}: CreativeTemplateProps) {
  const headerBg = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  return (
    <div className="min-h-[297mm] bg-white">
      {/* ═══════════════════════════════════════════════════════════
          BOLD HERO HEADER - Large gradient with photo and info
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative h-[140mm] overflow-hidden" style={{ background: headerBg }}>
        {/* Diagonal overlay */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-32 bg-white" 
          style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} 
        />
        
        <div className="relative z-10 p-8 flex items-center gap-8 h-full">
          {/* Large Photo */}
          <div 
            className={`w-44 h-44 rounded-2xl bg-white/20 border-4 border-white/40 overflow-hidden flex-shrink-0 shadow-2xl ${
              editable ? 'cursor-pointer hover:scale-105 transition-transform group' : ''
            }`}
            onClick={editable ? onPhotoUpload : undefined}
          >
            {data.photo ? (
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-20 w-20 text-white/60" />
              </div>
            )}
            {editable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          
          {/* Name & Info */}
          <div className="text-white flex-1">
            <h1 
              className={`text-5xl font-black tracking-tight ${
                editable ? 'cursor-text hover:bg-white/10 rounded px-2 py-1 -mx-2' : ''
              }`}
              onClick={editable ? () => onEditField?.('name', data.name) : undefined}
            >
              {data.name || (editable ? 'YOUR NAME' : '')}
            </h1>
            <p className="text-2xl font-light mt-2 opacity-90">
              {data.title || (editable ? 'Your Title' : '')}
            </p>
            
            {/* Contact Icons Row */}
            <div className="flex gap-4 mt-6 flex-wrap">
              {data.contact.email && (
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <Mail className="h-4 w-4 text-white" />
                  <span className="text-sm text-white font-medium">{data.contact.email}</span>
                </div>
              )}
              <button 
                className={`flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 ${
                  editable ? 'hover:bg-black/40 transition-colors' : ''
                }`}
                onClick={editable ? () => onEditField?.('contact.phone', data.contact.phone) : undefined}
              >
                <Phone className="h-4 w-4 text-white" />
                <span className="text-sm text-white font-medium">
                  {data.contact.phone || (editable ? 'Add Phone' : '')}
                </span>
              </button>
              <button 
                className={`flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 ${
                  editable ? 'hover:bg-black/40 transition-colors' : ''
                }`}
                onClick={editable ? () => onEditField?.('contact.location', data.contact.location) : undefined}
              >
                <MapPin className="h-4 w-4 text-white" />
                <span className="text-sm text-white font-medium">
                  {data.contact.location || (editable ? 'Add Location' : '')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CONTENT - Card-based sections
          ═══════════════════════════════════════════════════════════ */}
      <div className="p-8 -mt-16 relative z-20">
        {/* Summary Card */}
        <div 
          className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-l-4" 
          style={{ borderColor: primaryColor }}
        >
          <h2 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>About Me</h2>
          <p 
            className={`text-gray-700 ${editable ? 'cursor-pointer hover:bg-gray-50 rounded p-1 -m-1' : ''}`}
            onClick={editable ? () => onEditField?.('summary', data.summary) : undefined}
          >
            {data.summary || (editable ? 'Click to add your creative summary...' : '')}
          </p>
        </div>
        
        {/* Skills as Visual Tags */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>
            Skills & Expertise
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.technical.map((skill, i) => (
              <span 
                key={i} 
                className="px-4 py-2 rounded-full text-sm font-medium text-white" 
                style={{ backgroundColor: primaryColor }}
              >
                {skill}
              </span>
            ))}
            {data.skills.soft.map((skill, i) => (
              <span 
                key={`soft-${i}`} 
                className="px-4 py-2 rounded-full text-sm font-medium border-2" 
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {skill}
              </span>
            ))}
            {editable && (
              <button 
                onClick={() => onEditField?.('skills')}
                className="px-4 py-2 rounded-full text-sm border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400"
              >
                + Add
              </button>
            )}
          </div>
        </div>
        
        {/* Experience Cards */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: primaryColor }}>Experience</h2>
            {editable && (
              <button 
                onClick={() => onEditField?.('experience.add')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                + Add
              </button>
            )}
          </div>
          <div className="grid gap-3">
            {data.experience.map((exp) => (
              <div 
                key={exp.id} 
                className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900">{exp.title}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-500">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="text-sm font-medium" style={{ color: primaryColor }}>{exp.company}</p>
                {exp.achievements.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    {exp.achievements.slice(0, 2).map((achievement, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span style={{ color: primaryColor }}>▸</span>{achievement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {data.experience.length === 0 && editable && (
              <div 
                className="py-6 border-2 border-dashed rounded-xl text-center text-gray-400 cursor-pointer hover:border-gray-400" 
                onClick={() => onEditField?.('experience.add')}
              >
                + Add your experience
              </div>
            )}
          </div>
        </div>
        
        {/* Education */}
        <div>
          <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>Education</h2>
          <div className="flex flex-wrap gap-3">
            {data.education.map((edu) => (
              <div 
                key={edu.id} 
                className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
                <div>
                  <p className="font-medium text-sm text-gray-900">{edu.degree}</p>
                  <p className="text-xs text-gray-600">{edu.institution} • {edu.year}</p>
                </div>
              </div>
            ))}
            {editable && (
              <button 
                onClick={() => onEditField?.('education')}
                className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-gray-400 text-sm"
              >
                + Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreativeTemplate;

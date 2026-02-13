'use client';

import React from 'react';
import { Mail, Phone, MapPin, User, Camera } from 'lucide-react';
import { ResumeData } from '../../lib/schema';

interface ModernTemplateProps {
  data: ResumeData;
  primaryColor: string;
  secondaryColor: string;
  onEditField?: (field: string, value?: string) => void;
  onPhotoUpload?: () => void;
  editable?: boolean;
}

/**
 * MODERN TEMPLATE
 * 2-column layout with colored sidebar containing photo, contact, skills, education
 * Main content area has name, summary, and experience
 */
export function ModernTemplate({
  data,
  primaryColor,
  secondaryColor,
  onEditField,
  onPhotoUpload,
  editable = false,
}: ModernTemplateProps) {
  const headerBg = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
  
  const EditableText = ({ 
    field, 
    value, 
    placeholder, 
    className = '',
    as: Component = 'span',
  }: { 
    field: string; 
    value?: string; 
    placeholder: string;
    className?: string;
    as?: React.ElementType;
  }) => {
    if (!editable) {
      return <Component className={className}>{value || placeholder}</Component>;
    }
    return (
      <Component
        className={`${className} cursor-text hover:bg-white/10 rounded px-1 -mx-1 transition-colors`}
        onClick={() => onEditField?.(field, value)}
      >
        {value || <span className="opacity-60">{placeholder}</span>}
      </Component>
    );
  };

  return (
    <div className="flex min-h-[297mm] bg-white">
      {/* ═══════════════════════════════════════════════════════════
          LEFT SIDEBAR - Photo, Contact, Skills, Education
          ═══════════════════════════════════════════════════════════ */}
      <div 
        className="w-[75mm] text-white p-6 space-y-6 flex-shrink-0" 
        style={{ background: headerBg }}
      >
        {/* Photo */}
        <div className="flex justify-center">
          <div 
            className={`w-32 h-32 rounded-full bg-white/20 border-4 border-white/40 overflow-hidden flex items-center justify-center ${
              editable ? 'cursor-pointer hover:border-white transition-colors group' : ''
            }`}
            onClick={editable ? onPhotoUpload : undefined}
          >
            {data.photo ? (
              <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-14 w-14 text-white/60" />
            )}
            {editable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">
            Contact
          </h3>
          <div className="space-y-2 text-sm">
            {data.contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                <span className="text-xs break-all">{data.contact.email}</span>
              </div>
            )}
            <div 
              className={`flex items-center gap-2 ${editable ? 'hover:bg-white/10 rounded px-1 -mx-1 cursor-pointer' : ''}`}
              onClick={editable ? () => onEditField?.('contact.phone', data.contact.phone) : undefined}
            >
              <Phone className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
              <span className="text-xs">{data.contact.phone || (editable ? '+ Add phone' : '')}</span>
            </div>
            <div 
              className={`flex items-center gap-2 ${editable ? 'hover:bg-white/10 rounded px-1 -mx-1 cursor-pointer' : ''}`}
              onClick={editable ? () => onEditField?.('contact.location', data.contact.location) : undefined}
            >
              <MapPin className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
              <span className="text-xs">{data.contact.location || (editable ? '+ Add location' : '')}</span>
            </div>
          </div>
        </div>
        
        {/* Skills */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">
            Skills
          </h3>
          {data.skills.technical.length > 0 && (
            <div className="space-y-1">
              {data.skills.technical.slice(0, 6).map((skill, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                  {skill}
                </div>
              ))}
            </div>
          )}
          {data.skills.soft.length > 0 && (
            <div className="space-y-1 mt-3">
              <p className="text-[10px] uppercase tracking-wide opacity-60">Soft Skills</p>
              {data.skills.soft.slice(0, 4).map((skill, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                  {skill}
                </div>
              ))}
            </div>
          )}
          {editable && (
            <button 
              onClick={() => onEditField?.('skills')}
              className="text-[10px] text-white/60 hover:text-white mt-2"
            >
              + Add Skills
            </button>
          )}
        </div>
        
        {/* Education */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">
            Education
          </h3>
          {data.education.map((edu) => (
            <div key={edu.id} className="text-xs space-y-0.5">
              <p className="font-medium">{edu.degree}</p>
              <p className="opacity-70">{edu.institution}</p>
              <p className="opacity-50">{edu.year}</p>
            </div>
          ))}
          {editable && (
            <button 
              onClick={() => onEditField?.('education')}
              className="text-[10px] text-white/60 hover:text-white"
            >
              + Add Education
            </button>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          RIGHT MAIN CONTENT - Name, Summary, Experience
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 p-8">
        {/* Name & Title */}
        <div className="mb-6">
          <h1 
            className={`text-3xl font-bold text-gray-900 ${editable ? 'cursor-text hover:bg-gray-50 rounded px-2 py-1 -mx-2' : ''}`}
            onClick={editable ? () => onEditField?.('name', data.name) : undefined}
          >
            {data.name || (editable ? 'Your Name' : '')}
          </h1>
          <p className="text-lg mt-1" style={{ color: primaryColor }}>
            {data.title || (editable ? 'Your Title' : '')}
          </p>
        </div>
        
        {/* Summary */}
        <div className="mb-6">
          <h2 
            className="text-sm font-bold uppercase tracking-wider mb-2 pb-1 border-b-2" 
            style={{ color: primaryColor, borderColor: primaryColor }}
          >
            Professional Summary
          </h2>
          <p 
            className={`text-sm text-gray-700 leading-relaxed ${editable ? 'cursor-pointer hover:bg-gray-50 rounded p-1 -m-1' : ''}`}
            onClick={editable ? () => onEditField?.('summary', data.summary) : undefined}
          >
            {data.summary || (editable ? 'Click to add your professional summary...' : '')}
          </p>
        </div>
        
        {/* Experience */}
        <div>
          <div 
            className="flex items-center justify-between mb-2 pb-1 border-b-2" 
            style={{ borderColor: primaryColor }}
          >
            <h2 
              className="text-sm font-bold uppercase tracking-wider" 
              style={{ color: primaryColor }}
            >
              Work Experience
            </h2>
            {editable && (
              <button 
                onClick={() => onEditField?.('experience.add')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                + Add
              </button>
            )}
          </div>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id} className="group">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                  <span className="text-xs text-gray-500">
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="text-sm" style={{ color: primaryColor }}>{exp.company}</p>
                {exp.achievements.length > 0 && (
                  <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                    {exp.achievements.slice(0, 3).map((achievement, j) => (
                      <li key={j}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {data.experience.length === 0 && editable && (
              <p 
                className="text-sm text-gray-400 cursor-pointer hover:text-gray-600" 
                onClick={() => onEditField?.('experience.add')}
              >
                + Add experience...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModernTemplate;

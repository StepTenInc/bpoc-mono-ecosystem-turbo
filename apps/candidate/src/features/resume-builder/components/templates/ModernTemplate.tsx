'use client';

import React from 'react';
import { Mail, Phone, MapPin, User, Camera, Linkedin, Globe } from 'lucide-react';
import { TemplateProps, generateGradient } from '../../lib/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// MODERN TEMPLATE
// 2-column layout with colored sidebar containing photo, contact, skills
// Main content area has name, summary, experience, education
// ═══════════════════════════════════════════════════════════════════════════════

export function ModernTemplate({
  data,
  primaryColor,
  secondaryColor,
  editable = false,
  onEditSection,
  onPhotoUpload,
}: TemplateProps) {
  const headerBg = generateGradient(primaryColor, secondaryColor);
  
  // Group skills by category
  const technicalSkills = data.skills.filter(s => s.category === 'technical');
  const softSkills = data.skills.filter(s => s.category === 'soft');

  return (
    <div className="flex min-h-[297mm] bg-white font-sans">
      {/* ═══════════════════════════════════════════════════════════════════
          LEFT SIDEBAR - Photo, Contact, Skills
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="w-[75mm] text-white p-6 space-y-6 flex-shrink-0 print:w-[75mm]" 
        style={{ background: headerBg }}
      >
        {/* Photo */}
        <div className="flex justify-center">
          <div 
            className={`w-32 h-32 rounded-full bg-white/20 border-4 border-white/40 overflow-hidden flex items-center justify-center relative ${
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
            {(data.contact.phone || editable) && (
              <div 
                className={`flex items-center gap-2 ${editable ? 'hover:bg-white/10 rounded px-1 -mx-1 cursor-pointer' : ''}`}
                onClick={editable ? () => onEditSection?.('contact', 'phone') : undefined}
              >
                <Phone className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                <span className="text-xs">{data.contact.phone || '+ Add phone'}</span>
              </div>
            )}
            {(data.contact.location || editable) && (
              <div 
                className={`flex items-center gap-2 ${editable ? 'hover:bg-white/10 rounded px-1 -mx-1 cursor-pointer' : ''}`}
                onClick={editable ? () => onEditSection?.('contact', 'location') : undefined}
              >
                <MapPin className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                <span className="text-xs">{data.contact.location || '+ Add location'}</span>
              </div>
            )}
            {data.contact.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                <span className="text-xs break-all">{data.contact.linkedin.replace('https://', '')}</span>
              </div>
            )}
            {data.contact.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 opacity-70 flex-shrink-0" />
                <span className="text-xs break-all">{data.contact.website.replace('https://', '')}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Skills */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">
            Skills
          </h3>
          {technicalSkills.length > 0 && (
            <div className="space-y-1">
              {technicalSkills.slice(0, 8).map((skill) => (
                <div key={skill.id} className="text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                  {skill.name}
                </div>
              ))}
            </div>
          )}
          {softSkills.length > 0 && (
            <div className="space-y-1 mt-3">
              <p className="text-[10px] uppercase tracking-wide opacity-60">Soft Skills</p>
              {softSkills.slice(0, 5).map((skill) => (
                <div key={skill.id} className="text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                  {skill.name}
                </div>
              ))}
            </div>
          )}
          {editable && (
            <button 
              onClick={() => onEditSection?.('skills')}
              className="text-[10px] text-white/60 hover:text-white mt-2"
            >
              + Add Skills
            </button>
          )}
        </div>
        
        {/* Education in Sidebar */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1">
            Education
          </h3>
          {data.education.map((edu) => (
            <div 
              key={edu.id} 
              className={`text-xs space-y-0.5 ${editable ? 'hover:bg-white/10 rounded p-1 -m-1 cursor-pointer' : ''}`}
              onClick={editable ? () => onEditSection?.('education', edu.id) : undefined}
            >
              <p className="font-medium">{edu.degree || 'Degree'}</p>
              <p className="opacity-70">{edu.institution || 'Institution'}</p>
              <p className="opacity-50">{edu.endYear || 'Year'}</p>
            </div>
          ))}
          {editable && (
            <button 
              onClick={() => onEditSection?.('education')}
              className="text-[10px] text-white/60 hover:text-white"
            >
              + Add Education
            </button>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT MAIN CONTENT - Name, Summary, Experience
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 p-8">
        {/* Name & Title */}
        <div className="mb-6">
          <h1 
            className={`text-3xl font-bold text-gray-900 ${editable ? 'cursor-text hover:bg-gray-50 rounded px-2 py-1 -mx-2' : ''}`}
            onClick={editable ? () => onEditSection?.('name') : undefined}
          >
            {data.name || (editable ? 'Your Name' : '')}
          </h1>
          <p 
            className={`text-lg mt-1 ${editable ? 'cursor-text hover:bg-gray-50 rounded px-2 py-0.5 -mx-2' : ''}`}
            style={{ color: primaryColor }}
            onClick={editable ? () => onEditSection?.('title') : undefined}
          >
            {data.title || (editable ? 'Professional Title' : '')}
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
            onClick={editable ? () => onEditSection?.('summary') : undefined}
          >
            {data.summary || (editable ? 'Click to add your professional summary...' : '')}
          </p>
        </div>
        
        {/* Experience */}
        <div>
          <div className="flex items-center justify-between mb-2 pb-1 border-b-2" style={{ borderColor: primaryColor }}>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
              Work Experience
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
                className={`group ${editable ? 'hover:bg-gray-50 rounded p-2 -m-2 cursor-pointer' : ''}`}
                onClick={editable ? () => onEditSection?.('experience', exp.id) : undefined}
              >
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-900">{exp.title || 'Job Title'}</h3>
                  <span className="text-xs text-gray-500">
                    {exp.startDate || 'Start'} - {exp.current ? 'Present' : (exp.endDate || 'End')}
                  </span>
                </div>
                <p className="text-sm" style={{ color: primaryColor }}>{exp.company || 'Company'}</p>
                {exp.location && <p className="text-xs text-gray-500">{exp.location}</p>}
                {exp.achievements.length > 0 && (
                  <ul className="mt-1 text-sm text-gray-600 list-disc list-inside space-y-0.5">
                    {exp.achievements.slice(0, 4).map((achievement, j) => (
                      <li key={j}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {data.experience.length === 0 && editable && (
              <p 
                className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 p-2" 
                onClick={() => onEditSection?.('experience')}
              >
                + Add your work experience...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModernTemplate;

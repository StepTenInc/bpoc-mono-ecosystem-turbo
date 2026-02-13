'use client';

import React, { useEffect, useState } from 'react';
import { ResumeBuilder, ResumeData, useResumeStore } from '@/features/resume-builder';
import { Loader2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// NEW RESUME BUILDER PAGE
// Uses the modular resume-builder feature
// Route: /resume/builder (can be swapped to /resume/build later)
// ═══════════════════════════════════════════════════════════════════════════════

export default function ResumeBuilderPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const { loadResume } = useResumeStore();
  
  // Load candidate data and existing resume
  useEffect(() => {
    async function loadData() {
      try {
        // Get current candidate
        const profileRes = await fetch('/api/candidate/profile');
        if (!profileRes.ok) throw new Error('Failed to load profile');
        
        const profile = await profileRes.json();
        setCandidateId(profile.id);
        
        // Load existing resume data if available
        if (profile.resumeData) {
          // Transform from database format to our schema
          const data: ResumeData = {
            id: profile.resumeId,
            name: profile.name || '',
            title: profile.resumeData.professionalTitle || '',
            photo: profile.photo_url,
            contact: {
              email: profile.email || '',
              phone: profile.phone || '',
              location: profile.resumeData.location || profile.city || '',
              linkedin: profile.resumeData.linkedin || '',
              website: profile.resumeData.website || '',
            },
            summary: profile.resumeData.professionalSummary || '',
            experience: (profile.resumeData.workExperience || []).map((exp: any, i: number) => ({
              id: exp.id || `exp-${i}`,
              title: exp.jobTitle || '',
              company: exp.company || '',
              location: exp.location || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              current: exp.current || false,
              achievements: exp.achievements || [],
              description: exp.description || '',
            })),
            education: (profile.resumeData.education || []).map((edu: any, i: number) => ({
              id: edu.id || `edu-${i}`,
              degree: edu.degree || '',
              institution: edu.institution || '',
              location: edu.location || '',
              startYear: edu.startYear || '',
              endYear: edu.endYear || edu.graduationYear || '',
              gpa: edu.gpa || '',
              honors: edu.honors || '',
            })),
            skills: (profile.resumeData.skills || []).map((skill: any, i: number) => ({
              id: typeof skill === 'string' ? `skill-${i}` : (skill.id || `skill-${i}`),
              name: typeof skill === 'string' ? skill : skill.name,
              category: typeof skill === 'string' ? 'technical' : (skill.category || 'technical'),
              level: typeof skill === 'string' ? undefined : skill.level,
            })),
            sectionOrder: ['summary', 'experience', 'education', 'skills'],
            templateId: profile.resumeData.templateId || 'modern',
            primaryColor: profile.resumeData.primaryColor || '#0ea5e9',
            secondaryColor: profile.resumeData.secondaryColor || '#7c3aed',
            fontFamily: profile.resumeData.fontFamily || 'Inter',
            version: 1,
          };
          
          loadResume(data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setIsLoading(false);
    }
    
    loadData();
  }, [loadResume]);
  
  // Save handler
  const handleSave = async (data: ResumeData) => {
    if (!candidateId) return;
    
    setIsSaving(true);
    try {
      // Transform back to database format
      const resumeData = {
        professionalTitle: data.title,
        professionalSummary: data.summary,
        location: data.contact.location,
        linkedin: data.contact.linkedin,
        website: data.contact.website,
        workExperience: data.experience.map((exp) => ({
          id: exp.id,
          jobTitle: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          current: exp.current,
          achievements: exp.achievements,
          description: exp.description,
        })),
        education: data.education.map((edu) => ({
          id: edu.id,
          degree: edu.degree,
          institution: edu.institution,
          location: edu.location,
          startYear: edu.startYear,
          endYear: edu.endYear,
          gpa: edu.gpa,
          honors: edu.honors,
        })),
        skills: data.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          category: skill.category,
          level: skill.level,
        })),
        templateId: data.templateId,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        fontFamily: data.fontFamily,
      };
      
      const res = await fetch('/api/candidate/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData }),
      });
      
      if (!res.ok) throw new Error('Save failed');
      
      console.log('Resume saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p className="text-gray-400">Loading resume builder...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ResumeBuilder
      candidateId={candidateId || undefined}
      onSave={handleSave}
    />
  );
}

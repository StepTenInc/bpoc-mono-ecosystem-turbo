'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE INDEX - Auto-exports all templates and provides ResumePreview
// 
// TO ADD A NEW TEMPLATE:
// 1. Create YourTemplate.tsx in this folder
// 2. Import it below
// 3. Add it to TEMPLATE_COMPONENTS
// 4. Add metadata to lib/templates.ts TEMPLATES array
// Done! The system handles everything else.
// ═══════════════════════════════════════════════════════════════════════════════

import { ComponentType } from 'react';
import { TemplateProps } from '../../lib/templates';
import { ResumeData } from '../../lib/schema';

// Import all templates
import { ModernTemplate } from './ModernTemplate';
import { ExecutiveTemplate } from './ExecutiveTemplate';
import { CreativeTemplate } from './CreativeTemplate';
import { MinimalTemplate } from './MinimalTemplate';

// Export individual templates
export { ModernTemplate } from './ModernTemplate';
export { ExecutiveTemplate } from './ExecutiveTemplate';
export { CreativeTemplate } from './CreativeTemplate';
export { MinimalTemplate } from './MinimalTemplate';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE COMPONENT REGISTRY
// Add new templates here - key must match templateId in TEMPLATES array
// ═══════════════════════════════════════════════════════════════════════════════

const TEMPLATE_COMPONENTS: Record<string, ComponentType<TemplateProps>> = {
  modern: ModernTemplate,
  executive: ExecutiveTemplate,
  creative: CreativeTemplate,
  minimal: MinimalTemplate,
  // Add new templates here:
  // premium: PremiumTemplate,
  // tech: TechTemplate,
  // designer: DesignerTemplate,
};

// ═══════════════════════════════════════════════════════════════════════════════
// RESUME PREVIEW COMPONENT
// Automatically selects and renders the correct template
// ═══════════════════════════════════════════════════════════════════════════════

interface ResumePreviewProps {
  data: ResumeData;
  templateId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  editable?: boolean;
  onEditSection?: (section: string, itemId?: string) => void;
  onPhotoUpload?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ResumePreview({
  data,
  templateId,
  primaryColor,
  secondaryColor,
  editable = false,
  onEditSection,
  onPhotoUpload,
  className = '',
  style,
}: ResumePreviewProps) {
  // Get template ID from data or prop
  const activeTemplateId = templateId || data.templateId || 'modern';
  const activeColors = {
    primary: primaryColor || data.primaryColor || '#0ea5e9',
    secondary: secondaryColor || data.secondaryColor || '#7c3aed',
  };
  
  // Get the template component
  const TemplateComponent = TEMPLATE_COMPONENTS[activeTemplateId] || TEMPLATE_COMPONENTS.modern;
  
  return (
    <div className={className} style={style}>
      <TemplateComponent
        data={data}
        primaryColor={activeColors.primary}
        secondaryColor={activeColors.secondary}
        editable={editable}
        onEditSection={onEditSection}
        onPhotoUpload={onPhotoUpload}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function getAvailableTemplates(): string[] {
  return Object.keys(TEMPLATE_COMPONENTS);
}

export function isValidTemplate(templateId: string): boolean {
  return templateId in TEMPLATE_COMPONENTS;
}

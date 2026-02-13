// Template exports
export { ModernTemplate } from './ModernTemplate';
export { ExecutiveTemplate } from './ExecutiveTemplate';
export { CreativeTemplate } from './CreativeTemplate';
export { MinimalTemplate } from './MinimalTemplate';

// Template selector component
import { ModernTemplate } from './ModernTemplate';
import { ExecutiveTemplate } from './ExecutiveTemplate';
import { CreativeTemplate } from './CreativeTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { ResumeData, TemplateId } from '../../lib/schema';

interface ResumePreviewProps {
  data: ResumeData;
  templateId?: TemplateId;
  primaryColor?: string;
  secondaryColor?: string;
  onEditField?: (field: string, value?: string) => void;
  onPhotoUpload?: () => void;
  editable?: boolean;
}

/**
 * ResumePreview - Renders the appropriate template based on templateId
 * This is the main component to use when displaying a resume
 */
export function ResumePreview({
  data,
  templateId = data.templateId || 'modern',
  primaryColor = data.primaryColor || '#0ea5e9',
  secondaryColor = data.secondaryColor || '#7c3aed',
  onEditField,
  onPhotoUpload,
  editable = false,
}: ResumePreviewProps) {
  const props = {
    data,
    primaryColor,
    secondaryColor,
    onEditField,
    onPhotoUpload,
    editable,
  };

  switch (templateId) {
    case 'executive':
      return <ExecutiveTemplate {...props} />;
    case 'creative':
      return <CreativeTemplate {...props} />;
    case 'minimal':
      return <MinimalTemplate {...props} />;
    case 'modern':
    default:
      return <ModernTemplate {...props} />;
  }
}

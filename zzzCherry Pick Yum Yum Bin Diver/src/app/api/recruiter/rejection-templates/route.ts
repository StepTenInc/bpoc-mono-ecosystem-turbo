import { NextResponse } from 'next/server';
import { 
  REJECTION_TEMPLATES, 
  getRejectionCategories, 
  getTemplatesByCategory 
} from '@/lib/constants/rejection-templates';

/**
 * GET /api/recruiter/rejection-templates
 * Get all rejection reason templates
 */
export async function GET() {
  try {
    return NextResponse.json({
      templates: REJECTION_TEMPLATES,
      categories: getRejectionCategories(),
      byCategory: {
        skills: getTemplatesByCategory('skills'),
        experience: getTemplatesByCategory('experience'),
        cultural: getTemplatesByCategory('cultural'),
        logistics: getTemplatesByCategory('logistics'),
        other: getTemplatesByCategory('other'),
      },
    });
  } catch (error) {
    console.error('Error fetching rejection templates:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

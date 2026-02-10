/**
 * File Upload Security Validation
 * 
 * Validates file uploads to prevent malicious file uploads
 */

// Allowed MIME types for different upload contexts
export const ALLOWED_FILE_TYPES = {
  resume: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  document: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ],
} as const;

export type FileUploadContext = keyof typeof ALLOWED_FILE_TYPES;

// Maximum file sizes in bytes
export const MAX_FILE_SIZES = {
  resume: 10 * 1024 * 1024,      // 10MB
  image: 5 * 1024 * 1024,        // 5MB
  document: 20 * 1024 * 1024,    // 20MB
  video: 100 * 1024 * 1024,      // 100MB
} as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file upload
 */
export function validateFileUpload(
  file: File | { type: string; size: number; name: string },
  context: FileUploadContext
): FileValidationResult {
  const allowedTypes = ALLOWED_FILE_TYPES[context];
  const maxSize = MAX_FILE_SIZES[context];

  // Check MIME type
  if (!allowedTypes.includes(file.type as any)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxMB}MB`,
    };
  }

  // Check file extension matches MIME type (basic check)
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = getValidExtensions(context);
  
  if (ext && !validExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${validExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get valid file extensions for a context
 */
function getValidExtensions(context: FileUploadContext): string[] {
  switch (context) {
    case 'resume':
      return ['pdf', 'doc', 'docx'];
    case 'image':
      return ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    case 'document':
      return ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    case 'video':
      return ['mp4', 'webm', 'mov'];
    default:
      return [];
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  return filename
    .replace(/[/\\]/g, '_')
    .replace(/\0/g, '')
    .replace(/\.\./g, '_')
    .trim();
}

/**
 * Generate a safe storage path
 */
export function generateStoragePath(
  userId: string,
  filename: string,
  context: FileUploadContext
): string {
  const timestamp = Date.now();
  const safeFilename = sanitizeFilename(filename);
  const folder = context === 'resume' ? 'resumes' : context === 'image' ? 'images' : 'documents';
  
  return `${folder}/${userId}/${timestamp}-${safeFilename}`;
}

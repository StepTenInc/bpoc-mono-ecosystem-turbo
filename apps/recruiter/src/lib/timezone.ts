/**
 * Timezone utilities for BPOC Platform
 * All times are stored and displayed in Philippines Time (Asia/Manila)
 * 
 * When agencies/clients in different timezones schedule interviews,
 * we convert their local time to PH time for consistency.
 */

// Philippines timezone
export const PH_TIMEZONE = 'Asia/Manila';

/**
 * Convert a date/time to Philippines timezone
 * @param date - Date string, Date object, or ISO string
 * @param sourceTimezone - Optional: the timezone the date is in (defaults to UTC)
 * @returns ISO string in Philippines timezone
 */
export function toPhilippinesTime(date: string | Date, sourceTimezone?: string): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // If invalid date, return empty
    if (isNaN(dateObj.getTime())) {
      console.warn('[Timezone] Invalid date:', date);
      return '';
    }
    
    // Format to ISO string in PH timezone
    // This creates a string like "2024-01-15T09:00:00" in PH time
    const phDate = new Date(dateObj.toLocaleString('en-US', { timeZone: PH_TIMEZONE }));
    
    return phDate.toISOString();
  } catch (error) {
    console.error('[Timezone] Error converting to PH time:', error);
    return typeof date === 'string' ? date : date.toISOString();
  }
}

/**
 * Convert a local time (from client's browser) to Philippines time
 * This is useful when the client schedules in their local time
 * 
 * @param localDateString - Date string from client (in their local timezone)
 * @param clientTimezone - Client's timezone (e.g., 'America/New_York')
 * @returns ISO string in Philippines timezone
 */
export function clientTimeToPhilippinesTime(
  localDateString: string, 
  clientTimezone: string
): string {
  if (!localDateString) return '';
  
  try {
    // Parse the local date string
    const localDate = new Date(localDateString);
    
    if (isNaN(localDate.getTime())) {
      console.warn('[Timezone] Invalid local date:', localDateString);
      return '';
    }
    
    // Get the offset between client timezone and PH timezone
    const clientOffset = getTimezoneOffset(clientTimezone);
    const phOffset = getTimezoneOffset(PH_TIMEZONE);
    
    // Adjust the date
    const offsetDiff = phOffset - clientOffset;
    const phDate = new Date(localDate.getTime() + offsetDiff * 60 * 1000);
    
    return phDate.toISOString();
  } catch (error) {
    console.error('[Timezone] Error converting client time to PH:', error);
    return localDateString;
  }
}

/**
 * Get timezone offset in minutes for a given timezone
 */
function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

/**
 * Format a date for display in Philippines timezone
 * @param date - ISO date string
 * @param options - Intl.DateTimeFormat options
 */
export function formatInPhilippinesTime(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleString('en-PH', {
      ...options,
      timeZone: PH_TIMEZONE,
    });
  } catch (error) {
    console.error('[Timezone] Error formatting date:', error);
    return '';
  }
}

/**
 * Get current time in Philippines timezone as ISO string
 */
export function nowInPhilippines(): string {
  return new Date().toLocaleString('en-US', { timeZone: PH_TIMEZONE });
}

/**
 * Check if a date is in the past (in PH timezone)
 */
export function isPastInPhilippines(date: string | Date): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const nowPH = new Date(nowInPhilippines());
  
  return dateObj < nowPH;
}

/**
 * Common timezone mappings for display
 */
export const TIMEZONE_LABELS: Record<string, string> = {
  'Asia/Manila': 'Philippines (PHT)',
  'America/New_York': 'Eastern (ET)',
  'America/Chicago': 'Central (CT)',
  'America/Denver': 'Mountain (MT)',
  'America/Los_Angeles': 'Pacific (PT)',
  'Europe/London': 'UK (GMT/BST)',
  'Europe/Paris': 'Central Europe (CET)',
  'Asia/Tokyo': 'Japan (JST)',
  'Asia/Singapore': 'Singapore (SGT)',
  'Australia/Sydney': 'Sydney (AEST)',
};

/**
 * CSV Parsing and Import Utilities
 */

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedCSV {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
}

/**
 * Parse CSV file content into structured data
 */
export function parseCSV(csvContent: string): ParsedCSV {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    // Skip empty rows
    if (values.every(v => !v.trim())) continue;

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Parse a single CSV line (handles quoted values with commas)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push last field
  result.push(current.trim());

  return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Clean and normalize email
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate phone number (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation - just check if it has digits
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Normalize phone number
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except + at start
  let normalized = phone.trim();
  if (normalized.startsWith('+')) {
    return '+' + normalized.slice(1).replace(/\D/g, '');
  }
  return normalized.replace(/\D/g, '');
}

/**
 * Validate CSV row for import
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCSVRow(row: CSVRow, columnMapping: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get mapped email field
  const emailField = Object.entries(columnMapping).find(([_, dbField]) => dbField === 'email')?.[0];

  if (!emailField) {
    errors.push('Email column not mapped');
    return { valid: false, errors, warnings };
  }

  const email = row[emailField];

  // Required: Email
  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push(`Invalid email format: ${email}`);
  }

  // Optional but validate if present: Phone
  const phoneField = Object.entries(columnMapping).find(([_, dbField]) => dbField === 'phone_number')?.[0];
  if (phoneField && row[phoneField]) {
    const phone = row[phoneField];
    if (!isValidPhoneNumber(phone)) {
      warnings.push(`Invalid phone number format: ${phone}`);
    }
  }

  // Optional: First name, Last name
  const firstNameField = Object.entries(columnMapping).find(([_, dbField]) => dbField === 'first_name')?.[0];
  const lastNameField = Object.entries(columnMapping).find(([_, dbField]) => dbField === 'last_name')?.[0];

  if (firstNameField && !row[firstNameField]?.trim()) {
    warnings.push('First name is empty');
  }

  if (lastNameField && !row[lastNameField]?.trim()) {
    warnings.push('Last name is empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Map CSV row to database fields
 */
export interface MappedContact {
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  custom_fields: Record<string, string>;
}

export function mapCSVRowToContact(row: CSVRow, columnMapping: Record<string, string>): MappedContact {
  const contact: MappedContact = {
    email: '',
    custom_fields: {},
  };

  for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
    const value = row[csvColumn]?.trim();

    if (!value) continue;

    switch (dbField) {
      case 'email':
        contact.email = normalizeEmail(value);
        break;
      case 'first_name':
        contact.first_name = value;
        break;
      case 'last_name':
        contact.last_name = value;
        break;
      case 'phone_number':
        contact.phone_number = normalizePhoneNumber(value);
        break;
      default:
        // Store in custom_fields
        contact.custom_fields[csvColumn] = value;
        break;
    }
  }

  return contact;
}

/**
 * Auto-detect column mapping from CSV headers
 */
export function autoDetectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const emailPatterns = ['email', 'e-mail', 'email address', 'mail'];
  const firstNamePatterns = ['first name', 'firstname', 'fname', 'given name'];
  const lastNamePatterns = ['last name', 'lastname', 'lname', 'surname', 'family name'];
  const phonePatterns = ['phone', 'phone number', 'mobile', 'tel', 'telephone', 'contact number'];

  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim();

    if (emailPatterns.some(pattern => lowerHeader.includes(pattern))) {
      mapping[header] = 'email';
    } else if (firstNamePatterns.some(pattern => lowerHeader.includes(pattern))) {
      mapping[header] = 'first_name';
    } else if (lastNamePatterns.some(pattern => lowerHeader.includes(pattern))) {
      mapping[header] = 'last_name';
    } else if (phonePatterns.some(pattern => lowerHeader.includes(pattern))) {
      mapping[header] = 'phone_number';
    } else {
      // Map to custom field
      mapping[header] = `custom_${header.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    }
  }

  return mapping;
}

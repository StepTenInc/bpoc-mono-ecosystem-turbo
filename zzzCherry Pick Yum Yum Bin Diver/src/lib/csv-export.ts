/**
 * CSV Export Utilities
 * Convert data to CSV format and create downloadable files
 */

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV(data: Record<string, any>[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = csvHeaders.map(escapeCSVValue).join(',');

  // Create data rows
  const dataRows = data.map(row =>
    csvHeaders
      .map(header => {
        const value = row[header];
        return escapeCSVValue(value);
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV values (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Create downloadable CSV blob
 */
export function createCSVBlob(csvContent: string): Blob {
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(data: Record<string, any>[], filename: string, headers?: string[]) {
  const csv = convertToCSV(data, headers);
  const blob = createCSVBlob(csv);
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
}

/**
 * Format data for export (flatten nested objects)
 */
export function flattenForExport(data: Record<string, any>[]): Record<string, any>[] {
  return data.map(item => {
    const flattened: Record<string, any> = {};

    Object.keys(item).forEach(key => {
      const value = item[key];

      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.keys(value).forEach(nestedKey => {
          flattened[`${key}_${nestedKey}`] = value[nestedKey];
        });
      } else if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings
        flattened[key] = value.join(', ');
      } else {
        flattened[key] = value;
      }
    });

    return flattened;
  });
}

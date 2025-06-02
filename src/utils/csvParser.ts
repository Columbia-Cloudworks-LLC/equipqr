
import { Equipment } from '@/types';

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedCSVData {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Parse CSV content into structured data
 */
export function parseCSV(csvContent: string): ParsedCSVData {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  if (headers.length === 0) {
    throw new Error('CSV file has no headers');
  }

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) { // Skip empty lines
      const values = parseCSVLine(line);
      const row: CSVRow = {};
      
      // Map values to headers, handling cases where row has fewer/more columns
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }
  }

  return {
    headers,
    rows,
    totalRows: rows.length
  };
}

/**
 * Parse a single CSV line, handling quoted fields and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

/**
 * Detect and convert date strings to ISO format
 */
export function detectAndConvertDate(value: string): string | null {
  if (!value || value.trim() === '') return null;
  
  const trimmedValue = value.trim();
  
  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD (ISO)
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // M-D-YYYY
  ];
  
  // Check if it matches any pattern
  const matchedPattern = datePatterns.some(pattern => pattern.test(trimmedValue));
  if (!matchedPattern) return null;
  
  // Try to parse the date
  let parsedDate: Date;
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    // Already in ISO format
    parsedDate = new Date(trimmedValue);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedValue)) {
    // MM/DD/YYYY
    const [month, day, year] = trimmedValue.split('/');
    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedValue)) {
    // MM-DD-YYYY
    const [month, day, year] = trimmedValue.split('-');
    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmedValue)) {
    // M/D/YYYY
    const [month, day, year] = trimmedValue.split('/');
    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmedValue)) {
    // M-D-YYYY
    const [month, day, year] = trimmedValue.split('-');
    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    return null;
  }
  
  // Validate the parsed date
  if (isNaN(parsedDate.getTime())) return null;
  
  // Return in YYYY-MM-DD format
  return parsedDate.toISOString().split('T')[0];
}

/**
 * Map CSV field names to equipment properties
 */
export const CSV_FIELD_MAPPING: Record<string, keyof Equipment> = {
  'name': 'name',
  'equipment_name': 'name',
  'title': 'name',
  'manufacturer': 'manufacturer',
  'make': 'manufacturer',
  'model': 'model',
  'serial_number': 'serial_number',
  'serial': 'serial_number',
  'serial_no': 'serial_number',
  'asset_id': 'asset_id',
  'asset_number': 'asset_id',
  'status': 'status',
  'location': 'location',
  'site': 'location',
  'notes': 'notes',
  'description': 'notes',
  'install_date': 'install_date',
  'installation_date': 'install_date',
  'warranty_expiration': 'warranty_expiration',
  'warranty_expires': 'warranty_expiration',
  'warranty_date': 'warranty_expiration'
};

/**
 * Get normalized field mapping from CSV headers
 */
export function getNormalizedFieldMapping(headers: string[]): Record<string, keyof Equipment> {
  const mapping: Record<string, keyof Equipment> = {};
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const mappedField = CSV_FIELD_MAPPING[normalizedHeader];
    if (mappedField) {
      mapping[header] = mappedField;
    }
  });
  
  return mapping;
}

/**
 * Validate CSV row data for equipment import
 */
export function validateEquipmentRow(row: CSVRow, rowIndex: number, fieldMapping: Record<string, keyof Equipment>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for required name field
  const nameField = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'name');
  if (!nameField || !row[nameField] || row[nameField].trim() === '') {
    errors.push({
      row: rowIndex,
      field: nameField || 'name',
      message: 'Equipment name is required',
      value: row[nameField] || ''
    });
  }
  
  // Validate status values
  const statusField = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'status');
  if (statusField && row[statusField]) {
    const validStatuses = ['active', 'inactive', 'maintenance', 'retired', 'pending'];
    const status = row[statusField].toLowerCase();
    if (!validStatuses.includes(status)) {
      errors.push({
        row: rowIndex,
        field: statusField,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        value: row[statusField]
      });
    }
  }
  
  // Validate date fields
  const dateFields = ['install_date', 'warranty_expiration'];
  dateFields.forEach(dateField => {
    const csvField = Object.keys(fieldMapping).find(key => fieldMapping[key] === dateField as keyof Equipment);
    if (csvField && row[csvField]) {
      const convertedDate = detectAndConvertDate(row[csvField]);
      if (convertedDate === null && row[csvField].trim() !== '') {
        errors.push({
          row: rowIndex,
          field: csvField,
          message: 'Invalid date format. Use YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY',
          value: row[csvField]
        });
      }
    }
  });
  
  return errors;
}

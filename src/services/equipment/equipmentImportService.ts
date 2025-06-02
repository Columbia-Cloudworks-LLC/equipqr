
import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/types';
import { ParsedCSVData, ValidationError, validateEquipmentRow, getNormalizedFieldMapping, detectAndConvertDate } from '@/utils/csvParser';

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ValidationError[];
  warnings: string[];
}

export interface ImportProgress {
  current: number;
  total: number;
  stage: 'validating' | 'importing' | 'complete';
  message: string;
}

/**
 * Import equipment from parsed CSV data
 */
export async function importEquipmentFromCSV(
  csvData: ParsedCSVData,
  organizationId: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    failed: 0,
    errors: [],
    warnings: []
  };

  try {
    // Get current user
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User must be logged in to import equipment');
    }

    const userId = user.user.id;

    // Get field mapping
    const fieldMapping = getNormalizedFieldMapping(csvData.headers);
    console.log('Field mapping:', fieldMapping);

    // Check if we have at least a name field
    const hasNameField = Object.values(fieldMapping).includes('name');
    if (!hasNameField) {
      result.errors.push({
        row: 0,
        field: 'headers',
        message: 'CSV must contain a name column (name, equipment_name, or title)',
        value: csvData.headers.join(', ')
      });
      return result;
    }

    // Stage 1: Validation
    onProgress?.({
      current: 0,
      total: csvData.rows.length,
      stage: 'validating',
      message: 'Validating CSV data...'
    });

    // Validate all rows
    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i];
      const rowErrors = validateEquipmentRow(row, i + 2, fieldMapping); // +2 for header and 0-based index
      result.errors.push(...rowErrors);

      onProgress?.({
        current: i + 1,
        total: csvData.rows.length,
        stage: 'validating',
        message: `Validating row ${i + 1} of ${csvData.rows.length}...`
      });
    }

    // If there are validation errors, return early
    if (result.errors.length > 0) {
      result.failed = csvData.rows.length;
      return result;
    }

    // Stage 2: Import
    onProgress?.({
      current: 0,
      total: csvData.rows.length,
      stage: 'importing',
      message: 'Importing equipment records...'
    });

    // Import each row
    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i];
      
      try {
        await importSingleEquipment(row, fieldMapping, organizationId, userId);
        result.imported++;
      } catch (error) {
        console.error('Error importing row:', error);
        result.failed++;
        result.errors.push({
          row: i + 2,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown import error',
          value: JSON.stringify(row)
        });
      }

      onProgress?.({
        current: i + 1,
        total: csvData.rows.length,
        stage: 'importing',
        message: `Importing ${i + 1} of ${csvData.rows.length}...`
      });
    }

    // Final stage
    onProgress?.({
      current: csvData.rows.length,
      total: csvData.rows.length,
      stage: 'complete',
      message: `Import complete: ${result.imported} imported, ${result.failed} failed`
    });

    result.success = result.imported > 0;
    return result;

  } catch (error) {
    console.error('Import failed:', error);
    result.errors.push({
      row: 0,
      field: 'general',
      message: error instanceof Error ? error.message : 'Import process failed',
      value: ''
    });
    return result;
  }
}

/**
 * Import a single equipment record
 */
async function importSingleEquipment(
  row: any,
  fieldMapping: Record<string, keyof Equipment>,
  organizationId: string,
  userId: string
): Promise<void> {
  // Build equipment data from CSV row
  const equipmentData: any = {
    org_id: organizationId,
    created_by: userId,
    status: 'active' // Default status
  };

  // Map CSV fields to equipment properties
  Object.keys(fieldMapping).forEach(csvField => {
    const equipmentField = fieldMapping[csvField];
    const value = row[csvField];
    
    if (value && value.trim() !== '') {
      if (equipmentField === 'install_date' || equipmentField === 'warranty_expiration') {
        // Handle date fields
        const convertedDate = detectAndConvertDate(value);
        if (convertedDate) {
          equipmentData[equipmentField] = convertedDate;
        }
      } else if (equipmentField === 'status') {
        // Normalize status values
        equipmentData[equipmentField] = value.toLowerCase();
      } else {
        // Regular text fields
        equipmentData[equipmentField] = value.trim();
      }
    }
  });

  // Ensure name is present (validation should have caught this)
  if (!equipmentData.name) {
    throw new Error('Equipment name is required');
  }

  console.log('Importing equipment:', equipmentData);

  // Insert into database
  const { error } = await supabase
    .from('equipment')
    .insert(equipmentData);

  if (error) {
    console.error('Database insert error:', error);
    throw new Error(`Failed to insert equipment: ${error.message}`);
  }
}

/**
 * Generate sample CSV data for download
 */
export function generateSampleCSV(): string {
  const headers = [
    'name',
    'manufacturer',
    'model', 
    'serial_number',
    'status',
    'location',
    'install_date',
    'warranty_expiration',
    'notes'
  ];
  
  const sampleRows = [
    [
      'Excavator CAT 320',
      'Caterpillar',
      'CAT 320',
      'CAT320-001',
      'active',
      'Construction Site A',
      '2023-01-15',
      '2025-01-15',
      'Heavy duty excavator for site work'
    ],
    [
      'Generator Diesel 50kW',
      'Generac',
      'MDG50DF4',
      'GEN-50-002', 
      'active',
      'Equipment Yard',
      '2023-03-10',
      '2026-03-10',
      'Backup power generator'
    ],
    [
      'Forklift Toyota 5000lb',
      'Toyota',
      'Model 8FGCU25',
      'TY-FL-003',
      'maintenance',
      'Warehouse B',
      '2022-11-20',
      '2024-11-20',
      'Warehouse material handling'
    ]
  ];
  
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => 
      row.map(cell => {
        // Escape cells that contain commas or quotes
        if (cell.includes(',') || cell.includes('"')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

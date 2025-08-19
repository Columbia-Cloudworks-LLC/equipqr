import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MappedRow {
  name?: string;
  manufacturer?: string;
  model?: string;
  serial?: string;
  location?: string;
  last_maintenance?: string;
  customAttributes: Record<string, any>;
}

interface ImportRequest {
  dryRun: boolean;
  rows: Record<string, string>[];
  mappings: Array<{
    header: string;
    mappedTo: 'name' | 'manufacturer' | 'model' | 'serial' | 'location' | 'last_maintenance' | 'custom' | 'skip';
    customKey?: string;
  }>;
  importId: string;
  teamId: string | null;
  organizationId: string;
  chunkIndex?: number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    const body: ImportRequest = await req.json();
    const { dryRun, rows, mappings, importId, teamId, organizationId } = body;

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Verify user is admin/owner for the organization
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Check user's role in the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return new Response('Forbidden', { 
        status: 403,
        headers: corsHeaders 
      });
    }

    if (dryRun) {
      return await handleDryRun(organizationId, rows, mappings);
    } else {
      return await handleImport(organizationId, rows, mappings, importId, teamId, user.id);
    }

  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleDryRun(
  organizationId: string,
  rows: Record<string, string>[],
  mappings: Array<any>
) {
  let validCount = 0;
  let willCreate = 0;
  let willMerge = 0;
  let errorCount = 0;
  const sample: any[] = [];
  const warnings: string[] = [];
  const errors: Array<{ row: number; reason: string }> = [];

  for (let i = 0; i < Math.min(rows.length, 100); i++) {
    const row = rows[i];
    const mappedRow = mapRow(row, mappings);
    
    try {
      const validation = validateRow(mappedRow);
      if (!validation.valid) {
        errorCount++;
        errors.push({ row: i + 1, reason: validation.error || 'Invalid row' });
        sample.push({
          rowIndex: i,
          action: 'error',
          ...mappedRow,
          error: validation.error
        });
        continue;
      }

      // Check if equipment exists
      const existing = await findExistingEquipment(organizationId, mappedRow);
      
      if (existing) {
        willMerge++;
        sample.push({
          rowIndex: i,
          action: 'merge',
          ...mappedRow
        });
      } else {
        willCreate++;
        sample.push({
          rowIndex: i,
          action: 'create',
          ...mappedRow
        });
      }
      
      validCount++;
    } catch (error) {
      errorCount++;
      errors.push({ row: i + 1, reason: error.message });
      sample.push({
        rowIndex: i,
        action: 'error',
        ...mappedRow,
        error: error.message
      });
    }
  }

  return new Response(JSON.stringify({
    validCount,
    willCreate,
    willMerge,
    errorCount,
    sample,
    warnings,
    errors
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleImport(
  organizationId: string,
  rows: Record<string, string>[],
  mappings: Array<any>,
  importId: string,
  teamId: string | null,
  userId: string
) {
  let created = 0;
  let merged = 0;
  let failed = 0;
  const failures: Array<{ row: number; reason: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mappedRow = mapRow(row, mappings);
    
    try {
      const validation = validateRow(mappedRow);
      if (!validation.valid) {
        failed++;
        failures.push({ row: i + 1, reason: validation.error || 'Invalid row' });
        continue;
      }

      const existing = await findExistingEquipment(organizationId, mappedRow);
      
      if (existing) {
        // Merge logic
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        // Update name if provided
        if (mappedRow.name && mappedRow.name.trim() !== '') {
          updateData.name = mappedRow.name.trim();
        }

        // Update location if provided
        if (mappedRow.location && mappedRow.location.trim() !== '') {
          updateData.location = mappedRow.location.trim();
        }

        // Merge custom attributes
        if (Object.keys(mappedRow.customAttributes).length > 0) {
          updateData.custom_attributes = {
            ...(existing.custom_attributes || {}),
            ...mappedRow.customAttributes
          };
        }

        // Update last_maintenance if newer
        if (mappedRow.last_maintenance) {
          const newDate = new Date(mappedRow.last_maintenance);
          const existingDate = existing.last_maintenance ? new Date(existing.last_maintenance) : null;
          
          if (!existingDate || newDate > existingDate) {
            updateData.last_maintenance = mappedRow.last_maintenance;
          }
        }

        await supabase
          .from('equipment')
          .update(updateData)
          .eq('id', existing.id);
          
        merged++;
      } else {
        // Create new equipment
        const insertData: any = {
          organization_id: organizationId,
          name: mappedRow.name || `${mappedRow.manufacturer || ''} ${mappedRow.model || ''}`.trim() || 'Imported Equipment',
          manufacturer: mappedRow.manufacturer || '',
          model: mappedRow.model || '',
          serial_number: mappedRow.serial || '',
          status: 'active',
          location: mappedRow.location || 'Unknown',
          installation_date: new Date().toISOString().split('T')[0],
          custom_attributes: mappedRow.customAttributes,
          import_id: importId,
          team_id: teamId
        };

        if (mappedRow.last_maintenance) {
          insertData.last_maintenance = mappedRow.last_maintenance;
        }

        await supabase
          .from('equipment')
          .insert(insertData);
          
        created++;
      }
    } catch (error) {
      failed++;
      failures.push({ row: i + 1, reason: error.message });
    }
  }

  return new Response(JSON.stringify({
    created,
    merged,
    failed,
    failures
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function mapRow(row: Record<string, string>, mappings: Array<any>): MappedRow {
  const result: MappedRow = {
    customAttributes: {}
  };

  for (const mapping of mappings) {
    const value = row[mapping.header];
    if (!value || value.trim() === '') continue;

    if (mapping.mappedTo === 'custom') {
      result.customAttributes[mapping.customKey || mapping.header] = inferType(value);
    } else if (mapping.mappedTo !== 'skip') {
      (result as any)[mapping.mappedTo] = value.trim();
    }
  }

  return result;
}

function validateRow(row: MappedRow): { valid: boolean; error?: string } {
  const hasSerial = !!row.serial;
  const hasManufacturer = !!row.manufacturer;
  const hasModel = !!row.model;

  if (hasSerial || (hasManufacturer && hasModel)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Provide a serial or both manufacturer and model to create a new asset'
  };
}

async function findExistingEquipment(organizationId: string, row: MappedRow) {
  if (!row.manufacturer || !row.model || !row.serial) {
    return null;
  }

  const { data } = await supabase
    .from('equipment')
    .select('*')
    .eq('organization_id', organizationId)
    .ilike('manufacturer', row.manufacturer)
    .ilike('model', row.model)
    .ilike('serial_number', row.serial)
    .single();

  return data;
}

function inferType(value: string): string | number | boolean {
  const trimmed = value.trim();
  
  // Boolean
  if (['true', 'false', 'yes', 'no'].includes(trimmed.toLowerCase())) {
    return ['true', 'yes'].includes(trimmed.toLowerCase());
  }
  
  // Number
  const num = Number(trimmed);
  if (!isNaN(num) && isFinite(num) && trimmed !== '') {
    return num;
  }
  
  return trimmed;
}
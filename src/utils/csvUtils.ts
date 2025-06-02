

import { Equipment } from '@/types';

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: any[], headers?: string[]): string {
  if (!data.length) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = data.map(row => 
    csvHeaders.map(header => {
      const value = row[header] || '';
      // Escape values that contain commas, quotes, or newlines
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders.join(','), ...csvRows].join('\n');
}

/**
 * Parse CSV string to array of objects
 */
export function csvToArray(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

/**
 * Generate QR print format CSV for equipment
 */
export function generateQrPrintCsv(equipment: Equipment[]): string {
  const qrData = equipment.map(item => ({
    url: `${window.location.origin}/equipment/${item.id}/qr`,
    title: item.name,
    description: `${item.manufacturer || ''} ${item.model || ''}`.trim() || 'Equipment'
  }));
  
  return arrayToCSV(qrData, ['url', 'title', 'description']);
}

/**
 * Generate full data CSV export for equipment
 */
export function generateFullDataCsv(equipment: Equipment[]): string {
  const exportData = equipment.map(item => ({
    id: item.id,
    name: item.name,
    manufacturer: item.manufacturer || '',
    model: item.model || '',
    serial_number: item.serial_number || '',
    asset_id: item.asset_id || '',
    status: item.status,
    location: item.location || '',
    install_date: item.install_date || '',
    warranty_expiration: item.warranty_expiration || '',
    notes: item.notes || '',
    team_name: item.team_name || '',
    org_name: item.org_name || '',
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
  
  return arrayToCSV(exportData);
}

/**
 * Generate JSON export for equipment
 */
export function generateEquipmentJson(equipment: Equipment[]): string {
  const exportData = equipment.map(item => ({
    id: item.id,
    name: item.name,
    manufacturer: item.manufacturer,
    model: item.model,
    serial_number: item.serial_number,
    asset_id: item.asset_id,
    status: item.status,
    location: item.location,
    install_date: item.install_date,
    warranty_expiration: item.warranty_expiration,
    notes: item.notes,
    team_name: item.team_name,
    org_name: item.org_name,
    attributes: item.attributes,
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate XML export for equipment
 */
export function generateEquipmentXml(equipment: Equipment[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<equipment_export>\n';
  const xmlFooter = '</equipment_export>';
  
  const xmlItems = equipment.map(item => {
    return `  <equipment>
    <id>${escapeXml(item.id)}</id>
    <name>${escapeXml(item.name)}</name>
    <manufacturer>${escapeXml(item.manufacturer || '')}</manufacturer>
    <model>${escapeXml(item.model || '')}</model>
    <serial_number>${escapeXml(item.serial_number || '')}</serial_number>
    <asset_id>${escapeXml(item.asset_id || '')}</asset_id>
    <status>${escapeXml(item.status)}</status>
    <location>${escapeXml(item.location || '')}</location>
    <install_date>${escapeXml(item.install_date || '')}</install_date>
    <warranty_expiration>${escapeXml(item.warranty_expiration || '')}</warranty_expiration>
    <notes>${escapeXml(item.notes || '')}</notes>
    <team_name>${escapeXml(item.team_name || '')}</team_name>
    <org_name>${escapeXml(item.org_name || '')}</org_name>
    <created_at>${escapeXml(item.created_at || '')}</created_at>
    <updated_at>${escapeXml(item.updated_at || '')}</updated_at>
    ${item.attributes ? `<attributes>${escapeXml(JSON.stringify(item.attributes))}</attributes>` : ''}
  </equipment>`;
  }).join('\n');
  
  return xmlHeader + xmlItems + '\n' + xmlFooter;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}


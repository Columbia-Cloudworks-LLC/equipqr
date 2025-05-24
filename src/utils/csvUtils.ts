
/**
 * Utility functions for equipment data export in multiple formats
 */

/**
 * Generate QR Print Format CSV (existing format for QR code printers)
 */
export function generateQrPrintCsv(equipment: any[]): string {
  if (!Array.isArray(equipment) || equipment.length === 0) {
    return "URL,Title,Description\n";
  }
  
  // Create CSV header
  const headers = ["URL", "Title", "Description"];
  const csvContent = [headers.join(",")];
  
  // Get base URL for equipment links
  const baseUrl = getSiteUrl();
  
  // Add equipment data rows
  equipment.forEach(item => {
    if (!item) return;
    
    // Create a full URL to the equipment detail page with QR scan tracking parameter
    const url = `${baseUrl}/equipment/${item.id}?source=qr`;
    
    // Escape potential CSV-breaking characters in fields
    const title = escapeCsvField(item.name || "");
    const description = escapeCsvField(item.notes || item.description || "");
    
    csvContent.push(`${url},${title},${description}`);
  });
  
  return csvContent.join("\n");
}

/**
 * Generate Full Data CSV export with all standard table fields
 */
export function generateFullDataCsv(equipment: any[]): string {
  if (!Array.isArray(equipment) || equipment.length === 0) {
    return "Name,Manufacturer,Model,Serial Number,Status,Location,Team,Organization,Install Date,Warranty Expiration,Notes,Created At,Last Scan Location,Last Scan Date\n";
  }
  
  const headers = [
    "Name", "Manufacturer", "Model", "Serial Number", "Status", "Location", 
    "Team", "Organization", "Install Date", "Warranty Expiration", "Notes", 
    "Created At", "Last Scan Location", "Last Scan Date"
  ];
  
  const csvContent = [headers.join(",")];
  
  equipment.forEach(item => {
    if (!item) return;
    
    // Format location from GPS coordinates if available
    const lastScanLocation = item.last_scan_latitude && item.last_scan_longitude 
      ? `${item.last_scan_latitude.toFixed(6)}, ${item.last_scan_longitude.toFixed(6)}`
      : "";
    
    const lastScanDate = item.last_scan_timestamp 
      ? new Date(item.last_scan_timestamp).toLocaleDateString()
      : "";
    
    const row = [
      escapeCsvField(item.name || ""),
      escapeCsvField(item.manufacturer || ""),
      escapeCsvField(item.model || ""),
      escapeCsvField(item.serial_number || ""),
      escapeCsvField(item.status || ""),
      escapeCsvField(item.location || ""),
      escapeCsvField(item.team_name || ""),
      escapeCsvField(item.org_name || ""),
      escapeCsvField(item.install_date || ""),
      escapeCsvField(item.warranty_expiration || ""),
      escapeCsvField(item.notes || ""),
      escapeCsvField(new Date(item.created_at).toLocaleDateString()),
      escapeCsvField(lastScanLocation),
      escapeCsvField(lastScanDate)
    ];
    
    csvContent.push(row.join(","));
  });
  
  return csvContent.join("\n");
}

/**
 * Generate JSON export with complete equipment data including custom attributes
 */
export function generateEquipmentJson(equipment: any[]): string {
  const exportData = {
    exported_at: new Date().toISOString(),
    total_records: equipment.length,
    equipment: equipment.map(item => ({
      id: item.id,
      name: item.name,
      manufacturer: item.manufacturer,
      model: item.model,
      serial_number: item.serial_number,
      status: item.status,
      location: item.location,
      team: {
        id: item.team_id,
        name: item.team_name
      },
      organization: {
        id: item.org_id,
        name: item.org_name
      },
      dates: {
        created_at: item.created_at,
        updated_at: item.updated_at,
        install_date: item.install_date,
        warranty_expiration: item.warranty_expiration
      },
      location_tracking: {
        last_scan_latitude: item.last_scan_latitude,
        last_scan_longitude: item.last_scan_longitude,
        last_scan_accuracy: item.last_scan_accuracy,
        last_scan_timestamp: item.last_scan_timestamp,
        location_override: item.location_override,
        location_source: item.location_source
      },
      notes: item.notes,
      custom_attributes: item.attributes || []
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate XML export with structured data that Excel can import
 */
export function generateEquipmentXml(equipment: any[]): string {
  const escapeXml = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<equipment_export exported_at="${new Date().toISOString()}" total_records="${equipment.length}">\n`;
  
  equipment.forEach(item => {
    xml += '  <equipment>\n';
    xml += `    <id>${escapeXml(item.id || '')}</id>\n`;
    xml += `    <name>${escapeXml(item.name || '')}</name>\n`;
    xml += `    <manufacturer>${escapeXml(item.manufacturer || '')}</manufacturer>\n`;
    xml += `    <model>${escapeXml(item.model || '')}</model>\n`;
    xml += `    <serial_number>${escapeXml(item.serial_number || '')}</serial_number>\n`;
    xml += `    <status>${escapeXml(item.status || '')}</status>\n`;
    xml += `    <location>${escapeXml(item.location || '')}</location>\n`;
    xml += `    <team_name>${escapeXml(item.team_name || '')}</team_name>\n`;
    xml += `    <organization_name>${escapeXml(item.org_name || '')}</organization_name>\n`;
    xml += `    <install_date>${escapeXml(item.install_date || '')}</install_date>\n`;
    xml += `    <warranty_expiration>${escapeXml(item.warranty_expiration || '')}</warranty_expiration>\n`;
    xml += `    <created_at>${escapeXml(item.created_at || '')}</created_at>\n`;
    xml += `    <notes>${escapeXml(item.notes || '')}</notes>\n`;
    
    // Location tracking
    xml += '    <location_tracking>\n';
    xml += `      <last_scan_latitude>${item.last_scan_latitude || ''}</last_scan_latitude>\n`;
    xml += `      <last_scan_longitude>${item.last_scan_longitude || ''}</last_scan_longitude>\n`;
    xml += `      <last_scan_accuracy>${item.last_scan_accuracy || ''}</last_scan_accuracy>\n`;
    xml += `      <last_scan_timestamp>${escapeXml(item.last_scan_timestamp || '')}</last_scan_timestamp>\n`;
    xml += `      <location_override>${item.location_override || false}</location_override>\n`;
    xml += `      <location_source>${escapeXml(item.location_source || '')}</location_source>\n`;
    xml += '    </location_tracking>\n';
    
    // Custom attributes
    if (item.attributes && item.attributes.length > 0) {
      xml += '    <custom_attributes>\n';
      item.attributes.forEach((attr: any) => {
        xml += '      <attribute>\n';
        xml += `        <key>${escapeXml(attr.key || '')}</key>\n`;
        xml += `        <value>${escapeXml(attr.value || '')}</value>\n`;
        xml += '      </attribute>\n';
      });
      xml += '    </custom_attributes>\n';
    }
    
    xml += '  </equipment>\n';
  });
  
  xml += '</equipment_export>';
  return xml;
}

/**
 * Download data as a file with appropriate MIME type
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  // Create blob with appropriate MIME type
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  
  // Create object URL for download
  const url = URL.createObjectURL(blob);
  
  // Create temporary link element to trigger download
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  // Append to document, click to download, then remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL
  URL.revokeObjectURL(url);
}

/**
 * Legacy function - kept for backward compatibility
 */
export function generateEquipmentCsv(equipment: any[]): string {
  return generateQrPrintCsv(equipment);
}

/**
 * Legacy function - kept for backward compatibility
 */
export function downloadCsv(csvContent: string, filename?: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
  const finalFilename = filename || `equipment-export-${timestamp}.csv`;
  downloadFile(csvContent, finalFilename, "text/csv");
}

/**
 * Escape CSV field to handle commas, quotes, etc.
 */
function escapeCsvField(field: string): string {
  // If field contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (field.includes(",") || field.includes("\"") || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Get the base URL for the current environment
 * Importing from authCallbackUtils to reuse existing function
 */
import { getSiteUrl } from './authCallbackUtils';

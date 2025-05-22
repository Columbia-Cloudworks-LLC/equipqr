
/**
 * Utility functions for CSV generation and export
 */

/**
 * Generate CSV content from equipment data
 */
export function generateEquipmentCsv(equipment: any[]): string {
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
    
    // Create a full URL to the equipment detail page
    const url = `${baseUrl}/equipment/${item.id}`;
    
    // Escape potential CSV-breaking characters in fields
    const title = escapeCsvField(item.name || "");
    const description = escapeCsvField(item.notes || item.description || "");
    
    csvContent.push(`${url},${title},${description}`);
  });
  
  return csvContent.join("\n");
}

/**
 * Download data as a CSV file
 */
export function downloadCsv(csvContent: string, filename?: string): void {
  // Create blob from CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Create object URL for download
  const url = URL.createObjectURL(blob);
  
  // Generate timestamped filename if not provided
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const finalFilename = filename || `equipment-export-${timestamp}.csv`;
  
  // Create temporary link element to trigger download
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", finalFilename);
  link.style.visibility = "hidden";
  
  // Append to document, click to download, then remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL
  URL.revokeObjectURL(url);
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

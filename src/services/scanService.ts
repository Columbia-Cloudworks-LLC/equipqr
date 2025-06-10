
import { recordEnhancedScan, getEnhancedScanHistory } from '@/services/equipment/enhancedScanService';

/**
 * Records a scan event for an equipment using the enhanced scan service
 * This is a wrapper around the enhanced scan service for backward compatibility
 */
export async function recordScan(equipmentId: string, userId?: string): Promise<boolean> {
  console.log(`Recording scan for equipment ${equipmentId}${userId ? ` by user ${userId}` : ' (current user)'}`);
  
  // Use the enhanced scan service which handles permission validation
  return await recordEnhancedScan(equipmentId, 'qr_code');
}

/**
 * Get scan history for an equipment using the enhanced scan service
 */
export async function getScanHistory(equipmentId: string) {
  console.log(`Getting scan history for equipment ${equipmentId}`);
  
  // Use the enhanced scan service
  const scanHistory = await getEnhancedScanHistory(equipmentId);
  
  // Transform the data to match the expected format
  return scanHistory.map(scan => ({
    id: scan.id,
    timestamp: scan.ts,
    userId: scan.scanned_by_user_id,
    userName: scan.user_display_name || 'Anonymous',
    orgName: scan.user_org_name || 'Unknown Organization',
    ipAddress: scan.scanned_from_ip
  }));
}

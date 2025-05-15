
import { Equipment, EquipmentAttribute } from '@/types';
import { processDateFields } from '@/utils/authUtils';

/**
 * Extract attributes from equipment data before sending to the database
 * @param equipment - The equipment data containing attributes
 * @returns The extracted attributes array
 */
export function extractAttributes(equipment: Partial<Equipment>): EquipmentAttribute[] {
  // Extract attributes if they exist
  const attributes = equipment.attributes || [];
  return attributes;
}

/**
 * Prepare equipment data for database insertion
 * @param equipment - The equipment data
 * @param appUserId - The app_user ID of the current user
 * @param orgId - The organization ID for the equipment
 * @returns The processed equipment data ready for database insertion
 */
export function prepareEquipmentData(
  equipment: Partial<Equipment>, 
  appUserId: string, 
  orgId: string
): any {
  // Make a clean copy without the attributes
  const equipmentData = { ...equipment };
  delete equipmentData.attributes;
  
  // Handle special values
  if (equipmentData.team_id === 'none' || equipmentData.team_id === '') {
    equipmentData.team_id = null;
  }
  
  // Add required fields
  const nowTimestamp = new Date().toISOString();
  const dataWithMetadata = {
    ...equipmentData,
    org_id: orgId,
    created_by: appUserId,
    created_at: nowTimestamp,
    updated_at: nowTimestamp
  };
  
  // Process date fields correctly
  return processDateFields(dataWithMetadata, ['install_date', 'warranty_expiration']);
}

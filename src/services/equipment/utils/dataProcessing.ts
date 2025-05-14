
import { Equipment, EquipmentAttribute } from "@/types";
import { processDateFields } from "@/utils/authUtils";

/**
 * Process equipment data for database insertion
 * @param equipment - The equipment data from the form
 * @param appUserId - The app user ID
 * @param orgId - The organization ID
 * @returns Processed equipment data ready for database insertion
 */
export function prepareEquipmentData(
  equipment: Partial<Equipment>, 
  appUserId: string, 
  orgId: string
) {
  // Extract attributes before sending to database
  const equipmentData = { ...equipment };
  delete equipmentData.attributes;
  
  // Process dates and prepare data
  return processDateFields({
    name: equipment.name,
    model: equipment.model,
    serial_number: equipment.serial_number,
    manufacturer: equipment.manufacturer,
    status: equipment.status || 'active',
    location: equipment.location,
    install_date: equipment.install_date,
    warranty_expiration: equipment.warranty_expiration,
    notes: equipment.notes,
    team_id: equipment.team_id === 'none' ? null : equipment.team_id,
    // Add required fields
    created_by: appUserId,
    org_id: orgId
  }, ['install_date', 'warranty_expiration']);
}

/**
 * Extract attributes from equipment data
 * @param equipment - The equipment data from the form
 * @returns Array of equipment attributes
 */
export function extractAttributes(equipment: Partial<Equipment>): EquipmentAttribute[] {
  return equipment.attributes || [];
}

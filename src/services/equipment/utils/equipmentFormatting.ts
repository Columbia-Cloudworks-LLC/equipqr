
import { Equipment } from "@/types";

/**
 * Process equipment list to add team and org names
 * @param equipmentList - The raw equipment data from database
 * @returns Formatted equipment list with additional fields
 */
export function processEquipmentList(equipmentList: any[]): Equipment[] {
  return equipmentList.map(item => ({
    ...item,
    team_name: item.team?.name || null,
    org_name: item.org?.name || 'Unknown Organization',
    is_external_org: false, // Default to false for org equipment
  }));
}

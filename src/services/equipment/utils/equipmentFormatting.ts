
import { Equipment } from "@/types";

/**
 * Process equipment data from the database to match the frontend data model
 */
export function processEquipmentList(data: any[]): Equipment[] {
  console.log('Processing equipment list:', data);
  return data.map(item => {
    // Determine if the equipment has no team
    const hasNoTeam = item.team_id === null;
    
    return {
      ...item,
      team_name: item.team?.name || null,
      org_name: item.org?.name || 'Unknown Organization',
      is_external_org: item.is_external_org || false,
      can_edit: item.can_edit !== undefined ? item.can_edit : true,
      attributes: item.attributes || [],
      has_no_team: item.has_no_team !== undefined ? item.has_no_team : hasNoTeam
    };
  });
}

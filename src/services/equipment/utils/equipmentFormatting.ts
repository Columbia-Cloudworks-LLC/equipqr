
import { Equipment } from "@/types";

/**
 * Process equipment data from the database to match the frontend data model
 */
export function processEquipmentList(data: any[]): Equipment[] {
  console.log('Processing equipment list:', data?.length || 0, 'items');

  if (!Array.isArray(data)) {
    console.warn('processEquipmentList received invalid data:', data);
    return [];
  }
  
  return data.map(item => {
    if (!item) {
      console.warn('Encountered null or undefined item in equipment data');
      return null;
    }
    
    // Determine if the equipment has no team explicitly
    const hasNoTeam = item.team_id === null;
    
    const processed = {
      ...item,
      team_name: item.team?.name || null,
      org_name: item.org?.name || 'Unknown Organization',
      is_external_org: item.is_external_org || false,
      can_edit: item.can_edit !== undefined ? item.can_edit : true,
      attributes: item.attributes || [],
      has_no_team: item.has_no_team !== undefined ? item.has_no_team : hasNoTeam
    };
    
    // Log equipment details for debugging
    console.log(`Equipment ${item.name}: team_id=${item.team_id}, has_no_team=${processed.has_no_team}`);
    
    return processed;
  }).filter(Boolean); // Remove any null items
}

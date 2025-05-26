
import { Equipment } from "@/types";

/**
 * Process equipment data from the database to match the frontend data model with enhanced validation
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
    
    // Enhanced organization name resolution with multiple fallbacks and validation
    let orgName = item.org_name;
    if (!orgName && item.org?.name) {
      orgName = item.org.name;
      console.log(`Frontend: Equipment "${item.name}" resolved org name from nested org object`);
    } else if (!orgName && item.organization?.name) {
      orgName = item.organization.name;
      console.log(`Frontend: Equipment "${item.name}" resolved org name from nested organization object`);
    } else if (!orgName) {
      orgName = 'Unknown Organization';
      console.warn(`Frontend: Equipment "${item.name}" could not resolve organization name, using fallback`);
    }
    
    // Enhanced team name resolution with validation and logging
    let teamName = item.team_name;
    if (!teamName && item.team?.name) {
      teamName = item.team.name;
      console.log(`Frontend: Equipment "${item.name}" resolved team name from nested team object`);
    } else if (!teamName && item.team_id) {
      // If we have a team_id but no team name, this indicates a data inconsistency
      console.warn(`Frontend: Equipment "${item.name}" has team_id (${item.team_id}) but missing team name - potential data issue`);
      teamName = null;
    }
    
    const processed = {
      ...item,
      team_name: teamName,
      org_name: orgName,
      is_external_org: item.is_external_org || false,
      can_edit: item.can_edit !== undefined ? item.can_edit : true,
      attributes: item.attributes || [],
      has_no_team: item.has_no_team !== undefined ? item.has_no_team : hasNoTeam
    };
    
    // Enhanced logging for equipment details
    const teamInfo = processed.team_name ? `team_name=${processed.team_name}` : 'No team';
    console.log(`Frontend: Equipment "${item.name}": org_name=${processed.org_name}, ${teamInfo}, team_id=${item.team_id || 'null'}, has_no_team=${processed.has_no_team}`);
    
    return processed;
  }).filter(Boolean); // Remove any null items
}

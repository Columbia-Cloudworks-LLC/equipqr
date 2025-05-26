
/**
 * Process equipment data to add required fields for frontend consumption with enhanced validation
 */
export function formatEquipmentResponse(equipment: any[]): any[] {
  // Log the received equipment count for debugging
  console.log(`Formatting ${equipment.length} equipment items`);
  
  // Create a set of unique org IDs the user has access to
  const orgIds = new Set<string>();
  equipment.forEach(item => {
    if (item.org_id) orgIds.add(item.org_id);
  });
  
  const userOrgIds = Array.from(orgIds);
  
  // Format each equipment item with enhanced data validation
  return equipment.map(item => {
    const isExternalOrg = !userOrgIds.includes(item.org_id);
    const hasNoTeam = item.team_id === null;
    
    // Enhanced organization name resolution with multiple fallbacks and validation
    let orgName = item.org_name;
    if (!orgName && item.org?.name) {
      orgName = item.org.name;
      console.log(`Equipment "${item.name}": Resolved org name from nested org object`);
    } else if (!orgName && item.organization?.name) {
      orgName = item.organization.name;
      console.log(`Equipment "${item.name}": Resolved org name from nested organization object`);
    } else if (!orgName) {
      orgName = 'Unknown Organization';
      console.warn(`Equipment "${item.name}": Could not resolve organization name, using fallback`);
    }
    
    // Enhanced team name resolution with validation and logging
    let teamName = item.team_name;
    if (!teamName && item.team?.name) {
      teamName = item.team.name;
      console.log(`Equipment "${item.name}": Resolved team name from nested team object`);
    } else if (!teamName && item.team_id) {
      // If we have a team_id but no team name, this indicates a data inconsistency
      console.warn(`Equipment "${item.name}": Has team_id (${item.team_id}) but missing team name - data inconsistency detected`);
      teamName = null;
    }
    
    // Log team name resolution for debugging
    const teamInfo = teamName ? `team_name=${teamName}` : 'No team';
    console.log(`Equipment "${item.name}": org_name=${orgName}, ${teamInfo}, source=${item.access_via || 'unknown'}, team_id=${item.team_id || 'null'}`);
    
    return {
      ...item,
      team_name: teamName,
      org_name: orgName,
      is_external_org: isExternalOrg,
      can_edit: !isExternalOrg || (item.team?.org_id && userOrgIds.includes(item.team.org_id)),
      has_no_team: hasNoTeam
    };
  });
}

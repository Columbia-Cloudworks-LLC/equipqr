
/**
 * Process equipment data to add required fields for frontend consumption
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
  
  // Format each equipment item
  return equipment.map(item => {
    const isExternalOrg = !userOrgIds.includes(item.org_id);
    const hasNoTeam = item.team_id === null;
    
    // Enhanced organization name resolution with multiple fallbacks
    const orgName = item.org_name || 
                   (item.org?.name ? item.org.name : 
                    (item.organization?.name ? item.organization.name : 'Unknown Organization'));
    
    // Enhanced team name resolution with multiple fallbacks
    const teamName = item.team_name || 
                     (item.team?.name ? item.team.name : null);
    
    // Log organization and team name resolution for debugging
    console.log(`Equipment "${item.name}": org_name=${orgName}, team_name=${teamName || 'None'}, source=${item.access_via || 'unknown'}`);
    
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

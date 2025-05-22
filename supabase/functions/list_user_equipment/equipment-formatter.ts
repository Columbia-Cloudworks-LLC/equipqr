
/**
 * Process equipment data to add required fields for frontend consumption
 */
export function formatEquipmentResponse(equipment: any[]): any[] {
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
    
    return {
      ...item,
      team_name: item.team?.name || item.team_name || null,
      org_name: item.org?.name || item.org_name || 'Unknown Organization',
      is_external_org: isExternalOrg,
      can_edit: !isExternalOrg || (item.team?.org_id && userOrgIds.includes(item.team.org_id)),
      has_no_team: hasNoTeam
    };
  });
}

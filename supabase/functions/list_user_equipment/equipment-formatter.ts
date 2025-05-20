
/**
 * Process equipment data to add required fields for frontend consumption
 */
export function processEquipmentData(equipment: any[], userOrgIds: string[]): any[] {
  return equipment.map(item => {
    const isExternalOrg = !userOrgIds.includes(item.org_id);
    const hasNoTeam = item.team_id === null;
    
    return {
      ...item,
      team_name: item.team?.name || null,
      org_name: item.org?.name || 'Unknown Organization',
      is_external_org: isExternalOrg,
      can_edit: !isExternalOrg || (item.team?.org_id && userOrgIds.includes(item.team.org_id)),
      has_no_team: hasNoTeam
    };
  });
}


import { useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useSyncEquipmentById, useSyncTeamById, useSyncTeamMembersByTeam } from '@/services/syncDataService';
import { useOrganizationAdmins } from './useOrganizationAdmins';

export interface AssignmentOption {
  id: string;
  name: string;
  type: 'team' | 'member' | 'admin';
  teamId?: string;
  canSelfAssign?: boolean;
}

export interface WorkOrderAssignmentData {
  suggestedTeamId?: string;
  suggestedTeamName?: string;
  availableAssignees: AssignmentOption[];
  canAssignToSelf: boolean;
  currentUserMemberships: string[];
  hasEquipmentTeam: boolean;
  organizationAdmins: AssignmentOption[];
}

export const useWorkOrderAssignment = (organizationId: string, equipmentId?: string) => {
  const { getCurrentOrganization, getUserTeamIds, hasTeamAccess, canManageTeam } = useSession();
  const currentOrg = getCurrentOrganization();
  
  // Get equipment details to find associated team
  const { data: equipment } = useSyncEquipmentById(organizationId, equipmentId || '');
  
  // Get the equipment's team details if it has one
  const { data: equipmentTeam } = useSyncTeamById(
    organizationId, 
    equipment?.team_id || ''
  );
  
  // Get team members for the equipment's team
  const { data: teamMembers = [] } = useSyncTeamMembersByTeam(
    organizationId,
    equipment?.team_id || ''
  );

  // Get organization admins
  const { data: orgAdmins = [] } = useOrganizationAdmins(organizationId);

  const userTeamIds = getUserTeamIds();
  
  const assignmentData: WorkOrderAssignmentData = useMemo(() => {
    const availableAssignees: AssignmentOption[] = [];
    const organizationAdmins: AssignmentOption[] = [];
    
    // Check if equipment has a team
    const hasEquipmentTeam = !!equipment?.team_id;
    const suggestedTeamId = equipment?.team_id;
    const suggestedTeamName = equipmentTeam?.name;
    
    if (hasEquipmentTeam && equipmentTeam && teamMembers.length > 0) {
      // Equipment has a team - use team-based assignment
      
      // Add the team itself as an option
      availableAssignees.push({
        id: equipmentTeam.id,
        name: `${equipmentTeam.name} (Team)`,
        type: 'team',
        teamId: equipmentTeam.id
      });
      
      // Add individual team members
      teamMembers.forEach(member => {
        const canSelfAssign = member.id === 'current-user-id'; // This would come from auth context
        availableAssignees.push({
          id: member.id,
          name: member.name || 'Unknown Member',
          type: 'member',
          teamId: equipmentTeam.id,
          canSelfAssign
        });
      });
    } else {
      // Equipment has no team - use admin-based assignment
      
      // Add organization admins
      orgAdmins.forEach(admin => {
        const canSelfAssign = admin.id === 'current-user-id'; // This would be actual user ID
        const adminOption = {
          id: admin.id,
          name: canSelfAssign ? `${admin.name} (You)` : admin.name,
          type: 'admin' as const,
          canSelfAssign
        };
        
        availableAssignees.push(adminOption);
        organizationAdmins.push(adminOption);
      });
    }
    
    // Check if current user can assign to themselves
    const canAssignToSelf = hasEquipmentTeam 
      ? (suggestedTeamId ? hasTeamAccess(suggestedTeamId) : false)
      : (currentOrg ? ['owner', 'admin'].includes(currentOrg.userRole || '') : false);
    
    return {
      suggestedTeamId,
      suggestedTeamName,
      availableAssignees,
      canAssignToSelf,
      currentUserMemberships: userTeamIds,
      hasEquipmentTeam,
      organizationAdmins
    };
  }, [equipment, equipmentTeam, teamMembers, orgAdmins, userTeamIds, hasTeamAccess, currentOrg]);

  return {
    ...assignmentData,
    isManager: currentOrg ? ['owner', 'admin'].includes(currentOrg.userRole || '') : false,
    canManageEquipmentTeam: assignmentData.suggestedTeamId ? canManageTeam(assignmentData.suggestedTeamId) : false
  };
};

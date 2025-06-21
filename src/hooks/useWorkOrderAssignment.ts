
import { useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useSyncEquipmentById, useSyncTeamById, useSyncTeamMembersByTeam } from '@/services/syncDataService';

export interface AssignmentOption {
  id: string;
  name: string;
  type: 'team' | 'member';
  teamId?: string;
  canSelfAssign?: boolean;
}

export interface WorkOrderAssignmentData {
  suggestedTeamId?: string;
  suggestedTeamName?: string;
  availableAssignees: AssignmentOption[];
  canAssignToSelf: boolean;
  currentUserMemberships: string[];
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

  const userTeamIds = getUserTeamIds();
  
  const assignmentData: WorkOrderAssignmentData = useMemo(() => {
    const availableAssignees: AssignmentOption[] = [];
    
    // If equipment has a team, that's the suggested team
    const suggestedTeamId = equipment?.team_id;
    const suggestedTeamName = equipmentTeam?.name;
    
    // Add team members as assignment options
    if (equipmentTeam && teamMembers.length > 0) {
      // Add the team itself as an option
      availableAssignees.push({
        id: equipmentTeam.id,
        name: `${equipmentTeam.name} (Team)`,
        type: 'team',
        teamId: equipmentTeam.id
      });
      
      // Add individual team members
      teamMembers.forEach(member => {
        const canSelfAssign = member.user_id === 'current-user-id'; // This would come from auth context
        availableAssignees.push({
          id: member.user_id,
          name: member.name || 'Unknown Member',
          type: 'member',
          teamId: equipmentTeam.id,
          canSelfAssign
        });
      });
    }
    
    // Check if current user can assign to themselves
    const canAssignToSelf = suggestedTeamId ? hasTeamAccess(suggestedTeamId) : false;
    
    return {
      suggestedTeamId,
      suggestedTeamName,
      availableAssignees,
      canAssignToSelf,
      currentUserMemberships: userTeamIds
    };
  }, [equipment, equipmentTeam, teamMembers, userTeamIds, hasTeamAccess]);

  return {
    ...assignmentData,
    isManager: currentOrg ? ['owner', 'admin'].includes(currentOrg.userRole || '') : false,
    canManageEquipmentTeam: assignmentData.suggestedTeamId ? canManageTeam(assignmentData.suggestedTeamId) : false
  };
};

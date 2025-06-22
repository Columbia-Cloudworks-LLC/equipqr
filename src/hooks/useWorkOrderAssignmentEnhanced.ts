
import { useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useSyncEquipmentById, useSyncTeamById, useSyncTeamMembersByTeam } from '@/services/syncDataService';
import { useOrganizationAdmins } from './useOrganizationAdmins';

export interface EnhancedAssignmentOption {
  id: string;
  name: string;
  type: 'team' | 'member' | 'admin';
  teamId?: string;
  canSelfAssign?: boolean;
  email?: string;
  role?: string;
}

export interface EnhancedWorkOrderAssignmentData {
  suggestedTeamId?: string;
  suggestedTeamName?: string;
  availableAssignees: EnhancedAssignmentOption[];
  canAssignToSelf: boolean;
  currentUserMemberships: string[];
  hasEquipmentTeam: boolean;
  organizationAdmins: EnhancedAssignmentOption[];
  assignmentStrategy: 'team_based' | 'admin_based';
}

export const useWorkOrderAssignmentEnhanced = (organizationId: string, equipmentId?: string) => {
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
  const currentUserId = 'current-user-id'; // This would come from auth context
  
  const assignmentData: EnhancedWorkOrderAssignmentData = useMemo(() => {
    const availableAssignees: EnhancedAssignmentOption[] = [];
    const organizationAdmins: EnhancedAssignmentOption[] = [];
    
    // Check if equipment has a team
    const hasEquipmentTeam = !!equipment?.team_id;
    const suggestedTeamId = equipment?.team_id;
    const suggestedTeamName = equipmentTeam?.name;
    
    // Determine assignment strategy
    const assignmentStrategy: 'team_based' | 'admin_based' = hasEquipmentTeam ? 'team_based' : 'admin_based';
    
    if (hasEquipmentTeam && equipmentTeam && teamMembers.length > 0) {
      // Equipment has a team - use team-based assignment
      
      // Add the team itself as an option (for team-wide assignment)
      availableAssignees.push({
        id: equipmentTeam.id,
        name: `${equipmentTeam.name} (Entire Team)`,
        type: 'team',
        teamId: equipmentTeam.id
      });
      
      // Add individual team members
      teamMembers.forEach(member => {
        const canSelfAssign = member.id === currentUserId;
        availableAssignees.push({
          id: member.id,
          name: canSelfAssign ? `${member.name || 'You'}` : (member.name || 'Unknown Member'),
          type: 'member',
          teamId: equipmentTeam.id,
          canSelfAssign,
          email: member.email,
          role: member.role
        });
      });
      
      // Also add organization admins as backup assignees
      orgAdmins.forEach(admin => {
        const canSelfAssign = admin.id === currentUserId;
        const adminOption = {
          id: admin.id,
          name: canSelfAssign ? `${admin.name} (You - Admin)` : `${admin.name} (Admin)`,
          type: 'admin' as const,
          canSelfAssign,
          email: admin.email,
          role: admin.role
        };
        
        availableAssignees.push(adminOption);
        organizationAdmins.push(adminOption);
      });
    } else {
      // Equipment has no team - use admin-based assignment only
      
      orgAdmins.forEach(admin => {
        const canSelfAssign = admin.id === currentUserId;
        const adminOption = {
          id: admin.id,
          name: canSelfAssign ? `${admin.name} (You)` : admin.name,
          type: 'admin' as const,
          canSelfAssign,
          email: admin.email,
          role: admin.role
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
      organizationAdmins,
      assignmentStrategy
    };
  }, [equipment, equipmentTeam, teamMembers, orgAdmins, userTeamIds, hasTeamAccess, currentOrg, currentUserId]);

  return {
    ...assignmentData,
    isManager: currentOrg ? ['owner', 'admin'].includes(currentOrg.userRole || '') : false,
    canManageEquipmentTeam: assignmentData.suggestedTeamId ? canManageTeam(assignmentData.suggestedTeamId) : false,
    totalAssigneeCount: assignmentData.availableAssignees.length,
    teamMemberCount: teamMembers.length,
    adminCount: orgAdmins.length
  };
};

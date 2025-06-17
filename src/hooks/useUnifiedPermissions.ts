
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { WorkOrder, Equipment, Team } from '@/services/dataService';

export interface PermissionContext {
  organizationId: string;
  userRole: string;
  userId?: string;
  userTeamIds: string[];
}

export interface EntityPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign?: boolean;
  canChangeStatus?: boolean;
}

export interface UnifiedPermissionsHook {
  // Context
  context: PermissionContext | null;
  
  // Organization-level permissions
  organization: {
    canManage: boolean;
    canInviteMembers: boolean;
    canCreateTeams: boolean;
    canViewBilling: boolean;
  };
  
  // Equipment permissions
  equipment: {
    getPermissions: (equipment?: Equipment) => EntityPermissions;
    canViewAll: boolean;
    canCreateAny: boolean;
  };
  
  // Work order permissions
  workOrders: {
    getPermissions: (workOrder?: WorkOrder) => EntityPermissions;
    canViewAll: boolean;
    canCreateAny: boolean;
    canAssignAny: boolean;
  };
  
  // Team permissions
  teams: {
    getPermissions: (team?: Team) => EntityPermissions;
    canViewAll: boolean;
    canCreateAny: boolean;
    canManageAny: boolean;
  };
  
  // Utility functions
  hasRole: (roles: string | string[]) => boolean;
  isTeamMember: (teamId: string) => boolean;
  isTeamManager: (teamId: string) => boolean;
}

export const useUnifiedPermissions = (): UnifiedPermissionsHook => {
  const { currentOrganization } = useSimpleOrganization();

  const context: PermissionContext | null = currentOrganization ? {
    organizationId: currentOrganization.id,
    userRole: currentOrganization.userRole || 'viewer',
    userId: 'current-user-id', // This would come from auth context in real implementation
    userTeamIds: [] // This would come from team membership data
  } : null;

  const hasRole = (roles: string | string[]): boolean => {
    if (!context) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(context.userRole);
  };

  const isOrgAdmin = (): boolean => hasRole(['owner', 'admin']);
  const isOrgMember = (): boolean => hasRole(['owner', 'admin', 'member']);

  const isTeamMember = (teamId: string): boolean => {
    if (!context) return false;
    return context.userTeamIds.includes(teamId);
  };

  const isTeamManager = (teamId: string): boolean => {
    if (!context) return false;
    // In real implementation, this would check if user has manager role in specific team
    return isTeamMember(teamId) && hasRole(['owner', 'admin', 'manager']);
  };

  // Organization permissions
  const organization = {
    canManage: isOrgAdmin(),
    canInviteMembers: isOrgAdmin(),
    canCreateTeams: isOrgAdmin(),
    canViewBilling: hasRole(['owner', 'admin'])
  };

  // Equipment permissions
  const equipment = {
    getPermissions: (equipment?: Equipment): EntityPermissions => {
      if (!context) {
        return { canView: false, canCreate: false, canEdit: false, canDelete: false };
      }

      const canView = isOrgMember();
      const canCreate = isOrgAdmin();
      const canEdit = isOrgAdmin();
      const canDelete = isOrgAdmin();

      return { canView, canCreate, canEdit, canDelete };
    },
    canViewAll: isOrgMember(),
    canCreateAny: isOrgAdmin()
  };

  // Work order permissions
  const workOrders = {
    getPermissions: (workOrder?: WorkOrder): EntityPermissions => {
      if (!context) {
        return { 
          canView: false, 
          canCreate: false, 
          canEdit: false, 
          canDelete: false,
          canAssign: false,
          canChangeStatus: false
        };
      }

      const canView = isOrgMember() || (workOrder?.teamId ? isTeamMember(workOrder.teamId) : false);
      const canCreate = isOrgMember();
      const canEdit = isOrgAdmin() || (workOrder?.teamId ? isTeamManager(workOrder.teamId) : false);
      const canDelete = isOrgAdmin();
      const canAssign = isOrgAdmin() || (workOrder?.teamId ? isTeamManager(workOrder.teamId) : false);
      const canChangeStatus = isOrgAdmin() || (workOrder?.teamId ? isTeamMember(workOrder.teamId) : false);

      return { canView, canCreate, canEdit, canDelete, canAssign, canChangeStatus };
    },
    canViewAll: isOrgAdmin(),
    canCreateAny: isOrgMember(),
    canAssignAny: isOrgAdmin()
  };

  // Team permissions
  const teams = {
    getPermissions: (team?: Team): EntityPermissions => {
      if (!context) {
        return { canView: false, canCreate: false, canEdit: false, canDelete: false };
      }

      const canView = isOrgMember() || (team?.id ? isTeamMember(team.id) : false);
      const canCreate = isOrgAdmin();
      const canEdit = isOrgAdmin() || (team?.id ? isTeamManager(team.id) : false);
      const canDelete = isOrgAdmin();

      return { canView, canCreate, canEdit, canDelete };
    },
    canViewAll: isOrgAdmin(),
    canCreateAny: isOrgAdmin(),
    canManageAny: isOrgAdmin()
  };

  return {
    context,
    organization,
    equipment,
    workOrders,
    teams,
    hasRole,
    isTeamMember,
    isTeamManager
  };
};

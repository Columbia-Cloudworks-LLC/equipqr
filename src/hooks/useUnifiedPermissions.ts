
import { useSession } from '@/contexts/SessionContext';
import { WorkOrder } from '@/services/supabaseDataService';

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

export interface WorkOrderPermissions {
  canEdit: boolean;
  canEditPriority: boolean;
  canEditAssignment: boolean;
  canEditDueDate: boolean;
  canEditDescription: boolean;
  canChangeStatus: boolean;
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
    getPermissions: (equipmentTeamId?: string) => EntityPermissions;
    canViewAll: boolean;
    canCreateAny: boolean;
  };
  
  // Work order permissions
  workOrders: {
    getPermissions: (workOrder?: WorkOrder) => EntityPermissions;
    getDetailedPermissions: (workOrder?: WorkOrder) => WorkOrderPermissions;
    canViewAll: boolean;
    canCreateAny: boolean;
    canAssignAny: boolean;
  };
  
  // Team permissions
  teams: {
    getPermissions: (teamId?: string) => EntityPermissions;
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
  const { getCurrentOrganization, hasTeamAccess, canManageTeam, getUserTeamIds } = useSession();

  const currentOrganization = getCurrentOrganization();
  const userTeamIds = getUserTeamIds();

  const context: PermissionContext | null = currentOrganization ? {
    organizationId: currentOrganization.id,
    userRole: currentOrganization.userRole || 'viewer',
    userId: 'current-user-id', // This would come from auth context in real implementation
    userTeamIds
  } : null;

  const hasRole = (roles: string | string[]): boolean => {
    if (!context) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(context.userRole);
  };

  const isOrgAdmin = (): boolean => hasRole(['owner', 'admin']);
  const isOrgMember = (): boolean => hasRole(['owner', 'admin', 'member']);

  const isTeamMember = (teamId: string): boolean => {
    return hasTeamAccess(teamId);
  };

  const isTeamManager = (teamId: string): boolean => {
    return canManageTeam(teamId);
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
    getPermissions: (equipmentTeamId?: string): EntityPermissions => {
      if (!context) {
        return { canView: false, canCreate: false, canEdit: false, canDelete: false };
      }

      const canView = isOrgMember() || (equipmentTeamId ? isTeamMember(equipmentTeamId) : false);
      const canCreate = isOrgAdmin();
      const canEdit = isOrgAdmin() || (equipmentTeamId ? isTeamManager(equipmentTeamId) : false);
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
    getDetailedPermissions: (workOrder?: WorkOrder): WorkOrderPermissions => {
      if (!currentOrganization) {
        return {
          canEdit: false,
          canEditPriority: false,
          canEditAssignment: false,
          canEditDueDate: false,
          canEditDescription: false,
          canChangeStatus: false
        };
      }

      const isOrgAdminRole = ['owner', 'admin'].includes(currentOrganization.userRole);
      const isTeamManagerRole = workOrder?.teamId ? canManageTeam(workOrder.teamId) : false;
      const hasWorkOrderAccess = workOrder?.teamId ? hasTeamAccess(workOrder.teamId) : false;

      return {
        canEdit: isOrgAdminRole || isTeamManagerRole,
        canEditPriority: isOrgAdminRole || isTeamManagerRole,
        canEditAssignment: isOrgAdminRole || isTeamManagerRole,
        canEditDueDate: isOrgAdminRole || isTeamManagerRole || hasWorkOrderAccess,
        canEditDescription: isOrgAdminRole || isTeamManagerRole || hasWorkOrderAccess,
        canChangeStatus: isOrgAdminRole || isTeamManagerRole || hasWorkOrderAccess
      };
    },
    canViewAll: isOrgAdmin(),
    canCreateAny: isOrgMember(),
    canAssignAny: isOrgAdmin()
  };

  // Team permissions
  const teams = {
    getPermissions: (teamId?: string): EntityPermissions => {
      if (!context) {
        return { canView: false, canCreate: false, canEdit: false, canDelete: false };
      }

      const canView = isOrgMember() || (teamId ? isTeamMember(teamId) : false);
      const canCreate = isOrgAdmin();
      const canEdit = isOrgAdmin() || (teamId ? isTeamManager(teamId) : false);
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

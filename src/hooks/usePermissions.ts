
// Compatibility layer for usePermissions hook
import { useUnifiedPermissions } from './useUnifiedPermissions';

export const usePermissions = () => {
  const permissions = useUnifiedPermissions();
  
  // Legacy compatibility - map new structure to old expected interface
  return {
    canManageTeam: (teamId: string) => permissions.teams.getPermissions(teamId).canEdit,
    canViewTeam: (teamId: string) => permissions.teams.getPermissions(teamId).canView,
    canCreateTeam: () => permissions.teams.canCreateAny,
    canManageEquipment: (equipmentTeamId?: string) => permissions.equipment.getPermissions(equipmentTeamId).canEdit,
    canViewEquipment: (equipmentTeamId?: string) => permissions.equipment.getPermissions(equipmentTeamId).canView,
    canCreateEquipment: () => permissions.equipment.canCreateAny,
    canManageWorkOrder: (workOrder?: any) => permissions.workOrders.getPermissions(workOrder).canEdit,
    canViewWorkOrder: (workOrder?: any) => permissions.workOrders.getPermissions(workOrder).canView,
    canCreateWorkOrder: () => permissions.workOrders.canCreateAny,
    canAssignWorkOrder: (workOrder?: any) => permissions.workOrders.getPermissions(workOrder).canAssign,
    canChangeWorkOrderStatus: (workOrder?: any) => permissions.workOrders.getPermissions(workOrder).canChangeStatus,
    // Organization permissions
    canManageOrganization: () => permissions.organization.canManage,
    canInviteMembers: () => permissions.organization.canInviteMembers,
    // Utility functions
    hasRole: permissions.hasRole,
    isTeamMember: permissions.isTeamMember,
    isTeamManager: permissions.isTeamManager
  };
};

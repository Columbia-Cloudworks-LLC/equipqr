
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTeamMembership } from '@/hooks/useTeamMembership';
import { WorkOrder } from '@/services/dataService';

export interface PermissionHooks {
  // Organization-level permissions
  canManageOrganization: () => boolean;
  canInviteMembers: () => boolean;
  canCreateTeams: () => boolean;
  canCreateEquipment: () => boolean;
  canManageWorkOrders: () => boolean;
  
  // Team-level permissions
  canManageTeam: (teamId: string) => boolean;
  canAssignWorkOrders: (teamId: string) => boolean;
  canUpdateEquipmentStatus: () => boolean;
  hasTeamAccess: (teamId: string) => boolean;
  
  // Work order permissions
  canCreateWorkOrder: () => boolean;
  canUpdateWorkOrderStatus: (workOrderId: string) => boolean;
  canCompleteWorkOrder: (workOrderId: string) => boolean;
}

export interface WorkOrderPermissions {
  canEdit: boolean;
  canEditPriority: boolean;
  canEditAssignment: boolean;
  canEditDueDate: boolean;
  canEditDescription: boolean;
  canChangeStatus: boolean;
}

export const usePermissions = (): PermissionHooks => {
  const { currentOrganization } = useOrganization();
  const { canManageTeam: teamCanManage, hasTeamAccess } = useTeamMembership();

  const canManageOrganization = (): boolean => {
    if (!currentOrganization) return false;
    return ['owner', 'admin'].includes(currentOrganization.userRole);
  };

  const canInviteMembers = (): boolean => {
    return canManageOrganization();
  };

  const canCreateTeams = (): boolean => {
    return canManageOrganization();
  };

  const canCreateEquipment = (): boolean => {
    if (!currentOrganization) return false;
    return ['owner', 'admin'].includes(currentOrganization.userRole);
  };

  const canManageWorkOrders = (): boolean => {
    if (!currentOrganization) return false;
    return ['owner', 'admin'].includes(currentOrganization.userRole);
  };

  const canManageTeam = (teamId: string): boolean => {
    return teamCanManage(teamId);
  };

  const canAssignWorkOrders = (teamId: string): boolean => {
    return canManageTeam(teamId);
  };

  const canUpdateEquipmentStatus = (): boolean => {
    if (!currentOrganization) return false;
    // Organization admins and team members can update equipment status
    return ['owner', 'admin', 'member'].includes(currentOrganization.userRole);
  };

  const canCreateWorkOrder = (): boolean => {
    if (!currentOrganization) return false;
    // All organization members can create work orders
    return true;
  };

  const canUpdateWorkOrderStatus = (workOrderId: string): boolean => {
    if (!currentOrganization) return false;
    // Organization admins can always update, team managers can update assigned work orders
    return ['owner', 'admin'].includes(currentOrganization.userRole);
  };

  const canCompleteWorkOrder = (workOrderId: string): boolean => {
    // Similar logic to update, but also includes technicians who are assigned
    return canUpdateWorkOrderStatus(workOrderId);
  };

  return {
    canManageOrganization,
    canInviteMembers,
    canCreateTeams,
    canCreateEquipment,
    canManageWorkOrders,
    canManageTeam,
    canAssignWorkOrders,
    canUpdateEquipmentStatus,
    hasTeamAccess,
    canCreateWorkOrder,
    canUpdateWorkOrderStatus,
    canCompleteWorkOrder
  };
};

export const useWorkOrderPermissions = (workOrder?: WorkOrder): WorkOrderPermissions => {
  const { currentOrganization } = useOrganization();
  const { canManageTeam, hasTeamAccess } = useTeamMembership();

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

  const isOrgAdmin = ['owner', 'admin'].includes(currentOrganization.userRole);
  const isTeamManager = workOrder?.teamId ? canManageTeam(workOrder.teamId) : false;
  const hasWorkOrderAccess = workOrder?.teamId ? hasTeamAccess(workOrder.teamId) : false;

  return {
    canEdit: isOrgAdmin || isTeamManager,
    canEditPriority: isOrgAdmin || isTeamManager,
    canEditAssignment: isOrgAdmin || isTeamManager,
    canEditDueDate: isOrgAdmin || isTeamManager || hasWorkOrderAccess,
    canEditDescription: isOrgAdmin || isTeamManager || hasWorkOrderAccess,
    canChangeStatus: isOrgAdmin || isTeamManager || hasWorkOrderAccess
  };
};

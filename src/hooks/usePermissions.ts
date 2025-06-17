
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
  canUpdateEquipmentStatus: (equipmentTeamId?: string) => boolean;
  hasTeamAccess: (teamId: string) => boolean;
  
  // Work order permissions
  canCreateWorkOrder: () => boolean;
  canUpdateWorkOrderStatus: (workOrder: WorkOrder) => boolean;
  canCompleteWorkOrder: (workOrder: WorkOrder) => boolean;
  
  // Equipment permissions
  canViewEquipment: (equipmentTeamId?: string) => boolean;
  canEditEquipment: (equipmentTeamId?: string) => boolean;
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
  const { canManageTeam: teamCanManage, hasTeamAccess, getUserTeamIds } = useTeamMembership();

  const isOrgAdmin = (): boolean => {
    if (!currentOrganization) return false;
    return ['owner', 'admin'].includes(currentOrganization.userRole);
  };

  const canManageOrganization = (): boolean => {
    return isOrgAdmin();
  };

  const canInviteMembers = (): boolean => {
    return canManageOrganization();
  };

  const canCreateTeams = (): boolean => {
    return canManageOrganization();
  };

  const canCreateEquipment = (): boolean => {
    return isOrgAdmin();
  };

  const canManageWorkOrders = (): boolean => {
    return isOrgAdmin();
  };

  const canManageTeam = (teamId: string): boolean => {
    return teamCanManage(teamId);
  };

  const canAssignWorkOrders = (teamId: string): boolean => {
    return canManageTeam(teamId);
  };

  const canUpdateEquipmentStatus = (equipmentTeamId?: string): boolean => {
    if (!currentOrganization) return false;
    
    // Organization admins can update any equipment
    if (isOrgAdmin()) return true;
    
    // If equipment has no team assignment, any org member can update
    if (!equipmentTeamId) {
      return ['owner', 'admin', 'member'].includes(currentOrganization.userRole);
    }
    
    // Team members can update their team's equipment
    return hasTeamAccess(equipmentTeamId);
  };

  const canCreateWorkOrder = (): boolean => {
    if (!currentOrganization) return false;
    // All organization members can create work orders
    return true;
  };

  const canUpdateWorkOrderStatus = (workOrder: WorkOrder): boolean => {
    if (!currentOrganization) return false;
    
    // Organization admins can always update
    if (isOrgAdmin()) return true;
    
    // Team members can update work orders assigned to their teams
    if (workOrder.teamId && hasTeamAccess(workOrder.teamId)) return true;
    
    // Assigned users can update their work orders
    // Note: In a real implementation, you'd get the current user ID from auth
    // For now, we'll assume this check is handled elsewhere
    return false;
  };

  const canCompleteWorkOrder = (workOrder: WorkOrder): boolean => {
    return canUpdateWorkOrderStatus(workOrder);
  };

  const canViewEquipment = (equipmentTeamId?: string): boolean => {
    if (!currentOrganization) return false;
    
    // Organization admins can view all equipment
    if (isOrgAdmin()) return true;
    
    // If equipment has no team assignment, any org member can view
    if (!equipmentTeamId) return true;
    
    // Team members can view their team's equipment
    return hasTeamAccess(equipmentTeamId);
  };

  const canEditEquipment = (equipmentTeamId?: string): boolean => {
    if (!currentOrganization) return false;
    
    // Organization admins can edit all equipment
    if (isOrgAdmin()) return true;
    
    // If equipment has no team assignment, only admins can edit
    if (!equipmentTeamId) return false;
    
    // Team managers can edit their team's equipment
    return canManageTeam(equipmentTeamId);
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
    canCompleteWorkOrder,
    canViewEquipment,
    canEditEquipment
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

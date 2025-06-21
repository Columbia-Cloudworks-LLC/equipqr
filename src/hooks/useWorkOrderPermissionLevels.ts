
import { useUnifiedPermissions } from './useUnifiedPermissions';
import { WorkOrder } from '@/services/supabaseDataService';

export interface RequestorPermissions {
  canCreateRequest: boolean;
  canViewOwn: boolean;
  canAddNotes: boolean;
  canAddImages: boolean;
  canEditDueDate: boolean;
  canEditDescription: boolean;
}

export interface ManagerPermissions {
  canCreateFull: boolean;
  canAssign: boolean;
  canChangeStatus: boolean;
  canEditAll: boolean;
  canViewAll: boolean;
  canDeleteAny: boolean;
}

export interface WorkOrderPermissionLevels {
  isRequestor: boolean;
  isManager: boolean;
  requestor: RequestorPermissions;
  manager: ManagerPermissions;
  getFormMode: (workOrder?: WorkOrder, createdByCurrentUser?: boolean) => 'requestor' | 'manager' | 'readonly';
}

export const useWorkOrderPermissionLevels = (): WorkOrderPermissionLevels => {
  const permissions = useUnifiedPermissions();

  const isManager = permissions.hasRole(['owner', 'admin']) || 
    permissions.context?.userTeamIds.some(teamId => permissions.isTeamManager(teamId)) || false;
  
  const isRequestor = permissions.hasRole(['member']) && !isManager;

  const requestorPermissions: RequestorPermissions = {
    canCreateRequest: permissions.workOrders.canCreateAny,
    canViewOwn: true,
    canAddNotes: true,
    canAddImages: true,
    canEditDueDate: true,
    canEditDescription: true,
  };

  const managerPermissions: ManagerPermissions = {
    canCreateFull: permissions.workOrders.canCreateAny,
    canAssign: permissions.workOrders.canAssignAny,
    canChangeStatus: true,
    canEditAll: true,
    canViewAll: permissions.workOrders.canViewAll,
    canDeleteAny: true,
  };

  const getFormMode = (workOrder?: WorkOrder, createdByCurrentUser?: boolean): 'requestor' | 'manager' | 'readonly' => {
    if (isManager) {
      return 'manager';
    }
    
    if (isRequestor) {
      // Requestors can edit their own work orders in limited ways
      if (!workOrder || createdByCurrentUser) {
        return 'requestor';
      }
      // Can view but not edit others' work orders
      return 'readonly';
    }

    return 'readonly';
  };

  return {
    isRequestor,
    isManager,
    requestor: requestorPermissions,
    manager: managerPermissions,
    getFormMode,
  };
};

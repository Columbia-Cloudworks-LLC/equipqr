
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUser } from '@/contexts/UserContext';
import { WorkOrder } from '@/services/dataService';

export interface WorkOrderPermissions {
  canEdit: boolean;
  canChangeStatus: boolean;
  canAssign: boolean;
  canDelete: boolean;
  canEditAssignment: boolean;
  canEditPriority: boolean;
  canEditDueDate: boolean;
  canEditDescription: boolean;
}

export const useWorkOrderPermissions = (workOrder?: WorkOrder): WorkOrderPermissions => {
  const { currentOrganization } = useOrganization();
  const { currentUser } = useUser();

  if (!currentOrganization || !currentUser) {
    return {
      canEdit: false,
      canChangeStatus: false,
      canAssign: false,
      canDelete: false,
      canEditAssignment: false,
      canEditPriority: false,
      canEditDueDate: false,
      canEditDescription: false,
    };
  }

  const userRole = currentOrganization.userRole;
  const isOwnerOrAdmin = ['owner', 'admin'].includes(userRole);
  const isAssignedUser = workOrder?.assigneeId === currentUser.id;
  
  // For team permissions, we'd check team membership here
  // const userTeams = getUserTeams(currentUser.id, currentOrganization.id);
  // const isTeamManager = userTeams.some(team => team.role === 'manager');

  return {
    canEdit: isOwnerOrAdmin || isAssignedUser,
    canChangeStatus: isOwnerOrAdmin || isAssignedUser,
    canAssign: isOwnerOrAdmin,
    canDelete: isOwnerOrAdmin,
    canEditAssignment: isOwnerOrAdmin,
    canEditPriority: isOwnerOrAdmin,
    canEditDueDate: isOwnerOrAdmin || isAssignedUser,
    canEditDescription: isOwnerOrAdmin,
  };
};

export const useOrganizationPermissions = () => {
  const { currentOrganization } = useOrganization();
  const { currentUser } = useUser();

  if (!currentOrganization || !currentUser) {
    return {
      canManageMembers: false,
      canManageTeams: false,
      canManageEquipment: false,
      canCreateWorkOrders: false,
    };
  }

  const userRole = currentOrganization.userRole;

  return {
    canManageMembers: ['owner', 'admin'].includes(userRole),
    canManageTeams: ['owner', 'admin'].includes(userRole),
    canManageEquipment: ['owner', 'admin'].includes(userRole),
    canCreateWorkOrders: true, // All users can create work orders
  };
};

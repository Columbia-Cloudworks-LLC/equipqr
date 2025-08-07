import { useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/hooks/useAuth';
import { permissionEngine } from '@/services/permissions/PermissionEngine';
import { 
  UserContext, 
  EntityPermissions, 
  WorkOrderDetailedPermissions,
  OrganizationPermissions,
  EquipmentNotesPermissions
} from '@/types/permissions';
import { EntityContext, WorkOrder } from '@/types/workOrder';
import { PERMISSIONS_CONSTANTS } from '@/constants/permissions';

export const useUnifiedPermissions = () => {
  const { getCurrentOrganization, getUserTeamIds, hasTeamAccess, canManageTeam } = useSession();
  const { user } = useAuth();

  const currentOrganization = getCurrentOrganization();
  const userTeamIds = getUserTeamIds();

  // Create user context
  const userContext: UserContext | null = useMemo(() => {
    if (!currentOrganization || !user) return null;

    return {
      userId: user.id,
      organizationId: currentOrganization.id,
      userRole: currentOrganization.userRole as 'owner' | 'admin' | 'member',
      teamMemberships: userTeamIds.map(teamId => ({
        teamId,
        role: canManageTeam(teamId) ? 'manager' : 'technician'
      }))
    };
  }, [currentOrganization, user, userTeamIds, canManageTeam]);

  // Helper functions
  const hasPermission = (permission: string, entityContext?: EntityContext): boolean => {
    if (!userContext) return false;
    return permissionEngine.hasPermission(permission, userContext, entityContext);
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!userContext) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userContext.userRole);
  };

  const isTeamMember = (teamId: string): boolean => {
    return hasTeamAccess(teamId);
  };

  const isTeamManager = (teamId: string): boolean => {
    return canManageTeam(teamId);
  };

  // Organization permissions
  const organization: OrganizationPermissions = useMemo(() => ({
    canManage: hasPermission('organization.manage'),
    canInviteMembers: hasPermission('organization.invite'),
    canCreateTeams: hasPermission('organization.manage'),
    canViewBilling: hasRole(['owner', 'admin']),
    canManageMembers: hasRole(['owner', 'admin'])
  }), [userContext]);

  // Equipment permissions
  const equipment = {
    getPermissions: (equipmentTeamId?: string): EntityPermissions => {
      const entityContext = equipmentTeamId ? { teamId: equipmentTeamId } : undefined;
      
      return {
        canView: hasPermission('equipment.view', entityContext),
        canCreate: hasRole(['owner', 'admin']),
        canEdit: hasPermission('equipment.edit', entityContext),
        canDelete: hasRole(['owner', 'admin']),
        canAddNotes: hasPermission('equipment.view', entityContext),
        canAddImages: hasPermission('equipment.view', entityContext)
      };
    },
    canViewAll: hasRole(['owner', 'admin', 'member']),
    canCreateAny: hasRole(['owner', 'admin'])
  };

  // Work order permissions
  const workOrders = {
    getPermissions: (workOrder?: WorkOrder): EntityPermissions => {
      const entityContext = workOrder ? {
        teamId: workOrder.team_id,
        assigneeId: workOrder.assignee_id,
        status: workOrder.status,
        createdBy: workOrder.created_by
      } : undefined;

      return {
        canView: hasPermission('workorder.view', entityContext),
        canCreate: hasRole(['owner', 'admin', 'member']),
        canEdit: hasPermission('workorder.edit', entityContext),
        canDelete: hasRole(['owner', 'admin']),
        canAssign: hasPermission('workorder.assign', entityContext),
        canChangeStatus: hasPermission('workorder.changestatus', entityContext),
        canAddNotes: hasPermission('workorder.view', entityContext),
        canAddImages: hasPermission('workorder.view', entityContext)
      };
    },
    getDetailedPermissions: (workOrder?: WorkOrder): WorkOrderDetailedPermissions => {
      const entityContext = workOrder ? {
        teamId: workOrder.team_id,
        assigneeId: workOrder.assignee_id,
        status: workOrder.status,
        createdBy: workOrder.created_by
      } : undefined;

      const canEdit = hasPermission('workorder.edit', entityContext);
      const canView = hasPermission('workorder.view', entityContext);
      const isLocked = workOrder?.status === 'completed' || workOrder?.status === 'cancelled';

      return {
        canEdit: canEdit && !isLocked,
        canEditPriority: canEdit && !isLocked,
        canEditAssignment: hasPermission('workorder.assign', entityContext) && !isLocked,
        canEditDueDate: canView && !isLocked,
        canEditDescription: canView && !isLocked,
        canChangeStatus: hasPermission('workorder.changestatus', entityContext),
        canAddNotes: canView && !isLocked,
        canAddImages: canView && !isLocked,
        canAddCosts: (hasRole(['owner', 'admin']) || isTeamManager(workOrder?.team_id)) && !isLocked,
        canEditCosts: (hasRole(['owner', 'admin']) || isTeamManager(workOrder?.team_id)) && !isLocked,
        canViewPM: hasRole(['owner', 'admin']) || isTeamMember(workOrder?.team_id),
        canEditPM: (hasRole(['owner', 'admin']) || isTeamMember(workOrder?.team_id)) && !isLocked
      };
    },
    canViewAll: hasRole(['owner', 'admin']),
    canCreateAny: hasRole(['owner', 'admin', 'member']),
    canAssignAny: hasRole(['owner', 'admin'])
  };

  // Team permissions
  const teams = {
    getPermissions: (teamId?: string): EntityPermissions => {
      const entityContext = teamId ? { teamId } : undefined;
      
      return {
        canView: hasPermission('team.view', entityContext),
        canCreate: hasRole(['owner', 'admin']),
        canEdit: hasPermission('team.manage', entityContext),
        canDelete: hasRole(['owner', 'admin']),
        canAddNotes: false,
        canAddImages: false
      };
    },
    canViewAll: hasRole(['owner', 'admin']),
    canCreateAny: hasRole(['owner', 'admin']),
    canManageAny: hasRole(['owner', 'admin'])
  };

  // Equipment notes permissions
  const getEquipmentNotesPermissions = (equipmentTeamId?: string): EquipmentNotesPermissions => {
    const hasTeamAccess = equipmentTeamId ? isTeamMember(equipmentTeamId) : true;
    const isTeamManager = equipmentTeamId ? canManageTeam(equipmentTeamId) : false;
    const isOrgAdmin = hasRole(['owner', 'admin']);
    
    // Check if organization is single-user (simplified check)
    const isSingleUserOrg = currentOrganization?.memberCount === 1;

    return {
      canViewNotes: hasTeamAccess || isOrgAdmin,
      canAddPublicNote: hasTeamAccess || isOrgAdmin,
      canAddPrivateNote: (hasTeamAccess && hasRole(['member', 'admin', 'owner'])) || isOrgAdmin,
      canEditOwnNote: (note) => note.author_id === userContext?.userId,
      canEditAnyNote: isOrgAdmin || isTeamManager,
      canDeleteOwnNote: (note) => note.author_id === userContext?.userId,
      canDeleteAnyNote: isOrgAdmin || isTeamManager,
      canUploadImages: !isSingleUserOrg && (hasTeamAccess || isOrgAdmin),
      canDeleteImages: isOrgAdmin || isTeamManager,
      canSetDisplayImage: isOrgAdmin || isTeamManager
    };
  };

  return {
    // Context
    context: userContext,
    
    // Permissions by entity
    organization,
    equipment,
    workOrders,
    teams,
    
    // Utility functions
    hasRole,
    isTeamMember,
    isTeamManager,
    hasPermission,
    getEquipmentNotesPermissions,
    
    // Cache management
    clearPermissionCache: () => permissionEngine.clearCache()
  };
};

export type UnifiedPermissions = ReturnType<typeof useUnifiedPermissions>;
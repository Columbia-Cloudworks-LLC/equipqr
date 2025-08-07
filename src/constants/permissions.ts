// Permissions related constants
export const PERMISSIONS_CONSTANTS = {
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
  },
  TEAM_ROLES: {
    MANAGER: 'manager',
    TECHNICIAN: 'technician',
    REQUESTOR: 'requestor',
    VIEWER: 'viewer',
  },
  ORGANIZATION_PERMISSIONS: {
    MANAGE: 'organization.manage',
    INVITE: 'organization.invite',
  },
  EQUIPMENT_PERMISSIONS: {
    VIEW: 'equipment.view',
    EDIT: 'equipment.edit',
  },
  WORK_ORDER_PERMISSIONS: {
    VIEW: 'workorder.view',
    EDIT: 'workorder.edit',
    ASSIGN: 'workorder.assign',
    CHANGE_STATUS: 'workorder.changestatus',
  },
  TEAM_PERMISSIONS: {
    VIEW: 'team.view',
    MANAGE: 'team.manage',
  },
} as const;
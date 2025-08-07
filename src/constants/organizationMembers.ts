// Organization members related constants
export const ORGANIZATION_MEMBERS_CONSTANTS = {
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  QUERY_GC_TIME: 10 * 60 * 1000, // 10 minutes
  STATUSES: {
    ACTIVE: 'active',
    PENDING: 'pending',
    INACTIVE: 'inactive',
  },
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
  },
} as const;
/**
 * Query key factory functions for consistent and type-safe caching
 * These factories ensure we have a single source of truth for all query keys
 * and provide type safety with proper TypeScript const assertions.
 */

// Organization-related query keys
export const organization = (orgId: string) => ({
  root: ['organization', orgId] as const,
  members: () => ['organization', orgId, 'members'] as const,
  membersOptimized: () => ['organization', orgId, 'members-optimized'] as const,
  slots: () => ['organization', orgId, 'slots'] as const,
  slotAvailability: () => ['organization', orgId, 'slot-availability'] as const,
  slotPurchases: () => ['organization', orgId, 'slot-purchases'] as const,
  invitations: () => ['organization', orgId, 'invitations'] as const,
  admins: () => ['organization', orgId, 'admins'] as const,
  dashboardStats: () => ['organization', orgId, 'dashboard-stats'] as const,
  storageUsage: () => ['organization', orgId, 'storage-usage'] as const,
});

// Team-related query keys
export const team = (teamId: string) => ({
  root: ['team', teamId] as const,
  members: () => ['team', teamId, 'members'] as const,
  managerCheck: (userId: string) => ['team', teamId, 'manager', userId] as const,
});

export const teams = (orgId: string) => ({
  root: ['teams', orgId] as const,
  optimized: () => ['teams', orgId, 'optimized'] as const,
  availableUsers: (teamId: string) => ['teams', orgId, 'available-users', teamId] as const,
});

// Equipment-related query keys
export const equipment = {
  root: ['equipment'] as const,
  list: (orgId: string, filters?: any) => 
    filters ? ['equipment', orgId, 'filtered', filters] as const 
            : ['equipment', orgId] as const,
  listOptimized: (orgId: string) => ['equipment', orgId, 'optimized'] as const,
  byId: (orgId: string, equipmentId: string) => ['equipment', orgId, equipmentId] as const,
  notes: (equipmentId: string, orgId?: string) => 
    orgId ? ['equipment', equipmentId, 'notes', orgId] as const
          : ['equipment', equipmentId, 'notes'] as const,
  notesOptimized: (equipmentId: string) => ['equipment', equipmentId, 'notes-optimized'] as const,
  workingHours: (equipmentId: string, page?: number, pageSize?: number) =>
    page !== undefined && pageSize !== undefined 
      ? ['equipment', equipmentId, 'working-hours', page, pageSize] as const
      : ['equipment', equipmentId, 'working-hours'] as const,
  workingHoursHistory: (equipmentId: string, page: number, pageSize: number) =>
    ['equipment', equipmentId, 'working-hours-history', page, pageSize] as const,
  currentWorkingHours: (equipmentId: string) =>
    ['equipment', equipmentId, 'current-working-hours'] as const,
  teamBased: (orgId: string, userTeamIds: string[], isManager: boolean) =>
    ['equipment', orgId, 'team-based', userTeamIds, isManager] as const,
  scans: (orgId: string, equipmentId: string) =>
    ['equipment', 'scans', orgId, equipmentId] as const,
};

// Work order-related query keys
export const workOrders = {
  root: ['work-orders'] as const,
  list: (orgId: string, filters?: any) =>
    filters ? ['work-orders', orgId, 'filtered', filters] as const
            : ['work-orders', orgId] as const,
  enhanced: (orgId: string) => ['work-orders', orgId, 'enhanced'] as const,
  optimized: (orgId: string) => ['work-orders', orgId, 'optimized'] as const,
  filteredOptimized: (orgId: string, filters: any) => 
    ['work-orders', orgId, 'filtered-optimized', filters] as const,
  byId: (orgId: string, workOrderId: string) => ['work-orders', orgId, workOrderId] as const,
  teamBased: (orgId: string, userTeamIds: string[], isManager: boolean, filters?: any) =>
    filters 
      ? ['work-orders', orgId, 'team-based', userTeamIds, isManager, filters] as const
      : ['work-orders', orgId, 'team-based', userTeamIds, isManager] as const,
  myWorkOrders: (orgId: string, userId: string) => 
    ['work-orders', orgId, 'my', userId] as const,
  equipmentWorkOrders: (orgId: string, equipmentId: string, status?: string) =>
    status ? ['work-orders', orgId, 'equipment', equipmentId, status] as const
           : ['work-orders', orgId, 'equipment', equipmentId] as const,
  costs: (workOrderId: string) => ['work-orders', workOrderId, 'costs'] as const,
  costsSubtotal: (workOrderId: string) => ['work-orders', workOrderId, 'costs-subtotal'] as const,
  imageCount: (workOrderId: string) => ['work-orders', workOrderId, 'image-count'] as const,
};

// Notes-related query keys (for backward compatibility with existing patterns)
export const notes = {
  equipment: (orgId: string, equipmentId: string) => 
    ['notes', 'equipment', orgId, equipmentId] as const,
};

// Scans-related query keys (for backward compatibility with existing patterns)
export const scans = {
  equipment: (orgId: string, equipmentId: string) => 
    ['scans', 'equipment', orgId, equipmentId] as const,
};

// Dashboard-related query keys
export const dashboard = {
  stats: (orgId: string) => ['dashboard-stats', orgId] as const,
  teamBased: (orgId: string, userTeamIds: string[], isManager: boolean) => 
    ['dashboard', orgId, 'team-based', userTeamIds, isManager] as const,
};

// Preventative maintenance query keys
export const preventativeMaintenance = {
  list: (orgId: string) => ['preventative-maintenance', orgId] as const,
  byId: (pmId: string) => ['preventative-maintenance', pmId] as const,
  checklist: (pmId: string) => ['preventative-maintenance', pmId, 'checklist'] as const,
};

// Generic query key helpers
export const queryKeys = {
  organization,
  team,
  teams,
  equipment,
  workOrders,
  notes,
  scans,
  dashboard,
  preventativeMaintenance,
} as const;

// Export default for convenience
export default queryKeys;
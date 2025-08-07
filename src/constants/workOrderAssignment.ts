// Work order assignment related constants
export const WORK_ORDER_ASSIGNMENT_CONSTANTS = {
  ASSIGNMENT_STRATEGIES: ['admin_based', 'team_based'] as const,
  DEFAULT_STRATEGY: 'admin_based',
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutes
} as const;
// Simple organization context related constants
export const SIMPLE_ORGANIZATION_CONSTANTS = {
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  QUERY_RETRY_COUNT: 3,
  PLANS: {
    FREE: 'free',
    PREMIUM: 'premium',
  },
  BILLING_CYCLES: {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
  },
} as const;
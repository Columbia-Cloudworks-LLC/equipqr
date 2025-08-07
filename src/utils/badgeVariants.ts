
// Badge variant mappings for consistent styling
export const ROLE_BADGE_VARIANTS = {
  owner: 'default',
  admin: 'secondary'
} as const;

export const STATUS_BADGE_VARIANTS = {
  active: 'default',
  pending: 'secondary'
} as const;

export const PLAN_BADGE_VARIANTS = {
  premium: 'default',
  free: 'secondary'
} as const;

export const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
  return ROLE_BADGE_VARIANTS[role as keyof typeof ROLE_BADGE_VARIANTS] || 'outline';
};

export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
  return STATUS_BADGE_VARIANTS[status as keyof typeof STATUS_BADGE_VARIANTS] || 'destructive';
};

export const getPlanBadgeVariant = (plan: string): 'default' | 'secondary' => {
  return PLAN_BADGE_VARIANTS[plan as keyof typeof PLAN_BADGE_VARIANTS] || 'secondary';
};

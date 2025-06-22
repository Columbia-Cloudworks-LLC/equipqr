
export const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
  switch (role) {
    case 'owner':
      return 'default';
    case 'admin':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    default:
      return 'destructive';
  }
};

export const getPlanBadgeVariant = (plan: string): 'default' | 'secondary' => {
  return plan === 'premium' ? 'default' : 'secondary';
};

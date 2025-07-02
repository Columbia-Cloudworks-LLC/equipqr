
import { useQuery } from '@tanstack/react-query';
import { getEnhancedWorkOrdersByOrganization, type EnhancedWorkOrder } from '@/services/workOrdersEnhancedService';

export const useEnhancedWorkOrders = (organizationId?: string) => {
  return useQuery({
    queryKey: ['enhanced-work-orders', organizationId],
    queryFn: () => organizationId ? getEnhancedWorkOrdersByOrganization(organizationId) : [],
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

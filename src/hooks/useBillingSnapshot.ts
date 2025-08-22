import { useQuery } from '@tanstack/react-query';
import { getBillingSnapshot, BillingSnapshot } from '@/services/billingSnapshotService';

export const useBillingSnapshot = (organizationId?: string) => {
  return useQuery({
    queryKey: ['billing-snapshot', organizationId],
    queryFn: (): Promise<BillingSnapshot> => {
      if (!organizationId) {
        throw new Error('No organization ID provided');
      }
      return getBillingSnapshot(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};
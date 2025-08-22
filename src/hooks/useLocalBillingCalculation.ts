import { useQuery } from '@tanstack/react-query';
import { useEnhancedOrganizationMembers } from '@/hooks/useEnhancedOrganizationHooks';
import { useEnhancedSlotAvailability } from '@/hooks/useEnhancedOrganizationHooks';
import { useFleetMapSubscription } from '@/hooks/useFleetMapSubscription';
import { useOrganizationStorageUsage } from '@/hooks/useOrganizationStorageUsage';
import { calculateBilling, BillingState, BillingCalculation } from '@/utils/billing';

export const useLocalBillingCalculation = (organizationId?: string) => {
  // Get all the data needed for billing calculation
  const { data: members = [], isLoading: membersLoading } = useEnhancedOrganizationMembers(organizationId);
  const { data: slotAvailability, isLoading: slotsLoading } = useEnhancedSlotAvailability(organizationId);
  const { data: fleetMapSubscription, isLoading: fleetMapLoading } = useFleetMapSubscription(organizationId || '');
  const { data: storageUsage, isLoading: storageLoading } = useOrganizationStorageUsage(organizationId);

  return useQuery({
    queryKey: ['local-billing-calculation', organizationId],
    queryFn: (): BillingCalculation => {
      if (!organizationId) {
        throw new Error('No organization ID provided');
      }

      const billingState: BillingState = {
        members,
        slotAvailability,
        storageGB: storageUsage?.totalSizeGB || 0,
        fleetMapEnabled: fleetMapSubscription?.enabled || false
      };

      return calculateBilling(billingState);
    },
    enabled: !!organizationId && !membersLoading && !slotsLoading && !fleetMapLoading && !storageLoading,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};
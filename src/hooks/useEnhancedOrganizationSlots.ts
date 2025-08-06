import { useEffect } from 'react';
import { 
  useOrganizationSlots, 
  useSlotAvailability, 
  useSlotPurchases, 
  useReserveSlot, 
  useReleaseSlot,
  type OrganizationSlot,
  type SlotAvailability,
  type SlotPurchase 
} from './useOrganizationSlots';
import { useBackgroundSync } from './useCacheInvalidation';
import { performanceMonitor } from '@/utils/performanceMonitoring';

// Enhanced hook with background sync for organization slots
export const useEnhancedOrganizationSlots = (organizationId?: string) => {
  const query = useOrganizationSlots(organizationId || '');
  const { subscribeToOrganization } = useBackgroundSync();
  
  useEffect(() => {
    if (organizationId) {
      subscribeToOrganization(organizationId);
      performanceMonitor.recordMetric('enhanced-query-slots-init', 1);
    }
  }, [organizationId, subscribeToOrganization]);

  return query;
};

// Enhanced hook with background sync for slot availability
export const useEnhancedSlotAvailability = (organizationId?: string) => {
  const query = useSlotAvailability(organizationId || '');
  const { subscribeToOrganization } = useBackgroundSync();
  
  useEffect(() => {
    if (organizationId) {
      subscribeToOrganization(organizationId);
      performanceMonitor.recordMetric('enhanced-query-slot-availability-init', 1);
    }
  }, [organizationId, subscribeToOrganization]);

  return query;
};

// Enhanced hook with background sync for slot purchases
export const useEnhancedSlotPurchases = (organizationId?: string) => {
  const query = useSlotPurchases(organizationId || '');
  const { subscribeToOrganization } = useBackgroundSync();
  
  useEffect(() => {
    if (organizationId) {
      subscribeToOrganization(organizationId);
      performanceMonitor.recordMetric('enhanced-query-slot-purchases-init', 1);
    }
  }, [organizationId, subscribeToOrganization]);

  return query;
};

// Re-export enhanced mutations
export const useEnhancedReserveSlot = (organizationId: string) => {
  return useReserveSlot(organizationId);
};

export const useEnhancedReleaseSlot = (organizationId: string) => {
  return useReleaseSlot(organizationId);
};

// Re-export types for convenience
export type { OrganizationSlot, SlotAvailability, SlotPurchase };
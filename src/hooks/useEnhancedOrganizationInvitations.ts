import { useEffect } from 'react';
import { useOrganizationInvitations } from './useOrganizationInvitations';
import { useBackgroundSync } from './useCacheInvalidation';
import { performanceMonitor } from '@/utils/performanceMonitoring';

// Enhanced hook with background sync for organization invitations
export const useEnhancedOrganizationInvitations = (organizationId?: string) => {
  const query = useOrganizationInvitations(organizationId || '');
  const { subscribeToOrganization } = useBackgroundSync();
  
  useEffect(() => {
    if (organizationId) {
      subscribeToOrganization(organizationId);
      performanceMonitor.recordMetric('enhanced-query-invitations-init', 1);
    }
  }, [organizationId, subscribeToOrganization]);

  return query;
};
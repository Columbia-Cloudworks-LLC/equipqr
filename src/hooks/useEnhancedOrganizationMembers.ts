import { useEffect } from 'react';
import { useOptimizedOrganizationMembers, useOrganizationMemberStats, useUpdateMemberRole, useRemoveMember } from './useOptimizedOrganizationMembers';
import { useBackgroundSync } from './useCacheInvalidation';
import { performanceMonitor } from '@/utils/performanceMonitoring';

// Enhanced hook with background sync for organization members
export const useEnhancedOrganizationMembers = (organizationId?: string) => {
  const query = useOptimizedOrganizationMembers(organizationId || '');
  const { subscribeToOrganization } = useBackgroundSync();
  
  useEffect(() => {
    if (organizationId) {
      subscribeToOrganization(organizationId);
      performanceMonitor.recordMetric('enhanced-query-members-init', 1);
    }
  }, [organizationId, subscribeToOrganization]);

  return query;
};

// Enhanced hook with background sync for organization member stats
export const useEnhancedOrganizationMemberStats = (organizationId?: string) => {
  const query = useOrganizationMemberStats(organizationId || '');
  const { subscribeToOrganization } = useBackgroundSync();
  
  useEffect(() => {
    if (organizationId) {
      subscribeToOrganization(organizationId);
      performanceMonitor.recordMetric('enhanced-query-member-stats-init', 1);
    }
  }, [organizationId, subscribeToOrganization]);

  return query;
};

// Re-export enhanced mutations
export const useEnhancedUpdateMemberRole = (organizationId: string) => {
  return useUpdateMemberRole(organizationId);
};

export const useEnhancedRemoveMember = (organizationId: string) => {
  return useRemoveMember(organizationId);
};

// Re-export types for convenience
export type { RealOrganizationMember } from './useOptimizedOrganizationMembers';
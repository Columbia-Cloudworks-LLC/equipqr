import { useQuery } from '@tanstack/react-query';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { OptimizedOrganizationStorageService, type StorageUsage } from '@/services/optimizedOrganizationStorageService';

export type { StorageUsage };

/**
 * Optimized hook for fetching organization storage usage
 * Uses server-side aggregation and proper organization filtering
 */
export const useOrganizationStorageUsage = () => {
  const { currentOrganization } = useSimpleOrganization();

  return useQuery({
    queryKey: ['organization-storage-usage-optimized', currentOrganization?.id],
    queryFn: async (): Promise<StorageUsage> => {
      if (!currentOrganization?.id) {
        throw new Error('No organization selected');
      }

      return OptimizedOrganizationStorageService.getOrganizationStorageUsage(
        currentOrganization.id
      );
    },
    enabled: !!currentOrganization?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - increased for better performance
    refetchInterval: 10 * 60 * 1000, // 10 minutes - reduced frequency
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for getting detailed storage breakdown by type
 */
export const useDetailedStorageBreakdown = () => {
  const { currentOrganization } = useSimpleOrganization();

  return useQuery({
    queryKey: ['organization-storage-breakdown', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        throw new Error('No organization selected');
      }

      return OptimizedOrganizationStorageService.getDetailedStorageBreakdown(
        currentOrganization.id
      );
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
};

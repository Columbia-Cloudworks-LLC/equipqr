
import { useCacheManager } from '@/services/cache/cacheManager';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Hook for coordinating cache invalidation across the application
 * Now uses the centralized CacheManager service
 */
export function useCacheInvalidation() {
  const cacheManager = useCacheManager();
  const { selectedOrganization } = useOrganization();

  const validateOrganization = () => {
    if (!selectedOrganization?.id) {
      console.warn('Cannot invalidate cache: no organization selected');
      return false;
    }
    return true;
  };

  /**
   * Invalidate all equipment-related data across the application
   */
  const invalidateEquipmentData = async () => {
    if (!validateOrganization()) return;
    await cacheManager.invalidateEquipmentData(selectedOrganization!.id);
  };

  /**
   * Invalidate team-related data
   */
  const invalidateTeamData = async () => {
    if (!validateOrganization()) return;
    await cacheManager.invalidateTeamData(selectedOrganization!.id);
  };

  /**
   * Invalidate all dashboard-related data
   */
  const invalidateDashboardData = async () => {
    if (!validateOrganization()) return;
    await cacheManager.invalidateDashboardData(selectedOrganization!.id);
  };

  return {
    invalidateEquipmentData,
    invalidateTeamData,
    invalidateDashboardData
  };
}

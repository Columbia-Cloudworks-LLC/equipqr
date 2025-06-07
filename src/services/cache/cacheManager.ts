
import { useQueryClient } from '@tanstack/react-query';
import { clearDashboardCache, refreshDashboardData } from '@/services/dashboard/dashboardService';
import { clearCacheByPrefix } from '@/utils/storage/clientCache';
import { clearEquipmentCache } from '@/services/equipment/caching/equipmentCache';

/**
 * Centralized cache management service for coordinating data refreshes
 * across different parts of the application
 */
export class CacheManager {
  private queryClient: any;

  constructor(queryClient: any) {
    this.queryClient = queryClient;
  }

  /**
   * Invalidate all equipment-related data across the application
   */
  async invalidateEquipmentData(orgId: string): Promise<void> {
    console.log('Invalidating all equipment-related data for org:', orgId);

    // 1. Clear dashboard cache (edge function cache)
    clearDashboardCache();

    // 2. Clear equipment cache
    clearEquipmentCache();

    // 3. Clear session storage cache
    clearCacheByPrefix('equipment_');

    // 4. Invalidate React Query caches
    await Promise.all([
      this.queryClient.invalidateQueries({ 
        queryKey: ['equipment', orgId] 
      }),
      this.queryClient.invalidateQueries({ 
        queryKey: ['dashboardData', orgId] 
      }),
      this.queryClient.invalidateQueries({ 
        queryKey: ['equipment'] 
      })
    ]);

    // 5. Force refresh dashboard data
    try {
      await refreshDashboardData(orgId);
      console.log('Dashboard data force refreshed');
    } catch (error) {
      console.error('Error force refreshing dashboard data:', error);
    }
  }

  /**
   * Invalidate team-related data
   */
  async invalidateTeamData(orgId: string): Promise<void> {
    console.log('Invalidating team data for org:', orgId);

    clearDashboardCache();
    
    await Promise.all([
      this.queryClient.invalidateQueries({ 
        queryKey: ['teams'] 
      }),
      this.queryClient.invalidateQueries({ 
        queryKey: ['dashboardData', orgId] 
      })
    ]);
  }

  /**
   * Invalidate all dashboard-related data
   */
  async invalidateDashboardData(orgId: string): Promise<void> {
    console.log('Invalidating dashboard data for org:', orgId);

    clearDashboardCache();
    
    await this.queryClient.invalidateQueries({ 
      queryKey: ['dashboardData', orgId] 
    });

    try {
      await refreshDashboardData(orgId);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  }

  /**
   * Clear specific equipment detail cache
   */
  async invalidateEquipmentDetail(equipmentId: string): Promise<void> {
    clearCacheByPrefix(`equipment_${equipmentId}`);
    await this.queryClient.invalidateQueries({ 
      queryKey: ['equipment', equipmentId] 
    });
  }
}

/**
 * Hook to get cache manager instance
 */
export function useCacheManager() {
  const queryClient = useQueryClient();
  return new CacheManager(queryClient);
}

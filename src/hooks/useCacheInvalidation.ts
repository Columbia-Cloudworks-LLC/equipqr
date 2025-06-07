
import { useQueryClient } from '@tanstack/react-query';
import { clearDashboardCache, refreshDashboardData } from '@/services/dashboard/dashboardService';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Centralized cache invalidation hook for coordinating data refreshes
 * across different parts of the application
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();

  /**
   * Invalidate all equipment-related data across the application
   */
  const invalidateEquipmentData = async () => {
    const orgId = selectedOrganization?.id;
    
    if (!orgId) {
      console.warn('Cannot invalidate equipment data: no organization selected');
      return;
    }

    console.log('Invalidating all equipment-related data for org:', orgId);

    // 1. Clear dashboard cache (edge function cache)
    clearDashboardCache();

    // 2. Invalidate React Query caches
    await Promise.all([
      // Invalidate equipment list data
      queryClient.invalidateQueries({ 
        queryKey: ['equipment', orgId] 
      }),
      
      // Invalidate dashboard data
      queryClient.invalidateQueries({ 
        queryKey: ['dashboardData', orgId] 
      }),
      
      // Invalidate any individual equipment queries
      queryClient.invalidateQueries({ 
        queryKey: ['equipment'] 
      })
    ]);

    // 3. Force refresh dashboard data to get fresh data immediately
    try {
      await refreshDashboardData(orgId);
      console.log('Dashboard data force refreshed');
    } catch (error) {
      console.error('Error force refreshing dashboard data:', error);
    }
  };

  /**
   * Invalidate team-related data
   */
  const invalidateTeamData = async () => {
    const orgId = selectedOrganization?.id;
    
    if (!orgId) {
      console.warn('Cannot invalidate team data: no organization selected');
      return;
    }

    console.log('Invalidating team data for org:', orgId);

    // Clear dashboard cache and invalidate team queries
    clearDashboardCache();
    
    await Promise.all([
      queryClient.invalidateQueries({ 
        queryKey: ['teams'] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['dashboardData', orgId] 
      })
    ]);
  };

  /**
   * Invalidate all dashboard-related data
   */
  const invalidateDashboardData = async () => {
    const orgId = selectedOrganization?.id;
    
    if (!orgId) {
      console.warn('Cannot invalidate dashboard data: no organization selected');
      return;
    }

    console.log('Invalidating dashboard data for org:', orgId);

    // Clear dashboard cache and force refresh
    clearDashboardCache();
    
    await queryClient.invalidateQueries({ 
      queryKey: ['dashboardData', orgId] 
    });

    // Force fresh fetch
    try {
      await refreshDashboardData(orgId);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  return {
    invalidateEquipmentData,
    invalidateTeamData,
    invalidateDashboardData
  };
}

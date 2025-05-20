
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEquipment, refreshEquipment } from '@/services/equipment/equipmentListService';
import { Equipment } from '@/types';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { getTeams } from '@/services/team';
import { useLocation } from 'react-router-dom';

export function useDashboardData() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { invitations, refreshNotifications } = useNotificationsSafe();
  const [retries, setRetries] = useState(0);
  
  // Check if we need to force refresh data from location state
  const shouldRefresh = location.state?.refreshSession === true;
  const [hasRefreshed, setHasRefreshed] = useState(false);
  
  // Force refresh data if coming from authentication
  useEffect(() => {
    if (shouldRefresh && !hasRefreshed) {
      console.log('Dashboard: Detected refresh flag, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      // Mark as refreshed so we don't do it again
      setHasRefreshed(true);
      
      // Force refresh equipment data
      refreshEquipment().catch(console.error);
      
      // Clear the location state to prevent refreshing again on future renders
      window.history.replaceState(
        { ...location.state, refreshSession: false }, 
        '', 
        location.pathname
      );
    }
  }, [shouldRefresh, hasRefreshed, queryClient, location]);
  
  // Equipment data query
  const { 
    data: equipmentData = [], 
    isLoading: isEquipmentLoading, 
    isError: isEquipmentError,
    refetch: refetchEquipment
  } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
    retry: 1,
    staleTime: shouldRefresh ? 0 : 300000, // 5 minutes, but 0 if refresh flag is set
  });

  // Teams data query with force refresh option
  const { 
    data: teamsData = [], 
    isLoading: isTeamsLoading, 
    isError: isTeamsError,
    refetch: refetchTeams
  } = useQuery({
    queryKey: ['teams', 'dashboard'],
    queryFn: async () => {
      console.log('Dashboard: Fetching teams with forceRefresh');
      return getTeams({ forceRefresh: shouldRefresh || false });
    },
    retry: 2,
    staleTime: shouldRefresh ? 0 : 300000, // 5 minutes, but 0 if refresh flag is set
  });

  // Safely ensure equipment is always an array
  const equipment = Array.isArray(equipmentData) ? equipmentData : [];
  
  // Safely ensure teams is always an array with validated data
  const teams = Array.isArray(teamsData) ? teamsData.filter(team => 
    team && typeof team === 'object' && team.id && team.name
  ) : [];

  // Log team data for debugging
  useEffect(() => {
    if (teams.length > 0) {
      console.log('Dashboard teams data:', teams);
    } else if (!isTeamsLoading && retries < 2) {
      console.log('No teams found in dashboard, will retry...');
      setRetries(prev => prev + 1);
      setTimeout(() => refetchTeams(), 1500);
    }
  }, [teams, isTeamsLoading, refetchTeams, retries]);

  // Refresh notifications when the dashboard loads
  useEffect(() => {
    try {
      refreshNotifications().catch(error => {
        console.error("Failed to refresh notifications:", error);
        // Non-critical error, don't block the UI
      });
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  }, [refreshNotifications]);

  // Safely calculate equipment counts with defensive checks
  const activeCount = Array.isArray(equipment) 
    ? equipment.filter(item => item?.status === 'active').length 
    : 0;
    
  const maintenanceCount = Array.isArray(equipment)
    ? equipment.filter(item => item?.status === 'maintenance').length
    : 0;

  // Get recently added equipment (last 4) with error handling
  const recentEquipment = Array.isArray(equipment) 
    ? [...equipment]
        .sort((a, b) => {
          // Safely handle missing dates or invalid format
          const dateA = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 4)
    : [];

  return {
    equipment,
    recentEquipment,
    teams,
    activeCount,
    maintenanceCount,
    isEquipmentLoading,
    isTeamsLoading,
    isLoading: isEquipmentLoading || isTeamsLoading,
    isEquipmentError,
    isTeamsError,
    isError: isEquipmentError || isTeamsError,
    invitations,
    refetchTeams,
    refetchEquipment
  };
}

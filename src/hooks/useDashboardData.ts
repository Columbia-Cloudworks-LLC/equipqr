
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '@/services/equipment';
import { Equipment } from '@/types';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';
import { getTeams } from '@/services/team';

export function useDashboardData() {
  const { invitations, refreshNotifications } = useNotificationsSafe();
  
  const { data: equipmentData = [], isLoading: isEquipmentLoading, isError: isEquipmentError } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
    retry: 1,
  });

  const { data: teamsData = [], isLoading: isTeamsLoading, isError: isTeamsError } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    retry: 1,
  });

  // Safely ensure equipment is always an array
  const equipment = Array.isArray(equipmentData) ? equipmentData : [];
  
  // Safely ensure teams is always an array
  const teams = Array.isArray(teamsData) ? teamsData : [];

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
    isLoading: isEquipmentLoading,
    isEquipmentError,
    isTeamsError,
    isError: isEquipmentError,
    invitations
  };
}

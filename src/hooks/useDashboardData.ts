
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipment } from '@/services/equipment';
import { Equipment, TeamMember } from '@/types';
import { MOCK_TEAM_MEMBERS } from '@/data/mockData';
import { useNotificationsSafe } from '@/hooks/useNotificationsSafe';

export function useDashboardData() {
  const { invitations, refreshNotifications } = useNotificationsSafe();
  
  const { data: equipmentData = [], isLoading, isError } = useQuery({
    queryKey: ['equipment'],
    queryFn: getEquipment,
    retry: 1,
  });

  // Safely ensure equipment is always an array
  const equipment = Array.isArray(equipmentData) ? equipmentData : [];

  // Get team members (still using mock data for now)
  const teamMembers: TeamMember[] = MOCK_TEAM_MEMBERS;

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
    teamMembers,
    activeCount,
    maintenanceCount,
    isLoading,
    isError,
    invitations
  };
}

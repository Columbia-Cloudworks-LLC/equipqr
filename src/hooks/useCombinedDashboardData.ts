
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/services/dashboard/dashboardService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to fetch and process dashboard data from the edge function
 */
export function useCombinedDashboardData(orgId?: string) {
  const { session, user } = useAuth();
  const [isOrgReady, setIsOrgReady] = useState(false);
  
  // Only set orgReady to true when we have both a session and an orgId
  useEffect(() => {
    if (session && orgId) {
      setIsOrgReady(true);
    } else {
      setIsOrgReady(false);
    }
  }, [session, orgId]);

  // Only fetch data when we have an authenticated session and a selected organization
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboardData', orgId, session?.user?.id],
    queryFn: () => getDashboardData(orgId),
    enabled: !!session && !!orgId && isOrgReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Handle data processing and calculated stats
  const teams = useMemo(() => data?.teams || [], [data]);
  const equipment = useMemo(() => data?.equipment || [], [data]);
  const invitations = useMemo(() => data?.invitations || [], [data]);

  // Calculate equipment stats
  const activeCount = useMemo(() => 
    equipment.filter(item => item.status === 'active').length, 
    [equipment]
  );

  const maintenanceCount = useMemo(() => 
    equipment.filter(item => item.status === 'maintenance').length, 
    [equipment]
  );

  // Get recent equipment (last 4 items)
  const recentEquipment = useMemo(() => {
    if (!equipment.length) return [];
    return [...equipment]
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 4);
  }, [equipment]);

  // Refetch dashboard data
  const refetchDashboard = () => {
    if (isOrgReady) {
      return refetch();
    }
    return Promise.resolve();
  };

  return {
    teams,
    equipment,
    invitations,
    activeCount,
    maintenanceCount,
    recentEquipment,
    isLoading: isLoading || !isOrgReady,
    isTeamsLoading: isLoading || !isOrgReady,
    isEquipmentLoading: isLoading || !isOrgReady,
    isInvitationsLoading: isLoading || !isOrgReady,
    isTeamsError: isError,
    isEquipmentError: isError,
    isInvitationsError: isError,
    isOrgReady,
    isRefreshing: isFetching,
    refetchDashboard
  };
}

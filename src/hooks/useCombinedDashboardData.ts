
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
      console.log(`Organization and session are ready. OrgId: ${orgId}, UserId: ${session.user.id}`);
      setIsOrgReady(true);
    } else {
      const missingParts = [];
      if (!session) missingParts.push('session');
      if (!orgId) missingParts.push('orgId');
      console.log(`Waiting for ${missingParts.join(' and ')} before fetching dashboard data`);
      setIsOrgReady(false);
    }
  }, [session, orgId]);

  // Only fetch data when we have an authenticated session and a selected organization
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboardData', orgId, session?.user?.id],
    queryFn: async () => {
      if (!orgId) {
        console.error('getDashboardData called without orgId');
        return { 
          teams: [], 
          equipment: [], 
          invitations: [], 
          metadata: {
            error: 'Missing organization ID'
          }
        };
      }
      
      console.log(`Executing dashboard data fetch for org: ${orgId}`);
      const result = await getDashboardData(orgId);
      console.log(`Dashboard data fetch completed. Teams: ${result.teams?.length || 0}, Equipment: ${result.equipment?.length || 0}`);
      return result;
    },
    enabled: !!session && !!orgId && isOrgReady,
    staleTime: 1000 * 30, // Reduced from 5 minutes to 30 seconds for more responsive updates
    gcTime: 1000 * 60 * 2, // Reduced garbage collection time to 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Handle data processing and calculated stats
  const teams = useMemo(() => {
    const result = data?.teams || [];
    console.log(`Dashboard data contains ${result.length} teams`);
    return result;
  }, [data]);
  
  const equipment = useMemo(() => {
    const result = data?.equipment || [];
    console.log(`Dashboard data contains ${result.length} equipment items`);
    return result;
  }, [data]);
  
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

  // Enhanced refetch function that forces fresh data
  const refetchDashboard = async () => {
    if (isOrgReady) {
      console.log('Manually refetching dashboard data with fresh fetch');
      // Use refetch which will trigger a fresh API call
      return await refetch();
    }
    console.log('Cannot refetch: organization or session not ready');
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
    refetchDashboard,
    metadata: data?.metadata
  };
}


import { useQuery } from '@tanstack/react-query';
import { getTeamBasedWorkOrders, type TeamBasedWorkOrderFilters } from '@/services/teamBasedWorkOrderService';
import { useTeamMembership } from '@/hooks/useTeamMembership';
import { useOrganization } from '@/contexts/OrganizationContext';

export const useTeamBasedWorkOrders = (filters: TeamBasedWorkOrderFilters = {}) => {
  const { currentOrganization } = useOrganization();
  const { getUserTeamIds, isLoading: teamsLoading } = useTeamMembership();

  const userTeamIds = getUserTeamIds();

  return useQuery({
    queryKey: ['team-based-work-orders', currentOrganization?.id, userTeamIds, filters],
    queryFn: () => {
      if (!currentOrganization?.id) {
        return [];
      }
      return getTeamBasedWorkOrders(currentOrganization.id, userTeamIds, filters);
    },
    enabled: !!currentOrganization?.id && !teamsLoading,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

// Hook for checking if user has team-based access
export const useTeamBasedAccess = () => {
  const { getUserTeamIds, isLoading: teamsLoading } = useTeamMembership();
  const userTeamIds = getUserTeamIds();

  return {
    userTeamIds,
    hasTeamAccess: userTeamIds.length > 0,
    isLoading: teamsLoading
  };
};

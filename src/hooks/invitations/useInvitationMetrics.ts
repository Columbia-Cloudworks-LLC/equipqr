import { useQuery } from '@tanstack/react-query';
import { InvitationService } from '@/services/invitationService';

export const useInvitationMetrics = (organizationId: string) => {
  return useQuery({
    queryKey: ['invitation-metrics', organizationId],
    queryFn: () => InvitationService.getInvitationMetrics(organizationId),
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
};
import { useQuery } from '@tanstack/react-query';
import { InvitationService } from '@/services/invitationService';
import { OrganizationInvitation, InvitationFilters } from '@/types/invitation';

export const useInvitations = (
  organizationId: string, 
  filters?: InvitationFilters
) => {
  return useQuery({
    queryKey: ['organization-invitations', organizationId, filters],
    queryFn: () => InvitationService.getInvitations(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
};
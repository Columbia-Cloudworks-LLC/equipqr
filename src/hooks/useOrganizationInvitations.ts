// DEPRECATED: This file is kept for backward compatibility
// Use the new hooks from src/hooks/invitations/ instead

import { 
  useInvitations,
  useCreateInvitation as useCreateInvitationNew,
  useResendInvitation as useResendInvitationNew,
  useCancelInvitation as useCancelInvitationNew
} from '@/hooks/invitations';

// Legacy exports for backward compatibility
export type { OrganizationInvitation, CreateInvitationData } from '@/types/invitation';

export const useOrganizationInvitations = useInvitations;
export const useCreateInvitation = useCreateInvitationNew;
export const useResendInvitation = useResendInvitationNew;
export const useCancelInvitation = useCancelInvitationNew;

/**
 * @deprecated Use InvitationService.createInvitation directly or useCreateInvitation hook
 */
export const createInvitationDirectly = async (
  organizationId: string,
  email: string,
  role: 'admin' | 'member',
  message?: string
): Promise<string> => {
  const { InvitationService } = await import('@/services/invitationService');
  const invitation = await InvitationService.createInvitation(organizationId, {
    email,
    role,
    message
  });
  return invitation.id;
};

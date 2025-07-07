import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InvitationService } from '@/services/invitationService';
import { InvitationError } from '@/types/invitation';

export const useResendInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => 
      InvitationService.resendInvitation(organizationId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      toast.success('Invitation resent successfully');
    },
    onError: (error: InvitationError) => {
      console.error('Error resending invitation:', error);
      toast.error(error.message || 'Failed to resend invitation');
    }
  });
};
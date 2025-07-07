import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InvitationService } from '@/services/invitationService';
import { InvitationError } from '@/types/invitation';

export const useCancelInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => 
      InvitationService.cancelInvitation(organizationId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['slot-availability', organizationId] });
      toast.success('Invitation cancelled successfully');
    },
    onError: (error: InvitationError) => {
      console.error('Error cancelling invitation:', error);
      toast.error(error.message || 'Failed to cancel invitation');
    }
  });
};
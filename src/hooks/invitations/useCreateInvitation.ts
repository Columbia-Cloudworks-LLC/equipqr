import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InvitationService } from '@/services/invitationService';
import { CreateInvitationData, InvitationError } from '@/types/invitation';

export const useCreateInvitation = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestData: CreateInvitationData) => 
      InvitationService.createInvitation(organizationId, requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invitations', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['slot-availability', organizationId] });
      toast.success('Invitation sent successfully');
    },
    onError: (error: InvitationError) => {
      console.error('Error creating invitation:', error);
      
      switch (error.code) {
        case 'PERMISSION_DENIED':
          toast.error('You do not have permission to invite members');
          break;
        case 'DUPLICATE_INVITATION':
          toast.error('An invitation to this email already exists');
          break;
        case 'INVALID_DATA':
          toast.error('Invalid invitation data provided');
          break;
        default:
          toast.error('Failed to send invitation');
      }
    }
  });
};
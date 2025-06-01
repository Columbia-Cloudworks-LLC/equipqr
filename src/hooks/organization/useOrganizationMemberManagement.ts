
import { useCallback } from 'react';
import { toast } from 'sonner';
import { removeOrganizationMember } from '@/services/organization/removeOrgMember';

export function useOrganizationMemberManagement() {
  const handleRemoveMember = useCallback(async (organizationId: string, memberId: string) => {
    if (!organizationId) {
      console.error('No organization ID available for member removal');
      return;
    }

    try {
      const result = await removeOrganizationMember(organizationId, memberId);
      
      if (result.success) {
        toast.success(result.message || 'Member removed successfully');
        return true;
      } else {
        toast.error(result.error || 'Failed to remove member');
        return false;
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
      return false;
    }
  }, []);

  return {
    handleRemoveMember
  };
}

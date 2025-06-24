
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useTeamMembership } from '@/hooks/useTeamMembership';

export interface WorkOrderPermissionLevels {
  isManager: boolean;
  isRequestor: boolean;
  isTechnician: boolean;
  getFormMode: (workOrder: any, createdByCurrentUser: boolean) => 'manager' | 'requestor' | 'view_only';
}

export const useWorkOrderPermissionLevels = (): WorkOrderPermissionLevels => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');
  const { data: teamMemberships = [] } = useTeamMembership(user?.id || '', currentOrganization?.id || '');

  // Determine user role in organization
  const currentMember = members.find(m => m.user_id === user?.id);
  const isManager = currentMember?.role === 'owner' || currentMember?.role === 'admin';
  
  // Check if user is a technician in any team
  const isTechnician = teamMemberships.some(tm => tm.role === 'technician' || tm.role === 'manager');
  
  // All users can be requestors
  const isRequestor = true;

  const getFormMode = (workOrder: any, createdByCurrentUser: boolean): 'manager' | 'requestor' | 'view_only' => {
    if (isManager) {
      return 'manager';
    }
    
    if (createdByCurrentUser) {
      return 'requestor';
    }
    
    return 'view_only';
  };

  return {
    isManager,
    isRequestor,
    isTechnician,
    getFormMode
  };
};

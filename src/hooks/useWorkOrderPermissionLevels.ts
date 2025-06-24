
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useTeamMembership } from '@/hooks/useTeamMembership';

export interface WorkOrderPermissionLevels {
  isManager: boolean;
  isRequestor: boolean;
  isTechnician: boolean;
  canEdit: boolean;
  getFormMode: (workOrder: any, createdByCurrentUser: boolean) => 'manager' | 'requestor' | 'view_only';
}

export const useWorkOrderPermissionLevels = (): WorkOrderPermissionLevels => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');
  const { teamMemberships } = useTeamMembership();

  // Debug logging
  console.log('🔍 Permission Debug - Current User:', user?.id);
  console.log('🔍 Permission Debug - Organization:', currentOrganization?.id);
  console.log('🔍 Permission Debug - Members Data:', members);
  console.log('🔍 Permission Debug - Team Memberships:', teamMemberships);

  // Determine user role in organization
  const currentMember = members.find(m => {
    const match = m.id === user?.id;
    console.log(`🔍 Comparing member ${m.id} with user ${user?.id}: ${match}`);
    return match;
  });
  
  console.log('🔍 Permission Debug - Current Member Found:', currentMember);
  
  const isManager = currentMember?.role === 'owner' || currentMember?.role === 'admin';
  
  // Check if user is a technician in any team
  const isTechnician = teamMemberships.some(tm => tm.role === 'technician' || tm.role === 'manager');
  
  // All users can be requestors
  const isRequestor = true;

  // Users can edit if they are managers or technicians
  const canEdit = isManager || isTechnician;

  console.log('🔍 Permission Debug - Final Permissions:', {
    isManager,
    isTechnician,
    isRequestor,
    canEdit,
    userRole: currentMember?.role
  });

  const getFormMode = (workOrder: any, createdByCurrentUser: boolean): 'manager' | 'requestor' | 'view_only' => {
    console.log('🔍 Form Mode Debug:', {
      isManager,
      createdByCurrentUser,
      workOrderStatus: workOrder?.status,
      isTechnician,
      assigneeId: workOrder?.assignee_id,
      userId: user?.id,
      teamId: workOrder?.team_id
    });

    if (isManager) {
      console.log('🔍 Form Mode: Manager (user is organization manager)');
      return 'manager';
    }
    
    if (createdByCurrentUser && workOrder?.status === 'submitted') {
      console.log('🔍 Form Mode: Requestor (user created and status is submitted)');
      return 'requestor';
    }
    
    if (isTechnician && (workOrder?.assignee_id === user?.id || workOrder?.team_id)) {
      console.log('🔍 Form Mode: Manager (technician assigned to work order)');
      return 'manager'; // Technicians can act as managers for their assigned work orders
    }
    
    console.log('🔍 Form Mode: View Only (no permissions matched)');
    return 'view_only';
  };

  return {
    isManager,
    isRequestor,
    isTechnician,
    canEdit,
    getFormMode
  };
};

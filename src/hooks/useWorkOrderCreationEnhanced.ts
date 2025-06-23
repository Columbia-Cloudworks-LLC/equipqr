
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export interface EnhancedCreateWorkOrderData {
  title: string;
  description: string;
  equipmentId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedHours?: number;
  assignmentType?: 'team' | 'member' | 'admin';
  assignmentId?: string; // Can be team ID, member ID, or admin ID
}

export const useCreateWorkOrderEnhanced = () => {
  const { getCurrentOrganization } = useSession();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentOrg = getCurrentOrganization();

  // Get organization members to determine if it's a single-user org
  const { data: organizationMembers = [] } = useOrganizationMembers(currentOrg?.id || '');

  return useMutation({
    mutationFn: async (workOrderData: EnhancedCreateWorkOrderData) => {
      if (!currentOrg) throw new Error('No current organization');
      if (!currentUser) throw new Error('User not authenticated');

      const isSingleUserOrg = organizationMembers.length === 1;

      // Determine the target status and assignment based on org size
      let status = 'submitted';
      let teamId: string | null = null;
      let assigneeId: string | null = null;

      if (isSingleUserOrg) {
        // Single user org: auto-assign to current user and set to in_progress
        status = 'in_progress';
        assigneeId = currentUser.id;
        teamId = null; // No team assignment for single-user orgs
      } else {
        // Multi-user org: use provided assignment logic
        if (workOrderData.assignmentType === 'team' && workOrderData.assignmentId) {
          teamId = workOrderData.assignmentId;
          assigneeId = null; // Team assignment, no specific assignee
        } else if (workOrderData.assignmentType === 'member' && workOrderData.assignmentId) {
          // When assigning to a team member, we need to also set the team
          assigneeId = workOrderData.assignmentId;
          
          // Get equipment to find its team
          const { data: equipment } = await supabase
            .from('equipment')
            .select('team_id')
            .eq('id', workOrderData.equipmentId)
            .eq('organization_id', currentOrg.id)
            .single();
          
          teamId = equipment?.team_id || null;
        } else if (workOrderData.assignmentType === 'admin' && workOrderData.assignmentId) {
          // Admin assignment - no team, direct assignee
          assigneeId = workOrderData.assignmentId;
          teamId = null;
        }
      }

      const { data, error } = await supabase
        .from('work_orders')
        .insert({
          organization_id: currentOrg.id,
          created_by: currentUser.id,
          title: workOrderData.title,
          description: workOrderData.description,
          equipment_id: workOrderData.equipmentId,
          priority: workOrderData.priority,
          due_date: workOrderData.dueDate ? new Date(workOrderData.dueDate).toISOString() : null,
          estimated_hours: workOrderData.estimatedHours || null,
          assignee_id: assigneeId,
          team_id: teamId,
          status: status,
          acceptance_date: isSingleUserOrg ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (workOrder) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      const isSingleUserOrg = organizationMembers.length === 1;
      
      if (isSingleUserOrg) {
        toast.success('Work order created and started automatically');
      } else {
        toast.success('Work order created successfully');
      }
      
      // Navigate to the new work order's details page
      navigate(`/work-orders/${workOrder.id}`);
    },
    onError: (error) => {
      console.error('Error creating work order:', error);
      toast.error('Failed to create work order');
    }
  });
};

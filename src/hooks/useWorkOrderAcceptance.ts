
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { toast } from 'sonner';

interface AcceptWorkOrderParams {
  workOrderId: string;
  organizationId: string;
  assigneeId?: string;
  teamId?: string;
}

export const useWorkOrderAcceptance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workOrderId, organizationId, assigneeId, teamId }: AcceptWorkOrderParams) => {
      // Get organization member count to determine if single-user org
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      const isSingleUserOrg = (orgMembers?.length || 0) === 1;

      // Determine the target status based on assignment and org size
      let targetStatus = 'accepted';
      
      if (isSingleUserOrg) {
        // Single user org: go directly to in_progress with auto-assignment
        targetStatus = 'in_progress';
      } else if (assigneeId) {
        // Multi-user org with assignment: go to assigned
        targetStatus = 'assigned';
      }
      // Multi-user org without assignment: stay at accepted

      // Build update object
      const updateData: any = {
        status: targetStatus,
        acceptance_date: new Date().toISOString()
      };

      // Add assignment if provided or if single-user org
      if (assigneeId || isSingleUserOrg) {
        updateData.assignee_id = assigneeId;
      }

      if (teamId) {
        updateData.team_id = teamId;
      }

      // Update the work order
      const { data, error } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', workOrderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-order'] });
    },
    onError: (error) => {
      console.error('Error accepting work order:', error);
      toast.error('Failed to accept work order');
    }
  });
};

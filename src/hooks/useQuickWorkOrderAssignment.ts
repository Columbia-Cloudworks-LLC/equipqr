import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useQuickWorkOrderAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      workOrderId, 
      assigneeId, 
      teamId, 
      organizationId 
    }: { 
      workOrderId: string; 
      assigneeId?: string | null; 
      teamId?: string | null; 
      organizationId: string 
    }) => {
      // Determine the new status based on assignment
      let newStatus: string;
      if (assigneeId || teamId) {
        newStatus = 'assigned';
      } else {
        newStatus = 'submitted';
      }

      const updateData: any = {
        assignee_id: assigneeId || null,
        team_id: teamId || null,
        status: newStatus
      };

      // Set acceptance_date when assigning, clear when unassigning
      if (assigneeId || teamId) {
        updateData.acceptance_date = new Date().toISOString();
      } else {
        updateData.acceptance_date = null;
      }

      const { error } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', workOrderId);

      if (error) throw error;
    },
    onSuccess: (_, { assigneeId, teamId, organizationId }) => {
      const message = assigneeId || teamId ? 'Work order assigned successfully' : 'Work order unassigned successfully';
      toast.success(message);
      
      // Invalidate relevant queries with standardized keys
      queryClient.invalidateQueries({ queryKey: ['enhanced-work-orders', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['workOrders', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders-filtered-optimized', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', organizationId] });
    },
    onError: (error) => {
      console.error('Error assigning work order:', error);
      toast.error('Failed to assign work order');
    },
  });
};
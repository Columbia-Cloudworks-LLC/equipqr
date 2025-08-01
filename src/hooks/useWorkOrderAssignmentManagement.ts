
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedWorkOrderAssignment } from './useOptimizedWorkOrderAssignment';

export interface AssignmentUpdateData {
  assigneeId?: string | null;
  assigneeName?: string | null;
}

export const useWorkOrderAssignmentManagement = (organizationId: string, workOrderId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { assignmentOptions, isLoading: optionsLoading } = useOptimizedWorkOrderAssignment(organizationId);

  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentUpdateData) => {
      // Determine the new status based on assignment
      let newStatus: string;
      if (data.assigneeId) {
        newStatus = 'assigned';
      } else {
        newStatus = 'submitted';
      }

      const updateData: any = {
        assignee_id: data.assigneeId,
        team_id: null, // Always clear team_id since we're only doing user assignments
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Set acceptance_date when assigning, clear when unassigning
      if (data.assigneeId) {
        updateData.acceptance_date = new Date().toISOString();
      } else {
        updateData.acceptance_date = null;
      }

      const { error } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', workOrderId);

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment Updated",
        description: `Work order ${data.assigneeId ? 'assigned to ' + data.assigneeName : 'unassigned'} successfully`,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['workOrder', organizationId, workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['workOrders', organizationId] });
    },
    onError: (error) => {
      console.error('Assignment update error:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to update work order assignment",
        variant: "destructive",
      });
    }
  });

  const assignToUser = (userId: string, userName: string) => {
    updateAssignmentMutation.mutate({
      assigneeId: userId,
      assigneeName: userName
    });
  };

  const unassign = () => {
    updateAssignmentMutation.mutate({
      assigneeId: null,
      assigneeName: null
    });
  };

  return {
    assignmentOptions,
    optionsLoading,
    isUpdating: updateAssignmentMutation.isPending,
    assignToUser,
    unassign,
    updateAssignment: updateAssignmentMutation.mutate
  };
};


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedWorkOrderAssignment } from './useOptimizedWorkOrderAssignment';

export interface AssignmentUpdateData {
  assigneeId?: string | null;
  teamId?: string | null;
  assigneeName?: string | null;
  teamName?: string | null;
}

export const useWorkOrderAssignmentManagement = (organizationId: string, workOrderId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { assignmentOptions, isLoading: optionsLoading } = useOptimizedWorkOrderAssignment(organizationId);

  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentUpdateData) => {
      const updateData: any = {
        assignee_id: data.assigneeId,
        team_id: data.teamId,
        updated_at: new Date().toISOString()
      };

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
      teamId: null,
      assigneeName: userName,
      teamName: null
    });
  };

  const assignToTeam = (teamId: string, teamName: string) => {
    updateAssignmentMutation.mutate({
      assigneeId: null,
      teamId: teamId,
      assigneeName: null,
      teamName: teamName
    });
  };

  const unassign = () => {
    updateAssignmentMutation.mutate({
      assigneeId: null,
      teamId: null,
      assigneeName: null,
      teamName: null
    });
  };

  return {
    assignmentOptions,
    optionsLoading,
    isUpdating: updateAssignmentMutation.isPending,
    assignToUser,
    assignToTeam,
    unassign,
    updateAssignment: updateAssignmentMutation.mutate
  };
};


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export interface CreateWorkOrderData {
  title: string;
  description: string;
  equipmentId: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedHours?: number;
  assigneeId?: string;
  teamId?: string;
}

export const useCreateWorkOrder = () => {
  const { getCurrentOrganization } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentOrg = getCurrentOrganization();

  return useMutation({
    mutationFn: async (workOrderData: CreateWorkOrderData) => {
      if (!currentOrg) throw new Error('No current organization');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('work_orders')
        .insert({
          organization_id: currentOrg.id,
          created_by: userData.user.id,
          title: workOrderData.title,
          description: workOrderData.description,
          equipment_id: workOrderData.equipmentId,
          priority: workOrderData.priority,
          due_date: workOrderData.dueDate ? new Date(workOrderData.dueDate).toISOString() : null,
          estimated_hours: workOrderData.estimatedHours || null,
          assignee_id: workOrderData.assigneeId || null,
          team_id: workOrderData.teamId || null,
          status: 'submitted'
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
      
      toast.success('Work order created successfully');
      
      // Navigate to the new work order's details page
      navigate(`/work-orders/${workOrder.id}`);
    },
    onError: (error) => {
      console.error('Error creating work order:', error);
      toast.error('Failed to create work order');
    }
  });
};

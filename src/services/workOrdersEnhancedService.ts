
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedWorkOrder {
  id: string;
  title: string;
  description: string;
  equipmentId: string;
  organizationId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assigneeId?: string;
  assigneeName?: string;
  teamId?: string;
  teamName?: string;
  createdDate: string;
  created_date: string;
  dueDate?: string;
  estimatedHours?: number;
  completedDate?: string;
  equipmentName?: string;
  equipmentTeamId?: string;
  equipmentTeamName?: string;
  createdByName?: string;
}

export const getEnhancedWorkOrdersByOrganization = async (organizationId: string): Promise<EnhancedWorkOrder[]> => {
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        id,
        title,
        description,
        equipment_id,
        organization_id,
        priority,
        status,
        assignee_id,
        team_id,
        created_date,
        due_date,
        estimated_hours,
        completed_date,
        created_by,
        equipment:equipment_id (
          name,
          team_id,
          teams:team_id (
            name
          )
        ),
        assignee:profiles!work_orders_assignee_id_fkey (
          name
        ),
        team:team_id (
          name
        ),
        creator:profiles!work_orders_created_by_fkey (
          name
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(wo => ({
      id: wo.id,
      title: wo.title,
      description: wo.description,
      equipmentId: wo.equipment_id,
      organizationId: wo.organization_id,
      priority: wo.priority,
      status: wo.status,
      assigneeId: wo.assignee_id,
      assigneeName: wo.assignee?.name,
      teamId: wo.team_id,
      teamName: wo.team?.name,
      createdDate: wo.created_date,
      created_date: wo.created_date,
      dueDate: wo.due_date,
      estimatedHours: wo.estimated_hours,
      completedDate: wo.completed_date,
      equipmentName: wo.equipment?.name,
      equipmentTeamId: wo.equipment?.team_id,
      equipmentTeamName: wo.equipment?.teams?.name,
      createdByName: wo.creator?.name
    }));
  } catch (error) {
    console.error('Error fetching enhanced work orders:', error);
    throw error;
  }
};

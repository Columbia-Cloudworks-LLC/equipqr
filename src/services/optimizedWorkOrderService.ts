import { supabase } from '@/integrations/supabase/client';
import { EnhancedWorkOrder } from './workOrdersEnhancedService';

export interface WorkOrderFilters {
  status?: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'all';
  assigneeId?: string;
  teamId?: string;
  priority?: 'low' | 'medium' | 'high' | 'all';
  equipmentId?: string;
  dueDateFilter?: 'overdue' | 'today' | 'this_week';
  search?: string;
}

// Optimized work orders query using the new indexes
export const getFilteredWorkOrdersByOrganization = async (
  organizationId: string,
  filters: WorkOrderFilters = {}
): Promise<EnhancedWorkOrder[]> => {
  try {
    let query = supabase
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
          name
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
      .eq('organization_id', organizationId);

    // Apply filters to use our indexes efficiently
    if (filters.status && filters.status !== 'all') {
      // Uses idx_work_orders_org_status composite index
      query = query.eq('status', filters.status);
    }

    if (filters.assigneeId && filters.assigneeId !== 'all') {
      // Uses idx_work_orders_assignee_id index
      if (filters.assigneeId === 'unassigned') {
        query = query.is('assignee_id', null);
      } else {
        query = query.eq('assignee_id', filters.assigneeId);
      }
    }

    if (filters.teamId && filters.teamId !== 'all') {
      // Uses idx_work_orders_team_id index
      query = query.eq('team_id', filters.teamId);
    }

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    if (filters.equipmentId) {
      // Uses idx_work_orders_equipment_id index
      query = query.eq('equipment_id', filters.equipmentId);
    }

    // Due date filtering using idx_work_orders_org_due_date
    if (filters.dueDateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      switch (filters.dueDateFilter) {
        case 'overdue':
          query = query.lt('due_date', today.toISOString());
          break;
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query = query.gte('due_date', today.toISOString()).lt('due_date', tomorrow.toISOString());
          break;
        case 'this_week':
          query = query.gte('due_date', today.toISOString()).lt('due_date', weekFromNow.toISOString());
          break;
      }
    }

    // Order by created_date descending (most recent first)
    query = query.order('created_date', { ascending: false });

    const { data, error } = await query;

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
      createdByName: wo.creator?.name
    }));
  } catch (error) {
    console.error('Error fetching filtered work orders:', error);
    throw error;
  }
};

// Get work orders by assignee (uses idx_work_orders_assignee_id)
export const getMyWorkOrders = async (organizationId: string, userId: string): Promise<EnhancedWorkOrder[]> => {
  return getFilteredWorkOrdersByOrganization(organizationId, { assigneeId: userId });
};

// Get work orders by team (uses idx_work_orders_team_id and idx_work_orders_team_status)
export const getTeamWorkOrders = async (
  organizationId: string, 
  teamId: string, 
  status?: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'all'
): Promise<EnhancedWorkOrder[]> => {
  const filters: WorkOrderFilters = { teamId };
  if (status && status !== 'all') {
    filters.status = status;
  }
  return getFilteredWorkOrdersByOrganization(organizationId, filters);
};

// Get work orders by equipment (uses idx_work_orders_equipment_id and idx_work_orders_equipment_status)
export const getEquipmentWorkOrders = async (
  organizationId: string, 
  equipmentId: string, 
  status?: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'all'
): Promise<EnhancedWorkOrder[]> => {
  const filters: WorkOrderFilters = { equipmentId };
  if (status && status !== 'all') {
    filters.status = status;
  }
  return getFilteredWorkOrdersByOrganization(organizationId, filters);
};

// Dashboard query for overdue work orders (uses idx_work_orders_org_due_date)
export const getOverdueWorkOrders = async (organizationId: string): Promise<EnhancedWorkOrder[]> => {
  return getFilteredWorkOrdersByOrganization(organizationId, { dueDateFilter: 'overdue' });
};

// Dashboard query for work orders due today (uses idx_work_orders_org_due_date)
export const getWorkOrdersDueToday = async (organizationId: string): Promise<EnhancedWorkOrder[]> => {
  return getFilteredWorkOrdersByOrganization(organizationId, { dueDateFilter: 'today' });
};
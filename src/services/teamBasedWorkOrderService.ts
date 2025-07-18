
import { supabase } from '@/integrations/supabase/client';
import { EnhancedWorkOrder } from '@/services/workOrdersEnhancedService';
import { getAccessibleEquipmentIds } from './teamBasedEquipmentService';

export interface TeamBasedWorkOrderFilters {
  status?: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'all';
  assigneeId?: string;
  teamId?: string;
  priority?: 'low' | 'medium' | 'high' | 'all';
  dueDateFilter?: 'overdue' | 'today' | 'this_week';
  search?: string;
}

// Get work orders filtered by team-accessible equipment
export const getTeamBasedWorkOrders = async (
  organizationId: string,
  userTeamIds: string[],
  isOrgAdmin: boolean = false,
  filters: TeamBasedWorkOrderFilters = {}
): Promise<EnhancedWorkOrder[]> => {
  try {
    console.log('🔍 Fetching team-based work orders for organization:', organizationId);
    console.log('👥 User team IDs:', userTeamIds, 'isAdmin:', isOrgAdmin);

    // First, get the equipment IDs that this user can access
    const accessibleEquipmentIds = await getAccessibleEquipmentIds(organizationId, userTeamIds, isOrgAdmin);
    
    console.log('🔧 Accessible equipment IDs:', accessibleEquipmentIds.length);

    if (accessibleEquipmentIds.length === 0) {
      console.log('⚠️ No accessible equipment found, returning empty array');
      return [];
    }

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
      .eq('organization_id', organizationId)
      .in('equipment_id', accessibleEquipmentIds);

    // Apply additional filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.assigneeId && filters.assigneeId !== 'all') {
      if (filters.assigneeId === 'unassigned') {
        query = query.is('assignee_id', null);
      } else {
        query = query.eq('assignee_id', filters.assigneeId);
      }
    }

    if (filters.teamId && filters.teamId !== 'all') {
      query = query.eq('team_id', filters.teamId);
    }

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    // Due date filtering
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

    if (error) {
      console.error('❌ Error fetching team-based work orders:', error);
      throw error;
    }

    console.log('✅ Found team-based work orders:', data?.length || 0);

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
    console.error('💥 Error in getTeamBasedWorkOrders:', error);
    throw error;
  }
};

// Get work orders assigned to user's teams
export const getMyTeamWorkOrders = async (
  organizationId: string,
  userTeamIds: string[],
  userId: string,
  isOrgAdmin: boolean = false
): Promise<EnhancedWorkOrder[]> => {
  return getTeamBasedWorkOrders(organizationId, userTeamIds, isOrgAdmin, { assigneeId: userId });
};

// Get overdue work orders for user's accessible equipment
export const getTeamOverdueWorkOrders = async (
  organizationId: string,
  userTeamIds: string[],
  isOrgAdmin: boolean = false
): Promise<EnhancedWorkOrder[]> => {
  return getTeamBasedWorkOrders(organizationId, userTeamIds, isOrgAdmin, { dueDateFilter: 'overdue' });
};

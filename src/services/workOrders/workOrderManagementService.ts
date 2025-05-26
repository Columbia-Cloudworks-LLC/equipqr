
import { supabase } from '@/integrations/supabase/client';
import { WorkOrder, WorkOrderStatus } from '@/types/workOrders';

interface GetAllUserWorkOrdersParams {
  search?: string;
  status?: string;
  equipmentId?: string;
  assignedTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all work orders that the user has access to across all equipment
 */
export async function getAllUserWorkOrders(params: GetAllUserWorkOrdersParams = {}): Promise<WorkOrder[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Not authenticated');
    }

    let query = supabase
      .from('work_order')
      .select(`
        *,
        equipment!inner(
          id,
          name,
          org_id,
          team_id
        ),
        submitted_by_profile:app_user!work_order_created_by_fkey(
          display_name,
          email
        ),
        assigned_to_profile:app_user!work_order_assigned_to_fkey(
          display_name,
          email
        )
      `)
      .order('opened_at', { ascending: false });

    // Apply filters
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    if (params.equipmentId) {
      query = query.eq('equipment_id', params.equipmentId);
    }

    if (params.assignedTo) {
      query = query.eq('assigned_to', params.assignedTo);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching work orders:', error);
      throw error;
    }

    return data?.map(wo => ({
      id: wo.id,
      equipment_id: wo.equipment_id,
      title: wo.title,
      description: wo.description || '',
      status: wo.status as WorkOrderStatus,
      estimated_hours: wo.estimated_hours,
      submitted_by: wo.created_by,
      submitted_at: wo.opened_at,
      accepted_at: wo.accepted_at,
      assigned_at: wo.assigned_at,
      completed_at: wo.completed_at,
      assigned_to: wo.assigned_to,
      created_at: wo.opened_at,
      updated_at: wo.updated_at,
      equipment_name: wo.equipment?.name,
      submitted_by_name: wo.submitted_by_profile?.display_name || wo.submitted_by_profile?.email,
      assigned_to_name: wo.assigned_to_profile?.display_name || wo.assigned_to_profile?.email
    })) || [];
  } catch (error) {
    console.error('Error in getAllUserWorkOrders:', error);
    throw error;
  }
}

/**
 * Get work order statistics for dashboard
 */
export async function getWorkOrderStats() {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('work_order')
      .select('status, equipment!inner(org_id, team_id)')
      .not('deleted_at', 'is', null);

    if (error) {
      console.error('Error fetching work order stats:', error);
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      submitted: data?.filter(wo => wo.status === 'submitted').length || 0,
      in_progress: data?.filter(wo => wo.status === 'in_progress').length || 0,
      completed: data?.filter(wo => wo.status === 'completed').length || 0,
      overdue: 0 // TODO: Implement overdue logic based on due dates
    };

    return stats;
  } catch (error) {
    console.error('Error in getWorkOrderStats:', error);
    throw error;
  }
}

/**
 * Get work orders assigned to the current user
 */
export async function getMyWorkOrders(): Promise<WorkOrder[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Not authenticated');
    }

    // Get app_user ID
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user.user.id)
      .single();

    if (appUserError || !appUser) {
      throw new Error('User profile not found');
    }

    const { data, error } = await supabase
      .from('work_order')
      .select(`
        *,
        equipment!inner(name),
        submitted_by_profile:app_user!work_order_created_by_fkey(
          display_name,
          email
        )
      `)
      .eq('assigned_to', appUser.id)
      .order('opened_at', { ascending: false });

    if (error) {
      console.error('Error fetching my work orders:', error);
      throw error;
    }

    return data?.map(wo => ({
      id: wo.id,
      equipment_id: wo.equipment_id,
      title: wo.title,
      description: wo.description || '',
      status: wo.status as WorkOrderStatus,
      estimated_hours: wo.estimated_hours,
      submitted_by: wo.created_by,
      submitted_at: wo.opened_at,
      accepted_at: wo.accepted_at,
      assigned_at: wo.assigned_at,
      completed_at: wo.completed_at,
      assigned_to: wo.assigned_to,
      created_at: wo.opened_at,
      updated_at: wo.updated_at,
      equipment_name: wo.equipment?.name,
      submitted_by_name: wo.submitted_by_profile?.display_name || wo.submitted_by_profile?.email
    })) || [];
  } catch (error) {
    console.error('Error in getMyWorkOrders:', error);
    throw error;
  }
}

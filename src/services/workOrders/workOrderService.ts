
import { supabase } from '@/integrations/supabase/client';
import { WorkOrder, CreateWorkOrderParams, UpdateWorkOrderParams, WorkOrderStatus } from '@/types/workOrders';
import { logWorkOrderChange } from './workOrderAudit';

/**
 * Get work orders for equipment
 */
export async function getWorkOrders(equipmentId: string): Promise<WorkOrder[]> {
  try {
    const { data, error } = await supabase
      .from('work_order')
      .select(`
        *,
        equipment!inner(name),
        submitted_by_profile:app_user!work_order_submitted_by_fkey(
          user_profiles!inner(display_name, email)
        ),
        assigned_to_profile:app_user!work_order_assigned_to_fkey(
          user_profiles!inner(display_name, email)
        )
      `)
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching work orders:', error);
      throw error;
    }

    return data?.map(wo => ({
      ...wo,
      equipment_name: wo.equipment?.name,
      submitted_by_name: wo.submitted_by_profile?.user_profiles?.display_name || wo.submitted_by_profile?.user_profiles?.email,
      assigned_to_name: wo.assigned_to_profile?.user_profiles?.display_name || wo.assigned_to_profile?.user_profiles?.email
    })) || [];
  } catch (error) {
    console.error('Error in getWorkOrders:', error);
    throw error;
  }
}

/**
 * Create a new work order
 */
export async function createWorkOrder(params: CreateWorkOrderParams): Promise<WorkOrder> {
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
      .insert({
        ...params,
        status: 'submitted' as WorkOrderStatus,
        submitted_by: appUser.id,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work order:', error);
      throw error;
    }

    // Log the creation
    await logWorkOrderChange(data.id, 'status_change', null, 'submitted');

    return data;
  } catch (error) {
    console.error('Error in createWorkOrder:', error);
    throw error;
  }
}

/**
 * Update a work order
 */
export async function updateWorkOrder(
  workOrderId: string, 
  params: UpdateWorkOrderParams
): Promise<WorkOrder> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Not authenticated');
    }

    // Get current work order for audit logging
    const { data: currentWorkOrder } = await supabase
      .from('work_order')
      .select('*')
      .eq('id', workOrderId)
      .single();

    if (!currentWorkOrder) {
      throw new Error('Work order not found');
    }

    const updateData: any = {
      ...params,
      updated_at: new Date().toISOString()
    };

    // Set timestamps based on status changes
    if (params.status) {
      switch (params.status) {
        case 'accepted':
          updateData.accepted_at = new Date().toISOString();
          break;
        case 'assigned':
          updateData.assigned_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
      }
    }

    const { data, error } = await supabase
      .from('work_order')
      .update(updateData)
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating work order:', error);
      throw error;
    }

    // Log changes
    if (params.status && params.status !== currentWorkOrder.status) {
      await logWorkOrderChange(workOrderId, 'status_change', currentWorkOrder.status, params.status);
    }

    if (params.assigned_to && params.assigned_to !== currentWorkOrder.assigned_to) {
      await logWorkOrderChange(workOrderId, 'assignee_change', currentWorkOrder.assigned_to, params.assigned_to);
    }

    return data;
  } catch (error) {
    console.error('Error in updateWorkOrder:', error);
    throw error;
  }
}

/**
 * Get work order by ID
 */
export async function getWorkOrder(workOrderId: string): Promise<WorkOrder | null> {
  try {
    const { data, error } = await supabase
      .from('work_order')
      .select(`
        *,
        equipment!inner(name),
        submitted_by_profile:app_user!work_order_submitted_by_fkey(
          user_profiles!inner(display_name, email)
        ),
        assigned_to_profile:app_user!work_order_assigned_to_fkey(
          user_profiles!inner(display_name, email)
        )
      `)
      .eq('id', workOrderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching work order:', error);
      throw error;
    }

    return {
      ...data,
      equipment_name: data.equipment?.name,
      submitted_by_name: data.submitted_by_profile?.user_profiles?.display_name || data.submitted_by_profile?.user_profiles?.email,
      assigned_to_name: data.assigned_to_profile?.user_profiles?.display_name || data.assigned_to_profile?.user_profiles?.email
    };
  } catch (error) {
    console.error('Error in getWorkOrder:', error);
    throw error;
  }
}

/**
 * Get total hours for a work order from associated work notes
 */
export async function getWorkOrderTotalHours(workOrderId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('equipment_work_notes')
      .select('hours_worked')
      .eq('work_order_id', workOrderId)
      .not('hours_worked', 'is', null);

    if (error) {
      console.error('Error fetching work order hours:', error);
      return 0;
    }

    return data?.reduce((total, note) => total + (note.hours_worked || 0), 0) || 0;
  } catch (error) {
    console.error('Error in getWorkOrderTotalHours:', error);
    return 0;
  }
}

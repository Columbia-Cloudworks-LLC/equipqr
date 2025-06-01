import { supabase } from '@/integrations/supabase/client';
import { WorkOrder, CreateWorkOrderParams, UpdateWorkOrderParams, WorkOrderStatus } from '@/types/workOrders';
import { logWorkOrderChange } from './workOrderAudit';
import { canSubmitWorkOrders } from './workOrderPermissions';
import { sendAssignmentNotification } from './workOrderAssignmentService';

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
        submitted_by_profile:app_user!work_order_created_by_fkey(
          display_name,
          email
        ),
        assigned_to_profile:app_user!work_order_assigned_to_fkey(
          display_name,
          email
        )
      `)
      .eq('equipment_id', equipmentId)
      .order('opened_at', { ascending: false });

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
      created_at: wo.opened_at, // Use opened_at as created_at for consistency
      updated_at: wo.updated_at,
      equipment_name: wo.equipment?.name,
      submitted_by_name: wo.submitted_by_profile?.[0]?.display_name || wo.submitted_by_profile?.[0]?.email,
      assigned_to_name: wo.assigned_to_profile?.[0]?.display_name || wo.assigned_to_profile?.[0]?.email
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

    console.log('Creating work order for user:', user.user.id);

    // Get app_user.id from auth.uid - required for foreign key constraint
    const { data: appUser, error: appUserError } = await supabase
      .from('app_user')
      .select('id')
      .eq('auth_uid', user.user.id)
      .single();

    if (appUserError || !appUser) {
      console.error('Error fetching app_user:', appUserError);
      throw new Error('User profile not found');
    }

    console.log('Found app_user.id:', appUser.id);

    // Get equipment details including org_id
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('org_id, name')
      .eq('id', params.equipment_id)
      .single();

    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      throw new Error('Equipment not found');
    }

    console.log('Equipment org_id:', equipment.org_id);

    // Verify user has permission to create work orders for this equipment using our permission function
    const hasPermission = await canSubmitWorkOrders(params.equipment_id);

    if (!hasPermission) {
      throw new Error('You do not have permission to create work orders for this equipment');
    }

    console.log('User has permission to submit work orders');

    // Create the work order with app_user.id as created_by (required by foreign key)
    const workOrderData = {
      equipment_id: params.equipment_id,
      title: params.title,
      description: params.description,
      status: 'submitted' as WorkOrderStatus,
      created_by: appUser.id, // Use app_user.id for foreign key constraint
      org_id: equipment.org_id,
      opened_at: new Date().toISOString()
    };

    console.log('Creating work order with data:', workOrderData);

    const { data, error } = await supabase
      .from('work_order')
      .insert(workOrderData)
      .select()
      .single();

    if (error) {
      console.error('Error creating work order:', error);
      throw error;
    }

    console.log('Work order created successfully:', data.id);

    // Log the creation
    try {
      await logWorkOrderChange(data.id, 'status_change', null, 'submitted');
    } catch (auditError) {
      console.warn('Failed to log work order creation:', auditError);
      // Don't fail the whole operation if audit logging fails
    }

    return {
      id: data.id,
      equipment_id: data.equipment_id,
      title: data.title,
      description: data.description || '',
      status: data.status as WorkOrderStatus,
      estimated_hours: data.estimated_hours,
      submitted_by: data.created_by,
      submitted_at: data.opened_at,
      accepted_at: data.accepted_at,
      assigned_at: data.assigned_at,
      completed_at: data.completed_at,
      assigned_to: data.assigned_to,
      created_at: data.opened_at,
      updated_at: data.updated_at,
      equipment_name: equipment.name
    };
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
      .select('*, equipment!inner(name)')
      .eq('id', workOrderId)
      .single();

    if (!currentWorkOrder) {
      throw new Error('Work order not found');
    }

    const updateData: any = {
      ...params,
      updated_at: new Date().toISOString()
    };

    // If assigning to someone, convert auth.uid to app_user.id
    if (params.assigned_to) {
      const { data: assigneeAppUser, error: assigneeError } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_uid', params.assigned_to)
        .single();

      if (assigneeError || !assigneeAppUser) {
        throw new Error('Assignee not found');
      }

      updateData.assigned_to = assigneeAppUser.id;
    }

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
          updateData.closed_at = new Date().toISOString();
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

    if (updateData.assigned_to && updateData.assigned_to !== currentWorkOrder.assigned_to) {
      await logWorkOrderChange(workOrderId, 'assignee_change', currentWorkOrder.assigned_to, updateData.assigned_to);
      
      // Send assignment notification if assignment is new or changed
      if (params.assigned_to) {
        try {
          await sendAssignmentNotification(
            params.assigned_to,
            workOrderId,
            currentWorkOrder.title,
            currentWorkOrder.equipment?.name || 'Unknown Equipment'
          );
        } catch (notificationError) {
          console.warn('Failed to send assignment notification:', notificationError);
          // Don't fail the whole operation if notification fails
        }
      }
    }

    return {
      id: data.id,
      equipment_id: data.equipment_id,
      title: data.title,
      description: data.description || '',
      status: data.status as WorkOrderStatus,
      estimated_hours: data.estimated_hours,
      submitted_by: data.created_by,
      submitted_at: data.opened_at,
      accepted_at: data.accepted_at,
      assigned_at: data.assigned_at,
      completed_at: data.completed_at,
      assigned_to: data.assigned_to,
      created_at: data.opened_at,
      updated_at: data.updated_at
    };
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
        submitted_by_profile:app_user!work_order_created_by_fkey(
          display_name,
          email
        ),
        assigned_to_profile:app_user!work_order_assigned_to_fkey(
          display_name,
          email
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
      id: data.id,
      equipment_id: data.equipment_id,
      title: data.title,
      description: data.description || '',
      status: data.status as WorkOrderStatus,
      estimated_hours: data.estimated_hours,
      submitted_by: data.created_by,
      submitted_at: data.opened_at,
      accepted_at: data.accepted_at,
      assigned_at: data.assigned_at,
      completed_at: data.completed_at,
      assigned_to: data.assigned_to,
      created_at: data.opened_at,
      updated_at: data.updated_at,
      equipment_name: data.equipment?.name,
      submitted_by_name: data.submitted_by_profile?.[0]?.display_name || data.submitted_by_profile?.[0]?.email,
      assigned_to_name: data.assigned_to_profile?.[0]?.display_name || data.assigned_to_profile?.[0]?.email
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

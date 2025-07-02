
import { supabase } from '@/integrations/supabase/client';

export interface WorkOrderCost {
  id: string;
  work_order_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

export interface CreateWorkOrderCostData {
  work_order_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
}

export interface UpdateWorkOrderCostData {
  description?: string;
  quantity?: number;
  unit_price_cents?: number;
}

// Get all costs for a work order
export const getWorkOrderCosts = async (workOrderId: string): Promise<WorkOrderCost[]> => {
  try {
    const { data, error } = await supabase
      .from('work_order_costs')
      .select(`
        *,
        profiles:created_by (
          name
        )
      `)
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(cost => ({
      ...cost,
      created_by_name: (cost.profiles as any)?.name || 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching work order costs:', error);
    throw error;
  }
};

// Create a new cost item
export const createWorkOrderCost = async (costData: CreateWorkOrderCostData): Promise<WorkOrderCost> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('work_order_costs')
      .insert({
        ...costData,
        created_by: userData.user.id
      })
      .select(`
        *,
        profiles:created_by (
          name
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      created_by_name: (data.profiles as any)?.name || 'Unknown'
    };
  } catch (error) {
    console.error('Error creating work order cost:', error);
    throw error;
  }
};

// Update a cost item
export const updateWorkOrderCost = async (
  costId: string, 
  updateData: UpdateWorkOrderCostData
): Promise<WorkOrderCost> => {
  try {
    const { data, error } = await supabase
      .from('work_order_costs')
      .update(updateData)
      .eq('id', costId)
      .select(`
        *,
        profiles:created_by (
          name
        )
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      created_by_name: (data.profiles as any)?.name || 'Unknown'
    };
  } catch (error) {
    console.error('Error updating work order cost:', error);
    throw error;
  }
};

// Delete a cost item
export const deleteWorkOrderCost = async (costId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('work_order_costs')
      .delete()
      .eq('id', costId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting work order cost:', error);
    throw error;
  }
};

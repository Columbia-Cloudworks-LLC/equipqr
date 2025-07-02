
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
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get creator names separately to avoid join issues
    const costs = data || [];
    const creatorIds = [...new Set(costs.map(cost => cost.created_by))];
    
    let profilesMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', creatorIds);
      
      if (profiles) {
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile.name;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    return costs.map(cost => ({
      ...cost,
      created_by_name: profilesMap[cost.created_by] || 'Unknown'
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
      .select()
      .single();

    if (error) throw error;

    // Get creator name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userData.user.id)
      .single();

    return {
      ...data,
      created_by_name: profile?.name || 'Unknown'
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
      .select()
      .single();

    if (error) throw error;

    // Get creator name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', data.created_by)
      .single();

    return {
      ...data,
      created_by_name: profile?.name || 'Unknown'
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

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
  createdByName?: string;
  workOrderTitle?: string;
}

// Get costs created by a specific user (uses idx_work_order_costs_created_by)
export const getMyCosts = async (organizationId: string, userId: string): Promise<WorkOrderCost[]> => {
  try {
    const { data, error } = await supabase
      .from('work_order_costs')
      .select(`
        *,
        work_orders!inner (
          id,
          title,
          organization_id
        ),
        creator:profiles!work_order_costs_created_by_fkey (
          name
        )
      `)
      .eq('created_by', userId)
      .eq('work_orders.organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(cost => ({
      id: cost.id,
      work_order_id: cost.work_order_id,
      description: cost.description,
      quantity: cost.quantity,
      unit_price_cents: cost.unit_price_cents,
      total_price_cents: cost.total_price_cents || (cost.quantity * cost.unit_price_cents),
      created_by: cost.created_by,
      created_at: cost.created_at,
      updated_at: cost.updated_at,
      createdByName: cost.creator?.name,
      workOrderTitle: cost.work_orders?.title
    }));
  } catch (error) {
    console.error('Error fetching user costs:', error);
    return [];
  }
};

// Get all costs for organization with creator info (uses idx_work_order_costs_created_by)
export const getAllCostsWithCreators = async (organizationId: string): Promise<WorkOrderCost[]> => {
  try {
    const { data, error } = await supabase
      .from('work_order_costs')
      .select(`
        *,
        work_orders!inner (
          id,
          title,
          organization_id
        ),
        creator:profiles!work_order_costs_created_by_fkey (
          name
        )
      `)
      .eq('work_orders.organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(cost => ({
      id: cost.id,
      work_order_id: cost.work_order_id,
      description: cost.description,
      quantity: cost.quantity,
      unit_price_cents: cost.unit_price_cents,
      total_price_cents: cost.total_price_cents || (cost.quantity * cost.unit_price_cents),
      created_by: cost.created_by,
      created_at: cost.created_at,
      updated_at: cost.updated_at,
      createdByName: cost.creator?.name,
      workOrderTitle: cost.work_orders?.title
    }));
  } catch (error) {
    console.error('Error fetching all costs:', error);
    return [];
  }
};

// Get cost summary by user for organization reports
export const getCostSummaryByUser = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from('work_order_costs')
      .select(`
        created_by,
        quantity,
        unit_price_cents,
        total_price_cents,
        work_orders!inner (
          organization_id
        ),
        creator:profiles!work_order_costs_created_by_fkey (
          name
        )
      `)
      .eq('work_orders.organization_id', organizationId);

    if (error) throw error;

    // Group by user and calculate totals
    const summary = (data || []).reduce((acc, cost) => {
      const userId = cost.created_by;
      const userName = cost.creator?.name || 'Unknown';
      const total = cost.total_price_cents || (cost.quantity * cost.unit_price_cents);
      
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName,
          totalCosts: 0,
          itemCount: 0
        };
      }
      
      acc[userId].totalCosts += total;
      acc[userId].itemCount += 1;
      
      return acc;
    }, {} as Record<string, { userId: string; userName: string; totalCosts: number; itemCount: number }>);

    return Object.values(summary);
  } catch (error) {
    console.error('Error fetching cost summary:', error);
    return [];
  }
};
import { supabase } from '@/integrations/supabase/client';

export interface WorkingHoursHistoryEntry {
  id: string;
  equipment_id: string;
  old_hours: number | null;
  new_hours: number;
  hours_added: number;
  updated_by: string;
  updated_by_name: string | null;
  update_source: 'manual' | 'work_order';
  work_order_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface UpdateWorkingHoursData {
  equipmentId: string;
  newHours: number;
  updateSource?: 'manual' | 'work_order';
  workOrderId?: string;
  notes?: string;
}

export const updateEquipmentWorkingHours = async (data: UpdateWorkingHoursData) => {
  const { data: result, error } = await supabase.rpc('update_equipment_working_hours', {
    p_equipment_id: data.equipmentId,
    p_new_hours: data.newHours,
    p_update_source: data.updateSource || 'manual',
    p_work_order_id: data.workOrderId || null,
    p_notes: data.notes || null
  });

  if (error) {
    console.error('Error updating equipment working hours:', error);
    throw error;
  }

  return result;
};

export const getEquipmentWorkingHoursHistory = async (equipmentId: string): Promise<WorkingHoursHistoryEntry[]> => {
  const { data, error } = await supabase
    .from('equipment_working_hours_history')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching working hours history:', error);
    throw error;
  }

  return (data || []) as WorkingHoursHistoryEntry[];
};

export const getEquipmentCurrentWorkingHours = async (equipmentId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('working_hours')
    .eq('id', equipmentId)
    .single();

  if (error) {
    console.error('Error fetching current working hours:', error);
    throw error;
  }

  return data?.working_hours || 0;
};
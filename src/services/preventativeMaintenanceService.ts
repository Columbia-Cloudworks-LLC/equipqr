
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type PreventativeMaintenance = Tables<'preventative_maintenance'>;

export interface PMChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required: boolean;
  notes?: string;
}

export interface CreatePMData {
  workOrderId: string;
  equipmentId: string;
  organizationId: string;
  checklistData: PMChecklistItem[];
  notes?: string;
}

export interface UpdatePMData {
  checklistData: PMChecklistItem[];
  notes?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

// Create a new PM record
export const createPM = async (data: CreatePMData): Promise<PreventativeMaintenance | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data: pm, error } = await supabase
      .from('preventative_maintenance')
      .insert({
        work_order_id: data.workOrderId,
        equipment_id: data.equipmentId,
        organization_id: data.organizationId,
        created_by: userData.user.id,
        checklist_data: data.checklistData,
        notes: data.notes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating PM:', error);
      return null;
    }

    return pm;
  } catch (error) {
    console.error('Error in createPM:', error);
    return null;
  }
};

// Get PM by work order ID
export const getPMByWorkOrderId = async (workOrderId: string): Promise<PreventativeMaintenance | null> => {
  try {
    const { data, error } = await supabase
      .from('preventative_maintenance')
      .select('*')
      .eq('work_order_id', workOrderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching PM:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getPMByWorkOrderId:', error);
    return null;
  }
};

// Update PM record
export const updatePM = async (pmId: string, data: UpdatePMData): Promise<PreventativeMaintenance | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const updateData: any = {
      checklist_data: data.checklistData,
      notes: data.notes,
    };

    if (data.status) {
      updateData.status = data.status;
      
      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = userData.user.id;
      }
    }

    const { data: pm, error } = await supabase
      .from('preventative_maintenance')
      .update(updateData)
      .eq('id', pmId)
      .select()
      .single();

    if (error) {
      console.error('Error updating PM:', error);
      return null;
    }

    return pm;
  } catch (error) {
    console.error('Error in updatePM:', error);
    return null;
  }
};

// Get latest completed PM for equipment
export const getLatestCompletedPM = async (equipmentId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_completed_pm', { equipment_uuid: equipmentId });

    if (error) {
      console.error('Error fetching latest PM:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getLatestCompletedPM:', error);
    return null;
  }
};

// Delete PM record
export const deletePM = async (pmId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('preventative_maintenance')
      .delete()
      .eq('id', pmId);

    if (error) {
      console.error('Error deleting PM:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePM:', error);
    return false;
  }
};

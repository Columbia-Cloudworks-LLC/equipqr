
import { supabase } from '@/integrations/supabase/client';
import { Equipment, CreateEquipmentData, UpdateEquipmentData } from '@/types/equipment';

export const createEquipment = async (data: CreateEquipmentData): Promise<Equipment> => {
  const { data: equipment, error } = await supabase
    .from('equipment')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return equipment;
};

export const updateEquipment = async (id: string, data: UpdateEquipmentData): Promise<Equipment> => {
  const { data: equipment, error } = await supabase
    .from('equipment')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return equipment;
};

export const getEquipment = async (id: string): Promise<Equipment> => {
  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return equipment;
};

export const deleteEquipment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

import { logger } from '../utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface OptimizedEquipmentNote {
  id: string;
  content: string;
  equipment_id: string;
  author_id: string;
  author_name?: string;
  is_private: boolean;
  hours_worked: number;
  created_at: string;
  updated_at: string;
  last_modified_at: string;
  last_modified_by: string;
}

// Get equipment notes using idx_equipment_notes_equipment_created
export const getEquipmentNotesOptimized = async (equipmentId: string): Promise<OptimizedEquipmentNote[]> => {
  try {
    const { data, error } = await supabase
      .from('equipment_notes')
      .select(`
        *,
        profiles!equipment_notes_author_id_fkey (
          name
        )
      `)
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(note => ({
      id: note.id,
      content: note.content,
      equipment_id: note.equipment_id,
      author_id: note.author_id,
      author_name: note.profiles?.name,
      is_private: note.is_private,
      hours_worked: note.hours_worked || 0,
      created_at: note.created_at,
      updated_at: note.updated_at,
      last_modified_at: note.last_modified_at,
      last_modified_by: note.last_modified_by
    }));
  } catch (error) {
    logger.error('Error fetching equipment notes:', error);
    return [];
  }
};

// Get user's private notes using idx_equipment_notes_equipment_author
export const getUserEquipmentNotes = async (equipmentId: string, userId: string): Promise<OptimizedEquipmentNote[]> => {
  try {
    const { data, error } = await supabase
      .from('equipment_notes')
      .select(`
        *,
        profiles!equipment_notes_author_id_fkey (
          name
        )
      `)
      .eq('equipment_id', equipmentId)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(note => ({
      id: note.id,
      content: note.content,
      equipment_id: note.equipment_id,
      author_id: note.author_id,
      author_name: note.profiles?.name,
      is_private: note.is_private,
      hours_worked: note.hours_worked || 0,
      created_at: note.created_at,
      updated_at: note.updated_at,
      last_modified_at: note.last_modified_at,
      last_modified_by: note.last_modified_by
    }));
  } catch (error) {
    logger.error('Error fetching user equipment notes:', error);
    return [];
  }
};

// Get recent notes across organization using equipment organization index
export const getRecentOrganizationNotes = async (organizationId: string, limit: number = 50): Promise<OptimizedEquipmentNote[]> => {
  try {
    const { data, error } = await supabase
      .from('equipment_notes')
      .select(`
        *,
        profiles!equipment_notes_author_id_fkey (
          name
        ),
        equipment!inner (
          id,
          name,
          organization_id
        )
      `)
      .eq('equipment.organization_id', organizationId)
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(note => ({
      id: note.id,
      content: note.content,
      equipment_id: note.equipment_id,
      author_id: note.author_id,
      author_name: note.profiles?.name,
      is_private: note.is_private,
      hours_worked: note.hours_worked || 0,
      created_at: note.created_at,
      updated_at: note.updated_at,
      last_modified_at: note.last_modified_at,
      last_modified_by: note.last_modified_by
    }));
  } catch (error) {
    logger.error('Error fetching recent organization notes:', error);
    return [];
  }
};
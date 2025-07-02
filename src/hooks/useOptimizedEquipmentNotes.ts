import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentNotesOptimized, getUserEquipmentNotes, getRecentOrganizationNotes } from '@/services/optimizedEquipmentNotesService';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedEquipmentNotes = (equipmentId: string) => {
  return useQuery({
    queryKey: ['equipment-notes-optimized', equipmentId],
    queryFn: () => getEquipmentNotesOptimized(equipmentId),
    enabled: !!equipmentId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useOptimizedUserEquipmentNotes = (equipmentId: string, userId: string) => {
  return useQuery({
    queryKey: ['user-equipment-notes-optimized', equipmentId, userId],
    queryFn: () => getUserEquipmentNotes(equipmentId, userId),
    enabled: !!equipmentId && !!userId,
    staleTime: 30 * 1000,
  });
};

export const useOptimizedRecentOrganizationNotes = (organizationId: string, limit?: number) => {
  return useQuery({
    queryKey: ['recent-org-notes-optimized', organizationId, limit],
    queryFn: () => getRecentOrganizationNotes(organizationId, limit),
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useCreateEquipmentNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: {
      equipment_id: string;
      content: string;
      is_private?: boolean;
      hours_worked?: number;
    }) => {
      const { data, error } = await supabase
        .from('equipment_notes')
        .insert([{
          ...noteData,
          author_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['equipment-notes-optimized', data.equipment_id] });
      queryClient.invalidateQueries({ queryKey: ['user-equipment-notes-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['recent-org-notes-optimized'] });
    },
  });
};
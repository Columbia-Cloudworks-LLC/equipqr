import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getEquipmentWorkingHoursHistory, 
  getEquipmentCurrentWorkingHours,
  updateEquipmentWorkingHours,
  UpdateWorkingHoursData
} from '@/services/equipmentWorkingHoursService';
import { toast } from 'sonner';

export const useEquipmentWorkingHoursHistory = (equipmentId: string) => {
  return useQuery({
    queryKey: ['equipment-working-hours-history', equipmentId],
    queryFn: () => getEquipmentWorkingHoursHistory(equipmentId),
    enabled: !!equipmentId,
  });
};

export const useEquipmentCurrentWorkingHours = (equipmentId: string) => {
  return useQuery({
    queryKey: ['equipment-current-working-hours', equipmentId],
    queryFn: () => getEquipmentCurrentWorkingHours(equipmentId),
    enabled: !!equipmentId,
  });
};

export const useUpdateEquipmentWorkingHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEquipmentWorkingHours,
    onSuccess: (_, variables) => {
      toast.success('Equipment working hours updated successfully');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['equipment-working-hours-history', variables.equipmentId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['equipment-current-working-hours', variables.equipmentId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['equipment', variables.equipmentId] 
      });
    },
    onError: (error) => {
      console.error('Error updating working hours:', error);
      toast.error('Failed to update equipment working hours');
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getEquipmentWorkingHoursHistory, 
  getEquipmentCurrentWorkingHours,
  updateEquipmentWorkingHours,
  UpdateWorkingHoursData
} from '@/services/equipmentWorkingHoursService';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';

export const useEquipmentWorkingHoursHistory = (
  equipmentId: string, 
  page: number = 1, 
  pageSize: number = 10
) => {
  return useQuery({
    queryKey: queryKeys.equipment.workingHoursHistory(equipmentId, page, pageSize),
    queryFn: () => getEquipmentWorkingHoursHistory(equipmentId, page, pageSize),
    enabled: !!equipmentId,
  });
};

export const useEquipmentCurrentWorkingHours = (equipmentId: string) => {
  return useQuery({
    queryKey: queryKeys.equipment.currentWorkingHours(equipmentId),
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
        queryKey: queryKeys.equipment.currentWorkingHours(variables.equipmentId)
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.equipment.root
      });
    },
    onError: (error) => {
      console.error('Error updating working hours:', error);
      toast.error('Failed to update equipment working hours');
    },
  });
};
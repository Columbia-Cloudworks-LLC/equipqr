
import { Equipment } from '@/types';

export function useEquipmentDataProcessor() {
  const processFormData = (formData: Partial<Equipment>) => {
    // Process team_id - ensure it's handled correctly (null vs empty string)
    const processedData = {
      ...formData,
      team_id: formData.team_id === 'none' ? null : formData.team_id
    };
    
    return processedData;
  };

  return { processFormData };
}

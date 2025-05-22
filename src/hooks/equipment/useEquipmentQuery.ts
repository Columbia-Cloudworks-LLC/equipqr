
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';

interface UseEquipmentQueryProps {
  id?: string;
  isEditMode: boolean;
}

export function useEquipmentQuery({ id, isEditMode }: UseEquipmentQueryProps) {
  const [retryCount, setRetryCount] = useState(0);

  // Fetch equipment data if in edit mode
  const { 
    data: equipment, 
    isLoading: isFetchingEquipment, 
    error: equipmentError,
    refetch: refetchEquipment
  } = useQuery({
    queryKey: ['equipment', id, retryCount],
    queryFn: () => getEquipmentById(id as string),
    enabled: isEditMode && !!id,
    retry: 1, // Limit auto-retries to avoid excessive loading
  });

  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
    if (isEditMode) {
      refetchEquipment();
    }
  };

  return {
    equipment,
    equipmentError,
    isFetchingEquipment,
    handleRetry
  };
}

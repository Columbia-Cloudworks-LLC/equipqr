
import { useParams } from 'react-router-dom';
import { Equipment } from '@/types';
import { useEquipmentQuery } from './useEquipmentQuery';
import { useEquipmentMutations } from './useEquipmentMutations';
import { useEquipmentDataProcessor } from './useEquipmentDataProcessor';
import { useDiagnostics } from './useDiagnostics';

export function useEquipmentFormData(redirectToLogin: (message: string) => void) {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // Use our refactored hooks
  const { equipment, equipmentError, isFetchingEquipment, handleRetry } = 
    useEquipmentQuery({ id, isEditMode });
  
  const { createMutation, updateMutation } = 
    useEquipmentMutations({ redirectToLogin });
  
  const { processFormData } = useEquipmentDataProcessor();
  
  const { runDiagnostics } = useDiagnostics();

  const handleSave = (formData: Partial<Equipment>) => {
    const processedData = processFormData(formData);

    if (isEditMode && id) {
      updateMutation.mutate({ id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  // Call diagnostics when there's an error
  if (equipmentError) {
    runDiagnostics();
  }

  const isLoading = isFetchingEquipment || 
    createMutation.isPending || 
    updateMutation.isPending;

  return {
    equipment,
    equipmentError,
    isLoading,
    isEditMode,
    handleSave,
    handleRetry
  };
}

import { useOrganization } from '@/contexts/OrganizationContext';
import { useSyncEquipmentByOrganization, useSyncEquipmentById } from '@/services/syncDataService';
import { EnhancedWorkOrder } from '@/services/workOrderDataService';

interface UseEquipmentSelectionProps {
  equipmentId?: string;
  workOrder?: EnhancedWorkOrder;
}

export const useEquipmentSelection = ({ equipmentId, workOrder }: UseEquipmentSelectionProps) => {
  const { currentOrganization } = useOrganization();
  
  const { data: allEquipment = [] } = useSyncEquipmentByOrganization(currentOrganization?.id);
  const { data: preSelectedEquipment } = useSyncEquipmentById(
    currentOrganization?.id || '', 
    equipmentId || workOrder?.equipment_id || ''
  );

  const isEquipmentPreSelected = !!preSelectedEquipment || !!workOrder;

  return {
    allEquipment,
    preSelectedEquipment,
    isEquipmentPreSelected,
  };
};
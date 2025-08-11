import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useSyncWorkOrderById, useSyncEquipmentById } from '@/services/syncDataService';
import { usePMByWorkOrderId } from '@/hooks/usePMData';
import { useWorkOrderPermissionLevels } from '@/hooks/useWorkOrderPermissionLevels';

export const useWorkOrderDetailsData = (workOrderId: string) => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  // Use sync hooks for data
  const { data: workOrder, isLoading: workOrderLoading } = useSyncWorkOrderById(
    currentOrganization?.id || '', 
    workOrderId || ''
  );
  
  const { data: equipment } = useSyncEquipmentById(
    currentOrganization?.id || '', 
    workOrder?.equipment_id || ''
  );

  // Fetch PM data if work order has PM enabled
  const { data: pmData, isLoading: pmLoading } = usePMByWorkOrderId(workOrderId || '');

  const permissionLevels = useWorkOrderPermissionLevels();

  // Calculate derived state
  const createdByCurrentUser = workOrder?.created_by === user?.id;
  const formMode = workOrder ? permissionLevels.getFormMode(workOrder as any, createdByCurrentUser) : 'viewer';
  const isWorkOrderLocked = workOrder?.status === 'completed' || workOrder?.status === 'cancelled';
  
  // Calculate permissions
  const canAddCosts = permissionLevels.isManager || permissionLevels.isTechnician;
  const canEditCosts = permissionLevels.isManager;
  const baseCanAddNotes = permissionLevels.isManager || createdByCurrentUser;
  const baseCanUpload = permissionLevels.isManager || createdByCurrentUser;
  const canAddNotes = baseCanAddNotes && !isWorkOrderLocked;
  const canUpload = baseCanUpload && !isWorkOrderLocked;
  const canEdit = formMode === 'manager' || (formMode === 'requestor' && createdByCurrentUser);

  return {
    workOrder,
    equipment,
    pmData,
    workOrderLoading,
    pmLoading,
    permissionLevels,
    formMode,
    isWorkOrderLocked,
    canAddCosts: canAddCosts && !isWorkOrderLocked,
    canEditCosts: canEditCosts && !isWorkOrderLocked,
    canAddNotes,
    canUpload,
    canEdit,
    baseCanAddNotes,
    createdByCurrentUser,
    currentOrganization
  };
};
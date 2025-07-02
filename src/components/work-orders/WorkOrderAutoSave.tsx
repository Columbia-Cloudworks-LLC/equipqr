import React from 'react';
import { useSmartAutoSave } from '@/hooks/useSmartAutoSave';
import { AutoSaveIndicator } from '@/components/common/AutoSaveIndicator';

interface WorkOrderData {
  notes: string;
  costs: any[];
  images: any[];
}

interface WorkOrderAutoSaveProps {
  workOrderId: string;
  data: WorkOrderData;
  onSave: (data: WorkOrderData) => Promise<void>;
  enabled?: boolean;
  className?: string;
}

export const WorkOrderAutoSave: React.FC<WorkOrderAutoSaveProps> = ({
  workOrderId,
  data,
  onSave,
  enabled = true,
  className
}) => {
  const {
    triggerTextSave,
    triggerSelectionSave,
    triggerManualSave,
    status,
    lastSaved,
    hasChanges
  } = useSmartAutoSave({
    data,
    onSave,
    storageKey: `work-order-${workOrderId}`,
    enabled
  });

  // Methods available for parent components to use
  const autoSaveMethods = {
    triggerTextSave,
    triggerSelectionSave,
    triggerManualSave
  };

  return (
    <AutoSaveIndicator
      status={status}
      lastSaved={lastSaved}
      hasChanges={hasChanges}
      className={className}
    />
  );
};
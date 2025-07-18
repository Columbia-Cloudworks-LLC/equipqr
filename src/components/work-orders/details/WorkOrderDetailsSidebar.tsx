
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedWorkOrderStatusManagerWithPM from '@/components/work-orders/EnhancedWorkOrderStatusManagerWithPM';
import { WorkOrderDetailsQuickInfo } from './WorkOrderDetailsQuickInfo';
import { WorkOrderDetailsRequestorStatus } from './WorkOrderDetailsRequestorStatus';

interface WorkOrderDetailsSidebarProps {
  workOrder: any;
  equipment: any;
  pmData: any;
  formMode: string;
  permissionLevels: any;
  currentOrganization: any;
  showMobileSidebar: boolean;
  onCloseMobileSidebar: () => void;
}

export const WorkOrderDetailsSidebar: React.FC<WorkOrderDetailsSidebarProps> = ({
  workOrder,
  equipment,
  pmData,
  formMode,
  permissionLevels,
  currentOrganization,
  showMobileSidebar,
  onCloseMobileSidebar
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`
      ${isMobile ? (
        showMobileSidebar 
          ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' 
          : 'hidden'
      ) : 'space-y-6'}
    `}>
      {isMobile && showMobileSidebar && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Work Order Info</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onCloseMobileSidebar}
          >
            ✕
          </Button>
        </div>
      )}

      <div className="space-y-4 lg:space-y-6">
        {/* Enhanced Status Management with Assignment - Only managers can change status */}
        {permissionLevels.isManager && (
          <EnhancedWorkOrderStatusManagerWithPM 
            workOrder={workOrder} 
            organizationId={currentOrganization.id}
          />
        )}

        {/* Status Info for Requestors - now includes assignee info */}
        <WorkOrderDetailsRequestorStatus 
          workOrder={workOrder}
          permissionLevels={permissionLevels}
        />

        {/* Quick Info */}
        <WorkOrderDetailsQuickInfo 
          workOrder={workOrder}
          equipment={equipment}
          formMode={formMode}
          permissionLevels={permissionLevels}
          pmData={pmData}
        />
      </div>
    </div>
  );
};

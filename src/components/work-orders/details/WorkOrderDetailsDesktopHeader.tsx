import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Shield, Clipboard } from 'lucide-react';
import { getPriorityColor, getStatusColor, formatStatus } from '@/utils/workOrderHelpers';
import { WorkOrderData, PermissionLevels } from '@/types/workOrderDetails';

interface WorkOrderDetailsDesktopHeaderProps {
  workOrder: WorkOrderData;
  formMode: string;
  permissionLevels: PermissionLevels;
  canEdit: boolean;
  onEditClick: () => void;
}

export const WorkOrderDetailsDesktopHeader: React.FC<WorkOrderDetailsDesktopHeaderProps> = ({
  workOrder,
  formMode,
  permissionLevels,
  canEdit,
  onEditClick
}) => {
  return (
    <div className="hidden lg:block space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/work-orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Orders
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{workOrder.title}</h1>
              {workOrder.has_pm && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Clipboard className="h-3 w-3 mr-1" />
                  PM Required
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <p>Work Order #{workOrder.id}</p>
              {formMode === 'requestor' && !permissionLevels.isManager && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Limited Access
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(workOrder.priority)}>
            {workOrder.priority} priority
          </Badge>
          <Badge className={getStatusColor(workOrder.status)}>
            {formatStatus(workOrder.status)}
          </Badge>
          {canEdit && (
            <Button variant="outline" onClick={onEditClick}>
              <Edit className="h-4 w-4 mr-2" />
              {formMode === 'requestor' ? 'Edit Request' : 'Edit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
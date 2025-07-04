import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { getStatusColor, formatStatus } from '@/utils/workOrderHelpers';

interface WorkOrderDetailsRequestorStatusProps {
  workOrder: any;
  permissionLevels: any;
}

export const WorkOrderDetailsRequestorStatus: React.FC<WorkOrderDetailsRequestorStatusProps> = ({
  workOrder,
  permissionLevels
}) => {
  if (!permissionLevels.isRequestor || permissionLevels.isManager) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Request Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge className={getStatusColor(workOrder.status)}>
              {formatStatus(workOrder.status)}
            </Badge>
          </div>
          {workOrder.status === 'submitted' && (
            <p className="text-sm text-muted-foreground">
              Your request is awaiting review by a manager.
            </p>
          )}
          {workOrder.status === 'accepted' && (
            <p className="text-sm text-muted-foreground">
              Your request has been approved and is being scheduled.
            </p>
          )}
          {workOrder.status === 'assigned' && (
            <p className="text-sm text-muted-foreground">
              Work has been assigned to a team member.
            </p>
          )}
          {workOrder.status === 'in_progress' && (
            <p className="text-sm text-muted-foreground">
              Work is currently in progress.
            </p>
          )}
          {workOrder.status === 'completed' && (
            <p className="text-sm text-green-600">
              Work has been completed successfully.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
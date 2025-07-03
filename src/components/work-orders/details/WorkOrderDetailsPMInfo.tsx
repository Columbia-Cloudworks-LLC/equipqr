import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clipboard } from 'lucide-react';

interface WorkOrderDetailsPMInfoProps {
  workOrder: any;
  pmData: any;
  permissionLevels: any;
}

export const WorkOrderDetailsPMInfo: React.FC<WorkOrderDetailsPMInfoProps> = ({
  workOrder,
  pmData,
  permissionLevels
}) => {
  if (!workOrder.has_pm || !permissionLevels.isRequestor || permissionLevels.isManager || !pmData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clipboard className="h-5 w-5" />
          Preventative Maintenance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">PM Status:</span>
            <Badge className={
              pmData.status === 'completed' ? 'bg-green-100 text-green-800' :
              pmData.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {pmData.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            This work order includes preventative maintenance tasks that will be completed by the assigned technician.
          </p>
          {pmData.status === 'completed' && pmData.completed_at && (
            <p className="text-sm text-green-600">
              PM completed on {new Date(pmData.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface WorkOrderDetailsStatusLockWarningProps {
  workOrder: any;
  isWorkOrderLocked: boolean;
  baseCanAddNotes: boolean;
}

export const WorkOrderDetailsStatusLockWarning: React.FC<WorkOrderDetailsStatusLockWarningProps> = ({
  workOrder,
  isWorkOrderLocked,
  baseCanAddNotes
}) => {
  if (!isWorkOrderLocked || !baseCanAddNotes) return null;

  return (
    <div className="px-4 lg:px-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              This work order is {workOrder.status}. Notes, images, and costs cannot be added or modified.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { Wrench, FileText } from 'lucide-react';
import { WorkOrder, Equipment } from '@/services/supabaseDataService';

interface WorkOrderDetailsInfoProps {
  workOrder: WorkOrder;
  equipment: Equipment | null;
}

const WorkOrderDetailsInfo: React.FC<WorkOrderDetailsInfoProps> = ({
  workOrder,
  equipment,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Work Order Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-muted-foreground leading-relaxed">
            {workOrder.description}
          </p>
        </div>

        <Separator />

        {/* Equipment Information */}
        {equipment && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Equipment Information
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Link 
                  to={`/equipment/${equipment.id}`}
                  className="text-lg font-medium text-primary hover:underline"
                >
                  {equipment.name}
                </Link>
                <Badge variant="outline" className={
                  equipment.status === 'active' ? 'border-green-200 text-green-800' :
                  equipment.status === 'maintenance' ? 'border-yellow-200 text-yellow-800' :
                  'border-red-200 text-red-800'
                }>
                  {equipment.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Manufacturer:</span>
                  <span className="ml-2 text-muted-foreground">{equipment.manufacturer}</span>
                </div>
                <div>
                  <span className="font-medium">Model:</span>
                  <span className="ml-2 text-muted-foreground">{equipment.model}</span>
                </div>
                <div>
                  <span className="font-medium">Serial Number:</span>
                  <span className="ml-2 text-muted-foreground">{equipment.serial_number}</span>
                </div>
                <div>
                  <span className="font-medium">Location:</span>
                  <span className="ml-2 text-muted-foreground">{equipment.location}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {workOrder.completed_date && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Completion Details</h3>
              <p className="text-sm text-muted-foreground">
                Completed on {new Date(workOrder.completed_date).toLocaleDateString()} at{' '}
                {new Date(workOrder.completed_date).toLocaleTimeString()}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkOrderDetailsInfo;

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Users, Wrench, Clipboard } from 'lucide-react';

interface WorkOrderDetailsQuickInfoProps {
  workOrder: any;
  equipment: any;
  formMode: string;
  permissionLevels: any;
  pmData: any;
}

export const WorkOrderDetailsQuickInfo: React.FC<WorkOrderDetailsQuickInfoProps> = ({
  workOrder,
  equipment,
  formMode,
  permissionLevels,
  pmData
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">Created</div>
            <div className="text-muted-foreground">
              {new Date(workOrder.created_date).toLocaleDateString()}
            </div>
          </div>
        </div>

        {workOrder.due_date && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {formMode === 'requestor' && workOrder.status === 'submitted' ? 'Preferred Due Date' : 'Due Date'}
              </div>
              <div className="text-muted-foreground">
                {new Date(workOrder.due_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Only show assignment info to managers or if assigned to user */}
        {(permissionLevels.isManager || workOrder.assigneeName) && workOrder.assigneeName && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Assigned to</div>
              <div className="text-muted-foreground">{workOrder.assigneeName}</div>
            </div>
          </div>
        )}

        {(permissionLevels.isManager || workOrder.teamName) && workOrder.teamName && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Team</div>
              <div className="text-muted-foreground">{workOrder.teamName}</div>
            </div>
          </div>
        )}

        {permissionLevels.isManager && workOrder.estimated_hours && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Estimated Hours</div>
              <div className="text-muted-foreground">{workOrder.estimated_hours}h</div>
            </div>
          </div>
        )}

        {/* PM Status in Quick Info */}
        {workOrder.has_pm && pmData && (
          <div className="flex items-center gap-2 text-sm">
            <Clipboard className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">PM Status</div>
              <div className="text-muted-foreground">
                {pmData.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {equipment && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Equipment</div>
                <Link 
                  to={`/equipment/${equipment.id}`}
                  className="text-primary hover:underline"
                >
                  {equipment.name}
                </Link>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
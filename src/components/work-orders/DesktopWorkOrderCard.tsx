import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Users, UserX } from 'lucide-react';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { WorkOrder } from '@/services/syncDataService';
import WorkOrderCostSubtotal from './WorkOrderCostSubtotal';
import PMProgressIndicator from './PMProgressIndicator';
import { WorkOrderQuickActions } from './WorkOrderQuickActions';
import { WorkOrderAssignmentHover } from './WorkOrderAssignmentHover';
import { PRIORITY_COLORS, STATUS_COLORS } from '@/utils/badgeConstants';
import { formatStatus } from '@/utils/formatHelpers';

interface ExtendedWorkOrder extends WorkOrder {
  created_date: string;
  due_date?: string;
  estimated_hours?: number;
  completed_date?: string;
  has_pm?: boolean;
}

interface DesktopWorkOrderCardProps {
  workOrder: ExtendedWorkOrder;
  onNavigate: (id: string) => void;
  onAssignClick?: () => void;
  onReopenClick?: () => void;
}

function DesktopWorkOrderCard({ 
  workOrder, 
  onNavigate,
  onAssignClick,
  onReopenClick
}: DesktopWorkOrderCardProps) {
  const permissions = useUnifiedPermissions();

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.default;
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{workOrder.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {workOrder.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(workOrder.priority)}>
              {workOrder.priority} priority
            </Badge>
            <Badge className={getStatusColor(workOrder.status)}>
              {formatStatus(workOrder.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Created</div>
              <div className="text-muted-foreground">
                {new Date(workOrder.created_date).toLocaleDateString()}
              </div>
            </div>
          </div>

          {workOrder.due_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Due Date</div>
                <div className="text-muted-foreground">
                  {new Date(workOrder.due_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Equipment Team - Static Display */}
          {(workOrder as any).equipmentTeamName && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Equipment Team</div>
                <div className="text-muted-foreground">{(workOrder as any).equipmentTeamName}</div>
              </div>
            </div>
          )}

          {/* Assigned User - Interactive */}
          <WorkOrderAssignmentHover 
            workOrder={workOrder}
            disabled={!permissions.workOrders.getDetailedPermissions(workOrder as any).canEditAssignment}
          >
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors">
              {workOrder.assigneeName ? (
                <>
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Assigned to</div>
                    <div className="text-muted-foreground">{workOrder.assigneeName}</div>
                  </div>
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Assigned to</div>
                    <div className="text-muted-foreground">Unassigned</div>
                  </div>
                </>
              )}
            </div>
          </WorkOrderAssignmentHover>
        </div>

        {/* PM Progress Indicator */}
        {workOrder.has_pm && (
          <div className="mt-4 pt-4 border-t">
            <PMProgressIndicator 
              workOrderId={workOrder.id} 
              hasPM={workOrder.has_pm} 
            />
          </div>
        )}

        {/* Estimated Hours and Completion */}
        {workOrder.estimated_hours && (
          <div className={`mt-4 ${workOrder.has_pm ? '' : 'pt-4 border-t'}`}>
            <div className="text-sm">
              <span className="font-medium">Estimated time:</span> {workOrder.estimated_hours} hours
              {workOrder.completed_date && (
                <span className="ml-4">
                  <span className="font-medium">Completed:</span> {new Date(workOrder.completed_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer with Cost and Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            {/* Cost Display - Only for team managers and org admins */}
            {permissions.workOrders.getDetailedPermissions(workOrder as any).canEdit && (
              <WorkOrderCostSubtotal 
                workOrderId={workOrder.id}
                className="text-sm"
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <WorkOrderQuickActions
              workOrder={workOrder}
              onAssignClick={onAssignClick}
              onReopenClick={onReopenClick}
              showInline
              hideReassign
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate(workOrder.id)}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DesktopWorkOrderCard;
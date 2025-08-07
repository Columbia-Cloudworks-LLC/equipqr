import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, DollarSign, UserPlus, Users, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkOrderCostSubtotal from './WorkOrderCostSubtotal';
import { EnhancedWorkOrder } from '@/services/workOrdersEnhancedService';
import { useQuickWorkOrderAssignment } from '@/hooks/useQuickWorkOrderAssignment';
import { useWorkOrderStatusUpdate } from '@/hooks/useWorkOrderStatusUpdate';
import { supabase } from '@/integrations/supabase/client';
import { WorkOrderQuickActions } from './WorkOrderQuickActions';
import { WorkOrderAssignmentHover } from './WorkOrderAssignmentHover';

interface MobileWorkOrderCardProps {
  order: EnhancedWorkOrder;
  onAcceptClick: (order: EnhancedWorkOrder) => void;
  onStatusUpdate: (workOrderId: string, newStatus: string) => void;
  isUpdating: boolean;
  isAccepting: boolean;
  onAssignClick?: () => void;
  onReopenClick?: () => void;
}

const MobileWorkOrderCard: React.FC<MobileWorkOrderCardProps> = ({
  order,
  onAcceptClick,
  onStatusUpdate,
  isUpdating,
  isAccepting,
  onAssignClick,
  onReopenClick
}) => {
  const quickAssignMutation = useQuickWorkOrderAssignment();
  const statusUpdateMutation = useWorkOrderStatusUpdate();
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  const handleQuickAssignToMe = async () => {
    if (!currentUser) return;
    await quickAssignMutation.mutateAsync({
      workOrderId: order.id,
      assigneeId: currentUser.id,
      organizationId: order.organizationId
    });
  };

  const handleStatusUpdate = (newStatus: string) => {
    statusUpdateMutation.mutate({
      workOrderId: order.id,
      newStatus
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'assigned':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          {/* Title and Equipment */}
          <div>
            <CardTitle className="text-base leading-tight">{order.title}</CardTitle>
            {order.equipmentName && (
              <p className="text-sm text-muted-foreground mt-1">
                Equipment: {order.equipmentName}
              </p>
            )}
          </div>

          {/* Badges - Side by side on mobile */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={getPriorityColor(order.priority)} variant="outline">
              {order.priority}
            </Badge>
            <Badge className={getStatusColor(order.status)} variant="outline">
              {formatStatusText(order.status)}
            </Badge>
          </div>

          {/* Description */}
          <CardDescription className="text-sm line-clamp-2">
            {order.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Key Information - Stacked vertically */}
          <div className="space-y-2 text-sm">
            {/* Equipment Team - Static Display */}
            {(order as any).equipmentTeamName && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Team: {(order as any).equipmentTeamName}</span>
              </div>
            )}

            {/* Assigned User - Interactive */}
            <WorkOrderAssignmentHover 
              workOrder={{
                ...order,
                equipment_id: order.equipmentId || '',
                organization_id: order.organizationId || ''
              }}
              disabled={false}
            >
              <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors">
                {order.assigneeName ? (
                  <>
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Assigned: {order.assigneeName}</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Unassigned</span>
                  </>
                )}
              </div>
            </WorkOrderAssignmentHover>

            {/* Date Info */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                Created: {formatDate(order.createdDate)}
                {order.dueDate && ` • Due: ${formatDate(order.dueDate)}`}
              </span>
            </div>

            {/* Time and Cost Info */}
            <div className="flex items-center justify-between">
              {order.estimatedHours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{order.estimatedHours}h est.</span>
                </div>
              )}
              <WorkOrderCostSubtotal 
                workOrderId={order.id}
                className="flex-shrink-0"
              />
            </div>

            {/* Creator Info */}
            {order.createdByName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-xs">
                  Created by: {order.createdByName}
                </span>
              </div>
            )}

            {/* Completion Date */}
            {order.completedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-xs">
                  Completed: {formatDate(order.completedDate)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons - Full width and stacked */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1 justify-center">
                <Link to={`/work-orders/${order.id}`}>
                  View Details
                </Link>
              </Button>
              <WorkOrderQuickActions
                workOrder={order}
                onAssignClick={onAssignClick}
                onReopenClick={onReopenClick}
                hideReassign
              />
            </div>

            <div className="flex gap-2">
              {order.status === 'submitted' && !order.assigneeName && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleQuickAssignToMe}
                  disabled={quickAssignMutation.isPending || !currentUser}
                  className="flex-1"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Assign to Me
                </Button>
              )}
              {order.status === 'submitted' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAcceptClick(order)}
                  disabled={isAccepting}
                  className="flex-1"
                >
                  Accept
                </Button>
              )}
              {order.status === 'assigned' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={statusUpdateMutation.isPending}
                  className="flex-1"
                >
                  Start Work
                </Button>
              )}
              {order.status === 'in_progress' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={statusUpdateMutation.isPending}
                  className="flex-1"
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileWorkOrderCard;

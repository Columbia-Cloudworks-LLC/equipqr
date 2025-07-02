
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Wrench, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkOrderCostSubtotal from './WorkOrderCostSubtotal';
import { EnhancedWorkOrder } from '@/services/workOrdersEnhancedService';

interface DesktopWorkOrderCardProps {
  order: EnhancedWorkOrder;
  onAcceptClick: (order: EnhancedWorkOrder) => void;
  onStatusUpdate: (workOrderId: string, newStatus: string) => void;
  isUpdating: boolean;
  isAccepting: boolean;
}

const DesktopWorkOrderCard: React.FC<DesktopWorkOrderCardProps> = ({
  order,
  onAcceptClick,
  onStatusUpdate,
  isUpdating,
  isAccepting
}) => {
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
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{order.title}</CardTitle>
              {order.equipmentName && (
                <span className="text-sm text-muted-foreground">
                  • {order.equipmentName}
                </span>
              )}
            </div>
            <CardDescription className="line-clamp-2">{order.description}</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={getPriorityColor(order.priority)}>
              {order.priority}
            </Badge>
            <Badge className={getStatusColor(order.status)}>
              {formatStatusText(order.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Assignee:</span>
              <span className="text-muted-foreground">
                {order.assigneeName || 'Unassigned'}
              </span>
            </div>
            {order.teamName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Team:</span>
                <span className="text-muted-foreground">{order.teamName}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Created:</span>
              <span className="text-muted-foreground">{formatDate(order.createdDate)}</span>
            </div>
            {order.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Due:</span>
                <span className="text-muted-foreground">{formatDate(order.dueDate)}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {order.estimatedHours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Est. Hours:</span>
                <span className="text-muted-foreground">{order.estimatedHours}h</span>
              </div>
            )}
            {order.completedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Completed:</span>
                <span className="text-muted-foreground">{formatDate(order.completedDate)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <WorkOrderCostSubtotal 
              workOrderId={order.id}
              className="justify-start"
            />
            {order.createdByName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Creator:</span>
                <span className="text-muted-foreground">{order.createdByName}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/work-orders/${order.id}`}>
              View Details
            </Link>
          </Button>
          {order.status === 'submitted' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAcceptClick(order)}
              disabled={isAccepting}
            >
              Accept Work Order
            </Button>
          )}
          {order.status === 'assigned' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onStatusUpdate(order.id, 'in_progress')}
              disabled={isUpdating}
            >
              Start Work
            </Button>
          )}
          {order.status === 'in_progress' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onStatusUpdate(order.id, 'completed')}
              disabled={isUpdating}
            >
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DesktopWorkOrderCard;

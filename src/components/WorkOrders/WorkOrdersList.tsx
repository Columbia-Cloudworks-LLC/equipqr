
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, User, Package } from 'lucide-react';
import { WorkOrder } from '@/types/workOrders';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';
import { format } from 'date-fns';

interface WorkOrdersListProps {
  workOrders: WorkOrder[];
  isLoading?: boolean;
  canViewHours?: boolean;
  showEquipmentName?: boolean;
}

export function WorkOrdersList({ 
  workOrders, 
  isLoading = false, 
  canViewHours = false,
  showEquipmentName = false
}: WorkOrdersListProps) {
  const navigate = useNavigate();

  const handleViewDetails = (workOrder: WorkOrder) => {
    navigate(`/work-orders/${workOrder.id}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading work orders...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (workOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No work orders found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {workOrders.map((workOrder) => (
        <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg">{workOrder.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(workOrder.submitted_at), 'MMM d, yyyy')}
                  </div>
                  {workOrder.submitted_by_name && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {workOrder.submitted_by_name}
                    </div>
                  )}
                  {showEquipmentName && workOrder.equipment_name && (
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {workOrder.equipment_name}
                    </div>
                  )}
                </div>
              </div>
              <WorkOrderStatusBadge status={workOrder.status} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {workOrder.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {workOrder.assigned_to_name && (
                  <Badge variant="outline">
                    Assigned to: {workOrder.assigned_to_name}
                  </Badge>
                )}
                {canViewHours && workOrder.estimated_hours && (
                  <Badge variant="secondary">
                    Est: {workOrder.estimated_hours}h
                  </Badge>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(workOrder)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

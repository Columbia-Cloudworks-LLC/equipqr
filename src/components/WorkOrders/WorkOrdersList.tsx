
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Package } from 'lucide-react';
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

  const handleCardClick = (workOrder: WorkOrder) => {
    navigate(`/work-orders/${workOrder.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, workOrder: WorkOrder) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(workOrder);
    }
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
        <Card 
          key={workOrder.id} 
          className="hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-accent/5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          onClick={() => handleCardClick(workOrder)}
          onKeyDown={(e) => handleKeyDown(e, workOrder)}
          tabIndex={0}
          role="button"
          aria-label={`View work order: ${workOrder.title}`}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-2 flex-1 min-w-0">
                <CardTitle className="text-lg leading-tight">{workOrder.title}</CardTitle>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{format(new Date(workOrder.submitted_at), 'MMM d, yyyy')}</span>
                  </div>
                  {workOrder.submitted_by_name && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{workOrder.submitted_by_name}</span>
                    </div>
                  )}
                  {showEquipmentName && workOrder.equipment_name && (
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{workOrder.equipment_name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <WorkOrderStatusBadge status={workOrder.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {workOrder.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-2">
              {workOrder.assigned_to_name && (
                <Badge variant="outline" className="text-xs">
                  Assigned to: {workOrder.assigned_to_name}
                </Badge>
              )}
              {canViewHours && workOrder.estimated_hours && (
                <Badge variant="secondary" className="text-xs">
                  Est: {workOrder.estimated_hours}h
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

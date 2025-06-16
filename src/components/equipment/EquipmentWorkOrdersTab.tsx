
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, User, Users } from 'lucide-react';
import { getWorkOrdersByEquipmentId, WorkOrder } from '@/services/dataService';

interface EquipmentWorkOrdersTabProps {
  equipmentId: string;
  organizationId: string;
}

const EquipmentWorkOrdersTab: React.FC<EquipmentWorkOrdersTabProps> = ({
  equipmentId,
  organizationId,
}) => {
  const workOrders = getWorkOrdersByEquipmentId(organizationId, equipmentId);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'submitted':
      case 'accepted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Work Orders</h3>
          <p className="text-sm text-muted-foreground">
            {workOrders.length} {workOrders.length === 1 ? 'work order' : 'work orders'}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Work Order
        </Button>
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {workOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No work orders</h3>
              <p className="text-muted-foreground mb-4">
                No work orders have been created for this equipment yet.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Work Order
              </Button>
            </CardContent>
          </Card>
        ) : (
          workOrders.map((workOrder) => (
            <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Created</div>
                      <div className="text-muted-foreground">
                        {new Date(workOrder.createdDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {workOrder.dueDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Due Date</div>
                        <div className="text-muted-foreground">
                          {new Date(workOrder.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {workOrder.assigneeName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Assigned to</div>
                        <div className="text-muted-foreground">{workOrder.assigneeName}</div>
                      </div>
                    </div>
                  )}

                  {workOrder.teamName && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Team</div>
                        <div className="text-muted-foreground">{workOrder.teamName}</div>
                      </div>
                    </div>
                  )}
                </div>

                {workOrder.estimatedHours && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <span className="font-medium">Estimated time:</span> {workOrder.estimatedHours} hours
                      {workOrder.completedDate && (
                        <span className="ml-4">
                          <span className="font-medium">Completed:</span> {new Date(workOrder.completedDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EquipmentWorkOrdersTab;

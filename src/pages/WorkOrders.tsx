
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { WorkOrdersList } from '@/components/WorkOrders/WorkOrdersList';
import { WorkOrderDetail } from '@/components/WorkOrders/WorkOrderDetail';
import { WorkOrder, UpdateWorkOrderParams } from '@/types/workOrders';
import { getAllUserWorkOrders, updateWorkOrder } from '@/services/workOrders/workOrderManagementService';
import { toast } from 'sonner';

export default function WorkOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const { data: workOrders = [], isLoading, refetch } = useQuery({
    queryKey: ['allWorkOrders', searchTerm, statusFilter],
    queryFn: () => getAllUserWorkOrders({ search: searchTerm, status: statusFilter })
  });

  const handleUpdateWorkOrder = async (id: string, updates: UpdateWorkOrderParams) => {
    try {
      await updateWorkOrder(id, updates);
      toast.success('Work order updated successfully');
      refetch();
      // Update the selected work order if it's the one being updated
      if (selectedWorkOrder?.id === id) {
        const updatedWorkOrder = workOrders.find(wo => wo.id === id);
        if (updatedWorkOrder) {
          setSelectedWorkOrder(updatedWorkOrder);
        }
      }
    } catch (error: any) {
      toast.error('Failed to update work order: ' + error.message);
    }
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = !searchTerm || 
      wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wo.equipment_name && wo.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search work orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Orders List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Work Orders ({filteredWorkOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkOrdersList
                workOrders={filteredWorkOrders}
                isLoading={isLoading}
                onViewDetails={setSelectedWorkOrder}
                canViewHours={true}
                showEquipmentName={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Work Order Detail */}
        <div className="lg:col-span-1">
          {selectedWorkOrder ? (
            <WorkOrderDetail
              workOrder={selectedWorkOrder}
              canManage={true} // TODO: Implement proper permission check
              onUpdate={handleUpdateWorkOrder}
              onClose={() => setSelectedWorkOrder(null)}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                Select a work order to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

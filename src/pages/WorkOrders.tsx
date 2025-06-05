
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { WorkOrdersList } from '@/components/WorkOrders/WorkOrdersList';
import { getAllUserWorkOrders } from '@/services/workOrders/workOrderManagementService';
import { toast } from 'sonner';
import Layout from '@/components/Layout/Layout';
import { useOrganization } from '@/contexts/OrganizationContext';

export default function WorkOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { selectedOrganization, isLoading: isOrgLoading } = useOrganization();

  const { data: workOrders = [], isLoading, refetch } = useQuery({
    queryKey: ['allWorkOrders', selectedOrganization?.id, searchTerm, statusFilter],
    queryFn: () => getAllUserWorkOrders({ 
      search: searchTerm, 
      status: statusFilter,
      organizationId: selectedOrganization?.id 
    }),
    enabled: !!selectedOrganization
  });

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = !searchTerm || 
      wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wo.equipment_name && wo.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isOrgLoading || !selectedOrganization) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
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

        {/* Work Orders List */}
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
              canViewHours={true}
              showEquipmentName={true}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Calendar, User, Wrench, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isToday, isThisWeek } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEnhancedWorkOrders } from '@/hooks/useEnhancedWorkOrders';
import { useUpdateWorkOrderStatus } from '@/hooks/useWorkOrderData';
import { useWorkOrderAcceptance } from '@/hooks/useWorkOrderAcceptance';
import { useBatchAssignUnassignedWorkOrders } from '@/hooks/useBatchAssignUnassignedWorkOrders';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';
import WorkOrderAcceptanceModal from '@/components/work-orders/WorkOrderAcceptanceModal';
import MobileWorkOrderCard from '@/components/work-orders/MobileWorkOrderCard';
import DesktopWorkOrderCard from '@/components/work-orders/DesktopWorkOrderCard';
import NotificationCenter from '@/components/notifications/NotificationCenter';

const WorkOrders = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [acceptanceModal, setAcceptanceModal] = useState<{ open: boolean; workOrder: any }>({
    open: false,
    workOrder: null
  });
  const { currentOrganization } = useOrganization();
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Use enhanced hook for work orders data
  const { data: allWorkOrders = [], isLoading } = useEnhancedWorkOrders(currentOrganization?.id);
  const updateStatusMutation = useUpdateWorkOrderStatus();
  const acceptanceMutation = useWorkOrderAcceptance();
  const batchAssignMutation = useBatchAssignUnassignedWorkOrders();

  // Check for unassigned work orders in single-user organization
  const unassignedCount = allWorkOrders.filter(order => 
    order.status === 'submitted' && !order.assigneeName && !order.teamName
  ).length;
  const isSingleUserOrg = currentOrganization?.memberCount === 1;

  const filteredWorkOrders = allWorkOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.assigneeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.teamName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'all' || 
                           (assigneeFilter === 'mine' && order.assigneeId === currentUser?.id) ||
                           order.assigneeId === assigneeFilter;
    const matchesTeam = teamFilter === 'all' || order.teamId === teamFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    const matchesDueDate = dueDateFilter === 'all' || 
                          (dueDateFilter === 'overdue' && order.dueDate && new Date(order.dueDate) < new Date()) ||
                          (dueDateFilter === 'today' && order.dueDate && isToday(new Date(order.dueDate))) ||
                          (dueDateFilter === 'this_week' && order.dueDate && isThisWeek(new Date(order.dueDate)));
    
    return matchesSearch && matchesStatus && matchesAssignee && matchesTeam && matchesPriority && matchesDueDate;
  });

  const handleStatusUpdate = async (workOrderId: string, newStatus: string) => {
    if (!currentOrganization) return;
    
    try {
      await updateStatusMutation.mutateAsync({
        workOrderId,
        status: newStatus,
        organizationId: currentOrganization.id
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAcceptClick = (workOrder: any) => {
    setAcceptanceModal({ open: true, workOrder });
  };

  const handleAcceptance = async (assigneeId?: string, teamId?: string) => {
    if (!currentOrganization || !acceptanceModal.workOrder) return;
    
    await acceptanceMutation.mutateAsync({
      workOrderId: acceptanceModal.workOrder.id,
      organizationId: currentOrganization.id,
      assigneeId,
      teamId
    });

    setAcceptanceModal({ open: false, workOrder: null });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Manage maintenance and repair work orders</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Work Order
        </Button>
      </div>

      {/* Auto-assignment banner for single-user organizations */}
      {isSingleUserOrg && unassignedCount > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  {unassignedCount} unassigned work order{unassignedCount !== 1 ? 's' : ''} found
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Since you're the only member, these can be automatically assigned to you.
                </p>
              </div>
              <Button
                onClick={() => currentOrganization && batchAssignMutation.mutate(currentOrganization.id)}
                disabled={batchAssignMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {batchAssignMutation.isPending ? 'Assigning...' : 'Assign All to Me'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
        {/* Main Content */}
        <div className={`space-y-6 ${isMobile ? '' : 'lg:col-span-3'}`}>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search work orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
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
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger>
                      <User className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="mine">My Work Orders</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                    <SelectTrigger>
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Due Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="today">Due Today</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setAssigneeFilter('all');
                      setTeamFilter('all');
                      setPriorityFilter('all');
                      setDueDateFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Orders List */}
          <div className="space-y-4">
            {filteredWorkOrders.map((order) => (
              isMobile ? (
                <MobileWorkOrderCard
                  key={order.id}
                  order={order}
                  onAcceptClick={handleAcceptClick}
                  onStatusUpdate={handleStatusUpdate}
                  isUpdating={updateStatusMutation.isPending}
                  isAccepting={acceptanceMutation.isPending}
                />
              ) : (
                <DesktopWorkOrderCard
                  key={order.id}
                  workOrder={order}
                  onNavigate={(id) => navigate(`/work-orders/${id}`)}
                />
              )
            ))}
          </div>

          {filteredWorkOrders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No work orders found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No work orders match your current filters.' 
                    : 'Get started by creating your first work order.'}
                </p>
                {(!searchQuery && statusFilter === 'all') && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Work Order
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notifications Sidebar - Only show on desktop */}
        {!isMobile && (
          <div className="lg:col-span-1">
            {currentOrganization && (
              <NotificationCenter organizationId={currentOrganization.id} />
            )}
          </div>
        )}
      </div>

      {/* Work Order Form Modal */}
      <WorkOrderForm 
        open={showForm} 
        onClose={() => setShowForm(false)} 
      />

      {/* Work Order Acceptance Modal */}
      {currentOrganization && (
        <WorkOrderAcceptanceModal
          open={acceptanceModal.open}
          onClose={() => setAcceptanceModal({ open: false, workOrder: null })}
          workOrder={acceptanceModal.workOrder}
          organizationId={currentOrganization.id}
          onAccept={handleAcceptance}
        />
      )}
    </div>
  );
};

export default WorkOrders;

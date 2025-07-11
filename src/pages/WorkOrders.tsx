
import React, { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEnhancedWorkOrders } from '@/hooks/useEnhancedWorkOrders';
import { useUpdateWorkOrderStatus } from '@/hooks/useWorkOrderData';
import { useWorkOrderAcceptance } from '@/hooks/useWorkOrderAcceptance';
import { useBatchAssignUnassignedWorkOrders } from '@/hooks/useBatchAssignUnassignedWorkOrders';
import { useWorkOrderFilters } from '@/hooks/useWorkOrderFilters';
import { useWorkOrderReopening } from '@/hooks/useWorkOrderReopening';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTeams } from '@/hooks/useTeamManagement';
import { supabase } from '@/integrations/supabase/client';
import { WorkOrderAcceptanceModalState } from '@/types/workOrder';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';
import WorkOrderAcceptanceModal from '@/components/work-orders/WorkOrderAcceptanceModal';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { WorkOrdersHeader } from '@/components/work-orders/WorkOrdersHeader';
import { AutoAssignmentBanner } from '@/components/work-orders/AutoAssignmentBanner';
import { WorkOrderFilters } from '@/components/work-orders/WorkOrderFilters';
import { WorkOrdersList } from '@/components/work-orders/WorkOrdersList';

const WorkOrders = () => {
  const [showForm, setShowForm] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [acceptanceModal, setAcceptanceModal] = useState<WorkOrderAcceptanceModalState>({
    open: false,
    workOrder: null
  });
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { currentOrganization } = useOrganization();
  const isMobile = useIsMobile();

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
  const { data: teams = [] } = useTeams(currentOrganization?.id);
  const updateStatusMutation = useUpdateWorkOrderStatus();
  const acceptanceMutation = useWorkOrderAcceptance();
  const batchAssignMutation = useBatchAssignUnassignedWorkOrders();
  const reopenMutation = useWorkOrderReopening();

  // Use custom filters hook
  const {
    filters,
    filteredWorkOrders,
    getActiveFilterCount,
    clearAllFilters,
    applyQuickFilter,
    updateFilter
  } = useWorkOrderFilters(allWorkOrders, currentUser?.id);

  // Check for unassigned work orders in single-user organization
  const unassignedCount = allWorkOrders.filter(order => 
    order.status === 'submitted' && !order.assigneeName && !order.teamName
  ).length;
  const isSingleUserOrg = currentOrganization?.memberCount === 1;

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

  const handleQuickFilter = (preset: string) => {
    applyQuickFilter(preset);
    setShowMobileFilters(false);
  };

  const handleReopen = async (workOrderId: string) => {
    if (!currentOrganization) return;
    
    await reopenMutation.mutateAsync({
      workOrderId,
      organizationId: currentOrganization.id
    });
  };

  const handleAssignClick = () => {
    // For now, we'll focus on the assignment hover functionality
    // In the future, this could open a dedicated assignment modal
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
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters = getActiveFilterCount() > 0 || filters.searchQuery.length > 0;

  return (
    <div className="space-y-4">
      <WorkOrdersHeader onCreateClick={() => setShowForm(true)} />

      {isSingleUserOrg && (
        <AutoAssignmentBanner
          unassignedCount={unassignedCount}
          onAssignAll={() => currentOrganization && batchAssignMutation.mutate(currentOrganization.id)}
          isAssigning={batchAssignMutation.isPending}
        />
      )}

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
        {/* Main Content */}
        <div className={`space-y-4 ${isMobile ? '' : 'lg:col-span-3'}`}>
          <WorkOrderFilters
            filters={filters}
            activeFilterCount={getActiveFilterCount()}
            showMobileFilters={showMobileFilters}
            onShowMobileFiltersChange={setShowMobileFilters}
            onFilterChange={updateFilter}
            onClearFilters={clearAllFilters}
            onQuickFilter={handleQuickFilter}
            teams={teams}
          />

            <WorkOrdersList
              workOrders={filteredWorkOrders}
              onAcceptClick={handleAcceptClick}
              onStatusUpdate={handleStatusUpdate}
              isUpdating={updateStatusMutation.isPending}
              isAccepting={acceptanceMutation.isPending}
              hasActiveFilters={hasActiveFilters}
              onCreateClick={() => setShowForm(true)}
              onAssignClick={handleAssignClick}
              onReopenClick={() => undefined}
            />
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

import { useQuery } from '@tanstack/react-query';
import { 
  getFilteredWorkOrdersByOrganization, 
  getMyWorkOrders, 
  getTeamWorkOrders,
  getEquipmentWorkOrders,
  getOverdueWorkOrders,
  getWorkOrdersDueToday,
  type WorkOrderFilters 
} from '@/services/optimizedWorkOrderService';

export const useOptimizedFilteredWorkOrders = (organizationId: string, filters?: WorkOrderFilters) => {
  return useQuery({
    queryKey: ['work-orders-filtered-optimized', organizationId, filters],
    queryFn: () => getFilteredWorkOrdersByOrganization(organizationId, filters),
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useOptimizedMyWorkOrders = (organizationId: string, userId: string) => {
  return useQuery({
    queryKey: ['my-work-orders-optimized', organizationId, userId],
    queryFn: () => getMyWorkOrders(organizationId, userId),
    enabled: !!organizationId && !!userId,
    staleTime: 30 * 1000,
  });
};

export const useOptimizedTeamWorkOrders = (
  organizationId: string, 
  teamId: string, 
  status?: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'all'
) => {
  return useQuery({
    queryKey: ['team-work-orders-optimized', organizationId, teamId, status],
    queryFn: () => getTeamWorkOrders(organizationId, teamId, status),
    enabled: !!organizationId && !!teamId,
    staleTime: 30 * 1000,
  });
};

export const useOptimizedEquipmentWorkOrders = (
  organizationId: string, 
  equipmentId: string, 
  status?: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'all'
) => {
  return useQuery({
    queryKey: ['equipment-work-orders-optimized', organizationId, equipmentId, status],
    queryFn: () => getEquipmentWorkOrders(organizationId, equipmentId, status),
    enabled: !!organizationId && !!equipmentId,
    staleTime: 30 * 1000,
  });
};

export const useOptimizedOverdueWorkOrders = (organizationId: string) => {
  return useQuery({
    queryKey: ['overdue-work-orders-optimized', organizationId],
    queryFn: () => getOverdueWorkOrders(organizationId),
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useOptimizedWorkOrdersDueToday = (organizationId: string) => {
  return useQuery({
    queryKey: ['work-orders-due-today-optimized', organizationId],
    queryFn: () => getWorkOrdersDueToday(organizationId),
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/contexts/SessionContext';
import * as supabaseService from '@/services/supabaseDataService';
import { toast } from '@/hooks/use-toast';

// Equipment hooks
export const useEquipmentByOrganization = () => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['equipment', currentOrg?.id],
    queryFn: () => currentOrg ? supabaseService.getEquipmentByOrganization(currentOrg.id) : Promise.resolve([]),
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEquipmentById = (equipmentId?: string) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['equipment', currentOrg?.id, equipmentId],
    queryFn: () => currentOrg && equipmentId ? 
      supabaseService.getEquipmentById(currentOrg.id, equipmentId) : 
      Promise.resolve(undefined),
    enabled: !!currentOrg?.id && !!equipmentId,
    staleTime: 5 * 60 * 1000,
  });
};

// Teams hooks
export const useTeamsByOrganization = () => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['teams', currentOrg?.id],
    queryFn: () => currentOrg ? supabaseService.getTeamsByOrganization(currentOrg.id) : Promise.resolve([]),
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000,
  });
};

// Dashboard stats hook
export const useDashboardStats = () => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['dashboard-stats', currentOrg?.id],
    queryFn: () => currentOrg ? supabaseService.getDashboardStatsByOrganization(currentOrg.id) : Promise.resolve({
      totalEquipment: 0,
      activeEquipment: 0,
      maintenanceEquipment: 0,
      totalWorkOrders: 0
    }),
    enabled: !!currentOrg?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
  });
};

// Work orders hooks
export const useWorkOrdersByEquipment = (equipmentId?: string) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['work-orders', 'equipment', currentOrg?.id, equipmentId],
    queryFn: () => currentOrg && equipmentId ? 
      supabaseService.getWorkOrdersByEquipmentId(currentOrg.id, equipmentId) : 
      Promise.resolve([]),
    enabled: !!currentOrg?.id && !!equipmentId,
    staleTime: 3 * 60 * 1000,
  });
};

export const useAllWorkOrders = () => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['work-orders', currentOrg?.id],
    queryFn: () => currentOrg ? supabaseService.getAllWorkOrdersByOrganization(currentOrg.id) : Promise.resolve([]),
    enabled: !!currentOrg?.id,
    staleTime: 3 * 60 * 1000,
  });
};

export const useWorkOrderById = (workOrderId?: string) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['work-orders', currentOrg?.id, workOrderId],
    queryFn: () => currentOrg && workOrderId ? 
      supabaseService.getWorkOrderById(currentOrg.id, workOrderId) : 
      Promise.resolve(undefined),
    enabled: !!currentOrg?.id && !!workOrderId,
    staleTime: 3 * 60 * 1000,
  });
};

// Notes hooks
export const useNotesByEquipment = (equipmentId?: string) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['notes', 'equipment', currentOrg?.id, equipmentId],
    queryFn: () => currentOrg && equipmentId ? 
      supabaseService.getNotesByEquipmentId(currentOrg.id, equipmentId) : 
      Promise.resolve([]),
    enabled: !!currentOrg?.id && !!equipmentId,
    staleTime: 5 * 60 * 1000,
  });
};

// Scans hooks
export const useScansByEquipment = (equipmentId?: string) => {
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useQuery({
    queryKey: ['scans', 'equipment', currentOrg?.id, equipmentId],
    queryFn: () => currentOrg && equipmentId ? 
      supabaseService.getScansByEquipmentId(currentOrg.id, equipmentId) : 
      Promise.resolve([]),
    enabled: !!currentOrg?.id && !!equipmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes for scans
  });
};

// Mutation hooks
export const useUpdateWorkOrderStatus = () => {
  const queryClient = useQueryClient();
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useMutation({
    mutationFn: async ({ workOrderId, newStatus }: { 
      workOrderId: string; 
      newStatus: supabaseService.WorkOrder['status'] 
    }) => {
      if (!currentOrg) throw new Error('No current organization');
      return supabaseService.updateWorkOrderStatus(currentOrg.id, workOrderId, newStatus);
    },
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        
        toast({
          title: 'Work Order Updated',
          description: `Work order status changed to ${variables.newStatus}`,
        });
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update work order status',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Error updating work order:', error);
      toast({
        title: 'Update Failed',
        description: 'An error occurred while updating the work order',
        variant: 'destructive',
      });
    },
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useMutation({
    mutationFn: async (equipmentData: Omit<supabaseService.Equipment, 'id'>) => {
      if (!currentOrg) throw new Error('No current organization');
      return supabaseService.createEquipment(currentOrg.id, equipmentData);
    },
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['equipment'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        
        toast({
          title: 'Equipment Created',
          description: `${result.name} has been added successfully`,
        });
      } else {
        toast({
          title: 'Creation Failed',
          description: 'Failed to create equipment',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Error creating equipment:', error);
      toast({
        title: 'Creation Failed',
        description: 'An error occurred while creating equipment',
        variant: 'destructive',
      });
    },
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useMutation({
    mutationFn: async (workOrderData: Omit<supabaseService.WorkOrder, 'id' | 'createdDate' | 'assigneeName' | 'teamName' | 'completedDate'>) => {
      if (!currentOrg) throw new Error('No current organization');
      return supabaseService.createWorkOrder(currentOrg.id, workOrderData);
    },
    onSuccess: (result) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        
        toast({
          title: 'Work Order Created',
          description: `${result.title} has been created successfully`,
        });
      } else {
        toast({
          title: 'Creation Failed',
          description: 'Failed to create work order',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Error creating work order:', error);
      toast({
        title: 'Creation Failed',
        description: 'An error occurred while creating the work order',
        variant: 'destructive',
      });
    },
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useMutation({
    mutationFn: async ({ equipmentId, content, isPrivate = false }: { 
      equipmentId: string; 
      content: string; 
      isPrivate?: boolean 
    }) => {
      if (!currentOrg) throw new Error('No current organization');
      return supabaseService.createNote(currentOrg.id, equipmentId, content, isPrivate);
    },
    onSuccess: (result, variables) => {
      if (result) {
        // Invalidate notes queries for this equipment
        queryClient.invalidateQueries({ 
          queryKey: ['notes', 'equipment', currentOrg?.id, variables.equipmentId] 
        });
        
        toast({
          title: 'Note Added',
          description: 'Your note has been saved successfully',
        });
      } else {
        toast({
          title: 'Save Failed',
          description: 'Failed to save note',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Error creating note:', error);
      toast({
        title: 'Save Failed',
        description: 'An error occurred while saving the note',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();
  const { getCurrentOrganization } = useSession();
  const currentOrg = getCurrentOrganization();

  return useMutation({
    mutationFn: async ({ equipmentId, equipmentData }: { 
      equipmentId: string; 
      equipmentData: Partial<Omit<supabaseService.Equipment, 'id'>> 
    }) => {
      if (!currentOrg) throw new Error('No current organization');
      return supabaseService.updateEquipment(currentOrg.id, equipmentId, equipmentData);
    },
    onSuccess: (result, variables) => {
      if (result) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['equipment'] });
        queryClient.invalidateQueries({ queryKey: ['equipment', currentOrg?.id, variables.equipmentId] });
        
        toast({
          title: 'Equipment Updated',
          description: `${result.name} has been updated successfully`,
        });
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update equipment',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Error updating equipment:', error);
      toast({
        title: 'Update Failed',
        description: 'An error occurred while updating equipment',
        variant: 'destructive',
      });
    },
  });
};

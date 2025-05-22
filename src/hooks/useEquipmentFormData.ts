import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Equipment } from '@/types';
import { EquipmentStatus } from '@/types/supabase-enums';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { createEquipment } from '@/services/equipment/equipmentCreateService';
import { updateEquipment } from '@/services/equipment/equipmentUpdateService';
import { refreshEquipment, diagnoseEquipmentService } from '@/services/equipment/equipmentListService';
import { CreateEquipmentParams } from '@/types/equipment';
import { invalidateEquipmentCache } from '@/services/equipment/services/cacheService';
import { supabase } from '@/integrations/supabase/client';

export function useEquipmentFormData(redirectToLogin: (message: string) => void) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [retryCount, setRetryCount] = useState(0);

  // Fetch equipment data if in edit mode
  const { 
    data: equipment, 
    isLoading: isFetchingEquipment, 
    error: equipmentError,
    refetch: refetchEquipment
  } = useQuery({
    queryKey: ['equipment', id, retryCount],
    queryFn: () => getEquipmentById(id as string),
    enabled: isEditMode,
    retry: 1, // Limit auto-retries to avoid excessive loading
  });

  // Create equipment mutation
  const createMutation = useMutation({
    mutationFn: (formData: Partial<Equipment>) => {
      // Convert to the expected CreateEquipmentParams type with proper status type handling
      const processedData = {
        ...formData,
        // Cast the string status to EquipmentStatus for type safety
        status: formData.status as EquipmentStatus
      };
      
      // Create a correctly typed parameter for createEquipment
      const equipmentParams: CreateEquipmentParams = processedData as unknown as CreateEquipmentParams;
      return createEquipment(equipmentParams);
    },
    onSuccess: async (data) => {
      toast.success('Equipment added successfully');
      
      // Get user ID for cache invalidation
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      // Force refresh equipment list data
      try {
        await refreshEquipment();
        
        // Explicitly invalidate equipment caches
        if (userId) {
          invalidateEquipmentCache(userId, data?.equipment?.org_id);
        }
      } catch (refreshError) {
        console.warn('Failed to refresh equipment list:', refreshError);
      }
      
      // More targeted query invalidation
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      
      // Navigate to the new equipment page if we have an ID
      if (data.equipment && data.equipment.id) {
        navigate(`/equipment/${data.equipment.id}`);
      } else {
        navigate('/equipment');
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Please try again later';
      console.error('Error creating equipment:', error);
      
      // Check for authentication errors
      if (errorMessage.includes('Authentication required') || 
          errorMessage.includes('sign in') ||
          errorMessage.includes('logged in')) {
        
        toast.error('Authentication Required', {
          description: 'Your session has expired. Please sign in again.',
        });
        
        redirectToLogin('Please sign in to continue adding equipment');
        return;
      }
      
      // Handle other error types
      if (errorMessage.includes('Permission') || 
          errorMessage.includes('permission') || 
          errorMessage.includes('need to be') ||
          errorMessage.includes('access to this team')) {
        toast.error('Permission Error', {
          description: errorMessage,
        });
      } else if (errorMessage.includes('Server permission service')) {
        toast.error('Service Temporarily Unavailable', {
          description: errorMessage,
        });
      } else if (errorMessage.includes('Edge Function') || errorMessage.includes('function invoke error')) {
        toast.error('Server Error', {
          description: 'There was an issue with the permission check service. Please try again or contact support if the problem persists.',
        });
      } else if (errorMessage.includes('System error (Code:')) {
        toast.error('Technical Error', {
          description: errorMessage,
        });
      } else {
        toast.error('Failed to create equipment', {
          description: errorMessage,
        });
      }
    }
  });

  // Update equipment mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Equipment> }) => {
      // Ensure status is typed correctly for update as well
      const processedData = {
        ...data,
        status: data.status as EquipmentStatus
      };
      return updateEquipment(id, processedData);
    },
    onSuccess: async (data) => {
      toast.success('Equipment updated successfully');
      
      // Get user ID for cache invalidation
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      // Force refresh equipment list data
      try {
        await refreshEquipment();
        
        // Explicitly invalidate equipment caches with more specificity
        if (userId) {
          invalidateEquipmentCache(userId, data?.org_id, data?.id);
        }
      } catch (refreshError) {
        console.warn('Failed to refresh equipment list:', refreshError);
      }
      
      // More targeted query invalidation
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      
      // Specifically invalidate this equipment's detail query
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['equipment', data.id] });
      }
      
      // Navigate to the updated equipment page
      navigate(`/equipment/${data.id}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Please try again later';
      console.error('Error updating equipment:', error);
      
      // Check for authentication errors
      if (errorMessage.includes('Authentication required') || 
          errorMessage.includes('sign in')) {
        
        toast.error('Authentication Required', {
          description: 'Your session has expired. Please sign in again.',
        });
        
        redirectToLogin('Please sign in to continue updating equipment');
        return;
      }
      
      // Handle permission and other errors
      if (errorMessage.includes('Permission') || 
          errorMessage.includes('permission') || 
          errorMessage.includes('need to be')) {
        toast.error('Permission Error', {
          description: errorMessage,
        });
      } else if (errorMessage.includes('Edge Function') || errorMessage.includes('function invoke error')) {
        toast.error('Server Error', {
          description: 'There was an issue with the permission check service. Please try again or contact support if the problem persists.',
        });
      } else {
        toast.error('Failed to update equipment', {
          description: errorMessage,
        });
      }
    }
  });

  // Run diagnostics when we get errors
  const runDiagnostics = () => {
    diagnoseEquipmentService().then(result => {
      console.info('Equipment service diagnostics:', result);
    }).catch(e => {
      console.error('Diagnostics failed:', e);
    });
  };

  const handleSave = (formData: Partial<Equipment>) => {
    // Process team_id - ensure it's handled correctly (null vs empty string)
    const processedData = {
      ...formData,
      team_id: formData.team_id === 'none' ? null : formData.team_id
    };

    if (isEditMode && id) {
      updateMutation.mutate({ id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
    if (isEditMode) {
      refetchEquipment();
    }
  };

  const isLoading = isFetchingEquipment || createMutation.isPending || updateMutation.isPending;

  // Call diagnostics when there's an error
  if (equipmentError) {
    runDiagnostics();
  }

  return {
    equipment,
    equipmentError,
    isLoading,
    isEditMode,
    handleSave,
    handleRetry
  };
}


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Equipment } from '@/types';
import { EquipmentStatus } from '@/types/supabase-enums';
import { createEquipment } from '@/services/equipment/equipmentCreateService';
import { updateEquipment } from '@/services/equipment/equipmentUpdateService';
import { refreshEquipment } from '@/services/equipment/equipmentListService';
import { invalidateEquipmentCache } from '@/services/equipment/services/cacheService';
import { CreateEquipmentParams } from '@/types/equipment';
import { isValidUuid } from '@/utils/validationUtils';
import { authenticationService } from '@/services/auth/authenticationService';
import { errorHandlingService } from '@/services/errors/errorHandlingService';
import { useCacheManager } from '@/services/cache/cacheManager';

interface UseEquipmentMutationsProps {
  redirectToLogin: (message: string) => void;
}

export function useEquipmentMutations({ redirectToLogin }: UseEquipmentMutationsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cacheManager = useCacheManager();

  // Enhanced form data validation
  const validateFormData = (formData: Partial<Equipment>): string | null => {
    if (!formData.org_id || typeof formData.org_id !== 'string') {
      return 'Organization is required. Please select an organization and try again.';
    }
    
    if (formData.org_id.trim() === '') {
      return 'Organization cannot be empty. Please select a valid organization.';
    }
    
    if (!isValidUuid(formData.org_id)) {
      return 'Invalid organization selected. Please refresh the page and try again.';
    }
    
    if (!formData.name || formData.name.trim() === '') {
      return 'Equipment name is required';
    }
    
    return null;
  };

  // Create equipment mutation
  const createMutation = useMutation({
    mutationFn: async (formData: Partial<Equipment>) => {
      // Validate authentication
      const authResult = await authenticationService.validateAuthentication();
      if (!authResult.isValid) {
        throw new Error(authResult.error || 'Authentication required');
      }

      const authUserId = authResult.user!.id;
      console.log('Creating equipment for authenticated user:', { authUserId });
      
      // Pre-flight validation of form data
      const validationError = validateFormData(formData);
      if (validationError) {
        console.error('Form validation failed:', validationError, formData);
        throw new Error(validationError);
      }
      
      // Convert to the expected CreateEquipmentParams type
      const processedData = {
        ...formData,
        created_by: authUserId,
        status: formData.status as EquipmentStatus,
        org_id: formData.org_id!.trim()
      };
      
      console.log('Processed data for equipment creation:', processedData);
      
      const equipmentParams: CreateEquipmentParams = processedData as unknown as CreateEquipmentParams;
      return createEquipment(equipmentParams);
    },
    onSuccess: async (data) => {
      toast.success('Equipment added successfully');
      
      // Use centralized cache invalidation
      if (data?.equipment?.org_id) {
        await cacheManager.invalidateEquipmentData(data.equipment.org_id);
      }
      
      // Navigate to the new equipment page
      if (data.equipment && data.equipment.id) {
        navigate(`/equipment/${data.equipment.id}`);
      } else {
        navigate('/equipment');
      }
    },
    onError: (error: any) => {
      const processedError = errorHandlingService.processError(error, {
        operation: 'create equipment'
      });
      
      if (processedError.shouldRedirectToAuth) {
        toast.error(processedError.title, {
          description: processedError.message,
        });
        redirectToLogin('Please sign in to continue adding equipment');
        return;
      }
      
      toast.error(processedError.title, {
        description: processedError.message,
      });
    }
  });

  // Update equipment mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Equipment> }) => {
      const processedData = {
        ...data,
        status: data.status as EquipmentStatus
      };
      return updateEquipment(id, processedData);
    },
    onSuccess: async (data) => {
      toast.success('Equipment updated successfully');
      
      // Use centralized cache invalidation
      if (data?.org_id) {
        await cacheManager.invalidateEquipmentData(data.org_id);
      }
      
      // Specifically invalidate this equipment's detail query
      if (data?.id) {
        await cacheManager.invalidateEquipmentDetail(data.id);
      }
      
      navigate(`/equipment/${data.id}`);
    },
    onError: (error: any) => {
      const processedError = errorHandlingService.processError(error, {
        operation: 'update equipment'
      });
      
      if (processedError.shouldRedirectToAuth) {
        toast.error(processedError.title, {
          description: processedError.message,
        });
        redirectToLogin('Please sign in to continue updating equipment');
        return;
      }
      
      toast.error(processedError.title, {
        description: processedError.message,
      });
    }
  });

  return {
    createMutation,
    updateMutation
  };
}

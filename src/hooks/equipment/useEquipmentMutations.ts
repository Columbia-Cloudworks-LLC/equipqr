
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Equipment } from '@/types';
import { EquipmentStatus } from '@/types/supabase-enums';
import { createEquipment } from '@/services/equipment/equipmentCreateService';
import { updateEquipment } from '@/services/equipment/equipmentUpdateService';
import { refreshEquipment } from '@/services/equipment/equipmentListService';
import { invalidateEquipmentCache } from '@/services/equipment/services/cacheService';
import { supabase } from '@/integrations/supabase/client';
import { CreateEquipmentParams } from '@/types/equipment';
import { isValidUuid } from '@/utils/validationUtils';
import { getAppUserIdFromAuthId, ensureAppUserExists } from '@/utils/userMappingUtils';

interface UseEquipmentMutationsProps {
  redirectToLogin: (message: string) => void;
}

export function useEquipmentMutations({ redirectToLogin }: UseEquipmentMutationsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Enhanced form data validation
  const validateFormData = (formData: Partial<Equipment>): string | null => {
    // Critical organization validation
    if (!formData.org_id || typeof formData.org_id !== 'string') {
      return 'Organization is required. Please select an organization and try again.';
    }
    
    // Check for empty string or whitespace-only
    if (formData.org_id.trim() === '') {
      return 'Organization cannot be empty. Please select a valid organization.';
    }
    
    // Validate UUID format
    if (!isValidUuid(formData.org_id)) {
      return 'Invalid organization selected. Please refresh the page and try again.';
    }
    
    // Validate equipment name
    if (!formData.name || formData.name.trim() === '') {
      return 'Equipment name is required';
    }
    
    return null;
  };

  // Create equipment mutation
  const createMutation = useMutation({
    mutationFn: async (formData: Partial<Equipment>) => {
      // Get current authenticated user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw new Error('Authentication required: Please sign in to continue');
      }
      
      if (!sessionData?.session?.user) {
        throw new Error('Authentication required: Please sign in to continue');
      }
      
      const authUserId = sessionData.session.user.id;
      const userEmail = sessionData.session.user.email;
      
      // Pre-flight validation of form data
      const validationError = validateFormData(formData);
      if (validationError) {
        console.error('Form validation failed:', validationError, formData);
        throw new Error(validationError);
      }
      
      // Get or create app_user record
      console.log('Getting app_user ID for auth user:', authUserId);
      let appUserId = await getAppUserIdFromAuthId(authUserId);
      
      if (!appUserId) {
        // Try to create app_user record if it doesn't exist
        console.log('App user record not found, creating one...');
        appUserId = await ensureAppUserExists(authUserId, userEmail);
        
        if (!appUserId) {
          throw new Error('Failed to create or retrieve user record. Please sign out and sign back in.');
        }
      }
      
      // Additional validation with detailed logging
      console.log('Form data received for creation:', formData);
      console.log('Organization ID check:', {
        org_id: formData.org_id,
        type: typeof formData.org_id,
        length: formData.org_id?.length,
        trimmed: formData.org_id?.trim(),
        isValid: isValidUuid(formData.org_id || '')
      });
      console.log('Using app_user ID:', appUserId);
      
      // Convert to the expected CreateEquipmentParams type with proper status type handling
      const processedData = {
        ...formData,
        // Use the correct app_user.id instead of auth.users.id
        created_by: appUserId,
        // Cast the string status to EquipmentStatus for type safety
        status: formData.status as EquipmentStatus,
        // Ensure org_id is properly set and validated - trim whitespace
        org_id: formData.org_id!.trim()
      };
      
      console.log('Processed data for equipment creation:', processedData);
      
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
      
      // Handle app_user creation errors
      if (errorMessage.includes('Failed to create or retrieve user record')) {
        toast.error('User Account Error', {
          description: errorMessage,
        });
        return;
      }
      
      // Handle organization-specific errors with enhanced messaging
      if (errorMessage.includes('Organization is required') ||
          errorMessage.includes('Organization cannot be empty') ||
          errorMessage.includes('Invalid organization selected')) {
        toast.error('Organization Error', {
          description: errorMessage + ' Please refresh the page and ensure you have selected a valid organization.',
        });
        return;
      }
      
      // Handle foreign key constraint errors specifically
      if (errorMessage.includes('violates foreign key constraint')) {
        if (errorMessage.includes('created_by')) {
          toast.error('User Account Error', {
            description: 'There was an issue with your user account. Please sign out and sign back in.',
          });
        } else if (errorMessage.includes('org_id')) {
          toast.error('Organization Error', {
            description: 'Invalid organization selected. Please select a valid organization and try again.',
          });
        } else {
          toast.error('Database Error', {
            description: 'There was a database constraint error. Please check your data and try again.',
          });
        }
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

  return {
    createMutation,
    updateMutation
  };
}

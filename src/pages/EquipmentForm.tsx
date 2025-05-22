
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Equipment } from '@/types/equipment';
import { CreateEquipmentParams } from '@/types/equipment';
import { EquipmentStatus } from '@/types/supabase-enums';
import { EquipmentForm as EquipmentFormComponent } from '@/components/Equipment/EquipmentForm';
import { Layout } from '@/components/Layout/Layout';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { createEquipment } from '@/services/equipment/equipmentCreateService';
import { updateEquipment } from '@/services/equipment/equipmentUpdateService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { resetAuthState } from '@/utils/authInterceptors';
import { refreshEquipment, diagnoseEquipmentService } from '@/services/equipment/equipmentListService';

const EquipmentFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthStatus('loading');
        const { data: session } = await supabase.auth.getSession();
        
        if (session?.session) {
          console.log('Valid session found, user is authenticated');
          setAuthStatus('authenticated');
        } else {
          console.log('No valid session found, user is unauthenticated');
          setAuthStatus('unauthenticated');
          
          // Save current path to return after login
          const currentPath = window.location.pathname;
          localStorage.setItem('authReturnTo', currentPath);
          
          toast.error('Authentication Required', {
            description: 'You must be logged in to manage equipment',
          });
          
          navigate('/auth', { 
            state: { 
              returnTo: currentPath,
              message: 'You need to sign in to manage equipment'
            } 
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthStatus('unauthenticated');
        setAuthError('There was a problem verifying your authentication status.');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Fetch equipment data if in edit mode
  const { 
    data: equipment, 
    isLoading: isFetchingEquipment, 
    error: equipmentError,
    refetch: refetchEquipment
  } = useQuery({
    queryKey: ['equipment', id, retryCount],
    queryFn: () => getEquipmentById(id as string),
    enabled: isEditMode && authStatus === 'authenticated',
    retry: 1, // Limit auto-retries to avoid excessive loading
  });
  
  // Handle equipment fetch error
  useEffect(() => {
    if (equipmentError) {
      const errorMessage = equipmentError instanceof Error 
        ? equipmentError.message 
        : 'Please try again later';
      
      // Only show toast for network errors, not permission errors
      if (!errorMessage.includes('permission') && !errorMessage.includes('access')) {
        toast.error('Failed to load equipment details', {
          description: errorMessage,
        });
      }
      
      console.error('Equipment fetch error details:', equipmentError);
      
      // Run diagnostics when we get errors
      diagnoseEquipmentService().then(result => {
        console.info('Equipment service diagnostics:', result);
      }).catch(e => {
        console.error('Diagnostics failed:', e);
      });
    }
  }, [equipmentError]);

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
      
      // Force refresh equipment list data
      try {
        await refreshEquipment();
      } catch (refreshError) {
        console.warn('Failed to refresh equipment list:', refreshError);
      }
      
      // Invalidate queries to ensure data is fresh
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
        
        // Save return path and redirect to auth
        const currentPath = window.location.pathname;
        localStorage.setItem('authReturnTo', currentPath);
        
        resetAuthState(); // Clear tokens to ensure clean login
        
        navigate('/auth', { 
          state: { 
            returnTo: currentPath,
            message: 'Please sign in to continue adding equipment'
          } 
        });
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
      
      // Force refresh equipment list data
      try {
        await refreshEquipment();
      } catch (refreshError) {
        console.warn('Failed to refresh equipment list:', refreshError);
      }
      
      // Invalidate queries to ensure data is fresh
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      
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
        
        // Save return path and redirect to auth
        const currentPath = window.location.pathname;
        localStorage.setItem('authReturnTo', currentPath);
        
        resetAuthState(); // Clear tokens to ensure clean login
        
        navigate('/auth', { 
          state: { 
            returnTo: currentPath,
            message: 'Please sign in to continue updating equipment'
          } 
        });
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

  const handleSave = (formData: Partial<Equipment>) => {
    // Ensure user is authenticated before proceeding
    if (authStatus !== 'authenticated') {
      toast.error('Authentication Required', {
        description: 'Please log in to save equipment data',
      });
      
      // Save return path and redirect to auth
      const currentPath = window.location.pathname;
      localStorage.setItem('authReturnTo', currentPath);
      
      navigate('/auth', { 
        state: { returnTo: currentPath }
      });
      return;
    }
    
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

  const isLoading = authStatus === 'loading' || 
                   isFetchingEquipment || 
                   createMutation.isPending || 
                   updateMutation.isPending;

  // Show loading while checking auth
  if (authStatus === 'loading') {
    return (
      <Layout>
        <div className="flex-1 p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Checking authentication...</h1>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Show auth error
  if (authError) {
    return (
      <Layout>
        <div className="flex-1 p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
          
          <div className="flex justify-center mt-4">
            <Button 
              onClick={() => {
                resetAuthState();
                navigate('/auth', { replace: true });
              }}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Show not authenticated message
  if (authStatus === 'unauthenticated') {
    return (
      <Layout>
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You must be logged in to view this page.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center mt-4">
            <Button 
              onClick={() => navigate('/auth')}
              className="mt-4"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? 'Edit Equipment' : 'Add New Equipment'}
        </h1>
        
        {/* Show info alert when redirected from auth */}
        {location.state?.fromAuth && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4" />
            <AlertTitle>Session Restored</AlertTitle>
            <AlertDescription>
              Your session has been restored. You can now continue with your task.
            </AlertDescription>
          </Alert>
        )}
        
        <EquipmentFormComponent 
          equipment={equipment} 
          onSave={handleSave}
          isLoading={isLoading}
          error={isEditMode ? equipmentError : undefined} 
          onRetry={handleRetry}
        />
      </div>
    </Layout>
  );
};

export default EquipmentFormPage;

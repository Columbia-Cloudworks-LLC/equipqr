
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Equipment } from '@/types';
import { EquipmentForm as EquipmentFormComponent } from '@/components/Equipment/EquipmentForm';
import { Layout } from '@/components/Layout/Layout';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentById } from '@/services/equipment/equipmentDetailsService';
import { createEquipment } from '@/services/equipment/equipmentCreateService';
import { updateEquipment } from '@/services/equipment/equipmentUpdateService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const EquipmentFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
          toast.error('Authentication Required', {
            description: 'You must be logged in to access this page',
          });
          navigate('/auth');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthStatus('unauthenticated');
        navigate('/auth');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Fetch equipment data if in edit mode
  const { data: equipment, isLoading: isFetchingEquipment, error: equipmentError } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentById(id as string),
    enabled: isEditMode && authStatus === 'authenticated',
  });
  
  // Handle equipment fetch error
  useEffect(() => {
    if (equipmentError) {
      const errorMessage = equipmentError instanceof Error 
        ? equipmentError.message 
        : 'Please try again later';
        
      toast.error('Failed to load equipment details', {
        description: errorMessage,
      });
      
      if (errorMessage.includes('permission') || errorMessage.includes('access')) {
        // Permission error, navigate to equipment list
        setTimeout(() => navigate('/equipment'), 1500);
      }
    }
  }, [equipmentError, navigate]);

  // Create equipment mutation
  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: (data) => {
      toast.success('Equipment added successfully');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      navigate(`/equipment/${data.id}`);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Please try again later';
      console.error('Error creating equipment:', error);
      
      if (errorMessage.includes('Permission') || 
          errorMessage.includes('permission') || 
          errorMessage.includes('need to be') ||
          errorMessage.includes('access to this team')) {
        toast.error('Permission Error', {
          description: errorMessage,
        });
      } else if (errorMessage.includes('Edge Function') || errorMessage.includes('function invoke error')) {
        toast.error('Server Error', {
          description: 'There was an issue with the permission check service. Please try again or contact support if the problem persists.',
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
    mutationFn: ({ id, data }: { id: string, data: Partial<Equipment> }) => updateEquipment(id, data),
    onSuccess: (data) => {
      toast.success('Equipment updated successfully');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      navigate(`/equipment/${data.id}`);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Please try again later';
      console.error('Error updating equipment:', error);
      
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

  const isLoading = authStatus === 'loading' || isFetchingEquipment || createMutation.isPending || updateMutation.isPending;

  // Show loading while checking auth
  if (authStatus === 'loading') {
    return (
      <Layout>
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Loading...</h1>
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
            <Info className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You must be logged in to view this page.
            </AlertDescription>
          </Alert>
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
        <EquipmentFormComponent 
          equipment={equipment} 
          onSave={handleSave}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
};

export default EquipmentFormPage;

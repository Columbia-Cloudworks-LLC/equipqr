
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

const EquipmentFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  
  // Fetch equipment data if in edit mode
  const { data: equipment, isLoading: isFetchingEquipment, error: equipmentError } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentById(id as string),
    enabled: isEditMode,
  });
  
  // Handle equipment fetch error
  useEffect(() => {
    if (equipmentError) {
      toast.error('Failed to load equipment details', {
        description: equipmentError instanceof Error ? equipmentError.message : 'Please try again later',
      });
      navigate('/equipment');
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
      toast.error('Failed to add equipment', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
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
      toast.error('Failed to update equipment', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  });

  const handleSave = (formData: Partial<Equipment>) => {
    // Process team_id - ensure it's handled correctly (null vs empty string)
    const processedData = {
      ...formData,
      team_id: formData.team_id || null  // Ensure team_id is null if empty
    };

    if (isEditMode && id) {
      updateMutation.mutate({ id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const isLoading = isFetchingEquipment || createMutation.isPending || updateMutation.isPending;

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

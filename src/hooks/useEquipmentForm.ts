import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useCreateEquipment, useUpdateEquipment } from '@/hooks/useSupabaseData';
import { usePermissions } from '@/hooks/usePermissions';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { equipmentFormSchema, type EquipmentFormData, type EquipmentRecord } from '@/types/equipment';

interface UseEquipmentFormProps {
  equipment?: EquipmentRecord;
  onClose: () => void;
}

export const useEquipmentForm = ({ equipment, onClose }: UseEquipmentFormProps) => {
  const isEdit = !!equipment;
  const { currentOrganization } = useSimpleOrganization();
  const queryClient = useQueryClient();
  const createEquipmentMutation = !isEdit ? useCreateEquipment(currentOrganization?.id || '') : null;
  const updateEquipmentMutation = isEdit ? useUpdateEquipment(currentOrganization?.id || '') : null;
  const { canManageEquipment, hasRole } = usePermissions();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: equipment?.name || '',
      manufacturer: equipment?.manufacturer || '',
      model: equipment?.model || '',
      serial_number: equipment?.serial_number || '',
      status: equipment?.status || 'active',
      location: equipment?.location || '',
      installation_date: equipment?.installation_date || new Date().toISOString().split('T')[0],
      warranty_expiration: equipment?.warranty_expiration || '',
      last_maintenance: equipment?.last_maintenance || '',
      notes: equipment?.notes || '',
      custom_attributes: equipment?.custom_attributes || {},
      image_url: equipment?.image_url || '',
      last_known_location: equipment?.last_known_location || null,
      team_id: equipment?.team_id || undefined
    },
  });

  const onSubmit = async (values: EquipmentFormData) => {
    if (!canManageEquipment()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create equipment",
        variant: "destructive",
      });
      return;
    }

    // Check team assignment requirements for non-admin users
    const isAdminUser = hasRole(['owner', 'admin']);
    if (!isAdminUser && (!values.team_id || values.team_id === 'unassigned')) {
      toast({
        title: "Team Assignment Required",
        description: "Non-admin users must assign equipment to a team",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEdit) {
        if (!equipment?.id) {
          toast({
            title: "Update Failed",
            description: "Missing equipment ID",
            variant: "destructive",
          });
          return;
        }

        const equipmentData = {
          name: values.name,
          manufacturer: values.manufacturer,
          model: values.model,
          serial_number: values.serial_number,
          status: values.status,
          location: values.location,
          installation_date: values.installation_date,
          warranty_expiration: values.warranty_expiration || null,
          last_maintenance: values.last_maintenance || null,
          notes: values.notes || '',
          custom_attributes: values.custom_attributes || {},
          image_url: values.image_url || null,
          last_known_location: values.last_known_location || null,
          team_id: values.team_id === 'unassigned' ? null : (values.team_id || null),
        } as const;

        await updateEquipmentMutation!.mutateAsync({
          equipmentId: equipment.id,
          equipmentData,
        });

        // Ensure dashboard stats refresh after update
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      } else {
        // Ensure all required fields are present with proper values
        const equipmentData = {
          name: values.name,
          manufacturer: values.manufacturer,
          model: values.model,
          serial_number: values.serial_number,
          status: values.status,
          location: values.location,
          installation_date: values.installation_date,
          warranty_expiration: values.warranty_expiration || null,
          last_maintenance: values.last_maintenance || null,
          notes: values.notes || '',
          custom_attributes: values.custom_attributes || {},
          image_url: values.image_url || null,
          last_known_location: values.last_known_location || null,
          team_id: values.team_id === 'unassigned' ? null : (values.team_id || null),
          working_hours: 0 // Initialize with 0 hours for new equipment
        };
        
        await createEquipmentMutation!.mutateAsync(equipmentData);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting equipment form:', error);
    }
  };

  return {
    form,
    onSubmit,
    isEdit,
    isPending: isEdit ? !!updateEquipmentMutation?.isPending : !!createEquipmentMutation?.isPending
  };
};
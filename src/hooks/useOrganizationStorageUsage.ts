import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';

export interface StorageUsage {
  totalSizeMB: number;
  totalSizeGB: number;
  itemCount: number;
  freeQuotaMB: number;
  freeQuotaGB: number;
  overageMB: number;
  overageGB: number;
  costPerMB: number;
  overageCost: number;
}

export const useOrganizationStorageUsage = () => {
  const { currentOrganization } = useUnifiedOrganization();

  return useQuery({
    queryKey: ['organization-storage-usage', currentOrganization?.id],
    queryFn: async (): Promise<StorageUsage> => {
      if (!currentOrganization?.id) {
        throw new Error('No organization selected');
      }

      // Get equipment note images
      const { data: equipmentImages, error: equipmentError } = await supabase
        .from('equipment_note_images')
        .select(`
          file_size,
          equipment_notes!inner(
            equipment_id,
            equipment!inner(organization_id)
          )
        `)
        .eq('equipment_notes.equipment.organization_id', currentOrganization.id);

      if (equipmentError) {
        console.error('Error fetching equipment images:', equipmentError);
      }

      // Get work order images
      const { data: workOrderImages, error: workOrderError } = await supabase
        .from('work_order_images')
        .select(`
          file_size,
          work_orders!inner(organization_id)
        `)
        .eq('work_orders.organization_id', currentOrganization.id);

      if (workOrderError) {
        console.error('Error fetching work order images:', workOrderError);
      }

      // Calculate total storage usage
      const equipmentImageSizes = (equipmentImages || [])
        .map(img => img.file_size || 0)
        .reduce((sum, size) => sum + size, 0);

      const workOrderImageSizes = (workOrderImages || [])
        .map(img => img.file_size || 0)
        .reduce((sum, size) => sum + size, 0);

      const totalSizeBytes = equipmentImageSizes + workOrderImageSizes;
      const totalSizeMB = Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100;
      const totalSizeGB = Math.round((totalSizeMB / 1024) * 100) / 100;
      
      const itemCount = (equipmentImages?.length || 0) + (workOrderImages?.length || 0);
      
      // Storage pricing: First 1GB free, then $0.10 per MB
      const freeQuotaGB = 1;
      const freeQuotaMB = freeQuotaGB * 1024;
      const overageMB = Math.max(0, totalSizeMB - freeQuotaMB);
      const overageGB = Math.round((overageMB / 1024) * 100) / 100;
      const costPerMB = 0.10;
      const overageCost = Math.round(overageMB * costPerMB * 100) / 100;

      return {
        totalSizeMB,
        totalSizeGB,
        itemCount,
        freeQuotaMB,
        freeQuotaGB,
        overageMB,
        overageGB,
        costPerMB,
        overageCost
      };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};
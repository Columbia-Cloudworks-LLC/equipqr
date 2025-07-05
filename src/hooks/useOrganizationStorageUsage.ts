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
  costPerGB: number;
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

      // Get all equipment note images
      const { data: equipmentImages, error: equipmentError } = await supabase
        .from('equipment_note_images')
        .select('file_size');

      if (equipmentError) {
        console.error('Error fetching equipment images:', equipmentError);
      }

      // Get all work order images  
      const { data: workOrderImages, error: workOrderError } = await supabase
        .from('work_order_images')
        .select('file_size');

      if (workOrderError) {
        console.error('Error fetching work order images:', workOrderError);
      }

      // Since we can't easily filter by organization at query level due to complex joins,
      // we'll get all images for now and calculate total usage
      // TODO: This should be optimized with proper RLS policies or organization filtering
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
      
      // Storage pricing: First 5GB free, then $0.10 per GB
      const freeQuotaGB = 5;
      const freeQuotaMB = freeQuotaGB * 1024;
      const overageGB = Math.max(0, totalSizeGB - freeQuotaGB);
      const overageMB = overageGB * 1024;
      const costPerGB = 0.10;
      const overageCost = Math.round(overageGB * costPerGB * 100) / 100;

      return {
        totalSizeMB,
        totalSizeGB,
        itemCount,
        freeQuotaMB,
        freeQuotaGB,
        overageMB,
        overageGB,
        costPerGB,
        overageCost
      };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};
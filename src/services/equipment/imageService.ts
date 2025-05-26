
import { supabase } from '@/integrations/supabase/client';

export interface EquipmentImage {
  equipmentId: string;
  latestImageUrl: string | null;
}

/**
 * Get the latest image for specific equipment
 */
export async function getEquipmentLatestImage(equipmentId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_equipment_latest_image', { equipment_id_param: equipmentId });

    if (error) {
      console.error('Error fetching latest equipment image:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getEquipmentLatestImage:', error);
    return null;
  }
}

/**
 * Get latest images for multiple equipment items
 */
export async function getEquipmentLatestImages(equipmentIds: string[]): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();
  
  // Process in batches to avoid too many concurrent requests
  const batchSize = 10;
  for (let i = 0; i < equipmentIds.length; i += batchSize) {
    const batch = equipmentIds.slice(i, i + batchSize);
    const promises = batch.map(async (equipmentId) => {
      const imageUrl = await getEquipmentLatestImage(equipmentId);
      return { equipmentId, imageUrl };
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ equipmentId, imageUrl }) => {
      if (imageUrl) {
        imageMap.set(equipmentId, imageUrl);
      }
    });
  }
  
  return imageMap;
}

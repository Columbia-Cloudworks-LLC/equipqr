
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LocationOverrideData {
  location_override: boolean;
  location?: string;
  location_source: string;
}

/**
 * Toggle location override for equipment
 * When override is enabled, scan-based location updates will be ignored
 */
export async function toggleLocationOverride(
  equipmentId: string, 
  override: boolean,
  manualLocation?: string
): Promise<boolean> {
  try {
    const updateData: LocationOverrideData = {
      location_override: override,
      location_source: override ? 'manual' : 'scan'
    };

    // If enabling override and manual location provided, update it
    if (override && manualLocation) {
      updateData.location = manualLocation;
    }

    const { error } = await supabase
      .from('equipment')
      .update(updateData)
      .eq('id', equipmentId);

    if (error) {
      console.error('Error updating location override:', error);
      toast.error('Failed to update location settings');
      return false;
    }

    toast.success(override ? 'Location override enabled' : 'Automatic location tracking resumed');
    return true;
  } catch (error) {
    console.error('Error in toggleLocationOverride:', error);
    toast.error('Failed to update location settings');
    return false;
  }
}

/**
 * Update manual location for equipment
 */
export async function updateManualLocation(
  equipmentId: string, 
  location: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('equipment')
      .update({
        location,
        location_override: true,
        location_source: 'manual'
      })
      .eq('id', equipmentId);

    if (error) {
      console.error('Error updating manual location:', error);
      toast.error('Failed to update location');
      return false;
    }

    toast.success('Location updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateManualLocation:', error);
    toast.error('Failed to update location');
    return false;
  }
}

/**
 * Get equipment location for display
 */
export function getDisplayLocation(equipment: any): {
  hasLocation: boolean;
  displayText: string;
  source: 'manual' | 'scan' | 'none';
  coordinates?: { lat: number; lng: number };
  accuracy?: number;
  timestamp?: string;
} {
  // Check for manual location first
  if (equipment.location) {
    return {
      hasLocation: true,
      displayText: equipment.location,
      source: 'manual'
    };
  }

  // Check for scan-based location
  if (equipment.last_scan_latitude && equipment.last_scan_longitude) {
    return {
      hasLocation: true,
      displayText: `${equipment.last_scan_latitude.toFixed(6)}, ${equipment.last_scan_longitude.toFixed(6)}`,
      source: 'scan',
      coordinates: {
        lat: equipment.last_scan_latitude,
        lng: equipment.last_scan_longitude
      },
      accuracy: equipment.last_scan_accuracy,
      timestamp: equipment.last_scan_timestamp
    };
  }

  return {
    hasLocation: false,
    displayText: 'No location data',
    source: 'none'
  };
}
